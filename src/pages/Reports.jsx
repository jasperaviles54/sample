import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../supabaseClient.js';

export default function Reports() {
  const [branches, setBranches] = useState([]);
  const [windows, setWindows] = useState([]);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const [branchId, setBranchId] = useState('');
  const [windowId, setWindowId] = useState('');
  const [rating, setRating] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  useEffect(() => {
    supabase.from('branches').select('id, name').order('name').then(({ data }) => {
      setBranches(data ?? []);
    });
  }, []);

  useEffect(() => {
    if (!branchId) {
      setWindows([]);
      setWindowId('');
      return;
    }
    supabase
      .from('department_windows')
      .select('id, name')
      .eq('branch_id', branchId)
      .order('name')
      .then(({ data }) => setWindows(data ?? []));
  }, [branchId]);

  useEffect(() => {
    setLoading(true);
    let q = supabase
      .from('survey_details')
      .select('id, rating, comments, created_at, branch_name, window_name')
      .order('created_at', { ascending: false })
      .limit(500);
    if (branchId) q = q.eq('branch_id', branchId);
    if (windowId) q = q.eq('window_id', windowId);
    if (rating) q = q.eq('rating', rating);
    if (from) q = q.gte('created_at', new Date(from).toISOString());
    if (to) {
      const end = new Date(to);
      end.setHours(23, 59, 59, 999);
      q = q.lte('created_at', end.toISOString());
    }
    q.then(({ data }) => {
      setRows(data ?? []);
      setLoading(false);
    });
  }, [branchId, windowId, rating, from, to]);

  const csvHref = useMemo(() => {
    const params = new URLSearchParams();
    if (branchId) params.set('branchId', branchId);
    if (windowId) params.set('windowId', windowId);
    if (rating) params.set('rating', rating);
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    return `/api/export?${params.toString()}`;
  }, [branchId, windowId, rating, from, to]);

  function clearFilters() {
    setBranchId('');
    setWindowId('');
    setRating('');
    setFrom('');
    setTo('');
  }

  return (
    <>
      <h2>Reports</h2>
      <p className="subtitle">Filter, browse, and export survey responses.</p>

      <div className="toolbar">
        <div className="field">
          <label>Branch</label>
          <select value={branchId} onChange={(e) => setBranchId(e.target.value)}>
            <option value="">All branches</option>
            {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
        <div className="field">
          <label>Window</label>
          <select
            value={windowId}
            onChange={(e) => setWindowId(e.target.value)}
            disabled={!branchId}
          >
            <option value="">All windows</option>
            {windows.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
          </select>
        </div>
        <div className="field">
          <label>Rating</label>
          <select value={rating} onChange={(e) => setRating(e.target.value)}>
            <option value="">Any</option>
            <option value="happy">Satisfied</option>
            <option value="sad">Not satisfied</option>
          </select>
        </div>
        <div className="field">
          <label>From</label>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div className="field">
          <label>To</label>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <button className="btn btn-ghost" onClick={clearFilters}>Clear</button>
        <a className="btn" href={csvHref} target="_blank" rel="noreferrer">Export CSV</a>
      </div>

      {loading ? (
        <div className="empty">Loading…</div>
      ) : rows.length === 0 ? (
        <div className="empty">No responses match the current filters.</div>
      ) : (
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Branch</th>
                <th>Window</th>
                <th>Rating</th>
                <th>Comments</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>{new Date(r.created_at).toLocaleString()}</td>
                  <td>{r.branch_name}</td>
                  <td>{r.window_name}</td>
                  <td>
                    <span className={`badge ${r.rating}`}>
                      {r.rating === 'happy' ? '😊 Satisfied' : '😞 Not satisfied'}
                    </span>
                  </td>
                  <td style={{ maxWidth: 380, whiteSpace: 'pre-wrap' }}>{r.comments || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
