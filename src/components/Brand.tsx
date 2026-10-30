import { TrendingUp } from 'lucide-react';

export function Brand({ light = false }: { light?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white">
        <TrendingUp className="h-5 w-5" aria-hidden />
      </span>
      <div className="leading-tight">
        <p className={`text-sm font-semibold ${light ? 'text-white' : 'text-navy-900'}`}>Student Growth Hub</p>
        <p className={`text-[11px] ${light ? 'text-navy-200' : 'text-slate-500'}`}>Independent prototype</p>
      </div>
    </div>
  );
}
