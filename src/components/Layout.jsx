import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient.js';

export default function Layout() {
  const [email, setEmail] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? ''));
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    navigate('/login', { replace: true });
  }

  return (
    <div className="shell">
      <aside className="sidebar">
        <h1>Feedback Admin</h1>
        <NavLink to="/admin/dashboard">Dashboard</NavLink>
        <NavLink to="/admin/reports">Reports</NavLink>
        <NavLink to="/admin/branches">Branches</NavLink>
        <NavLink to="/admin/windows">Department Windows</NavLink>
        <div className="spacer" />
        <div className="user">Signed in as<br /><strong>{email || '…'}</strong></div>
        <button className="btn btn-ghost" onClick={signOut} style={{ marginTop: 8 }}>
          Sign out
        </button>
      </aside>
      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}
