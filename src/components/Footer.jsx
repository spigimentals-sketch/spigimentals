import React from 'react';
import { Mic2, Instagram, Music2 } from 'lucide-react';
import { C, FONT } from '../lib/theme';

export default function Footer({ hasPlayer }) {
  return (
    <footer
      style={{
        borderTop: `1px solid ${C.border}`,
        marginTop: 60,
        paddingBottom: hasPlayer ? 88 : 0,
      }}
    >
      <div
        style={{
          maxWidth: 1400,
          margin: '0 auto',
          padding: '32px 24px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            aria-hidden="true"
            style={{
              width: 24,
              height: 24,
              borderRadius: 5,
              background: C.orange,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Mic2 size={14} color={C.bg} strokeWidth={2.5} />
          </div>
          <span style={{ fontFamily: FONT, fontSize: 13, color: C.textDim }}>
            © {new Date().getFullYear()} Spigimentals. All rights reserved.
          </span>
        </div>

        <div style={{ display: 'flex', gap: 16 }}>
          <a href="https://instagram.com" target="_blank" rel="noreferrer" aria-label="Instagram" style={iconLink}>
            <Instagram size={16} />
          </a>
          <a href="https://open.spotify.com" target="_blank" rel="noreferrer" aria-label="Spotify" style={iconLink}>
            <Music2 size={16} />
          </a>
        </div>
      </div>
    </footer>
  );
}

const iconLink = {
  color: C.textDim,
  display: 'inline-flex',
  padding: 6,
};
