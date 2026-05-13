import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient.js';
import QRModal from '../components/QRModal.jsx';

export default function ManageBranches() {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', code: '', address: '' });
  const [saving, setSaving] = useState(false);
  const [qrFor, setQrFor] = useState(null);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from('branches')
      .select('id, name, code, address, created_at')
      .order('name');
    if (error) setErr(error.message);
    else setBranches(data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  function startNew() {
    setEditing('new');
    setForm({ name: '', code: '', address: '' });
    setErr('');
  }

  function startEdit(b) {
    setEditing(b.id);
    setForm({ name: b.name, code: b.code, address: b.address ?? '' });
    setErr('');
  }

  function cancel() {
    setEditing(null);
    setForm({ name: '', code: '', address: '' });
    setErr('');
  }

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    setErr('');
    const payload = {
      name: form.name.trim(),
      code: form.code.trim(),
      address: form.address.trim() || null
    };
    let res;
    if (editing === 'new') {
      res = await supabase.from('branches').insert(payload);
    } else {
      res = await supabase.from('branches').update(payload).eq('id', editing);
    }
    setSaving(false);
    if (res.error) {
      setErr(res.error.message);
      return;
    }
    cancel();
    load();
  }

  async function remove(id) {
    if (!confirm('Delete this branch? All of its windows and responses will be removed.')) return;
    const { error } = await supabase.from('branches').delete().eq('id', id);
    if (error) setErr(error.message);
    else load();
  }

  function qrUrl(branchId) {
    return `${window.location.origin}/survey?branch=${branchId}`;
  }

  return (
    <>
      <h2>Branches</h2>
      <p className="subtitle">Add the business locations that will collect feedback.</p>

      {err && <div className="error-msg">{err}</div>}

      {editing ? (
        <form className="card" onSubmit={save} style={{ marginBottom: 20 }}>
          <h3 style={{ margin: '0 0 12px', fontSize: 16 }}>
            {editing === 'new' ? 'New branch' : 'Edit branch'}
          </h3>
          <div className="toolbar" style={{ alignItems: 'end' }}>
            <div className="field" style={{ flex: 1, minWidth: 200 }}>
              <label>Name</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                placeholder="e.g. Main Branch"
              />
            </div>
            <div className="field" style={{ minWidth: 160 }}>
              <label>Code</label>
              <input
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                required
                placeholder="e.g. MAIN"
              />
            </div>
            <div className="field" style={{ flex: 1, minWidth: 240 }}>
              <label>Address</label>
              <input
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="Optional"
              />
            </div>
            <button className="btn" type="submit" disabled={saving}>
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button className="btn btn-ghost" type="button" onClick={cancel}>Cancel</button>
          </div>
        </form>
      ) : (
        <div style={{ marginBottom: 16 }}>
          <button className="btn" onClick={startNew}>+ Add branch</button>
        </div>
      )}

      {loading ? (
        <div className="empty">Loading…</div>
      ) : branches.length === 0 ? (
        <div className="empty">No branches yet. Add your first one.</div>
      ) : (
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Code</th>
                <th>Address</th>
                <th>Created</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {branches.map((b) => (
                <tr key={b.id}>
                  <td><strong>{b.name}</strong></td>
                  <td>{b.code}</td>
                  <td>{b.address || '—'}</td>
                  <td>{new Date(b.created_at).toLocaleDateString()}</td>
                  <td>
                    <div className="row-actions">
                      <button className="btn btn-ghost" onClick={() => setQrFor(b)}>QR</button>
                      <button className="btn btn-ghost" onClick={() => startEdit(b)}>Edit</button>
                      <button className="btn btn-danger" onClick={() => remove(b.id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {qrFor && (
        <QRModal
          title={qrFor.name}
          subtitle="Branch survey · customer picks the window"
          url={qrUrl(qrFor.id)}
          onClose={() => setQrFor(null)}
        />
      )}
    </>
  );
}
