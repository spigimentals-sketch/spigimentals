import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { api } from '../lib/api';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);
const STORAGE_KEY = 'spigimentals_cart';

/**
 * A cart item shape:
 * {
 *   key:       string  unique per item+license, e.g. "beat-3-premium"
 *   type:      'beat' | 'pack' | 'course'
 *   id:        number  // the original item id
 *   title:     string
 *   license?:  'basic' | 'premium' | 'exclusive'   (for beats)
 *   price:     number   // USD
 *   quantity:  number
 * }
 *
 * Guest carts live in localStorage. Once a user signs in, the guest cart is
 * merged into their server-side cart and localStorage is cleared.
 */
export function CartProvider({ children }) {
  const { user } = useAuth();
  const [items, setItems] = useState(() => loadFromStorage());
  const [open, setOpen] = useState(false);
  const hasMergedOnSignInRef = useRef(false);

  // ---- persistence ----
  // Only clear the local guest-cart backup once the server write actually
  // succeeds — clearing it unconditionally would silently lose the cart on
  // any network/API failure.
  const persist = useCallback(async (nextItems) => {
    setItems(nextItems);
    if (user) {
      try {
        await api.putCart(nextItems);
        localStorage.removeItem(STORAGE_KEY);
      } catch (err) {
        console.warn('[Cart] Failed to save cart to server, keeping local backup:', err.message);
      }
    } else {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextItems));
    }
  }, [user]);

  // ---- sign-in: merge guest cart into the server cart ----
  useEffect(() => {
    if (!user) {
      hasMergedOnSignInRef.current = false;
      return;
    }
    if (hasMergedOnSignInRef.current) return;
    hasMergedOnSignInRef.current = true;

    (async () => {
      const guestItems = loadFromStorage();
      try {
        const { items: remoteItems } = await api.getCart();
        const merged = mergeItems(remoteItems, guestItems);
        await api.putCart(merged);
        localStorage.removeItem(STORAGE_KEY);
        setItems(merged);
      } catch (err) {
        console.warn('[Cart] Failed to merge guest cart on sign-in, keeping local backup:', err.message);
      }
    })();
  }, [user]);

  // ---- public API ----
  const addItem = (item) => {
    const key = item.key || makeKey(item);
    const existing = items.find((i) => i.key === key);
    const next = existing
      ? items.map((i) => (i.key === key ? { ...i, quantity: i.quantity + (item.quantity || 1) } : i))
      : [...items, { ...item, key, quantity: item.quantity || 1 }];
    persist(next);
    setOpen(true); // open the drawer so the user sees what they added
  };

  const removeItem = (key) => persist(items.filter((i) => i.key !== key));

  const updateQuantity = (key, quantity) => {
    if (quantity <= 0) return removeItem(key);
    persist(items.map((i) => (i.key === key ? { ...i, quantity } : i)));
  };

  const clear = () => persist([]);

  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const count = items.reduce((sum, i) => sum + i.quantity, 0);

  const value = {
    items,
    count,
    subtotal,
    open,
    openCart: () => setOpen(true),
    closeCart: () => setOpen(false),
    addItem,
    removeItem,
    updateQuantity,
    clear,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside <CartProvider>');
  return ctx;
}

// ---- helpers ----
function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function makeKey(item) {
  return `${item.type}-${item.id}${item.license ? '-' + item.license : ''}`;
}

function mergeItems(remoteItems, guestItems) {
  const map = new Map();
  for (const item of remoteItems) map.set(item.key || makeKey(item), { ...item });
  for (const item of guestItems) {
    const key = item.key || makeKey(item);
    const existing = map.get(key);
    if (existing) {
      existing.quantity = (existing.quantity || 1) + (item.quantity || 1);
    } else {
      map.set(key, { ...item, key });
    }
  }
  return Array.from(map.values());
}
