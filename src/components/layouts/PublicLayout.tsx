import { Link, Outlet } from 'react-router-dom';
import { LayoutDashboard } from 'lucide-react';
import { Brand } from '../Brand';

export default function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <Link to="/register" aria-label="Student Growth Hub home">
            <Brand />
          </Link>
          <Link to="/admin" className="btn-ghost btn-sm">
            <LayoutDashboard className="h-4 w-4" aria-hidden />
            <span className="hidden sm:inline">Admin dashboard (demo)</span>
            <span className="sm:hidden">Admin</span>
          </Link>
        </div>
      </header>

      <div className="flex-1">
        <Outlet />
      </div>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-6 text-xs leading-relaxed text-slate-500 sm:px-6">
          <p>
            <strong className="text-slate-700">Student Growth Hub</strong> is an independent internship
            assignment prototype. It is not an official NxtWave product and does not use NxtWave branding.
          </p>
          <p className="mt-1">
            Registrations are saved only in your own browser (localStorage). Nothing is sent to a server and no
            real event seat is reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
