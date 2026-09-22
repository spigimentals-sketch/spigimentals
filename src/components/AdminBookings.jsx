import React, { useEffect, useState } from 'react';
import { C, FONT } from '../lib/theme';
import { api } from '../lib/api';

const STATUS_COLOR = {
  pending: C.textMute,
  confirmed: C.success,
  cancelled: C.danger,
};

const STATUSES = ['pending', 'confirmed', 'cancelled'];

// Every studio booking, admin-only. Bookings are created from the public
// /book page (see server/routes/bookings.js) — this is where they all land.
export default function AdminBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  const load = () => {
    setLoading(true);
    api.listBookings()
      .then((res) => setBookings(res.bookings))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleStatusChange = async (booking, status) => {
    setUpdatingId(booking.id);
    setError('');
    try {
      await api.updateBookingStatus(booking.id, status);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <section style={{ marginBottom: 40 }}>
      <h2 style={{ margin: '0 0 12px', fontFamily: FONT, fontSize: 18, fontWeight: 800, color: C.text }}>
        Bookings <span style={{ color: C.textMute, fontWeight: 600, fontSize: 13 }}>({bookings.length})</span>
      </h2>

      {error && <div style={{ fontFamily: FONT, fontSize: 12, color: C.danger, marginBottom: 10 }}>{error}</div>}

      <div style={{ border: `1px solid ${C.border}`, borderRadius: 6, overflow: 'hidden' }}>
        {loading ? (
          <Row muted>Loading…</Row>
        ) : bookings.length === 0 ? (
          <Row muted>No bookings yet.</Row>
        ) : (
          bookings.map((b) => (
            <div key={b.id} style={{ borderBottom: `1px solid ${C.border}`, background: C.bg2 }}>
              <Row>
                <div style={{ flex: '1 1 220px', minWidth: 0 }}>
                  <div style={{ fontFamily: FONT, fontSize: 13, fontWeight: 700, color: C.text }}>{b.name}</div>
                  <div style={{ fontFamily: FONT, fontSize: 11, color: C.textMute }}>{b.email}{b.phone ? ` · ${b.phone}` : ''}</div>
                </div>
                <div style={{ flex: '1 1 160px', fontFamily: FONT, fontSize: 12, color: C.textDim }}>
                  {b.session_type} · {b.duration_hours}h
                </div>
                <div style={{ flex: '1 1 180px', fontFamily: FONT, fontSize: 12, color: C.textDim }}>
                  {new Date(b.starts_at).toLocaleString()}
                </div>
                <span
                  style={{
                    fontFamily: FONT,
                    fontSize: 11,
                    fontWeight: 700,
                    color: STATUS_COLOR[b.status] || C.textMute,
                    textTransform: 'capitalize',
                    marginRight: 10,
                  }}
                >
                  {b.status}
                </span>
                <select
                  value={b.status}
                  disabled={updatingId === b.id}
                  onChange={(e) => handleStatusChange(b, e.target.value)}
                  style={selectStyle}
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </Row>
              {b.notes && (
                <div style={{ padding: '0 14px 12px', fontFamily: FONT, fontSize: 12, color: C.textMute }}>
                  {b.notes}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </section>
  );
}

function Row({ children, muted }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 8,
        padding: '10px 14px',
        background: C.bg2,
      }}
    >
      {muted ? <span style={{ fontFamily: FONT, fontSize: 13, color: C.textMute }}>{children}</span> : children}
    </div>
  );
}

const selectStyle = {
  padding: '6px 8px',
  borderRadius: 4,
  background: C.bg3,
  border: `1px solid ${C.border}`,
  color: C.text,
  fontFamily: FONT,
  fontSize: 12,
  outline: 'none',
};
