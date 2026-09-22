// Thin client for the local Express + SQLite API in server/.
// Replaces @supabase/supabase-js — see AuthContext.jsx, CartContext.jsx, BookingPage.jsx.
// In production the same Express server hosts the built frontend, so the
// default is a relative '/api' (same origin, no CORS); local dev overrides
// this via VITE_API_URL since Vite and the API run on different ports.
const API_URL = import.meta.env.VITE_API_URL || '/api';
const API_ORIGIN = API_URL.replace(/\/api\/?$/, '');
const TOKEN_KEY = 'spigimentals_token';

export const getToken = () => localStorage.getItem(TOKEN_KEY);
const setToken = (token) => {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
};

// Uploaded files (audio/cover art) live on Cloudinary and come back as full
// URLs already — pass those through untouched. Anything else is treated as
// a path relative to the API's origin (kept for safety, though nothing
// should produce that shape anymore).
export const resolveAssetUrl = (path) => {
  if (!path) return null;
  if (/^https?:\/\//.test(path)) return path;
  return `${API_ORIGIN}${path}`;
};

class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

async function request(path, { method = 'GET', body, auth = true, isForm = false } = {}) {
  const headers = {};
  const token = getToken();
  if (auth && token) headers.Authorization = `Bearer ${token}`;
  if (!isForm) headers['Content-Type'] = 'application/json';

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: isForm ? body : body !== undefined ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(data.error || `Request failed (${res.status})`, res.status);
  return data;
}

export const api = {
  signUp: (payload) => request('/auth/signup', { method: 'POST', body: payload, auth: false }),
  signIn: (payload) => request('/auth/signin', { method: 'POST', body: payload, auth: false }),
  getSession: () => request('/auth/session'),
  updateProfile: (patch) => request('/profile', { method: 'PATCH', body: patch }),
  getCart: () => request('/cart'),
  putCart: (items) => request('/cart', { method: 'PUT', body: { items } }),
  getBookedSlots: (month) => request(`/bookings/slots?month=${month}`, { auth: false }),
  // Guests can book too (no token = anonymous booking); signed-in users get
  // attributed via the JWT the server reads from this Authorization header.
  createBooking: (payload) => request('/bookings', { method: 'POST', body: payload }),
  // Admin-only — every booking, and changing its status.
  listBookings: () => request('/bookings'),
  updateBookingStatus: (id, status) => request(`/bookings/${id}`, { method: 'PATCH', body: { status } }),

  // Fire-and-forget analytics — a pageview per route change, a play-count
  // bump when a track/beat actually starts playing. Neither should ever
  // surface an error to the visitor, so callers swallow rejections.
  recordVisit: (path) => request('/visits', { method: 'POST', body: { path }, auth: false }),
  recordPlay: (resource, id) => request(`/${resource}/${id}/play`, { method: 'POST', auth: false }),
  getVisitStats: () => request('/visits/stats'),

  // Storefront content — tracks/beats/packs/plugins/courses. Reads are public;
  // writes require an admin token and 401/403 server-side if missing.
  listContent: (resource) => request(`/${resource}`, { auth: false }),
  createContent: (resource, payload) => request(`/${resource}`, { method: 'POST', body: payload }),
  updateContent: (resource, id, payload) => request(`/${resource}/${id}`, { method: 'PUT', body: payload }),
  deleteContent: (resource, id) => request(`/${resource}/${id}`, { method: 'DELETE' }),

  // Uploaded audio — a single file per row, admin-only. `resource` is
  // 'tracks' or 'beats' (both expose the same /:id/audio shape).
  uploadAudio: (resource, id, file) => {
    const form = new FormData();
    form.append('audio', file);
    return request(`/${resource}/${id}/audio`, { method: 'POST', body: form, isForm: true });
  },
  deleteAudio: (resource, id) => request(`/${resource}/${id}/audio`, { method: 'DELETE' }),

  // Uploaded cover art — 'tracks' or 'beats', admin-only to write.
  uploadCover: (resource, id, file) => {
    const form = new FormData();
    form.append('cover', file);
    return request(`/${resource}/${id}/cover`, { method: 'POST', body: form, isForm: true });
  },
  deleteCover: (resource, id) => request(`/${resource}/${id}/cover`, { method: 'DELETE' }),

  // Uploaded samples — many files per pack, admin-only to write.
  listPackFiles: (packId) => request(`/packs/${packId}/files`, { auth: false }),
  uploadPackFiles: (packId, files) => {
    const form = new FormData();
    for (const f of files) form.append('samples', f);
    return request(`/packs/${packId}/files`, { method: 'POST', body: form, isForm: true });
  },
  deletePackFile: (packId, fileId) => request(`/packs/${packId}/files/${fileId}`, { method: 'DELETE' }),
};

export { setToken, ApiError };
