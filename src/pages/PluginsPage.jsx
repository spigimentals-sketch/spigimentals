import React from 'react';
import { Cpu, ShoppingBag, Monitor } from 'lucide-react';
import { C, FONT } from '../lib/theme';
import { useContent } from '../lib/useContent';
import PageHeader from '../components/PageHeader';
import { useCart } from '../contexts/CartContext';

export default function PluginsPage() {
  const { items: plugins } = useContent('plugins');
  const { addItem } = useCart();

  return (
    <div>
      <PageHeader
        eyebrow="Plugins"
        title="Audio plugins."
        description="In-house VST/AU/AAX plugins built for producers and engineers. Instant download after checkout."
      />
      <div style={{ padding: '24px', maxWidth: 1400, margin: '0 auto' }}>
        <div
          className="stagger-list"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 16,
          }}
        >
          {plugins.map((plugin) => (
            <div
              key={plugin.id}
              className="hover-lift"
              style={{
                padding: 20,
                borderRadius: 8,
                background: C.bg2,
                border: `1px solid ${C.border}`,
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
              }}
            >
              <div
                aria-hidden="true"
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 8,
                  background: 'rgba(255,85,0,0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Cpu size={20} color={C.orange} />
              </div>

              <div>
                <div style={{ fontFamily: FONT, fontSize: 16, fontWeight: 700, color: C.text }}>{plugin.name}</div>
                <div style={{ fontFamily: FONT, fontSize: 12, color: C.orange, marginTop: 2 }}>{plugin.tagline}</div>
              </div>

              <p style={{ fontFamily: FONT, fontSize: 13, color: C.textDim, lineHeight: 1.5, margin: 0, flex: 1 }}>
                {plugin.description}
              </p>

              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <Badge>{plugin.category}</Badge>
                {plugin.formats.map((f) => (
                  <Badge key={f}>{f}</Badge>
                ))}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Monitor size={12} color={C.textMute} />
                <span style={{ fontFamily: FONT, fontSize: 11, color: C.textMute }}>
                  {plugin.os.join(' · ')} · v{plugin.version}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
                <span style={{ fontFamily: FONT, fontSize: 18, fontWeight: 800, color: C.text }}>${plugin.price}</span>
              </div>

              <button
                onClick={() => addItem({ type: 'plugin', id: plugin.id, title: plugin.name, price: plugin.price })}
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
          ))}
        </div>
      </div>
    </div>
  );
}

function Badge({ children }) {
  return (
    <span
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
      {children}
    </span>
  );
}
