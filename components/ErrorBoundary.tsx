'use client';

import React, { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  showDetails?: boolean;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo?: React.ErrorInfo;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // Log error to external service in production
    if (process.env.NODE_ENV === 'production') {
      // Add your error reporting service here
      // e.g., Sentry, LogRocket, etc.
    }

    this.setState({ errorInfo });
  }

  handleRefresh = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-6 bg-red-50 border border-red-200 rounded-lg max-w-2xl mx-auto">
          <div className="flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>

          <h2 className="text-xl font-semibold text-red-800 mb-2">Something went wrong</h2>
          <p className="text-red-600 text-center mb-6 max-w-md">
            We encountered an unexpected error while loading this page. This might be a temporary issue.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <button
              onClick={this.handleRetry}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </button>
            <button
              onClick={this.handleRefresh}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh Page
            </button>
            <button
              onClick={this.handleGoHome}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              <Home className="w-4 h-4" />
              Go Home
            </button>
          </div>

          {this.props.showDetails && this.state.error && (
            <details className="w-full max-w-md">
              <summary className="cursor-pointer text-sm text-red-700 hover:text-red-800 mb-2">
                Show Error Details
              </summary>
              <div className="bg-red-100 p-3 rounded text-xs text-red-800 font-mono overflow-auto max-h-32">
                <div className="font-semibold mb-1">Error:</div>
                <div className="mb-2">{this.state.error.message}</div>
                {this.state.error.stack && (
                  <>
                    <div className="font-semibold mb-1">Stack Trace:</div>
                    <div className="whitespace-pre-wrap">{this.state.error.stack}</div>
                  </>
                )}
              </div>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
