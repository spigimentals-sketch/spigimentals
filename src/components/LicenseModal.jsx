import React, { useState } from 'react';
import { X, CheckCircle2 } from 'lucide-react';
import { C, FONT } from '../lib/theme';
import { useCart } from '../contexts/CartContext';

/**
 * Drop-in replacement for the original LicenseModal.
 * The only real difference: the "Add to cart" button now calls useCart().addItem().
 */
export default function LicenseModal({ beat, onClose }) {
  const [tier, setTier] = useState('premium');
  const { addItem } = useCart();

  const tiers = [
    {
      id: 'basic',
      name: 'Basic',
      price: beat.priceBasic,
      feats: ['MP3 only', 'Up to 5,000 streams', 'Non-profit use', 'Producer tag stays'],
    },
    {
      id: 'premium',
      name: 'Premium',
      price: beat.pricePremium,
      feats: ['WAV + MP3', 'Up to 500K streams', 'Commercial release', 'Stems included'],
    },
    {
      id: 'exclusive',
      name: 'Exclusive',
      price: beat.priceExclusive,
      feats: ['Full ownership transfer', 'Unlimited streams & sales', 'Beat removed from store', 'Trackouts + stems'],
    },
  ];
  const active = tiers.find((t) => t.id === tier);

  const handleAdd = () => {
    addItem({
      type: 'beat',
      id: beat.id,
      title: beat.title,
      license: tier,
      price: active.price,
    });
    onClose();
  };

  return (
    <div
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="license-modal-title"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        background: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        animation: 'fadeIn 0.15s',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: 720,
          width: '100%',
          maxHeight: '90vh',
          overflow: 'auto',
          background: C.bg2,
          borderRadius: 8,
          border: `1px solid ${C.border}`,
          padding: 32,
          animation: 'scaleIn 0.2s',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
          <div>
            <div
              style={{
                fontFamily: FONT,
                fontSize: 11,
                color: C.orange,
                fontWeight: 600,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                marginBottom: 6,
              }}
            >
              License — {beat.bpm} BPM · {beat.key}
            </div>
            <h2
              id="license-modal-title"
              style={{
                fontFamily: FONT,
                fontSize: 28,
                color: C.text,
                margin: 0,
                fontWeight: 800,
                letterSpacing: '-0.02em',
              }}
            >
              {beat.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{ background: 'none', border: 'none', color: C.textDim, cursor: 'pointer', padding: 4 }}
          >
            <X />
          </button>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 10,
            marginBottom: 20,
          }}
        >
          {tiers.map((t) => (
            <button
              key={t.id}
              onClick={() => setTier(t.id)}
              aria-pressed={tier === t.id}
              style={{
                padding: 18,
                borderRadius: 6,
                cursor: 'pointer',
                textAlign: 'left',
                background: tier === t.id ? 'rgba(255, 85, 0, 0.08)' : C.bg3,
                border: `1px solid ${tier === t.id ? C.orange : C.border}`,
                transition: 'all 0.15s',
              }}
            >
              <div
                style={{
                  fontFamily: FONT,
                  fontSize: 11,
                  color: tier === t.id ? C.orange : C.textDim,
                  fontWeight: 700,
                  letterSpacing: '0.05em',
                  marginBottom: 6,
                  textTransform: 'uppercase',
                }}
              >
                {t.name}
              </div>
              <div style={{ fontFamily: FONT, fontSize: 28, color: C.text, fontWeight: 800 }}>${t.price}</div>
            </button>
          ))}
        </div>

        <div style={{ padding: 18, background: C.bg3, borderRadius: 6, marginBottom: 20 }}>
          {active.feats.map((f) => (
            <div
              key={f}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '5px 0',
                fontFamily: FONT,
                fontSize: 13,
                color: C.text,
              }}
            >
              <CheckCircle2 size={14} color={C.orange} /> {f}
            </div>
          ))}
        </div>

        <button
          onClick={handleAdd}
          style={{
            width: '100%',
            padding: '14px',
            borderRadius: 4,
            border: 'none',
            cursor: 'pointer',
            background: C.orange,
            color: C.bg,
            fontFamily: FONT,
            fontSize: 14,
            fontWeight: 700,
          }}
        >
          Add to cart — ${active.price}
        </button>
      </div>
    </div>
  );
}
