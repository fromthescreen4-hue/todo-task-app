import React from 'react';
import { AlertCircle, RefreshCw, Trash2, Home } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[CORE FIT Error Boundary]', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleHardReset = () => {
    try {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then((registrations) => {
          for (const registration of registrations) {
            registration.unregister();
          }
        });
      }
      if ('caches' in window) {
        caches.keys().then((names) => {
          for (const name of names) {
            caches.delete(name);
          }
        });
      }
    } catch (e) {
      console.warn('Cache clearing error:', e);
    }
    window.location.href = window.location.origin + '/?t=' + Date.now();
  };

  handleWipeStorage = () => {
    if (window.confirm('Wipe local database and restart fresh? This will resolve any corrupted data.')) {
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch (e) {}
      this.handleHardReset();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#F6F6F7] text-[#15171A] flex flex-col items-center justify-center p-4 sm:p-6">
          <div className="w-full max-w-md bg-[#FFFFFF] border border-[#D9DDE2] rounded-[10px] p-6 shadow-sm space-y-5">
            <div className="flex items-center gap-3 border-b border-[#D9DDE2] pb-4">
              <div className="w-10 h-10 rounded-[8px] bg-[#FEF2F2] border border-[#FCA5A5] flex items-center justify-center text-[#FFAE00] flex-shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-base font-extrabold uppercase tracking-tight text-[#15171A]">
                  Something Went Wrong
                </h1>
                <p className="text-xs text-[#555B63] mt-0.5">
                  An unexpected error occurred. Please try reloading the app.
                </p>
              </div>
            </div>

            <div className="p-3 bg-[#F6F6F7] rounded-[6px] border border-[#EAECEF] text-xs font-mono text-[#555B63] overflow-x-auto max-h-32">
              {this.state.error?.message || 'Unknown runtime error'}
            </div>

            <div className="space-y-2 pt-2">
              <button
                onClick={this.handleReload}
                className="btn btn-primary w-full py-2.5 text-xs font-bold justify-center"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reload Application</span>
              </button>

              <button
                onClick={this.handleHardReset}
                className="btn btn-secondary w-full py-2.5 text-xs font-bold justify-center"
              >
                <RefreshCw className="w-3.5 h-3.5 text-[#0284C7]" />
                <span>Clear Cache &amp; Refresh</span>
              </button>

              <button
                onClick={this.handleWipeStorage}
                className="btn btn-outline w-full py-2.5 text-xs font-bold justify-center text-[#DC2626] hover:bg-[#FEF2F2]"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Reset Local Data &amp; Restart</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
