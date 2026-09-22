import React from 'react';
import { Disc3, ShoppingBag } from 'lucide-react';
import { C, FONT } from '../lib/theme';
import { useCart } from '../contexts/CartContext';

// Sample packs aren't playable audio, so there's no play button here — but
// the 16:9 thumbnail header matches TrackVideoCard/BeatVideoCard so packs
// sit visually consistent alongside tracks and beats wherever they're shown.
export default function PackCard({ pack }) {
  const { addItem } = useCart();

  return (
    <div
      className="hover-lift"
      style={{
        borderRadius: 8,
        overflow: 'hidden',
        background: C.bg2,
        border: `1px solid ${C.border}`,
        transition: 'border-color 0.15s, transform 0.15s ease',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        aria-hidden="true"
        style={{
          width: '100%',
          aspectRatio: '16 / 9',
          background: 'rgba(255,85,0,0.12)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Disc3 size={32} color={C.orange} />
      </div>

      <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
        <div style={{ fontFamily: FONT, fontSize: 15, fontWeight: 700, color: C.text }}>{pack.title}</div>
        <p style={{ fontFamily: FONT, fontSize: 13, color: C.textDim, lineHeight: 1.5, margin: 0, flex: 1 }}>
          {pack.description}
        </p>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {pack.tags.map((t) => (
            <span
              key={t}
              style={{
                fontFamily: FONT,
                fontSize: 10,
                color: C.textMute,
                background: C.bg3,
                border: `1px solid ${C.border}`,
                borderRadius: 3,
                padding: '2px 6px',
              }}
            >
              {t}
            </span>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontFamily: FONT, fontSize: 11, color: C.textMute }}>{pack.sampleCount} samples</span>
          <span style={{ fontFamily: FONT, fontSize: 18, fontWeight: 800, color: C.text }}>${pack.price}</span>
        </div>
        <button
          onClick={() => addItem({ type: 'pack', id: pack.id, title: pack.title, price: pack.price })}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            padding: '11px 16px',
            borderRadius: 4,
            border: 'none',
            background: C.orange,
            color: C.bg,
            fontFamily: FONT,
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          <ShoppingBag size={14} /> Add to cart
        </button>
      </div>
    </div>
  );
}
