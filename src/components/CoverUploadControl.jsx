import React, { useRef, useState } from 'react';
import { UploadCloud, Trash2, Image as ImageIcon } from 'lucide-react';
import { C, FONT } from '../lib/theme';
import { api, resolveAssetUrl } from '../lib/api';

// Inline cover-art upload widget for one track/beat row in the admin panel.
// `resource` is 'tracks' or 'beats' (both expose the same /:id/cover shape).
// `onChange` is AdminSection's `load()` — call it after any upload/delete so
// the list (and this item's coverUrl) reflects the new state.
export default function CoverUploadControl({ resource, item, onChange }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-selecting the same file later
    if (!file) return;
    setBusy(true);
    setError('');
    try {
      await api.uploadCover(resource, item.id, file);
      onChange();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleRemove = async () => {
    setBusy(true);
    setError('');
    try {
      await api.deleteCover(resource, item.id);
      onChange();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
      <ImageIcon size={13} color={C.textMute} />
      {item.coverUrl ? (
        <>
          <img
            src={resolveAssetUrl(item.coverUrl)}
            alt=""
            style={{ width: 28, height: 28, borderRadius: 4, objectFit: 'cover' }}
          />
          <button type="button" onClick={handleRemove} disabled={busy} style={tinyBtn}>
            <Trash2 size={11} /> Remove cover
          </button>
        </>
      ) : (
        <span style={{ fontFamily: FONT, fontSize: 11, color: C.textMute }}>No cover art</span>
      )}
      <button type="button" onClick={() => inputRef.current?.click()} disabled={busy} style={tinyBtn}>
        <UploadCloud size={11} /> {busy ? 'Uploading…' : item.coverUrl ? 'Replace cover' : 'Upload cover'}
      </button>
      <input ref={inputRef} type="file" accept="image/*" onChange={handleFile} style={{ display: 'none' }} />
      {error && <span style={{ fontFamily: FONT, fontSize: 11, color: C.danger }}>{error}</span>}
    </div>
  );
}

const tinyBtn = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 5,
  padding: '5px 9px',
  borderRadius: 4,
  border: `1px solid ${C.border}`,
  background: C.bg3,
  color: C.textDim,
  fontFamily: FONT,
  fontSize: 11,
  fontWeight: 600,
  cursor: 'pointer',
};
