import React, { useMemo } from 'react';
import { C } from '../lib/theme';

/**
 * Purely decorative bar waveform — there's no real audio analysis here, just
 * a deterministic-looking random pattern that pulses when `playing` is true.
 */
export default function Waveform({ playing = false, bars = 28, height = 28, color }) {
  const heights = useMemo(
    () => Array.from({ length: bars }, (_, i) => 20 + Math.round(Math.abs(Math.sin(i * 12.9898)) * 80)),
    [bars]
  );

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-end',
        gap: 2,
        height,
      }}
      aria-hidden="true"
    >
      {heights.map((h, i) => (
        <div
          key={i}
          style={{
            width: 2,
            borderRadius: 1,
            height: `${h}%`,
            background: color || (playing ? C.orange : C.textMute),
            animation: playing ? `pulse ${0.6 + (i % 5) * 0.15}s ease-in-out infinite alternate` : 'none',
            opacity: playing ? 1 : 0.5,
          }}
        />
      ))}
    </div>
  );
}
