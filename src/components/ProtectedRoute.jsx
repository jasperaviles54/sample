import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '../supabaseClient.js';

export default function ProtectedRoute({ children }) {
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setStatus(data.session ? 'authed' : 'anon');
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setStatus(session ? 'authed' : 'anon');
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  if (status === 'loading') {
    return <div style={{ padding: 40, color: '#6b7280' }}>Loading…</div>;
  }
  if (status === 'anon') {
    return <Navigate to="/login" replace />;
  }
  return children;
}
