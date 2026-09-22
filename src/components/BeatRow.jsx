import React from 'react';
import { Play, Pause, Tag } from 'lucide-react';
import { C, FONT } from '../lib/theme';
import Waveform from './Waveform';

export default function BeatRow({ beat, isPlaying, onPlay, onLicense }) {
  return (
    <div
      className="hover-lift"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: '14px 16px',
        borderRadius: 8,
        background: C.bg2,
        border: `1px solid ${isPlaying ? C.orange : C.border}`,
        transition: 'border-color 0.15s, transform 0.15s ease',
      }}
    >
      <button
        onClick={() => onPlay(beat)}
        aria-label={isPlaying ? `Pause ${beat.title}` : `Preview ${beat.title}`}
        style={{
          width: 36,
          height: 36,
          borderRadius: '50%',
          border: 'none',
          background: isPlaying ? C.orange : C.bg3,
          color: isPlaying ? C.bg : C.text,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          flexShrink: 0,
        }}
      >
        {isPlaying ? <Pause size={14} /> : <Play size={14} style={{ marginLeft: 1 }} />}
      </button>

      <div style={{ minWidth: 0, flex: '1 1 180px' }}>
        <div style={{ fontFamily: FONT, fontSize: 14, fontWeight: 700, color: C.text }}>{beat.title}</div>
        <div style={{ fontFamily: FONT, fontSize: 12, color: C.textDim }}>
          {beat.bpm} BPM · {beat.key} · {beat.mood}
        </div>
        <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
          {beat.tags.map((t) => (
            <span
              key={t}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 3,
                fontFamily: FONT,
                fontSize: 10,
                color: C.textMute,
                background: C.bg3,
                border: `1px solid ${C.border}`,
                borderRadius: 3,
                padding: '2px 6px',
              }}
            >
              <Tag size={9} /> {t}
            </span>
          ))}
        </div>
      </div>

      <div className="row-waveform" style={{ flexShrink: 0 }}>
        <Waveform playing={isPlaying} bars={20} height={22} />
      </div>

      <button
        onClick={() => onLicense(beat)}
        style={{
          flexShrink: 0,
          padding: '9px 16px',
          borderRadius: 4,
          border: 'none',
          background: C.orange,
          color: C.bg,
          fontFamily: FONT,
          fontSize: 12,
          fontWeight: 700,
          cursor: 'pointer',
          whiteSpace: 'nowrap',
        }}
      >
        From ${beat.priceBasic}
      </button>
    </div>
  );
}
