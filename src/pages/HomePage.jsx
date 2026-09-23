import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Calendar, GraduationCap } from 'lucide-react';
import { C, FONT } from '../lib/theme';
import { useContent } from '../lib/useContent';
import { api } from '../lib/api';
import SectionHeader from '../components/SectionHeader';
import BeatVideoCard from '../components/BeatVideoCard';
import TrackVideoCard from '../components/TrackVideoCard';
import PackCard from '../components/PackCard';
import LicenseModal from '../components/LicenseModal';

const cardGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
  gap: 16,
};

export default function HomePage({ setCurrentTrack, currentTrack }) {
  const { items: beats } = useContent('beats');
  const { items: tracks } = useContent('tracks');
  const { items: covers } = useContent('covers');
  const { items: packs } = useContent('packs');
  const [licensingBeat, setLicensingBeat] = useState(null);

  const playBeat = (beat) => {
    if (currentTrack?.kind === 'beat' && currentTrack.id === beat.id) return setCurrentTrack(null);
    setCurrentTrack({ kind: 'beat', id: beat.id, title: beat.title, artist: 'Beat preview', spotifyUrl: null, youtubeUrl: beat.youtubeUrl, audioUrl: beat.audioUrl });
    api.recordPlay('beats', beat.id).catch(() => {});
  };

  const playTrack = (track) => {
    if (currentTrack?.kind === 'catalog' && currentTrack.id === track.id) return setCurrentTrack(null);
    setCurrentTrack({ kind: 'catalog', id: track.id, title: track.title, artist: track.artist, spotifyUrl: track.spotifyUrl, youtubeUrl: track.youtubeUrl, audioUrl: track.audioUrl });
    api.recordPlay('tracks', track.id).catch(() => {});
  };

  const playCover = (cover) => {
    if (currentTrack?.kind === 'cover' && currentTrack.id === cover.id) return setCurrentTrack(null);
    setCurrentTrack({ kind: 'cover', id: cover.id, title: cover.title, artist: cover.artist, spotifyUrl: cover.spotifyUrl, youtubeUrl: cover.youtubeUrl, audioUrl: cover.audioUrl });
    api.recordPlay('covers', cover.id).catch(() => {});
  };

  return (
    <div>
      {/* Hero */}
      <div style={{ padding: '64px 24px 48px', maxWidth: 1400, margin: '0 auto' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '4px 10px',
            borderRadius: 3,
            background: 'rgba(255, 85, 0, 0.12)',
            marginBottom: 20,
            fontFamily: FONT,
            fontSize: 11,
            color: C.orange,
            fontWeight: 700,
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
          }}
        >
          Independent production house — Douala
        </div>
        <h1
          style={{
            fontFamily: FONT,
            fontSize: 'clamp(34px, 6vw, 60px)',
            color: C.text,
            margin: 0,
            fontWeight: 900,
            letterSpacing: '-0.03em',
            lineHeight: 1.02,
            maxWidth: 820,
          }}
        >
          Beats, samples, and studio sessions for your next record.
        </h1>
        <p style={{ fontFamily: FONT, fontSize: 16, color: C.textDim, lineHeight: 1.6, maxWidth: 560, marginTop: 18 }}>
          License a beat, grab a sample pack, or book time in the room. Everything a producer or
          artist needs to finish a track, in one place.
        </p>
        <div style={{ display: 'flex', gap: 12, marginTop: 28, flexWrap: 'wrap' }}>
          <Link to="/beats" style={primaryCta}>
            Browse beats <ArrowRight size={15} />
          </Link>
          <Link to="/book" style={secondaryCta}>
            Book the studio
          </Link>
        </div>
      </div>

      {/* Latest catalog */}
      <div style={{ padding: '8px 24px', maxWidth: 1400, margin: '0 auto' }}>
        <SectionHeader
          title="Latest releases"
          action={
            <Link to="/catalog" style={sectionLink}>
              View all <ArrowRight size={13} />
            </Link>
          }
        />
        <div className="stagger-list" style={cardGrid}>
          {tracks.slice(0, 3).map((track) => (
            <TrackVideoCard
              key={track.id}
              track={track}
              isPlaying={currentTrack?.kind === 'catalog' && currentTrack.id === track.id}
              onPlay={playTrack}
            />
          ))}
        </div>
      </div>

      {/* Covers */}
      <div style={{ padding: '8px 24px', maxWidth: 1400, margin: '0 auto' }}>
        <SectionHeader
          title="Covers"
          action={
            <Link to="/covers" style={sectionLink}>
              View all <ArrowRight size={13} />
            </Link>
          }
        />
        <div className="stagger-list" style={cardGrid}>
          {covers.slice(0, 3).map((cover) => (
            <TrackVideoCard
              key={cover.id}
              track={cover}
              isPlaying={currentTrack?.kind === 'cover' && currentTrack.id === cover.id}
              onPlay={playCover}
            />
          ))}
        </div>
      </div>

      {/* Featured beats */}
      <div style={{ padding: '40px 24px', maxWidth: 1400, margin: '0 auto' }}>
        <SectionHeader
          title="Featured beats"
          action={
            <Link to="/beats" style={sectionLink}>
              View all <ArrowRight size={13} />
            </Link>
          }
        />
        <div className="stagger-list" style={cardGrid}>
          {beats.slice(0, 3).map((beat) => (
            <BeatVideoCard
              key={beat.id}
              beat={beat}
              isPlaying={currentTrack?.kind === 'beat' && currentTrack.id === beat.id}
              onPlay={playBeat}
              onLicense={setLicensingBeat}
            />
          ))}
        </div>
      </div>

      {/* Sample packs */}
      <div style={{ padding: '8px 24px', maxWidth: 1400, margin: '0 auto' }}>
        <SectionHeader
          title="Sample packs"
          action={
            <Link to="/packs" style={sectionLink}>
              View all <ArrowRight size={13} />
            </Link>
          }
        />
        <div className="stagger-list" style={cardGrid}>
          {packs.slice(0, 3).map((pack) => (
            <PackCard key={pack.id} pack={pack} />
          ))}
        </div>
      </div>

      {/* CTA strip */}
      <div style={{ padding: '16px 24px 64px', maxWidth: 1400, margin: '0 auto' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: 16,
          }}
        >
          <CtaCard
            icon={Calendar}
            title="Studio sessions"
            description="Book recording, mixing, mastering, or production time."
            to="/book"
            label="Book now"
          />
          <CtaCard
            icon={GraduationCap}
            title="Classroom"
            description="Courses on mixing, drum programming, and vocal recording."
            to="/classroom"
            label="Start learning"
          />
        </div>
      </div>

      {licensingBeat && <LicenseModal beat={licensingBeat} onClose={() => setLicensingBeat(null)} />}
    </div>
  );
}

function CtaCard({ icon: Icon, title, description, to, label }) {
  return (
    <div
      style={{
        padding: 24,
        borderRadius: 8,
        background: C.bg2,
        border: `1px solid ${C.border}`,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      <div
        aria-hidden="true"
        style={{
          width: 36,
          height: 36,
          borderRadius: 8,
          background: 'rgba(255,85,0,0.12)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon size={18} color={C.orange} />
      </div>
      <div style={{ fontFamily: FONT, fontSize: 15, fontWeight: 700, color: C.text }}>{title}</div>
      <p style={{ fontFamily: FONT, fontSize: 13, color: C.textDim, lineHeight: 1.5, margin: 0, flex: 1 }}>
        {description}
      </p>
      <Link to={to} style={sectionLink}>
        {label} <ArrowRight size={13} />
      </Link>
    </div>
  );
}

const primaryCta = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  padding: '13px 22px',
  borderRadius: 4,
  background: C.orange,
  color: C.bg,
  fontFamily: FONT,
  fontSize: 14,
  fontWeight: 800,
  textDecoration: 'none',
};

const secondaryCta = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '13px 22px',
  borderRadius: 4,
  background: 'transparent',
  border: `1px solid ${C.border}`,
  color: C.text,
  fontFamily: FONT,
  fontSize: 14,
  fontWeight: 700,
  textDecoration: 'none',
};

const sectionLink = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  fontFamily: FONT,
  fontSize: 12,
  fontWeight: 700,
  color: C.orange,
  textDecoration: 'none',
};
