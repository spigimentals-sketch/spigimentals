import React, { useState } from 'react';
import { useContent } from '../lib/useContent';
import { api } from '../lib/api';
import PageHeader from '../components/PageHeader';
import BeatRow from '../components/BeatRow';
import LicenseModal from '../components/LicenseModal';

export default function BeatsPage({ setCurrentTrack, currentTrack }) {
  const { items: beats } = useContent('beats');
  const [licensingBeat, setLicensingBeat] = useState(null);

  const playBeat = (beat) => {
    if (currentTrack?.kind === 'beat' && currentTrack.id === beat.id) return setCurrentTrack(null);
    setCurrentTrack({ kind: 'beat', id: beat.id, title: beat.title, artist: 'Beat preview', spotifyUrl: null, youtubeUrl: beat.youtubeUrl, audioUrl: beat.audioUrl });
    api.recordPlay('beats', beat.id).catch(() => {});
  };

  return (
    <div>
      <PageHeader
        eyebrow="Beat store"
        title="License a beat."
        description="Basic, premium, or exclusive — pick the license that fits your release plan."
      />
      <div style={{ padding: '24px', maxWidth: 1400, margin: '0 auto' }}>
        <div className="stagger-list" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {beats.map((beat) => (
            <BeatRow
              key={beat.id}
              beat={beat}
              isPlaying={currentTrack?.kind === 'beat' && currentTrack.id === beat.id}
              onPlay={playBeat}
              onLicense={setLicensingBeat}
            />
          ))}
        </div>
      </div>

      {licensingBeat && <LicenseModal beat={licensingBeat} onClose={() => setLicensingBeat(null)} />}
    </div>
  );
}
