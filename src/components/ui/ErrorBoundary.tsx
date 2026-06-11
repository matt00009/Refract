import React from 'react';
import { RotateCcw } from 'lucide-react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

/**
 * React error boundary that catches rendering errors and displays a fallback UI.
 * Prevents the entire app from crashing due to a single component error.
 */
export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error) {
    console.error('Error caught by boundary:', error);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: undefined });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div role="alert" className="min-h-screen bg-[var(--rf-void)] flex items-center justify-center p-6">
          <div className="max-w-md w-full space-y-6 text-center">
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full bg-[var(--rf-forest)] border border-[var(--rf-border)] flex items-center justify-center">
                <span className="text-2xl">⚠️</span>
              </div>
            </div>

            <div className="space-y-2">
              <h1 className="text-xl font-bold text-[var(--rf-mist)]">Something went wrong</h1>
              <p className="text-sm text-[var(--rf-mist)]/60">
                An unexpected error occurred. Try reloading the page.
              </p>
            </div>

            {this.state.error && (
              <div className="bg-[var(--rf-depth)] border border-[var(--rf-border)] rounded-[8px] p-4 text-left">
                <p className="text-[11px] font-mono text-[var(--rf-ember)] line-clamp-3">
                  {this.state.error.message}
                </p>
              </div>
            )}

            <button
              onClick={this.handleReload}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-[var(--rf-volt)] text-[var(--rf-void)] font-bold rounded-[8px] hover:opacity-90 transition-opacity"
            >
              <RotateCcw size={16} />
              Reload
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
