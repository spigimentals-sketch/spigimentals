import React from 'react';
import { Play, Pause } from 'lucide-react';
import { C, FONT } from '../lib/theme';
import Waveform from './Waveform';
import { resolveAssetUrl } from '../lib/api';

export default function TrackRow({ track, isPlaying, onPlay }) {
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
      <div
        style={{
          position: 'relative',
          width: 44,
          height: 44,
          borderRadius: 6,
          overflow: 'hidden',
          flexShrink: 0,
          background: C.bg3,
          backgroundImage: track.coverUrl ? `url(${resolveAssetUrl(track.coverUrl)})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <button
          onClick={() => onPlay(track)}
          aria-label={isPlaying ? `Pause ${track.title}` : `Play ${track.title}`}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            borderRadius: 6,
            border: 'none',
            background: isPlaying
              ? `${C.orange}cc`
              : track.coverUrl
              ? 'rgba(0,0,0,0.35)'
              : C.bg3,
            color: isPlaying ? C.bg : C.text,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          {isPlaying ? <Pause size={14} /> : <Play size={14} style={{ marginLeft: 1 }} />}
        </button>
      </div>

      <div style={{ minWidth: 0, flex: '1 1 200px' }}>
        <div style={{ fontFamily: FONT, fontSize: 14, fontWeight: 700, color: C.text }}>{track.title}</div>
        <div style={{ fontFamily: FONT, fontSize: 12, color: C.textDim }}>
          {track.artist} · {track.bpm} BPM · {track.key}
        </div>
      </div>

      <div className="row-waveform" style={{ flexShrink: 0 }}>
        <Waveform playing={isPlaying} bars={24} height={22} />
      </div>

      <div
        className="row-plays"
        style={{
          fontFamily: FONT,
          fontSize: 11,
          color: C.textMute,
          flexShrink: 0,
          minWidth: 60,
          textAlign: 'right',
        }}
      >
        {track.plays} plays
      </div>
    </div>
  );
}
