import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw, Home, ArrowLeft } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
  resetButtonText?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('[ErrorBoundary caught error]:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  handleReload = (): void => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  render(): ReactNode {
    if (this.state.hasError) {
      const title = this.props.fallbackTitle || 'Unable to Load Component';
      const resetText = this.props.resetButtonText || 'Try Again';

      return (
        <div className="w-full max-w-4xl mx-auto my-8 p-6 sm:p-8 bg-white dark:bg-[#0B1228] border-2 border-amber-300 dark:border-amber-700/60 rounded-3xl shadow-lg font-sans text-slate-900 dark:text-white animate-fadeIn">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pb-5 border-b border-slate-200 dark:border-slate-800">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/80 border border-amber-300 dark:border-amber-600/50 flex items-center justify-center shrink-0 text-amber-600 dark:text-amber-400 shadow-xs">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 block">
                RECOVERY SYSTEM // ERROR HANDLER
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white leading-tight">
                {title}
              </h2>
            </div>
          </div>

          <p className="mt-4 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            The application intercepted an unexpected rendering error and prevented a blank screen. Your progress and data are safe.
          </p>

          {this.state.error && (
            <div className="mt-4 p-3.5 rounded-2xl bg-slate-50 dark:bg-[#070B19] border border-slate-200 dark:border-slate-800 font-mono text-xs text-rose-600 dark:text-rose-400 overflow-x-auto">
              <span className="font-bold">Error:</span> {this.state.error.message || String(this.state.error)}
            </div>
          )}

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={this.handleRetry}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-blue-500/25 cursor-pointer transition-all hover:scale-[1.02]"
            >
              <RotateCcw className="w-4 h-4" />
              <span>{resetText}</span>
            </button>

            {this.props.onReset && (
              <button
                type="button"
                onClick={this.props.onReset}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 border border-slate-200 dark:border-blue-900/30 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-bold cursor-pointer transition-all"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Return to Menu</span>
              </button>
            )}

            <button
              type="button"
              onClick={this.handleReload}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#070B19] border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs sm:text-sm font-bold cursor-pointer transition-all"
            >
              <Home className="w-4 h-4" />
              <span>Reload Page</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
