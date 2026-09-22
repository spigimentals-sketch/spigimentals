import React, { useEffect, useState } from 'react';
import { Eye, CalendarClock, Music2, Disc3 } from 'lucide-react';
import { C, FONT } from '../lib/theme';
import { api } from '../lib/api';

// Top-of-page overview: site visits, upcoming bookings, and most-played
// tracks/beats. Pulled from /api/visits/stats, /api/bookings, and the
// existing public tracks/beats lists (now carrying playCount).
export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [tracks, setTracks] = useState([]);
  const [beats, setBeats] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      api.getVisitStats(),
      api.listBookings(),
      api.listContent('tracks'),
      api.listContent('beats'),
    ])
      .then(([visitStats, bookingsRes, tracksRes, beatsRes]) => {
        setStats(visitStats);
        setBookings(bookingsRes.bookings);
        setTracks(tracksRes.items);
        setBeats(beatsRes.items);
      })
      .catch((err) => setError(err.message));
  }, []);

  const upcoming = bookings.filter(
    (b) => b.status !== 'cancelled' && new Date(b.starts_at) >= new Date()
  ).length;

  const topTracks = [...tracks].sort((a, b) => (b.playCount || 0) - (a.playCount || 0)).slice(0, 5);
  const topBeats = [...beats].sort((a, b) => (b.playCount || 0) - (a.playCount || 0)).slice(0, 5);

  if (error) {
    return <div style={{ fontFamily: FONT, fontSize: 13, color: C.danger, marginBottom: 24 }}>{error}</div>;
  }

  if (!stats) {
    return <div style={{ fontFamily: FONT, fontSize: 13, color: C.textMute, marginBottom: 24 }}>Loading dashboard…</div>;
  }

  return (
    <section style={{ marginBottom: 40 }}>
      <h2 style={{ margin: '0 0 12px', fontFamily: FONT, fontSize: 18, fontWeight: 800, color: C.text }}>
        Dashboard
      </h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10, marginBottom: 20 }}>
        <StatCard icon={Eye} label="Visits today" value={stats.today} />
        <StatCard icon={Eye} label="Total visits" value={stats.total} />
        <StatCard icon={CalendarClock} label="Upcoming bookings" value={upcoming} />
        <StatCard icon={CalendarClock} label="Total bookings" value={bookings.length} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
        <TopList icon={Disc3} title="Top tracks" items={topTracks} />
        <TopList icon={Music2} title="Top beats" items={topBeats} />
      </div>
    </section>
  );
}

function StatCard({ icon: Icon, label, value }) {
  return (
    <div
      style={{
        padding: '14px 16px',
        borderRadius: 8,
        background: C.bg2,
        border: `1px solid ${C.border}`,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
        <Icon size={13} color={C.textMute} />
        <span style={{ fontFamily: FONT, fontSize: 11, color: C.textMute, fontWeight: 600 }}>{label}</span>
      </div>
      <div style={{ fontFamily: FONT, fontSize: 22, fontWeight: 800, color: C.text }}>{value}</div>
    </div>
  );
}

function TopList({ icon: Icon, title, items }) {
  return (
    <div style={{ borderRadius: 8, background: C.bg2, border: `1px solid ${C.border}`, padding: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
        <Icon size={13} color={C.textMute} />
        <span style={{ fontFamily: FONT, fontSize: 12, color: C.textDim, fontWeight: 700 }}>{title}</span>
      </div>
      {items.length === 0 ? (
        <div style={{ fontFamily: FONT, fontSize: 12, color: C.textMute }}>No plays yet.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {items.map((item) => (
            <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
              <span style={{ fontFamily: FONT, fontSize: 13, color: C.text, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {item.title}
              </span>
              <span style={{ fontFamily: FONT, fontSize: 12, color: C.textMute, flexShrink: 0 }}>
                {item.playCount || 0} plays
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
