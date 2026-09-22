import React from 'react';
import { C, FONT } from '../lib/theme';

export default function SectionHeader({ title, action }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
      }}
    >
      <h2
        style={{
          margin: 0,
          fontFamily: FONT,
          fontSize: 20,
          fontWeight: 800,
          color: C.text,
          letterSpacing: '-0.01em',
        }}
      >
        {title}
      </h2>
      {action}
    </div>
  );
}
