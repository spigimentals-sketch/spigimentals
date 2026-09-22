import React from 'react';
import { C, FONT } from '../lib/theme';

export default function PageHeader({ eyebrow, title, description }) {
  return (
    <div className="header-in" style={{ padding: '40px 24px 8px', maxWidth: 1400, margin: '0 auto' }}>
      {eyebrow && (
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '4px 10px',
            borderRadius: 3,
            background: 'rgba(255, 85, 0, 0.12)',
            marginBottom: 16,
            fontFamily: FONT,
            fontSize: 11,
            color: C.orange,
            fontWeight: 700,
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
          }}
        >
          {eyebrow}
        </div>
      )}
      <h1
        style={{
          fontFamily: FONT,
          fontSize: 'clamp(28px, 4.5vw, 44px)',
          color: C.text,
          margin: 0,
          fontWeight: 800,
          letterSpacing: '-0.03em',
          lineHeight: 1.05,
        }}
      >
        {title}
      </h1>
      {description && (
        <p
          style={{
            fontFamily: FONT,
            fontSize: 15,
            color: C.textDim,
            lineHeight: 1.5,
            maxWidth: 620,
            marginTop: 10,
          }}
        >
          {description}
        </p>
      )}
    </div>
  );
}
