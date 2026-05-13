import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient.js';

export default function ManageWindows() {
  const [branches, setBranches] = useState([]);
  const [windows, setWindows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  const [filterBranchId, setFilterBranchId] = useState('');
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ branch_id: '', name: '', code: '' });
  const [saving, setSaving] = useState(false);

  async function loadBranches() {
    const { data, error } = await supabase
      .from('branches')
      .select('id, name')
      .order('name');
    if (error) setErr(error.message);
    else setBranches(data ?? []);
  }

  async function loadWindows() {
    setLoading(true);
    let q = supabase
      .from('department_windows')
      .select('id, name, code, branch_id, created_at, branches(name)')
      .order('name');
    if (filterBranchId) q = q.eq('branch_id', filterBranchId);
    const { data, error } = await q;
    if (error) setErr(error.message);
    else setWindows(data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    loadBranches();
  }, []);

  useEffect(() => {
    loadWindows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterBranchId]);

  function startNew() {
    setEditing('new');
    setForm({ branch_id: filterBranchId || '', name: '', code: '' });
    setErr('');
  }

  function startEdit(w) {
    setEditing(w.id);
    setForm({ branch_id: w.branch_id, name: w.name, code: w.code });
    setErr('');
  }

  function cancel() {
    setEditing(null);
    setForm({ branch_id: '', name: '', code: '' });
    setErr('');
  }

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    setErr('');
    const payload = {
      branch_id: form.branch_id,
      name: form.name.trim(),
      code: form.code.trim()
    };
    let res;
    if (editing === 'new') {
      res = await supabase.from('department_windows').insert(payload);
    } else {
      res = await supabase.from('department_windows').update(payload).eq('id', editing);
    }
    setSaving(false);
    if (res.error) {
      setErr(res.error.message);
      return;
    }
    cancel();
    loadWindows();
  }

  async function remove(id) {
    if (!confirm('Delete this window? All of its survey responses will be removed.')) return;
    const { error } = await supabase.from('department_windows').delete().eq('id', id);
    if (error) setErr(error.message);
    else loadWindows();
  }

  return (
    <>
      <h2>Department Windows</h2>
      <p className="subtitle">
        Each window (Registrar, Cashier, etc.) belongs to a branch and appears in the survey form.
      </p>

      {err && <div className="error-msg">{err}</div>}

      <div className="toolbar">
        <div className="field" style={{ minWidth: 220 }}>
          <label>Filter by branch</label>
          <select value={filterBranchId} onChange={(e) => setFilterBranchId(e.target.value)}>
            <option value="">All branches</option>
            {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
        <button
          className="btn"
          onClick={startNew}
          disabled={branches.length === 0}
          title={branches.length === 0 ? 'Add a branch first' : ''}
        >
          + Add window
        </button>
      </div>

      {editing && (
        <form className="card" onSubmit={save} style={{ marginBottom: 20 }}>
          <h3 style={{ margin: '0 0 12px', fontSize: 16 }}>
            {editing === 'new' ? 'New department window' : 'Edit window'}
          </h3>
          <div className="toolbar" style={{ alignItems: 'end' }}>
            <div className="field" style={{ minWidth: 220 }}>
              <label>Branch</label>
              <select
                value={form.branch_id}
                onChange={(e) => setForm({ ...form, branch_id: e.target.value })}
                required
              >
                <option value="">— Select branch —</option>
                {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <div className="field" style={{ flex: 1, minWidth: 200 }}>
              <label>Name</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                placeholder="e.g. Registrar"
              />
            </div>
            <div className="field" style={{ minWidth: 160 }}>
              <label>Code</label>
              <input
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                required
                placeholder="e.g. REG"
              />
            </div>
            <button className="btn" type="submit" disabled={saving}>
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button className="btn btn-ghost" type="button" onClick={cancel}>Cancel</button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="empty">Loading…</div>
      ) : windows.length === 0 ? (
        <div className="empty">No windows yet. Add one with the button above.</div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Branch</th>
              <th>Name</th>
              <th>Code</th>
              <th>Created</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {windows.map((w) => (
              <tr key={w.id}>
                <td>{w.branches?.name ?? '—'}</td>
                <td><strong>{w.name}</strong></td>
                <td>{w.code}</td>
                <td>{new Date(w.created_at).toLocaleDateString()}</td>
                <td>
                  <div className="row-actions">
                    <button className="btn btn-ghost" onClick={() => startEdit(w)}>Edit</button>
                    <button className="btn btn-danger" onClick={() => remove(w.id)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
