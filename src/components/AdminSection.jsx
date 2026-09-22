import React, { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, X } from 'lucide-react';
import { C, FONT } from '../lib/theme';
import { api } from '../lib/api';

const emptyValues = (fields) =>
  Object.fromEntries(fields.map((f) => [f.key, f.type === 'number' ? '' : '']));

const toFormValues = (fields, item) =>
  Object.fromEntries(
    fields.map((f) => {
      const v = item[f.key];
      if (f.type === 'tags') return [f.key, Array.isArray(v) ? v.join(', ') : ''];
      return [f.key, v ?? ''];
    })
  );

const toPayload = (fields, values) =>
  Object.fromEntries(
    fields.map((f) => {
      const raw = values[f.key];
      if (f.type === 'number') return [f.key, raw === '' ? null : Number(raw)];
      if (f.type === 'tags') return [f.key, raw.split(',').map((s) => s.trim()).filter(Boolean)];
      return [f.key, raw];
    })
  );

export default function AdminSection({ resource, title, fields, renderRowExtra }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null); // 'new' | id | null
  const [values, setValues] = useState(() => emptyValues(fields));
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    api.listContent(resource)
      .then(({ items: fetched }) => setItems(fetched))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, [resource]);

  const startCreate = () => {
    setValues(emptyValues(fields));
    setError('');
    setEditingId('new');
  };

  const startEdit = (item) => {
    setValues(toFormValues(fields, item));
    setError('');
    setEditingId(item.id);
  };

  const cancel = () => {
    setEditingId(null);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = toPayload(fields, values);
      if (editingId === 'new') {
        await api.createContent(resource, payload);
      } else {
        await api.updateContent(resource, editingId, payload);
      }
      setEditingId(null);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Delete "${item.title || item.name}"? This can't be undone.`)) return;
    try {
      await api.deleteContent(resource, item.id);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <section style={{ marginBottom: 40 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <h2 style={{ margin: 0, fontFamily: FONT, fontSize: 18, fontWeight: 800, color: C.text }}>
          {title} <span style={{ color: C.textMute, fontWeight: 600, fontSize: 13 }}>({items.length})</span>
        </h2>
        {editingId === null && (
          <button onClick={startCreate} style={smallBtn(true)}>
            <Plus size={13} /> Add new
          </button>
        )}
      </div>

      {editingId !== null && (
        <form
          onSubmit={handleSubmit}
          style={{
            padding: 16,
            marginBottom: 12,
            borderRadius: 6,
            background: C.bg2,
            border: `1px solid ${C.border}`,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 10,
          }}
        >
          {fields.map((f) => (
            <label key={f.key} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontFamily: FONT, fontSize: 11, color: C.textDim, fontWeight: 600 }}>{f.label}</span>
              {f.type === 'textarea' ? (
                <textarea
                  value={values[f.key]}
                  onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                  rows={3}
                  style={inputStyle}
                />
              ) : (
                <input
                  type={f.type === 'number' ? 'number' : 'text'}
                  value={values[f.key]}
                  onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                  style={inputStyle}
                />
              )}
            </label>
          ))}

          {error && (
            <div style={{ gridColumn: '1 / -1', fontFamily: FONT, fontSize: 12, color: C.danger }}>{error}</div>
          )}

          <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 8 }}>
            <button type="submit" disabled={saving} style={smallBtn(true)}>
              {saving ? 'Saving…' : editingId === 'new' ? 'Create' : 'Save changes'}
            </button>
            <button type="button" onClick={cancel} style={smallBtn(false)}>
              <X size={13} /> Cancel
            </button>
          </div>
        </form>
      )}

      <div style={{ border: `1px solid ${C.border}`, borderRadius: 6, overflow: 'hidden' }}>
        {loading ? (
          <Row muted>Loading…</Row>
        ) : items.length === 0 ? (
          <Row muted>Nothing here yet.</Row>
        ) : (
          items.map((item) => (
            <div key={item.id} style={{ borderBottom: `1px solid ${C.border}`, background: C.bg2 }}>
              <Row noBorder>
                <span style={{ fontFamily: FONT, fontSize: 13, color: C.text, fontWeight: 600, flex: 1, minWidth: 0 }}>
                  {item.title || item.name}
                </span>
                <span style={{ fontFamily: FONT, fontSize: 12, color: C.textMute, marginRight: 12 }}>
                  {item.price != null ? `$${item.price}` : ''}
                </span>
                <button onClick={() => startEdit(item)} aria-label={`Edit ${item.title || item.name}`} style={iconBtn}>
                  <Pencil size={13} />
                </button>
                <button onClick={() => handleDelete(item)} aria-label={`Delete ${item.title || item.name}`} style={iconBtn}>
                  <Trash2 size={13} />
                </button>
              </Row>
              {renderRowExtra && (
                <div style={{ padding: '0 14px 12px' }}>{renderRowExtra(item, load)}</div>
              )}
            </div>
          ))
        )}
      </div>
    </section>
  );
}

function Row({ children, muted, noBorder }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '10px 14px',
        borderBottom: noBorder ? 'none' : `1px solid ${C.border}`,
        background: C.bg2,
      }}
    >
      {muted ? (
        <span style={{ fontFamily: FONT, fontSize: 13, color: C.textMute }}>{children}</span>
      ) : (
        children
      )}
    </div>
  );
}

const inputStyle = {
  padding: '9px 10px',
  borderRadius: 4,
  background: C.bg3,
  border: `1px solid ${C.border}`,
  color: C.text,
  fontFamily: FONT,
  fontSize: 13,
  outline: 'none',
  boxSizing: 'border-box',
  resize: 'vertical',
};

const iconBtn = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 28,
  height: 28,
  borderRadius: 4,
  border: `1px solid ${C.border}`,
  background: C.bg3,
  color: C.textDim,
  cursor: 'pointer',
  marginLeft: 6,
};

const smallBtn = (primary) => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '8px 14px',
  borderRadius: 4,
  border: primary ? 'none' : `1px solid ${C.border}`,
  background: primary ? C.orange : 'transparent',
  color: primary ? C.bg : C.textDim,
  fontFamily: FONT,
  fontSize: 12,
  fontWeight: 700,
  cursor: 'pointer',
});
