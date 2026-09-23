import React from 'react';
import { useContent } from '../lib/useContent';
import { api } from '../lib/api';
import PageHeader from '../components/PageHeader';
import TrackVideoCard from '../components/TrackVideoCard';

export default function CoversPage({ setCurrentTrack, currentTrack }) {
  const { items: covers } = useContent('covers');

  const playCover = (cover) => {
    if (currentTrack?.kind === 'cover' && currentTrack.id === cover.id) return setCurrentTrack(null);
    setCurrentTrack({ kind: 'cover', id: cover.id, title: cover.title, artist: cover.artist, spotifyUrl: cover.spotifyUrl, youtubeUrl: cover.youtubeUrl, audioUrl: cover.audioUrl });
    api.recordPlay('covers', cover.id).catch(() => {});
  };

  return (
    <div>
      <PageHeader
        eyebrow="Covers"
        title="Cover songs."
        description="Our takes on tracks we love — reimagined, mixed, and produced in-house."
      />
      <div style={{ padding: '24px', maxWidth: 1400, margin: '0 auto' }}>
        <div
          className="stagger-list"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: 16,
          }}
        >
          {covers.map((cover) => (
            <TrackVideoCard
              key={cover.id}
              track={cover}
              isPlaying={currentTrack?.kind === 'cover' && currentTrack.id === cover.id}
              onPlay={playCover}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
