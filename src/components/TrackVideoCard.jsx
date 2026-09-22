import React from 'react';
import { Play, Pause, Music, Youtube } from 'lucide-react';
import { C, FONT } from '../lib/theme';
import { resolveAssetUrl } from '../lib/api';
import { getYoutubeThumbnail } from '../lib/youtube';

// Catalog tracks as video-style cards — a 16:9 thumbnail (uploaded cover art,
// or the track's own YouTube thumbnail when no cover is set) with a play
// button overlay, instead of the compact row layout used elsewhere.
export default function TrackVideoCard({ track, isPlaying, onPlay }) {
  const thumbnail = track.coverUrl ? resolveAssetUrl(track.coverUrl) : getYoutubeThumbnail(track.youtubeUrl);

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
        onClick={() => onPlay(track)}
        aria-label={isPlaying ? `Pause ${track.title}` : `Play ${track.title}`}
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

        {track.youtubeUrl && (
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

      <div style={{ padding: '12px 14px' }}>
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
          {track.title}
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
          {track.artist} · {track.bpm} BPM · {track.key}
        </div>
        <div style={{ fontFamily: FONT, fontSize: 11, color: C.textMute, marginTop: 6 }}>
          {track.plays} plays
        </div>
      </div>
    </div>
  );
}
