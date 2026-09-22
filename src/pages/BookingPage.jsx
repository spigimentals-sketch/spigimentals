import React, { useEffect, useMemo, useState } from 'react';
import {
  Mic2, Headphones, Disc3, Sparkles, Calendar as CalendarIcon, Clock,
  ChevronLeft, ChevronRight, CheckCircle2, AlertCircle, MapPin, Phone, Mail, User,
} from 'lucide-react';
import { C, FONT } from '../lib/theme';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

// ----------------------------------------------------------------------------
// Pricing — adjust to your real rates. XAF (Central African CFA franc) is the
// local currency in Cameroon. USD shown for international clients.
// ----------------------------------------------------------------------------
const SESSION_TYPES = [
  {
    id: 'recording',
    name: 'Recording session',
    desc: 'Tracking vocals or instruments in the booth with engineer included.',
    icon: Mic2,
    perHourXAF: 25000,
    perHourUSD: 42,
    minHours: 2,
  },
  {
    id: 'mixing',
    name: 'Mixing session',
    desc: 'Session with the engineer to mix your stems on the SSL chain.',
    icon: Headphones,
    perHourXAF: 30000,
    perHourUSD: 50,
    minHours: 3,
  },
  {
    id: 'mastering',
    name: 'Mastering',
    desc: 'Per-track flat rate. Includes one revision pass.',
    icon: Disc3,
    perHourXAF: 50000,
    perHourUSD: 85,
    minHours: 1,
    flatRate: true,
  },
  {
    id: 'production',
    name: 'Production session',
    desc: 'Beat-making, arrangement, and topline writing with a producer.',
    icon: Sparkles,
    perHourXAF: 35000,
    perHourUSD: 58,
    minHours: 3,
  },
];

const OPEN_HOUR = 10;        // 10:00 AM
const CLOSE_HOUR = 22;       // 10:00 PM
const SLOT_HOURS = 2;        // each visible slot is a 2-hour block

const fmtXAF = (n) => `${n.toLocaleString('fr-FR')} FCFA`;
const fmtUSD = (n) => `$${n.toFixed(0)}`;

// ----------------------------------------------------------------------------
// Date helpers — kept inline so this page has no external date-lib hard dep.
// If you want, swap these for date-fns.
// ----------------------------------------------------------------------------
const startOfMonth = (d) => new Date(d.getFullYear(), d.getMonth(), 1);
const endOfMonth = (d) => new Date(d.getFullYear(), d.getMonth() + 1, 0);
const sameDay = (a, b) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();
const addMonths = (d, n) => new Date(d.getFullYear(), d.getMonth() + n, 1);
const isPast = (d) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return d < today;
};
const monthLabel = (d) =>
  d.toLocaleString('en-US', { month: 'long', year: 'numeric' });

// ----------------------------------------------------------------------------

export default function BookingPage() {
  const { user, profile } = useAuth();

  const [sessionType, setSessionType] = useState(SESSION_TYPES[0].id);
  const [hours, setHours] = useState(SESSION_TYPES[0].minHours);
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d;
  });
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null); // hour as int, e.g. 14 = 2pm

  const [name, setName] = useState(profile?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');

  const [bookedSlots, setBookedSlots] = useState([]);   // [{starts_at, duration_hours}]
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);           // { ok: true } | { ok: false, message }

  // Whenever session type changes, reset hours to that type's minimum
  useEffect(() => {
    const t = SESSION_TYPES.find((s) => s.id === sessionType);
    setHours(t?.minHours || 1);
  }, [sessionType]);

  // Prefill name + email when the auth state hydrates
  useEffect(() => {
    if (profile?.name && !name) setName(profile.name);
    if (user?.email && !email) setEmail(user.email);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile, user]);

  // Load booked slots whenever we look at a new month
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const monthKey = `${calendarMonth.getFullYear()}-${String(calendarMonth.getMonth() + 1).padStart(2, '0')}`;
      try {
        const { slots } = await api.getBookedSlots(monthKey);
        if (!cancelled) setBookedSlots(slots || []);
      } catch (err) {
        if (cancelled) return;
        console.warn('[Booking] Failed to load slots:', err.message);
        setBookedSlots([]);
      }
    })();
    return () => { cancelled = true; };
  }, [calendarMonth]);

  const sessionDef = SESSION_TYPES.find((s) => s.id === sessionType);
  const totalXAF = sessionDef.flatRate ? sessionDef.perHourXAF : sessionDef.perHourXAF * hours;
  const totalUSD = sessionDef.flatRate ? sessionDef.perHourUSD : sessionDef.perHourUSD * hours;

  // Build the slot list for the selected day, marking ones that conflict.
  // We check conflicts against the user's ACTUAL session duration so a
  // 4-hour session can't be booked over an existing 2-hour booking starting
  // in the middle.
  const daySlots = useMemo(() => {
    if (!selectedDate) return [];
    const sessionLength = sessionDef.flatRate ? 1 : hours;
    const slots = [];
    for (let h = OPEN_HOUR; h + SLOT_HOURS <= CLOSE_HOUR; h += SLOT_HOURS) {
      const slotStart = new Date(selectedDate);
      slotStart.setHours(h, 0, 0, 0);
      const slotEnd = new Date(slotStart.getTime() + sessionLength * 3600_000);

      const inPast = slotStart < new Date();
      const tooLate = h + sessionLength > CLOSE_HOUR;

      const conflict = bookedSlots.some((b) => {
        const bStart = new Date(b.starts_at);
        const bEnd = new Date(bStart.getTime() + b.duration_hours * 3600_000);
        return slotStart < bEnd && bStart < slotEnd;
      });

      slots.push({ hour: h, conflict, inPast, tooLate });
    }
    return slots;
  }, [selectedDate, bookedSlots, hours, sessionDef.flatRate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setResult(null);
    if (!selectedDate || selectedSlot == null) {
      setResult({ ok: false, message: 'Please pick a date and time slot.' });
      return;
    }
    if (!name.trim() || !email.trim()) {
      setResult({ ok: false, message: 'Name and email are required.' });
      return;
    }

    const startsAt = new Date(selectedDate);
    startsAt.setHours(selectedSlot, 0, 0, 0);

    setSubmitting(true);
    try {
      await api.createBooking({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim() || null,
        session_type: sessionType,
        starts_at: startsAt.toISOString(),
        duration_hours: hours,
        notes: notes.trim() || null,
        total_xaf: totalXAF,
        total_usd: totalUSD,
      });
      setResult({ ok: true });
      // Refresh slots so the one we just took shows as booked
      setBookedSlots((prev) => [
        ...prev,
        { starts_at: startsAt.toISOString(), duration_hours: hours },
      ]);
      setSelectedSlot(null);
    } catch (err) {
      // 409 means someone else took this slot between our last fetch and
      // submit — the server re-checks for overlaps, so this is authoritative.
      setResult({ ok: false, message: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  // -------- render --------
  return (
    <div style={{ padding: '32px 24px' }}>
      <div style={{ maxWidth: 1180, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '4px 10px',
              borderRadius: 3,
              background: 'rgba(255, 85, 0, 0.12)',
              marginBottom: 16,
            }}
          >
            <MapPin size={12} color={C.orange} />
            <span
              style={{
                fontFamily: FONT,
                fontSize: 11,
                color: C.orange,
                fontWeight: 700,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
              }}
            >
              Akwa, Douala — by appointment
            </span>
          </div>
          <h1
            style={{
              fontFamily: FONT,
              fontSize: 'clamp(28px, 4.5vw, 44px)',
              color: C.text,
              margin: 0,
              fontWeight: 800,
              letterSpacing: '-0.03em',
              lineHeight: 1.05,
            }}
          >
            Book the studio.
          </h1>
          <p
            style={{
              fontFamily: FONT,
              fontSize: 15,
              color: C.textDim,
              lineHeight: 1.5,
              maxWidth: 620,
              marginTop: 10,
            }}
          >
            Pick a session type, a date, and a time. We'll confirm by email within 24 hours.
            Payment via mobile money (MTN MoMo / Orange Money) or card.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 1fr) 340px',
              gap: 24,
              alignItems: 'start',
            }}
            className="booking-grid"
          >
            {/* LEFT column — selection */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {/* Step 1: session type */}
              <Section step="1" title="Choose a session type">
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                    gap: 12,
                  }}
                >
                  {SESSION_TYPES.map((s) => {
                    const Icon = s.icon;
                    const active = sessionType === s.id;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setSessionType(s.id)}
                        aria-pressed={active}
                        style={{
                          textAlign: 'left',
                          padding: 16,
                          borderRadius: 6,
                          cursor: 'pointer',
                          background: active ? 'rgba(255,85,0,0.08)' : C.bg2,
                          border: `1px solid ${active ? C.orange : C.border}`,
                          color: 'inherit',
                          transition: 'all 0.15s',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 8,
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <Icon size={18} color={active ? C.orange : C.textDim} />
                          <span style={{ fontFamily: FONT, fontSize: 14, color: C.text, fontWeight: 700 }}>
                            {s.name}
                          </span>
                        </div>
                        <p style={{ fontFamily: FONT, fontSize: 12, color: C.textDim, margin: 0, lineHeight: 1.5 }}>
                          {s.desc}
                        </p>
                        <div
                          style={{
                            display: 'flex',
                            gap: 6,
                            alignItems: 'baseline',
                            marginTop: 4,
                            fontFamily: FONT,
                            fontSize: 12,
                            color: active ? C.orange : C.textDim,
                            fontWeight: 600,
                          }}
                        >
                          <span>{fmtXAF(s.perHourXAF)}</span>
                          <span style={{ color: C.textMute, fontSize: 11 }}>
                            ({fmtUSD(s.perHourUSD)}){s.flatRate ? ' / track' : ' / hr'}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Hours stepper, hidden for flat-rate sessions */}
                {!sessionDef.flatRate && (
                  <div
                    style={{
                      marginTop: 18,
                      display: 'flex',
                      gap: 12,
                      alignItems: 'center',
                      padding: 14,
                      background: C.bg2,
                      borderRadius: 6,
                      border: `1px solid ${C.border}`,
                    }}
                  >
                    <Clock size={14} color={C.textDim} />
                    <label style={{ fontFamily: FONT, fontSize: 13, color: C.text, fontWeight: 600 }}>
                      Duration:
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
                      <Stepper
                        ariaLabel="Decrease hours"
                        onClick={() => setHours(Math.max(sessionDef.minHours, hours - 1))}
                        disabled={hours <= sessionDef.minHours}
                      >−</Stepper>
                      <span
                        style={{
                          fontFamily: FONT,
                          fontSize: 14,
                          color: C.text,
                          fontWeight: 700,
                          minWidth: 64,
                          textAlign: 'center',
                        }}
                      >
                        {hours} hour{hours === 1 ? '' : 's'}
                      </span>
                      <Stepper
                        ariaLabel="Increase hours"
                        onClick={() => setHours(Math.min(8, hours + 1))}
                        disabled={hours >= 8}
                      >+</Stepper>
                    </div>
                  </div>
                )}
              </Section>

              {/* Step 2: date */}
              <Section step="2" title="Pick a date">
                <Calendar
                  month={calendarMonth}
                  onPrev={() => setCalendarMonth(addMonths(calendarMonth, -1))}
                  onNext={() => setCalendarMonth(addMonths(calendarMonth, 1))}
                  selectedDate={selectedDate}
                  onSelect={(d) => {
                    setSelectedDate(d);
                    setSelectedSlot(null);
                  }}
                />
              </Section>

              {/* Step 3: time slot */}
              {selectedDate && (
                <Section step="3" title={`Pick a time on ${selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}`}>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))',
                      gap: 8,
                    }}
                  >
                    {daySlots.map(({ hour, conflict, inPast, tooLate }) => {
                      const disabled = conflict || inPast || tooLate;
                      const active = selectedSlot === hour;
                      const statusLabel =
                        conflict ? 'taken' :
                        inPast   ? 'past'  :
                        tooLate  ? 'closes' :
                                   `${sessionDef.flatRate ? 1 : hours}h`;
                      return (
                        <button
                          key={hour}
                          type="button"
                          disabled={disabled}
                          onClick={() => setSelectedSlot(hour)}
                          aria-pressed={active}
                          style={{
                            padding: '12px 10px',
                            borderRadius: 6,
                            cursor: disabled ? 'not-allowed' : 'pointer',
                            background: active ? C.orange : (disabled ? C.bg : C.bg2),
                            border: `1px solid ${active ? C.orange : (disabled ? C.border : C.border)}`,
                            color: active ? C.bg : (disabled ? C.textMute : C.text),
                            fontFamily: FONT,
                            fontSize: 13,
                            fontWeight: 700,
                            transition: 'all 0.12s',
                            opacity: disabled ? 0.5 : 1,
                            textDecoration: conflict ? 'line-through' : 'none',
                          }}
                        >
                          {formatHour(hour)}
                          <div style={{ fontSize: 10, fontWeight: 500, marginTop: 2, opacity: 0.8 }}>
                            {statusLabel}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </Section>
              )}

              {/* Step 4: contact + notes */}
              <Section step="4" title="Your details">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
                  <Field label="Full name" icon={User}>
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your name"
                      required
                      style={inputStyle}
                    />
                  </Field>
                  <Field label="Email" icon={Mail}>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                      style={inputStyle}
                    />
                  </Field>
                  <Field label="Phone (optional)" icon={Phone}>
                    <input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+237 ..."
                      style={inputStyle}
                    />
                  </Field>
                </div>
                <div style={{ marginTop: 12 }}>
                  <label
                    style={{
                      display: 'block',
                      fontFamily: FONT,
                      fontSize: 12,
                      color: C.textDim,
                      fontWeight: 600,
                      marginBottom: 6,
                    }}
                  >
                    Notes for the engineer (optional)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Number of vocalists, reference tracks, gear requests, etc."
                    rows={4}
                    style={{ ...inputStyle, resize: 'vertical', fontFamily: FONT }}
                  />
                </div>
              </Section>
            </div>

            {/* RIGHT column — summary (sticky) */}
            <aside
              style={{
                background: C.bg2,
                border: `1px solid ${C.border}`,
                borderRadius: 8,
                padding: 20,
                position: 'sticky',
                top: 72,
                display: 'flex',
                flexDirection: 'column',
                gap: 14,
              }}
              className="booking-summary"
            >
              <h3
                style={{
                  margin: 0,
                  fontFamily: FONT,
                  fontSize: 12,
                  fontWeight: 700,
                  color: C.textDim,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                }}
              >
                Summary
              </h3>

              <SummaryRow label="Session" value={sessionDef.name} />
              {!sessionDef.flatRate && <SummaryRow label="Duration" value={`${hours} hours`} />}
              <SummaryRow
                label="Date"
                value={selectedDate ? selectedDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : '—'}
              />
              <SummaryRow
                label="Time"
                value={selectedSlot != null
                  ? `${formatHour(selectedSlot)} – ${formatHour(selectedSlot + (sessionDef.flatRate ? 1 : hours))}`
                  : '—'}
              />

              <div style={{ height: 1, background: C.border, margin: '4px 0' }} />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontFamily: FONT, fontSize: 13, color: C.textDim, fontWeight: 600 }}>Total</span>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontFamily: FONT, fontSize: 22, color: C.text, fontWeight: 800, lineHeight: 1 }}>
                    {fmtXAF(totalXAF)}
                  </div>
                  <div style={{ fontFamily: FONT, fontSize: 12, color: C.textMute, marginTop: 4 }}>
                    ≈ {fmtUSD(totalUSD)}
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting || !selectedDate || selectedSlot == null}
                style={{
                  padding: '14px 20px',
                  borderRadius: 6,
                  border: 'none',
                  background: (!selectedDate || selectedSlot == null || submitting) ? C.bg3 : C.orange,
                  color: (!selectedDate || selectedSlot == null || submitting) ? C.textMute : C.bg,
                  fontFamily: FONT,
                  fontSize: 14,
                  fontWeight: 800,
                  cursor: (!selectedDate || selectedSlot == null || submitting) ? 'not-allowed' : 'pointer',
                  marginTop: 6,
                }}
              >
                {submitting ? 'Submitting…' : 'Request booking'}
              </button>

              {result?.ok && (
                <div
                  style={{
                    padding: 12,
                    borderRadius: 6,
                    background: 'rgba(29, 185, 84, 0.12)',
                    border: '1px solid rgba(29, 185, 84, 0.4)',
                    display: 'flex',
                    gap: 10,
                    alignItems: 'flex-start',
                  }}
                >
                  <CheckCircle2 size={16} color="#1DB954" style={{ flexShrink: 0, marginTop: 1 }} />
                  <div style={{ fontFamily: FONT, fontSize: 12, color: C.text, lineHeight: 1.5 }}>
                    Request received. We'll confirm by email within 24 hours.
                  </div>
                </div>
              )}
              {result && !result.ok && (
                <div
                  style={{
                    padding: 12,
                    borderRadius: 6,
                    background: 'rgba(226, 54, 54, 0.12)',
                    border: '1px solid rgba(226, 54, 54, 0.4)',
                    display: 'flex',
                    gap: 10,
                    alignItems: 'flex-start',
                  }}
                >
                  <AlertCircle size={16} color="#e23636" style={{ flexShrink: 0, marginTop: 1 }} />
                  <div style={{ fontFamily: FONT, fontSize: 12, color: C.text, lineHeight: 1.5 }}>
                    {result.message}
                  </div>
                </div>
              )}

              <p style={{ fontFamily: FONT, fontSize: 11, color: C.textMute, margin: 0, lineHeight: 1.5 }}>
                No payment is taken right now. We'll send you a payment link with the confirmation.
              </p>
            </aside>
          </div>
        </form>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .booking-grid { grid-template-columns: 1fr !important; }
          .booking-summary { position: static !important; }
        }
        @keyframes slideInRight { from { transform: translateX(100%); } to { transform: translateX(0); } }
      `}</style>
    </div>
  );
}

// ============================================================================
// Sub-components
// ============================================================================

function Section({ step, title, children }) {
  return (
    <section style={{ padding: 20, background: C.bg2, borderRadius: 8, border: `1px solid ${C.border}` }}>
      <header style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <span
          aria-hidden="true"
          style={{
            width: 24,
            height: 24,
            borderRadius: '50%',
            background: C.orange,
            color: C.bg,
            fontFamily: FONT,
            fontSize: 12,
            fontWeight: 800,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {step}
        </span>
        <h2
          style={{
            margin: 0,
            fontFamily: FONT,
            fontSize: 16,
            color: C.text,
            fontWeight: 700,
            letterSpacing: '-0.01em',
          }}
        >
          {title}
        </h2>
      </header>
      {children}
    </section>
  );
}

function Calendar({ month, onPrev, onNext, selectedDate, onSelect }) {
  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(month);
  const startWeekday = monthStart.getDay(); // 0 = Sunday

  // Build a 6x7 grid
  const cells = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= monthEnd.getDate(); d++) {
    cells.push(new Date(month.getFullYear(), month.getMonth(), d));
  }
  while (cells.length % 7 !== 0) cells.push(null);

  const weekdayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div>
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <button
          type="button"
          onClick={onPrev}
          aria-label="Previous month"
          style={navBtnStyle}
        >
          <ChevronLeft size={16} />
        </button>
        <div style={{ fontFamily: FONT, fontSize: 14, color: C.text, fontWeight: 700 }}>
          {monthLabel(month)}
        </div>
        <button
          type="button"
          onClick={onNext}
          aria-label="Next month"
          style={navBtnStyle}
        >
          <ChevronRight size={16} />
        </button>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
        {weekdayLabels.map((d) => (
          <div
            key={d}
            style={{
              fontFamily: FONT,
              fontSize: 10,
              color: C.textMute,
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              textAlign: 'center',
              padding: '6px 0',
            }}
          >
            {d}
          </div>
        ))}
        {cells.map((d, i) => {
          if (!d) return <div key={i} />;
          const past = isPast(d);
          const selected = selectedDate && sameDay(d, selectedDate);
          const today = sameDay(d, new Date());
          return (
            <button
              key={i}
              type="button"
              disabled={past}
              onClick={() => onSelect(d)}
              aria-label={d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
              aria-pressed={selected}
              style={{
                aspectRatio: '1 / 1',
                borderRadius: 6,
                border: today && !selected ? `1px solid ${C.orange}` : `1px solid transparent`,
                background: selected ? C.orange : (past ? 'transparent' : C.bg3),
                color: selected ? C.bg : (past ? C.textMute : C.text),
                cursor: past ? 'not-allowed' : 'pointer',
                fontFamily: FONT,
                fontSize: 13,
                fontWeight: selected ? 800 : 600,
                opacity: past ? 0.35 : 1,
                transition: 'all 0.12s',
              }}
            >
              {d.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Field({ label, icon: Icon, children }) {
  return (
    <label style={{ display: 'block' }}>
      <span
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          fontFamily: FONT,
          fontSize: 12,
          color: C.textDim,
          fontWeight: 600,
          marginBottom: 6,
        }}
      >
        {Icon && <Icon size={12} />}
        {label}
      </span>
      {children}
    </label>
  );
}

function Stepper({ children, ariaLabel, ...props }) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      {...props}
      style={{
        width: 28,
        height: 28,
        borderRadius: 6,
        border: `1px solid ${C.border}`,
        background: C.bg3,
        color: C.text,
        fontFamily: FONT,
        fontSize: 16,
        fontWeight: 700,
        cursor: props.disabled ? 'not-allowed' : 'pointer',
        opacity: props.disabled ? 0.4 : 1,
      }}
    >
      {children}
    </button>
  );
}

function SummaryRow({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
      <span style={{ fontFamily: FONT, fontSize: 12, color: C.textDim }}>{label}</span>
      <span
        style={{
          fontFamily: FONT,
          fontSize: 13,
          color: C.text,
          fontWeight: 600,
          textAlign: 'right',
          maxWidth: '60%',
        }}
      >
        {value}
      </span>
    </div>
  );
}

function formatHour(h) {
  const period = h >= 12 ? 'PM' : 'AM';
  const display = h % 12 === 0 ? 12 : h % 12;
  return `${display}:00 ${period}`;
}

const inputStyle = {
  width: '100%',
  padding: '11px 12px',
  borderRadius: 6,
  background: C.bg3,
  border: `1px solid ${C.border}`,
  color: C.text,
  fontFamily: FONT,
  fontSize: 13,
  outline: 'none',
  boxSizing: 'border-box',
};

const navBtnStyle = {
  width: 32,
  height: 32,
  borderRadius: 6,
  border: `1px solid ${C.border}`,
  background: C.bg3,
  color: C.text,
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
};
