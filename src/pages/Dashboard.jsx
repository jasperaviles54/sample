import { useEffect, useMemo, useState } from 'react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { supabase } from '../supabaseClient.js';

const RANGES = [
  { key: '7d', label: 'Last 7 days', days: 7 },
  { key: '30d', label: 'Last 30 days', days: 30 },
  { key: '90d', label: 'Last 90 days', days: 90 },
  { key: 'all', label: 'All time', days: null }
];

export default function Dashboard() {
  const [branches, setBranches] = useState([]);
  const [branchId, setBranchId] = useState('');
  const [range, setRange] = useState('30d');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('branches').select('id, name').order('name').then(({ data }) => {
      setBranches(data ?? []);
    });
  }, []);

  useEffect(() => {
    setLoading(true);
    const days = RANGES.find((r) => r.key === range)?.days;
    let q = supabase
      .from('survey_details')
      .select('id, rating, comments, created_at, branch_id, branch_name, window_id, window_name');
    if (days) {
      const since = new Date(Date.now() - days * 86400_000).toISOString();
      q = q.gte('created_at', since);
    }
    if (branchId) q = q.eq('branch_id', branchId);
    q.order('created_at', { ascending: false }).then(({ data }) => {
      setRows(data ?? []);
      setLoading(false);
    });
  }, [branchId, range]);

  const stats = useMemo(() => {
    const total = rows.length;
    const happy = rows.filter((r) => r.rating === 'happy').length;
    const sad = rows.filter((r) => r.rating === 'sad').length;
    const score = total ? Math.round((happy / total) * 100) : 0;
    return { total, happy, sad, score };
  }, [rows]);

  const byWindow = useMemo(() => {
    const map = new Map();
    for (const r of rows) {
      const key = `${r.branch_name} · ${r.window_name}`;
      const cur = map.get(key) ?? { name: key, happy: 0, sad: 0 };
      cur[r.rating] += 1;
      map.set(key, cur);
    }
    return Array.from(map.values()).sort((a, b) => (b.happy + b.sad) - (a.happy + a.sad)).slice(0, 10);
  }, [rows]);

  const pieData = [
    { name: 'Satisfied', value: stats.happy, color: '#16a34a' },
    { name: 'Not satisfied', value: stats.sad, color: '#dc2626' }
  ];

  return (
    <>
      <h2>Dashboard</h2>
      <p className="subtitle">A live overview of customer feedback.</p>

      <div className="toolbar">
        <div className="field">
          <label>Branch</label>
          <select value={branchId} onChange={(e) => setBranchId(e.target.value)}>
            <option value="">All branches</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>Range</label>
          <select value={range} onChange={(e) => setRange(e.target.value)}>
            {RANGES.map((r) => (
              <option key={r.key} value={r.key}>{r.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="stat-grid">
        <div className="stat">
          <div className="label">Total responses</div>
          <div className="value">{stats.total}</div>
        </div>
        <div className="stat">
          <div className="label">Satisfied</div>
          <div className="value happy">{stats.happy}</div>
        </div>
        <div className="stat">
          <div className="label">Not satisfied</div>
          <div className="value sad">{stats.sad}</div>
        </div>
        <div className="stat">
          <div className="label">Satisfaction score</div>
          <div className="value">{stats.score}%</div>
        </div>
      </div>

      {loading ? (
        <div className="empty">Loading…</div>
      ) : stats.total === 0 ? (
        <div className="empty">No responses yet for the selected filters.</div>
      ) : (
        <div className="chart-grid">
          <div className="card">
            <h3 style={{ margin: '0 0 12px', fontSize: 14 }}>Responses by window</h3>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={byWindow} layout="vertical" margin={{ left: 80 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" allowDecimals={false} />
                <YAxis dataKey="name" type="category" width={150} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="happy" name="Satisfied" stackId="a" fill="#16a34a" />
                <Bar dataKey="sad" name="Not satisfied" stackId="a" fill="#dc2626" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="card">
            <h3 style={{ margin: '0 0 12px', fontSize: 14 }}>Overall split</h3>
            <ResponsiveContainer width="100%" height={320}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" outerRadius={110} label>
                  {pieData.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </>
  );
}
