import React from 'react';
import { Play, Pause, Music, Youtube } from 'lucide-react';
import { C, FONT } from '../lib/theme';
import { resolveAssetUrl } from '../lib/api';
import { getYoutubeThumbnail } from '../lib/youtube';

// Beats as video-style cards — same thumbnail-with-play-overlay treatment as
// TrackVideoCard, plus a license button since beats are sold, not just played.
export default function BeatVideoCard({ beat, isPlaying, onPlay, onLicense }) {
  const thumbnail = beat.coverUrl ? resolveAssetUrl(beat.coverUrl) : getYoutubeThumbnail(beat.youtubeUrl);

  return (
    <div
      className="hover-lift"
      style={{
        borderRadius: 8,
        overflow: 'hidden',
        background: C.bg2,
        border: `1px solid ${isPlaying ? C.orange : C.border}`,
        transition: 'border-color 0.15s, transform 0.15s ease',
      }}
    >
      <button
        onClick={() => onPlay(beat)}
        aria-label={isPlaying ? `Pause ${beat.title}` : `Preview ${beat.title}`}
        style={{
          position: 'relative',
          display: 'block',
          width: '100%',
          aspectRatio: '16 / 9',
          border: 'none',
          padding: 0,
          margin: 0,
          cursor: 'pointer',
          background: C.bg3,
          backgroundImage: thumbnail ? `url(${thumbnail})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {!thumbnail && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Music size={28} color={C.textMute} />
          </div>
        )}

        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: isPlaying ? 'rgba(255,85,0,0.25)' : 'rgba(0,0,0,0.25)',
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              background: isPlaying ? C.orange : 'rgba(0,0,0,0.65)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {isPlaying ? <Pause size={20} color={C.bg} /> : <Play size={20} color="#fff" style={{ marginLeft: 2 }} />}
          </div>
        </div>

        {beat.youtubeUrl && (
          <span
            aria-hidden="true"
            style={{
              position: 'absolute',
              top: 8,
              right: 8,
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: '3px 7px',
              borderRadius: 3,
              background: 'rgba(0,0,0,0.75)',
              color: '#fff',
              fontFamily: FONT,
              fontSize: 10,
              fontWeight: 700,
            }}
          >
            <Youtube size={11} /> YouTube
          </span>
        )}
      </button>

      <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div>
          <div
            style={{
              fontFamily: FONT,
              fontSize: 14,
              fontWeight: 700,
              color: C.text,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {beat.title}
          </div>
          <div
            style={{
              fontFamily: FONT,
              fontSize: 12,
              color: C.textDim,
              marginTop: 2,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {beat.bpm} BPM · {beat.key} · {beat.mood}
          </div>
        </div>

        <button
          onClick={() => onLicense(beat)}
          style={{
            alignSelf: 'flex-start',
            padding: '8px 14px',
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
    </div>
  );
}
