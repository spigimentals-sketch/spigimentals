import React, { useEffect } from 'react';
import { X, Trash2, Plus, Minus, ShoppingCart } from 'lucide-react';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import { C, FONT } from '../../lib/theme';

const fmt = (n) => `$${n.toFixed(2)}`;

export default function CartDrawer({ onCheckout }) {
  const { items, subtotal, open, closeCart, removeItem, updateQuantity, clear } = useCart();
  const { user } = useAuth();

  // Close on Escape, lock body scroll while open
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && closeCart();
    window.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, closeCart]);

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={closeCart}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 250,
          background: 'rgba(0,0,0,0.6)',
          animation: 'fadeIn 0.15s',
        }}
      />
      {/* Drawer */}
      <aside
        role="dialog"
        aria-label="Shopping cart"
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: 'min(440px, 100vw)',
          background: C.bg,
          borderLeft: `1px solid ${C.border}`,
          zIndex: 251,
          display: 'flex',
          flexDirection: 'column',
          animation: 'slideInRight 0.2s ease-out',
          boxShadow: '-12px 0 32px rgba(0,0,0,0.4)',
        }}
      >
        {/* Header */}
        <header
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '20px 24px',
            borderBottom: `1px solid ${C.border}`,
          }}
        >
          <div>
            <h2
              style={{
                margin: 0,
                fontFamily: FONT,
                fontSize: 18,
                fontWeight: 800,
                color: C.text,
                letterSpacing: '-0.02em',
              }}
            >
              Your cart
            </h2>
            <p
              style={{
                margin: '2px 0 0',
                fontFamily: FONT,
                fontSize: 12,
                color: C.textDim,
              }}
            >
              {items.length} {items.length === 1 ? 'item' : 'items'}
            </p>
          </div>
          <button
            onClick={closeCart}
            aria-label="Close cart"
            style={{
              background: 'none',
              border: 'none',
              color: C.textDim,
              cursor: 'pointer',
              padding: 6,
              display: 'flex',
            }}
          >
            <X size={20} />
          </button>
        </header>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: items.length ? 16 : 24 }}>
          {items.length === 0 ? (
            <EmptyState onClose={closeCart} />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {items.map((item) => (
                <CartLine
                  key={item.key}
                  item={item}
                  onRemove={() => removeItem(item.key)}
                  onInc={() => updateQuantity(item.key, item.quantity + 1)}
                  onDec={() => updateQuantity(item.key, item.quantity - 1)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <footer
            style={{
              padding: 20,
              borderTop: `1px solid ${C.border}`,
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ fontFamily: FONT, fontSize: 13, color: C.textDim, fontWeight: 600 }}>
                Subtotal
              </span>
              <span style={{ fontFamily: FONT, fontSize: 24, color: C.text, fontWeight: 800 }}>
                {fmt(subtotal)}
              </span>
            </div>
            <p style={{ fontFamily: FONT, fontSize: 11, color: C.textMute, margin: 0 }}>
              Taxes and exchange fees calculated at checkout.
            </p>
            <button
              onClick={() => onCheckout?.({ user, items, subtotal })}
              style={{
                padding: '14px 20px',
                borderRadius: 6,
                border: 'none',
                background: C.orange,
                color: C.bg,
                fontFamily: FONT,
                fontSize: 14,
                fontWeight: 800,
                cursor: 'pointer',
                letterSpacing: '0.02em',
              }}
            >
              Checkout — {fmt(subtotal)}
            </button>
            <button
              onClick={clear}
              style={{
                padding: '10px 16px',
                borderRadius: 6,
                border: `1px solid ${C.border}`,
                background: 'transparent',
                color: C.textDim,
                fontFamily: FONT,
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Clear cart
            </button>
          </footer>
        )}
      </aside>
    </>
  );
}

function CartLine({ item, onRemove, onInc, onDec }) {
  return (
    <div
      style={{
        display: 'flex',
        gap: 12,
        padding: 12,
        borderRadius: 6,
        background: C.bg2,
        border: `1px solid ${C.border}`,
      }}
    >
      <div
        aria-hidden="true"
        style={{
          width: 56,
          height: 56,
          borderRadius: 4,
          flexShrink: 0,
          background: item.type === 'beat' ? `linear-gradient(135deg, ${C.orange}, ${C.bg3})` :
                       item.type === 'pack' ? `linear-gradient(135deg, #5b21b6, ${C.bg3})` :
                       item.type === 'plugin' ? `linear-gradient(135deg, #1d4ed8, ${C.bg3})` :
                                              `linear-gradient(135deg, #047857, ${C.bg3})`,
        }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontFamily: FONT,
            fontSize: 10,
            color: C.orange,
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}
        >
          {item.type}{item.license ? ` · ${item.license}` : ''}
        </div>
        <div
          style={{
            fontFamily: FONT,
            fontSize: 14,
            color: C.text,
            fontWeight: 600,
            marginTop: 2,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {item.title}
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: 8,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <QtyBtn onClick={onDec} aria-label="Decrease quantity"><Minus size={12} /></QtyBtn>
            <span
              style={{
                fontFamily: FONT,
                fontSize: 13,
                color: C.text,
                fontWeight: 600,
                minWidth: 18,
                textAlign: 'center',
              }}
            >
              {item.quantity}
            </span>
            <QtyBtn onClick={onInc} aria-label="Increase quantity"><Plus size={12} /></QtyBtn>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontFamily: FONT, fontSize: 14, color: C.text, fontWeight: 700 }}>
              {fmt(item.price * item.quantity)}
            </span>
            <button
              onClick={onRemove}
              aria-label={`Remove ${item.title}`}
              style={{
                background: 'none',
                border: 'none',
                color: C.textMute,
                cursor: 'pointer',
                padding: 4,
                display: 'flex',
              }}
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function QtyBtn({ children, ...props }) {
  return (
    <button
      {...props}
      style={{
        width: 24,
        height: 24,
        borderRadius: 4,
        border: `1px solid ${C.border}`,
        background: C.bg3,
        color: C.text,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {children}
    </button>
  );
}

function EmptyState({ onClose }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        padding: '32px 16px',
        color: C.textDim,
      }}
    >
      <ShoppingCart size={36} strokeWidth={1.5} />
      <h3
        style={{
          fontFamily: FONT,
          color: C.text,
          margin: '16px 0 6px',
          fontSize: 18,
          fontWeight: 700,
        }}
      >
        Your cart is empty
      </h3>
      <p style={{ fontFamily: FONT, fontSize: 13, lineHeight: 1.5, margin: 0, maxWidth: 280 }}>
        Browse the beat store or sample packs and add something fire to your cart.
      </p>
      <button
        onClick={onClose}
        style={{
          marginTop: 20,
          padding: '10px 18px',
          borderRadius: 6,
          border: 'none',
          background: C.orange,
          color: C.bg,
          fontFamily: FONT,
          fontSize: 13,
          fontWeight: 700,
          cursor: 'pointer',
        }}
      >
        Keep browsing
      </button>
    </div>
  );
}
