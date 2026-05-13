import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import SurveyPage from './pages/SurveyPage.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Reports from './pages/Reports.jsx';
import ManageBranches from './pages/ManageBranches.jsx';
import ManageWindows from './pages/ManageWindows.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/survey" replace />} />
      <Route path="/survey" element={<SurveyPage />} />
      <Route path="/login" element={<Login />} />

      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="/admin/dashboard" element={<Dashboard />} />
        <Route path="/admin/reports" element={<Reports />} />
        <Route path="/admin/branches" element={<ManageBranches />} />
        <Route path="/admin/windows" element={<ManageWindows />} />
      </Route>

      <Route path="*" element={<Navigate to="/survey" replace />} />
    </Routes>
  );
}
