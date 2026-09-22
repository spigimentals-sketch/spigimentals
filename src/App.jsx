import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';

import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';

import Nav from './components/Nav';
import Footer from './components/Footer';
import MiniPlayer from './components/MiniPlayer';
import CartDrawer from './components/Cart/CartDrawer';

import HomePage from './pages/HomePage';
import CatalogPage from './pages/CatalogPage';
import BeatsPage from './pages/BeatsPage';
import PacksPage from './pages/PacksPage';
import PluginsPage from './pages/PluginsPage';
import ClassroomPage from './pages/ClassroomPage';
import BookingPage from './pages/BookingPage';
import AuthPage from './pages/AuthPage';
import AdminPage from './pages/AdminPage';

import { C, FONT } from './lib/theme';
import { normalizeSpotifyUrl } from './lib/spotify';
import { normalizeYoutubeUrl } from './lib/youtube';
import { api } from './lib/api';

// Logs one pageview per route change for the admin dashboard. Rendered inside
// BrowserRouter so it can read the current location; renders nothing itself.
function VisitTracker() {
  const location = useLocation();
  useEffect(() => {
    api.recordVisit(location.pathname).catch(() => {});
  }, [location.pathname]);
  return null;
}

// Remounts its children (replaying the fadeIn animation) on every route
// change, so page content doesn't just snap in on navigation.
function PageFade({ children }) {
  const location = useLocation();
  return (
    <div key={location.pathname} className="page-fade">
      {children}
    </div>
  );
}

/**
 * Top-level App.
 * - Wraps everything in AuthProvider → CartProvider so any page can use both.
 * - Uses React Router so URLs are real and back/forward works.
 * - Keeps the currently-playing track in App state (cross-page).
 */
export default function App() {
  const [currentTrack, setCurrentTrack] = useState(null);

  // Inject global fonts + base styles once
  useEffect(() => {
    if (!document.getElementById('spigi-fonts')) {
      const link = document.createElement('link');
      link.id = 'spigi-fonts';
      link.rel = 'stylesheet';
      link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap';
      document.head.appendChild(link);
    }
    {
      // Always overwrite the content (not just create-if-missing) so a dev
      // hot-reload of this component can't leave a stale stylesheet behind —
      // this effect's `[]` deps mean it won't re-run on Fast Refresh, but the
      // tag itself gets rewritten on every fresh page load either way.
      let style = document.getElementById('spigi-styles');
      if (!style) {
        style = document.createElement('style');
        style.id = 'spigi-styles';
        document.head.appendChild(style);
      }
      style.textContent = `
        @keyframes fadeUp { from { opacity: 0; transform: translateY(18px) scale(0.96); } to { opacity: 1; transform: translateY(0) scale(1); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(6px) scale(0.99); } to { opacity: 1; transform: translateY(0) scale(1); } }
        @keyframes scaleIn { from { opacity: 0; transform: translateY(10px) scale(0.94); } to { opacity: 1; transform: translateY(0) scale(1); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        @keyframes slideInRight { from { transform: translateX(100%); } to { transform: translateX(0); } }
        body { background: ${C.bg}; margin: 0; font-family: ${FONT}; }
        ::selection { background: ${C.orange}; color: ${C.bg}; }
        input::placeholder { color: ${C.textMute}; }
        button { font-family: inherit; }

        .desktop-nav { display: flex; }
        .mobile-toggle { display: none; }
        .mobile-menu { display: none; }
        @media (max-width: 1024px) {
          .desktop-nav, .desktop-search { display: none; }
          .mobile-toggle { display: flex; }
          .mobile-menu { display: flex; }
        }
        @media (max-width: 420px) {
          .nav-wordmark { display: none; }
        }
        .player-icon { display: flex; }
        @media (max-width: 480px) {
          .player-icon { display: none; }
          .player-meta { max-width: 110px !important; }
          .row-waveform, .row-plays { display: none; }
        }
        .mobile-menu { animation: fadeUp 0.18s ease; }

        /* Page-level fade when navigating between routes */
        .page-fade { animation: fadeIn 0.25s ease; }

        /* Entrance animation for page headers */
        .header-in { animation: fadeUp 0.5s ease both; }

        /* Applied to a list/grid container — each direct child fades/slides
           up in sequence instead of popping in all at once. */
        .stagger-list > * { opacity: 0; animation: fadeUp 0.45s ease forwards; }
        ${Array.from({ length: 24 }, (_, i) => `.stagger-list > *:nth-child(${i + 1}) { animation-delay: ${(i * 0.04).toFixed(2)}s; }`).join('\n        ')}

        /* Applied to cards/rows for a lift + zoom on hover */
        .hover-lift { transition: transform 0.15s ease, border-color 0.15s ease; }
        .hover-lift:hover { transform: translateY(-2px) scale(1.015); }

        button, a { transition: background-color 0.15s ease, color 0.15s ease, opacity 0.15s ease, transform 0.15s ease; }
        button:not(.hover-lift):not(.mobile-toggle):hover { transform: scale(1.04); }
        button:active { transform: scale(0.96); }
      `;
    }
  }, []);

  const handleSetCurrentTrack = (t) => {
    if (!t) return setCurrentTrack(null);
    const copy = { ...t };
    if (copy.spotifyUrl) copy.spotifyUrl = normalizeSpotifyUrl(copy.spotifyUrl) || copy.spotifyUrl;
    if (copy.youtubeUrl) copy.youtubeUrl = normalizeYoutubeUrl(copy.youtubeUrl) || copy.youtubeUrl;
    setCurrentTrack(copy);
  };

  // Checkout handler (placeholder — wire to Stripe / Flutterwave here)
  const handleCheckout = ({ user, items, subtotal }) => {
    // TODO: create an order row in Supabase, then redirect to payment gateway
    console.log('Checkout requested', { user, items, subtotal });
    alert(`Checkout — $${subtotal.toFixed(2)}\n(Wire this to Flutterwave or Stripe.)`);
  };

  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <div
            style={{
              minHeight: '100vh',
              background: C.bg,
              color: C.text,
              fontFamily: FONT,
            }}
          >
            <Nav />
            <VisitTracker />

            <PageFade>
              <Routes>
                <Route path="/" element={<HomePage setCurrentTrack={handleSetCurrentTrack} currentTrack={currentTrack} />} />
                <Route path="/catalog" element={<CatalogPage setCurrentTrack={handleSetCurrentTrack} currentTrack={currentTrack} />} />
                <Route path="/beats" element={<BeatsPage setCurrentTrack={handleSetCurrentTrack} currentTrack={currentTrack} />} />
                <Route path="/packs" element={<PacksPage />} />
                <Route path="/plugins" element={<PluginsPage />} />
                <Route path="/classroom" element={<ClassroomPage />} />
                <Route path="/book" element={<BookingPage />} />
                <Route path="/account" element={<AuthPage />} />
                <Route path="/admin" element={<AdminPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </PageFade>

            <Footer hasPlayer={!!currentTrack} />
            <MiniPlayer track={currentTrack} onClose={() => handleSetCurrentTrack(null)} />
            <CartDrawer onCheckout={handleCheckout} />
          </div>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
