import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { analytics } from '../utils/analytics';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Track error with analytics
    analytics.trackError(
      error.message,
      `React Error Boundary: ${errorInfo.componentStack}`,
      error.stack
    );

    console.error('🚨 React Error Boundary caught error:', error, errorInfo);
  }

  handleReload = () => {
    analytics.trackButtonClick('error_boundary_reload', 'error_recovery');
    window.location.reload();
  };

  handleGoHome = () => {
    analytics.trackButtonClick('error_boundary_home', 'error_recovery');
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      const { fallbackTitle = "Something went wrong", fallbackMessage } = this.props;

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white p-4">
          <div className="max-w-md w-full text-center">
            <div className="bg-gray-800 rounded-lg p-8 border border-gray-700">
              <div className="text-6xl mb-4">💥</div>

              <h1 className="text-2xl font-bold mb-4 text-red-400">
                {fallbackTitle}
              </h1>

              <p className="text-gray-400 mb-6">
                {fallbackMessage || "We've been notified and are working on a fix."}
              </p>

              {this.state.error && (
                <details className="mb-6 text-left">
                  <summary className="cursor-pointer text-gray-500 hover:text-gray-300 mb-2">
                    Error details
                  </summary>
                  <div className="bg-gray-900 p-3 rounded text-xs font-mono text-red-300 overflow-auto max-h-32">
                    <div className="font-semibold mb-1">
                      {this.state.error.name}: {this.state.error.message}
                    </div>
                    {this.state.error.stack && (
                      <div className="text-gray-500 whitespace-pre-wrap">
                        {this.state.error.stack}
                      </div>
                    )}
                  </div>
                </details>
              )}

              <div className="space-y-3">
                <button
                  onClick={this.handleReload}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
                >
                  🔄 Reload Page
                </button>

                <button
                  onClick={this.handleGoHome}
                  className="w-full bg-gray-700 hover:bg-gray-600 text-white font-medium py-3 px-4 rounded-lg transition-colors"
                >
                  🏠 Go Home
                </button>
              </div>

              <div className="mt-6 text-xs text-gray-500">
                Error ID: {crypto.randomUUID().split('-')[0]}
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}