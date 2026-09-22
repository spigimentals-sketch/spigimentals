import React from 'react';
import { useContent } from '../lib/useContent';
import { api } from '../lib/api';
import PageHeader from '../components/PageHeader';
import TrackVideoCard from '../components/TrackVideoCard';

export default function CatalogPage({ setCurrentTrack, currentTrack }) {
  const { items: tracks } = useContent('tracks');

  const playTrack = (track) => {
    if (currentTrack?.kind === 'catalog' && currentTrack.id === track.id) return setCurrentTrack(null);
    setCurrentTrack({ kind: 'catalog', id: track.id, title: track.title, artist: track.artist, spotifyUrl: track.spotifyUrl, youtubeUrl: track.youtubeUrl, audioUrl: track.audioUrl });
    api.recordPlay('tracks', track.id).catch(() => {});
  };

  return (
    <div>
      <PageHeader
        eyebrow="Catalog"
        title="Released tracks."
        description="Finished, mixed, and mastered records — stream a preview before you check the credits."
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
          {tracks.map((track) => (
            <TrackVideoCard
              key={track.id}
              track={track}
              isPlaying={currentTrack?.kind === 'catalog' && currentTrack.id === track.id}
              onPlay={playTrack}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
