import { Link, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import PublicLayout from './components/layouts/PublicLayout';
import AdminLayout from './components/layouts/AdminLayout';
import RegisterPage from './pages/RegisterPage';
import OverviewPage from './pages/OverviewPage';
import RegistrationsPage from './pages/RegistrationsPage';
import ReferralsPage from './pages/ReferralsPage';
import ExperimentsPage from './pages/ExperimentsPage';
import SettingsPage from './pages/SettingsPage';

/** Keeps any ?ref= query when someone lands on "/". */
function RootRedirect() {
  const { search } = useLocation();
  return <Navigate to={{ pathname: '/register', search }} replace />;
}

function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 p-6 text-center">
      <p className="text-5xl font-semibold text-indigo-600">404</p>
      <h1 className="text-xl font-semibold text-navy-900">Page not found</h1>
      <p className="text-sm text-slate-500">The page you are looking for does not exist.</p>
      <Link to="/register" className="btn-primary mt-2">
        Go to workshop page
      </Link>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route element={<PublicLayout />}>
        <Route path="/register" element={<RegisterPage />} />
      </Route>
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<OverviewPage />} />
        <Route path="registrations" element={<RegistrationsPage />} />
        <Route path="referrals" element={<ReferralsPage />} />
        <Route path="experiments" element={<ExperimentsPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
