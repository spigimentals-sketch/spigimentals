import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Menu, X, Search, LogOut, User as UserIcon, ShieldCheck } from 'lucide-react';

import { C, FONT } from '../lib/theme';
import { useAuth } from '../contexts/AuthContext';
import CartButton from './Cart/CartButton';

const LINKS = [
  { to: '/',           label: 'Home',      end: true },
  { to: '/catalog',    label: 'Catalog' },
  { to: '/beats',      label: 'Beats' },
  { to: '/packs',      label: 'Samples' },
  { to: '/plugins',    label: 'Plugins' },
  { to: '/classroom',  label: 'Classroom' },
  { to: '/book',       label: 'Book studio' },
];

export default function Nav() {
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    setMenuOpen(false);
    navigate('/');
  };

  // Auto-close both menus if the viewport grows past the mobile breakpoint
  // (e.g. rotating a tablet, or resizing a desktop window back up) — nothing
  // else clears them, so they'd otherwise stay stuck open.
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1025px)');
    const handleChange = (e) => {
      if (e.matches) {
        setOpen(false);
        setMenuOpen(false);
      }
    };
    mq.addEventListener('change', handleChange);
    return () => mq.removeEventListener('change', handleChange);
  }, []);

  const linkStyle = ({ isActive }) => ({
    padding: '6px 10px',
    borderRadius: 4,
    fontFamily: FONT,
    fontSize: 13,
    fontWeight: 600,
    color: isActive ? C.orange : C.textDim,
    textDecoration: 'none',
    transition: 'color 0.12s',
  });

  return (
    <nav style={{ position: 'sticky', top: 0, zIndex: 50, background: C.bg, borderBottom: `1px solid ${C.border}` }}>
      <div
        className="nav-bar"
        style={{
          maxWidth: 1400,
          margin: '0 auto',
          height: 56,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
        }}
      >
        {/* Logo */}
        <NavLink
          to="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: 0,
            textDecoration: 'none',
            flexShrink: 0,
          }}
        >
          <img
            src="/logo.png"
            alt=""
            aria-hidden="true"
            width={28}
            height={28}
            style={{ width: 28, height: 28, borderRadius: 6, display: 'block' }}
          />
          <span
            className="nav-wordmark"
            style={{
              fontFamily: FONT,
              fontWeight: 800,
              color: C.orange,
              letterSpacing: '-0.02em',
              whiteSpace: 'nowrap',
            }}
          >
            SPIGIMENTALS
          </span>
        </NavLink>

        {/* Search (desktop) */}
        <div style={{ flex: 1, maxWidth: 380, position: 'relative' }} className="desktop-search">
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: C.textMute }} />
          <input
            placeholder="Search beats, packs, courses..."
            aria-label="Search the site"
            style={{
              width: '100%',
              padding: '8px 12px 8px 34px',
              borderRadius: 4,
              background: C.bg2,
              border: `1px solid ${C.border}`,
              color: C.text,
              fontFamily: FONT,
              fontSize: 13,
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Desktop nav links */}
        <div style={{ alignItems: 'center', gap: 4 }} className="desktop-nav">
          {LINKS.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end} style={linkStyle}>
              {l.label}
            </NavLink>
          ))}
        </div>

        {/* Right side — cart + user */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <CartButton />
          {user ? (
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                aria-label="Account menu"
                aria-expanded={menuOpen}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px 8px',
                  borderRadius: 4,
                  color: C.text,
                }}
              >
                <div
                  aria-hidden="true"
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    background: C.bg3,
                    border: `1px solid ${C.border}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: FONT,
                    fontSize: 12,
                    fontWeight: 700,
                    color: C.text,
                  }}
                >
                  {(profile?.name || user.email || '?').charAt(0).toUpperCase()}
                </div>
              </button>
              {menuOpen && (
                <>
                  <div onClick={() => setMenuOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 40 }} />
                  <div
                    style={{
                      position: 'absolute',
                      top: 'calc(100% + 6px)',
                      right: 0,
                      minWidth: 200,
                      background: C.bg2,
                      border: `1px solid ${C.border}`,
                      borderRadius: 6,
                      padding: 6,
                      overflow: 'hidden',
                      zIndex: 41,
                      boxShadow: '0 12px 28px rgba(0,0,0,0.4)',
                    }}
                  >
                    <div style={{ padding: '8px 12px', borderBottom: `1px solid ${C.border}`, marginBottom: 4 }}>
                      <div style={{ fontFamily: FONT, fontSize: 13, color: C.text, fontWeight: 700 }}>
                        {profile?.name || 'Account'}
                      </div>
                      <div style={{ fontFamily: FONT, fontSize: 11, color: C.textMute }}>{user.email}</div>
                    </div>
                    <MenuItem onClick={() => { setMenuOpen(false); navigate('/classroom'); }} icon={UserIcon}>
                      My classroom
                    </MenuItem>
                    {profile?.is_admin && (
                      <MenuItem onClick={() => { setMenuOpen(false); navigate('/admin'); }} icon={ShieldCheck}>
                        Admin panel
                      </MenuItem>
                    )}
                    <MenuItem onClick={handleSignOut} icon={LogOut}>Sign out</MenuItem>
                  </div>
                </>
              )}
            </div>
          ) : (
            <NavLink
              to="/account"
              style={{
                padding: '7px 14px',
                borderRadius: 4,
                background: C.orange,
                color: C.bg,
                fontFamily: FONT,
                fontSize: 12,
                fontWeight: 800,
                textDecoration: 'none',
                whiteSpace: 'nowrap',
              }}
            >
              Sign in
            </NavLink>
          )}
          <button
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
            aria-expanded={open}
            style={{ background: 'none', border: 'none', color: C.text, cursor: 'pointer', padding: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            className="mobile-toggle"
          >
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div
          style={{
            flexDirection: 'column',
            padding: 12,
            borderTop: `1px solid ${C.border}`,
            background: C.bg,
          }}
          className="mobile-menu"
        >
          <div style={{ position: 'relative', marginBottom: 8 }}>
            <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: C.textMute }} />
            <input
              placeholder="Search beats, packs, courses..."
              aria-label="Search the site"
              style={{
                width: '100%',
                padding: '12px 12px 12px 34px',
                borderRadius: 4,
                background: C.bg2,
                border: `1px solid ${C.border}`,
                color: C.text,
                fontFamily: FONT,
                fontSize: 14,
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>
          {LINKS.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              onClick={() => setOpen(false)}
              style={({ isActive }) => ({
                padding: '14px',
                borderRadius: 4,
                fontFamily: FONT,
                fontSize: 15,
                fontWeight: 700,
                color: isActive ? C.orange : C.text,
                textDecoration: 'none',
              })}
            >
              {l.label}
            </NavLink>
          ))}
        </div>
      )}
    </nav>
  );
}

function MenuItem({ children, onClick, icon: Icon }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        width: '100%',
        padding: '10px 12px',
        background: 'transparent',
        border: 'none',
        color: C.text,
        fontFamily: FONT,
        fontSize: 13,
        fontWeight: 600,
        cursor: 'pointer',
        borderRadius: 4,
        textAlign: 'left',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = C.bg3)}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
    >
      {Icon && <Icon size={14} />}
      {children}
    </button>
  );
}
