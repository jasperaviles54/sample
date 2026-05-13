import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient.js';

export default function SurveyPage() {
  const [branches, setBranches] = useState([]);
  const [windows, setWindows] = useState([]);
  const [branchId, setBranchId] = useState('');
  const [windowId, setWindowId] = useState('');
  const [rating, setRating] = useState('');
  const [comments, setComments] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from('branches')
        .select('id, name, code')
        .order('name');
      if (error) setErr(error.message);
      else setBranches(data ?? []);
    })();
  }, []);

  useEffect(() => {
    if (!branchId) {
      setWindows([]);
      setWindowId('');
      return;
    }
    (async () => {
      const { data, error } = await supabase
        .from('department_windows')
        .select('id, name, code')
        .eq('branch_id', branchId)
        .order('name');
      if (error) setErr(error.message);
      else setWindows(data ?? []);
      setWindowId('');
    })();
  }, [branchId]);

  async function handleSubmit(e) {
    e.preventDefault();
    setErr('');
    if (!branchId || !windowId || !rating) {
      setErr('Please pick a branch, a window, and a rating.');
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from('surveys').insert({
      branch_id: branchId,
      window_id: windowId,
      rating,
      comments: comments.trim() || null
    });
    setSubmitting(false);
    if (error) {
      setErr(error.message);
      return;
    }
    setSubmitted(true);
  }

  function resetForm() {
    setRating('');
    setComments('');
    setSubmitted(false);
  }

  if (submitted) {
    return (
      <div className="survey-wrap">
        <div className="survey-card success">
          <div className="emoji">🙏</div>
          <h2>Thanks for your feedback!</h2>
          <p>Your response helps us improve our service.</p>
          <button className="btn" onClick={resetForm}>Submit another</button>
        </div>
      </div>
    );
  }

  return (
    <div className="survey-wrap">
      <form className="survey-card" onSubmit={handleSubmit}>
        <h1>How was your experience?</h1>
        <p className="subtitle">Tap a face, leave a comment if you'd like.</p>

        {err && <div className="error-msg">{err}</div>}

        <div className="field">
          <label>Branch</label>
          <select value={branchId} onChange={(e) => setBranchId(e.target.value)} required>
            <option value="">— Select branch —</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>

        <div className="field">
          <label>Department / Window</label>
          <select
            value={windowId}
            onChange={(e) => setWindowId(e.target.value)}
            disabled={!branchId}
            required
          >
            <option value="">
              {branchId ? '— Select window —' : 'Pick a branch first'}
            </option>
            {windows.map((w) => (
              <option key={w.id} value={w.id}>{w.name}</option>
            ))}
          </select>
        </div>

        <div className="rating-row">
          <button
            type="button"
            className={`rating-btn happy ${rating === 'happy' ? 'selected' : ''}`}
            onClick={() => setRating('happy')}
          >
            <div className="emoji">😊</div>
            <span className="label">Satisfied</span>
          </button>
          <button
            type="button"
            className={`rating-btn sad ${rating === 'sad' ? 'selected' : ''}`}
            onClick={() => setRating('sad')}
          >
            <div className="emoji">😞</div>
            <span className="label">Not satisfied</span>
          </button>
        </div>

        <div className="field">
          <label>Remarks / Comments (optional)</label>
          <textarea
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            placeholder="Tell us more about your experience…"
            maxLength={1000}
          />
        </div>

        <button className="btn" type="submit" disabled={submitting} style={{ width: '100%' }}>
          {submitting ? 'Submitting…' : 'Submit feedback'}
        </button>

        <div style={{ textAlign: 'center', marginTop: 16, fontSize: 12 }}>
          <Link to="/login">Admin sign in</Link>
        </div>
      </form>
    </div>
  );
}
