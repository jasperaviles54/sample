import { getServiceClient } from './_supabase.js';

// GET /api/export?branchId=&windowId=&rating=&from=YYYY-MM-DD&to=YYYY-MM-DD
// Streams filtered survey responses as a CSV download.
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabase = getServiceClient();
    const { branchId, windowId, rating, from, to } = req.query;

    let q = supabase
      .from('survey_details')
      .select('created_at, branch_name, window_name, rating, comments')
      .order('created_at', { ascending: false })
      .limit(10000);

    if (branchId) q = q.eq('branch_id', branchId);
    if (windowId) q = q.eq('window_id', windowId);
    if (rating) q = q.eq('rating', rating);
    if (from) q = q.gte('created_at', new Date(from).toISOString());
    if (to) {
      const end = new Date(to);
      end.setHours(23, 59, 59, 999);
      q = q.lte('created_at', end.toISOString());
    }

    const { data, error } = await q;
    if (error) return res.status(500).json({ error: error.message });

    const header = ['Date', 'Branch', 'Window', 'Rating', 'Comments'];
    const lines = [header.join(',')];
    for (const r of data) {
      lines.push([
        csvEscape(new Date(r.created_at).toISOString()),
        csvEscape(r.branch_name),
        csvEscape(r.window_name),
        csvEscape(r.rating),
        csvEscape(r.comments ?? '')
      ].join(','));
    }

    const filename = `survey-export-${new Date().toISOString().slice(0, 10)}.csv`;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).send(lines.join('\n'));
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

function csvEscape(value) {
  const s = String(value ?? '');
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}
