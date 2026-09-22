import React, { useEffect, useRef } from 'react';
import { X, Music } from 'lucide-react';
import { C, FONT } from '../lib/theme';
import { resolveAssetUrl } from '../lib/api';
import Waveform from './Waveform';

export default function MiniPlayer({ track, onClose }) {
  const audioRef = useRef(null);

  // The `autoPlay` attribute alone is inconsistently honored by browser
  // autoplay policies — calling .play() imperatively right after the track
  // changes is the reliable way to actually start playback immediately,
  // since it's still tied to the click that set this track.
  useEffect(() => {
    if (track?.audioUrl && audioRef.current) {
      audioRef.current.play().catch(() => {});
    }
  }, [track?.audioUrl]);

  if (!track) return null;

  return (
    <div
      style={{
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 60,
        background: C.bg2,
        borderTop: `1px solid ${C.border}`,
        animation: 'slideInRight 0.2s',
      }}
    >
      <div
        style={{
          maxWidth: 1400,
          margin: '0 auto',
          padding: '10px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
        }}
      >
        <div
          aria-hidden="true"
          className="player-icon"
          style={{
            width: 36,
            height: 36,
            borderRadius: 6,
            background: C.bg3,
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Music size={16} color={C.orange} />
        </div>

        <div className="player-meta" style={{ minWidth: 0, flexShrink: 0, maxWidth: 220 }}>
          <div
            style={{
              fontFamily: FONT,
              fontSize: 13,
              fontWeight: 700,
              color: C.text,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {track.title}
          </div>
          {track.artist && (
            <div
              style={{
                fontFamily: FONT,
                fontSize: 11,
                color: C.textMute,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {track.artist}
            </div>
          )}
        </div>

        {track.youtubeUrl ? (
          // Real youtube.com/embed iframe — plays here count toward the
          // video's YouTube view count, which is the whole point of setting
          // this field. Takes priority over the uploaded file/Spotify embed.
          // rel=0/modestbranding/playsinline keep everything on-site; if a
          // specific video still bounces to a new tab, that video has
          // "Allow embedding" turned off in YouTube Studio — a per-video
          // setting on the uploader's end, not something this iframe controls.
          <iframe
            key={track.youtubeUrl}
            title={`YouTube player — ${track.title}`}
            style={{ borderRadius: 8, flex: 1, minWidth: 0 }}
            src={`${track.youtubeUrl}?autoplay=1&rel=0&modestbranding=1&playsinline=1`}
            height="80"
            frameBorder="0"
            allow="autoplay; encrypted-media; picture-in-picture"
            loading="lazy"
          />
        ) : track.audioUrl ? (
          <audio
            key={track.audioUrl}
            ref={audioRef}
            controls
            autoPlay
            src={resolveAssetUrl(track.audioUrl)}
            style={{ flex: 1, minWidth: 0, height: 36 }}
          />
        ) : track.spotifyUrl ? (
          <iframe
            title={`Spotify player — ${track.title}`}
            style={{ borderRadius: 8, flex: 1, minWidth: 0 }}
            src={track.spotifyUrl}
            height="80"
            frameBorder="0"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
          />
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
            <Waveform playing bars={40} height={24} />
            <span style={{ fontFamily: FONT, fontSize: 11, color: C.textMute, whiteSpace: 'nowrap' }}>
              Preview only — no audio file wired up yet
            </span>
          </div>
        )}

        <button
          onClick={onClose}
          aria-label="Close player"
          style={{
            background: 'none',
            border: 'none',
            color: C.textDim,
            cursor: 'pointer',
            padding: 10,
            flexShrink: 0,
          }}
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
}
