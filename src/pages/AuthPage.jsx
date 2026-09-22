import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, User, AlertCircle, LogOut } from 'lucide-react';
import { C, FONT } from '../lib/theme';
import { useAuth } from '../contexts/AuthContext';

export default function AuthPage() {
  const { user, profile, loading, signIn, signUp, signOut } = useAuth();
  const [mode, setMode] = useState('signin'); // 'signin' | 'signup'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  if (loading) return null;

  if (user) {
    return (
      <div style={{ maxWidth: 480, margin: '80px auto', padding: '0 24px' }}>
        <div style={{ padding: 28, borderRadius: 8, background: C.bg2, border: `1px solid ${C.border}` }}>
          <div style={{ fontFamily: FONT, fontSize: 12, color: C.textDim, marginBottom: 4 }}>Signed in as</div>
          <div style={{ fontFamily: FONT, fontSize: 18, color: C.text, fontWeight: 800, marginBottom: 2 }}>
            {profile?.name || 'Account'}
          </div>
          <div style={{ fontFamily: FONT, fontSize: 13, color: C.textMute, marginBottom: 20 }}>{user.email}</div>
          <button
            onClick={async () => { await signOut(); navigate('/'); }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              width: '100%',
              padding: 12,
              borderRadius: 4,
              border: `1px solid ${C.border}`,
              background: 'transparent',
              color: C.text,
              fontFamily: FONT,
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            <LogOut size={14} /> Sign out
          </button>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    const result = mode === 'signup'
      ? await signUp({ name, email, password })
      : await signIn({ email, password });
    setSubmitting(false);
    if (!result.success) {
      setError(result.message);
      return;
    }
    navigate('/');
  };

  return (
    <div style={{ maxWidth: 420, margin: '64px auto', padding: '0 24px' }}>
      <div style={{ display: 'flex', marginBottom: 24, borderRadius: 4, background: C.bg2, border: `1px solid ${C.border}`, padding: 4 }}>
        {['signin', 'signup'].map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => { setMode(m); setError(''); }}
            style={{
              flex: 1,
              padding: '10px 0',
              borderRadius: 3,
              border: 'none',
              cursor: 'pointer',
              background: mode === m ? C.orange : 'transparent',
              color: mode === m ? C.bg : C.textDim,
              fontFamily: FONT,
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            {m === 'signin' ? 'Sign in' : 'Create account'}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {mode === 'signup' && (
          <Field label="Full name" icon={User}>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" required style={inputStyle} />
          </Field>
        )}
        <Field label="Email" icon={Mail}>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required style={inputStyle} />
        </Field>
        <Field label="Password" icon={Lock}>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={mode === 'signup' ? 'At least 6 characters' : 'Your password'}
            required
            minLength={6}
            style={inputStyle}
          />
        </Field>

        {error && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', padding: 12, borderRadius: 6, background: 'rgba(226,54,54,0.12)', border: '1px solid rgba(226,54,54,0.4)' }}>
            <AlertCircle size={15} color={C.danger} style={{ flexShrink: 0, marginTop: 1 }} />
            <span style={{ fontFamily: FONT, fontSize: 12, color: C.text }}>{error}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          style={{
            marginTop: 8,
            padding: 14,
            borderRadius: 4,
            border: 'none',
            cursor: submitting ? 'not-allowed' : 'pointer',
            background: submitting ? C.bg3 : C.orange,
            color: submitting ? C.textMute : C.bg,
            fontFamily: FONT,
            fontSize: 14,
            fontWeight: 800,
          }}
        >
          {submitting ? 'Please wait…' : mode === 'signup' ? 'Create account' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}

function Field({ label, icon: Icon, children }) {
  return (
    <label style={{ display: 'block' }}>
      <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: FONT, fontSize: 12, color: C.textDim, fontWeight: 600, marginBottom: 6 }}>
        {Icon && <Icon size={12} />}
        {label}
      </span>
      {children}
    </label>
  );
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
