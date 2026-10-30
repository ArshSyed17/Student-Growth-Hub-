import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
}
interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Unhandled UI error', error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <div className="card max-w-md p-8 text-center">
          <AlertTriangle className="mx-auto h-10 w-10 text-rose-500" aria-hidden />
          <h1 className="mt-4 text-lg font-semibold text-navy-900">Something went wrong</h1>
          <p className="mt-2 text-sm text-slate-600">
            The page hit an unexpected error. Reloading usually fixes it; your saved data is not affected.
          </p>
          <button className="btn-primary mt-6" onClick={() => window.location.reload()}>
            Reload page
          </button>
        </div>
      </div>
    );
  }
}
