import { getServiceClient } from './_supabase.js';

// GET /api/stats?branchId=...&days=30
// Returns aggregated counts by window for the dashboard. This lives in a
// serverless function instead of the client so the heavy lifting stays on
// the server when result sets grow.
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabase = getServiceClient();
    const { branchId, days } = req.query;

    let q = supabase
      .from('survey_details')
      .select('rating, branch_id, branch_name, window_id, window_name, created_at');

    if (branchId) q = q.eq('branch_id', branchId);
    if (days) {
      const n = Number(days);
      if (Number.isFinite(n) && n > 0) {
        const since = new Date(Date.now() - n * 86400_000).toISOString();
        q = q.gte('created_at', since);
      }
    }

    const { data, error } = await q;
    if (error) return res.status(500).json({ error: error.message });

    const totals = { total: data.length, happy: 0, sad: 0 };
    const byWindow = new Map();
    for (const row of data) {
      totals[row.rating] += 1;
      const key = row.window_id;
      const cur = byWindow.get(key) ?? {
        window_id: row.window_id,
        window_name: row.window_name,
        branch_id: row.branch_id,
        branch_name: row.branch_name,
        happy: 0,
        sad: 0
      };
      cur[row.rating] += 1;
      byWindow.set(key, cur);
    }
    totals.score = totals.total ? Math.round((totals.happy / totals.total) * 100) : 0;

    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json({
      totals,
      byWindow: Array.from(byWindow.values())
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
