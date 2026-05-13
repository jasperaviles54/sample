import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { supabase } from '../supabaseClient.js';

export default function SurveyPage() {
  const [params] = useSearchParams();
  const branchParam = params.get('branch') || '';
  const windowParam = params.get('window') || '';

  const [loading, setLoading] = useState(true);
  const [branch, setBranch] = useState(null);
  const [lockedWindow, setLockedWindow] = useState(null);
  const [windows, setWindows] = useState([]);
  const [windowId, setWindowId] = useState('');

  const [rating, setRating] = useState('');
  const [comments, setComments] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [err, setErr] = useState('');
  const [gateMessage, setGateMessage] = useState('');

  useEffect(() => {
    if (!branchParam) {
      setGateMessage('Please scan the QR code at your service window to start.');
      setLoading(false);
      return;
    }
    (async () => {
      const { data: b } = await supabase
        .from('branches')
        .select('id, name')
        .eq('id', branchParam)
        .maybeSingle();
      if (!b) {
        setGateMessage('This survey link is invalid or has been removed.');
        setLoading(false);
        return;
      }
      setBranch(b);

      if (windowParam) {
        const { data: w } = await supabase
          .from('department_windows')
          .select('id, name, branch_id')
          .eq('id', windowParam)
          .maybeSingle();
        if (!w || w.branch_id !== b.id) {
          setGateMessage('This survey link is invalid or has been removed.');
          setLoading(false);
          return;
        }
        setLockedWindow(w);
        setWindowId(w.id);
      } else {
        const { data: ws } = await supabase
          .from('department_windows')
          .select('id, name')
          .eq('branch_id', b.id)
          .order('name');
        setWindows(ws ?? []);
      }
      setLoading(false);
    })();
  }, [branchParam, windowParam]);

  async function handleSubmit(e) {
    e.preventDefault();
    setErr('');
    if (!branch || !windowId || !rating) {
      setErr('Please pick a window and a rating.');
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from('surveys').insert({
      branch_id: branch.id,
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
    if (!lockedWindow) setWindowId('');
  }

  if (loading) {
    return (
      <div className="survey-wrap">
        <div className="survey-card"><p style={{ textAlign: 'center', color: '#6b7280' }}>Loading…</p></div>
      </div>
    );
  }

  if (gateMessage) {
    return (
      <div className="survey-wrap">
        <div className="survey-card success">
          <div className="emoji">📱</div>
          <h2>Scan to leave feedback</h2>
          <p>{gateMessage}</p>
          <div style={{ textAlign: 'center', marginTop: 16, fontSize: 12 }}>
            <Link to="/login">Admin sign in</Link>
          </div>
        </div>
      </div>
    );
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
          <div className="locked-field">{branch.name}</div>
        </div>

        <div className="field">
          <label>Department / Window</label>
          {lockedWindow ? (
            <div className="locked-field">{lockedWindow.name}</div>
          ) : (
            <select value={windowId} onChange={(e) => setWindowId(e.target.value)} required>
              <option value="">— Select window —</option>
              {windows.map((w) => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
          )}
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
      </form>
    </div>
  );
}
