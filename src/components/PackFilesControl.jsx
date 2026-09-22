import React, { useEffect, useRef, useState } from 'react';
import { UploadCloud, Trash2, FileAudio } from 'lucide-react';
import { C, FONT } from '../lib/theme';
import { api } from '../lib/api';

// Inline sample-file manager for one pack row in the admin panel. Manages its
// own file list independently (packs can hold many files, unlike a track's
// single audio_url), so it fetches on mount rather than relying on the
// parent AdminSection's list, which only has pack metadata.
export default function PackFilesControl({ pack }) {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  const load = () => {
    setLoading(true);
    api.listPackFiles(pack.id)
      .then(({ items }) => setFiles(items))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, [pack.id]);

  const handleUpload = async (e) => {
    const selected = Array.from(e.target.files || []);
    e.target.value = '';
    if (!selected.length) return;
    setBusy(true);
    setError('');
    try {
      await api.uploadPackFiles(pack.id, selected);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (fileId) => {
    setBusy(true);
    setError('');
    try {
      await api.deletePackFile(pack.id, fileId);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {!loading && files.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {files.map((f) => (
            <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <FileAudio size={12} color={C.textMute} />
              <span style={{ fontFamily: FONT, fontSize: 12, color: C.text, flex: 1, minWidth: 0 }}>
                {f.filename}
              </span>
              <button type="button" onClick={() => handleDelete(f.id)} disabled={busy} style={tinyBtn}>
                <Trash2 size={11} />
              </button>
            </div>
          ))}
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <button type="button" onClick={() => inputRef.current?.click()} disabled={busy} style={tinyBtn}>
          <UploadCloud size={11} /> {busy ? 'Uploading…' : 'Upload samples'}
        </button>
        <input ref={inputRef} type="file" accept="audio/*" multiple onChange={handleUpload} style={{ display: 'none' }} />
        {!loading && files.length === 0 && (
          <span style={{ fontFamily: FONT, fontSize: 11, color: C.textMute }}>No sample files uploaded</span>
        )}
        {error && <span style={{ fontFamily: FONT, fontSize: 11, color: C.danger }}>{error}</span>}
      </div>
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
