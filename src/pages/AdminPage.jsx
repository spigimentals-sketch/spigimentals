import React from 'react';
import { ShieldAlert } from 'lucide-react';
import { C, FONT } from '../lib/theme';
import { useAuth } from '../contexts/AuthContext';
import PageHeader from '../components/PageHeader';
import AdminSection from '../components/AdminSection';
import AudioUploadControl from '../components/AudioUploadControl';
import CoverUploadControl from '../components/CoverUploadControl';
import PackFilesControl from '../components/PackFilesControl';
import AdminDashboard from '../components/AdminDashboard';
import AdminBookings from '../components/AdminBookings';

const SECTIONS = [
  {
    resource: 'tracks',
    title: 'Catalog tracks',
    orderable: true,
    fields: [
      { key: 'title', label: 'Title', type: 'text' },
      { key: 'artist', label: 'Artist', type: 'text' },
      { key: 'bpm', label: 'BPM', type: 'number' },
      { key: 'key', label: 'Key', type: 'text' },
      { key: 'mood', label: 'Mood', type: 'text' },
      { key: 'tags', label: 'Tags (comma-separated)', type: 'tags' },
      { key: 'plays', label: 'Plays label', type: 'text' },
      { key: 'spotifyUrl', label: 'Spotify URL', type: 'text' },
      { key: 'youtubeUrl', label: 'YouTube URL (takes priority when set)', type: 'text' },
    ],
    renderRowExtra: (track, reload) => (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <AudioUploadControl resource="tracks" item={track} onChange={reload} />
        <CoverUploadControl resource="tracks" item={track} onChange={reload} />
      </div>
    ),
  },
  {
    resource: 'covers',
    title: 'Covers',
    orderable: true,
    fields: [
      { key: 'title', label: 'Title', type: 'text' },
      { key: 'artist', label: 'Artist (performer)', type: 'text' },
      { key: 'originalArtist', label: 'Originally by', type: 'text' },
      { key: 'bpm', label: 'BPM', type: 'number' },
      { key: 'key', label: 'Key', type: 'text' },
      { key: 'mood', label: 'Mood', type: 'text' },
      { key: 'tags', label: 'Tags (comma-separated)', type: 'tags' },
      { key: 'plays', label: 'Plays label', type: 'text' },
      { key: 'spotifyUrl', label: 'Spotify URL', type: 'text' },
      { key: 'youtubeUrl', label: 'YouTube URL (takes priority when set)', type: 'text' },
    ],
    renderRowExtra: (cover, reload) => (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <AudioUploadControl resource="covers" item={cover} onChange={reload} />
        <CoverUploadControl resource="covers" item={cover} onChange={reload} />
      </div>
    ),
  },
  {
    resource: 'beats',
    title: 'Beats',
    fields: [
      { key: 'title', label: 'Title', type: 'text' },
      { key: 'bpm', label: 'BPM', type: 'number' },
      { key: 'key', label: 'Key', type: 'text' },
      { key: 'mood', label: 'Mood', type: 'text' },
      { key: 'priceBasic', label: 'Basic price ($)', type: 'number' },
      { key: 'pricePremium', label: 'Premium price ($)', type: 'number' },
      { key: 'priceExclusive', label: 'Exclusive price ($)', type: 'number' },
      { key: 'tags', label: 'Tags (comma-separated)', type: 'tags' },
      { key: 'plays', label: 'Plays label', type: 'text' },
      { key: 'youtubeUrl', label: 'YouTube URL (takes priority when set)', type: 'text' },
    ],
    renderRowExtra: (beat, reload) => (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <AudioUploadControl resource="beats" item={beat} onChange={reload} />
        <CoverUploadControl resource="beats" item={beat} onChange={reload} />
      </div>
    ),
  },
  {
    resource: 'packs',
    title: 'Sample packs',
    fields: [
      { key: 'title', label: 'Title', type: 'text' },
      { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'price', label: 'Price ($)', type: 'number' },
      { key: 'sampleCount', label: 'Sample count', type: 'number' },
      { key: 'tags', label: 'Tags (comma-separated)', type: 'tags' },
    ],
    renderRowExtra: (pack) => <PackFilesControl pack={pack} />,
  },
  {
    resource: 'plugins',
    title: 'Plugins',
    fields: [
      { key: 'name', label: 'Name', type: 'text' },
      { key: 'tagline', label: 'Tagline', type: 'text' },
      { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'price', label: 'Price ($)', type: 'number' },
      { key: 'category', label: 'Category', type: 'text' },
      { key: 'formats', label: 'Formats (comma-separated)', type: 'tags' },
      { key: 'os', label: 'OS (comma-separated)', type: 'tags' },
      { key: 'version', label: 'Version', type: 'text' },
    ],
  },
  {
    resource: 'courses',
    title: 'Courses',
    fields: [
      { key: 'title', label: 'Title', type: 'text' },
      { key: 'instructor', label: 'Instructor', type: 'text' },
      { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'price', label: 'Price ($)', type: 'number' },
      { key: 'lessons', label: 'Lessons', type: 'number' },
      { key: 'level', label: 'Level', type: 'text' },
    ],
  },
];

export default function AdminPage() {
  const { user, profile, loading } = useAuth();

  if (loading) return null;

  if (!user || !profile?.is_admin) {
    return (
      <div style={{ maxWidth: 480, margin: '96px auto', padding: '0 24px', textAlign: 'center' }}>
        <ShieldAlert size={32} color={C.textMute} style={{ marginBottom: 12 }} />
        <h1 style={{ fontFamily: FONT, fontSize: 20, color: C.text, fontWeight: 800, margin: '0 0 6px' }}>
          Admins only
        </h1>
        <p style={{ fontFamily: FONT, fontSize: 13, color: C.textDim, lineHeight: 1.5 }}>
          {user
            ? "Your account doesn't have admin access."
            : 'Sign in with an admin account to manage storefront content.'}
        </p>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        eyebrow="Admin"
        title="Manage storefront content."
        description="Add, edit, or remove tracks, beats, sample packs, plugins, and courses. Changes go live immediately."
      />
      <div style={{ padding: '24px', maxWidth: 900, margin: '0 auto' }}>
        <AdminDashboard />
        <AdminBookings />
        {SECTIONS.map((s) => (
          <AdminSection
            key={s.resource}
            resource={s.resource}
            title={s.title}
            fields={s.fields}
            renderRowExtra={s.renderRowExtra}
            orderable={s.orderable}
          />
        ))}
      </div>
    </div>
  );
}
