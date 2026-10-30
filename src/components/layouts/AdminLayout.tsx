import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import {
  ExternalLink,
  FlaskConical,
  LayoutDashboard,
  Menu,
  Settings,
  ShieldAlert,
  Trophy,
  Users,
  X,
} from 'lucide-react';
import { Brand } from '../Brand';
import { DemoBanner } from '../DemoBanner';
import { Alert } from '../ui';
import { useAppStore } from '../../store/AppStore';

const NAV = [
  { to: '/admin', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/admin/registrations', label: 'Registrations', icon: Users, end: false },
  { to: '/admin/referrals', label: 'Referral Leaderboard', icon: Trophy, end: false },
  { to: '/admin/experiments', label: 'Campaign Experiments', icon: FlaskConical, end: false },
  { to: '/admin/settings', label: 'Settings', icon: Settings, end: false },
];

function NavItems({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="flex flex-col gap-1" aria-label="Admin">
      {NAV.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          onClick={onNavigate}
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
              isActive ? 'bg-white/10 text-white' : 'text-navy-200 hover:bg-white/5 hover:text-white'
            }`
          }
        >
          <Icon className="h-[18px] w-[18px]" aria-hidden />
          {label}
        </NavLink>
      ))}
    </nav>
  );
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col gap-8 p-5">
      <Brand light />
      <NavItems onNavigate={onNavigate} />
      <div className="mt-auto space-y-3">
        <a
          href="/register"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2.5 text-sm text-navy-200 hover:bg-white/5 hover:text-white"
        >
          <ExternalLink className="h-4 w-4" aria-hidden />
          View public page
        </a>
        <p className="px-1 text-[11px] leading-relaxed text-navy-300">
          Prototype for an internship assignment. Not an official NxtWave product.
        </p>
      </div>
    </div>
  );
}

export default function AdminLayout() {
  const [open, setOpen] = useState(false);
  const { storageError } = useAppStore();

  return (
    <div className="min-h-screen">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 bg-navy-900 lg:block">
        <SidebarContent />
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between bg-navy-900 px-4 py-3 lg:hidden">
        <Brand light />
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-lg p-2 text-white hover:bg-white/10"
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" aria-hidden />
        </button>
      </header>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation">
          <div className="absolute inset-0 bg-navy-950/60" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-72 max-w-[85%] bg-navy-900">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute right-3 top-3 rounded-lg p-2 text-white hover:bg-white/10"
              aria-label="Close navigation menu"
            >
              <X className="h-5 w-5" aria-hidden />
            </button>
            <SidebarContent onNavigate={() => setOpen(false)} />
          </div>
        </div>
      )}

      <main className="lg:pl-64">
        <div className="mx-auto max-w-7xl space-y-4 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div className="flex items-start gap-2 text-xs text-slate-500">
            <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
            <p>
              Client-side admin view: there is no login or real access control. Data is stored only in this
              browser (localStorage) and is not shared across visitors or devices.
            </p>
          </div>
          {storageError && (
            <Alert tone="warning" title="Storage warning">
              {storageError}
            </Alert>
          )}
          <DemoBanner />
          <Outlet />
        </div>
      </main>
    </div>
  );
}
