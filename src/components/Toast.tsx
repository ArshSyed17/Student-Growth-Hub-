import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';
import { AlertTriangle, CheckCircle2, Info } from 'lucide-react';

type Tone = 'success' | 'error' | 'info';
interface ToastItem {
  id: number;
  tone: Tone;
  message: string;
}

const Ctx = createContext<{ notify: (tone: Tone, message: string) => void } | null>(null);

const toneStyles: Record<Tone, string> = {
  success: 'border-emerald-200 bg-emerald-50 text-emerald-900',
  error: 'border-rose-200 bg-rose-50 text-rose-900',
  info: 'border-indigo-200 bg-indigo-50 text-indigo-900',
};
const toneIcon: Record<Tone, ReactNode> = {
  success: <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden />,
  error: <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden />,
  info: <Info className="h-4 w-4 shrink-0" aria-hidden />,
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const idRef = useRef(0);

  const notify = useCallback((tone: Tone, message: string) => {
    const id = ++idRef.current;
    setItems((prev) => [...prev, { id, tone, message }]);
    window.setTimeout(() => setItems((prev) => prev.filter((t) => t.id !== id)), 3800);
  }, []);

  const value = useMemo(() => ({ notify }), [notify]);

  return (
    <Ctx.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex flex-col items-center gap-2 px-4 sm:items-end sm:px-6"
        aria-live="polite"
      >
        {items.map((t) => (
          <div
            key={t.id}
            role="status"
            className={`pointer-events-auto flex max-w-sm items-start gap-2 rounded-xl border px-4 py-3 text-sm shadow-card ${toneStyles[t.tone]}`}
          >
            <span className="mt-0.5">{toneIcon[t.tone]}</span>
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}

export function useToast() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx.notify;
}
