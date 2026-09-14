import React from 'react';
import { AlertTriangle, RefreshCw, Trash2, ShieldAlert } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[Application Crash Catch]', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  handleClearCacheAndReload = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch (e) {}
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0f0e17] text-white flex items-center justify-center p-6 relative overflow-hidden font-sans">
          {/* Glowing Background Auras */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-rose-500/20 rounded-full blur-3xl pointer-events-none animate-coral-glow" />
          <div className="absolute bottom-10 right-10 w-80 h-80 bg-orange-500/15 rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-md w-full bg-[#1a1926]/90 border border-white/10 rounded-3xl p-8 shadow-2xl backdrop-blur-xl relative z-10 text-center space-y-6">
            
            {/* Warning Icon Badge */}
            <div className="w-16 h-16 mx-auto rounded-3xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500 shadow-lg shadow-rose-500/10">
              <ShieldAlert className="w-8 h-8 animate-bounce" />
            </div>

            <div className="space-y-2">
              <span className="px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-rose-500/20 text-rose-300 border border-rose-500/30">
                Application Exception
              </span>
              <h1 className="text-xl font-extrabold tracking-tight text-white">
                Something Went Wrong
              </h1>
              <p className="text-xs text-slate-400 leading-relaxed">
                An unexpected error occurred in the application view. Don't worry, your tasks remain stored safely.
              </p>
            </div>

            {/* Error Message Box */}
            {this.state.error && (
              <div className="p-3 bg-black/40 rounded-2xl border border-white/5 text-left max-h-32 overflow-y-auto">
                <div className="text-[10px] font-bold text-rose-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> Error Trace
                </div>
                <code className="text-[11px] text-slate-300 font-mono break-all leading-tight block">
                  {this.state.error.toString()}
                </code>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3 pt-2">
              <button
                onClick={this.handleReset}
                className="w-full py-3 px-4 bg-gradient-to-r from-orange-500 via-rose-500 to-amber-500 hover:opacity-95 text-white font-bold text-xs rounded-2xl shadow-lg shadow-orange-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" /> Reload Workspace
              </button>

              <button
                onClick={this.handleClearCacheAndReload}
                className="w-full py-2.5 px-4 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white font-bold text-xs rounded-2xl border border-white/10 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Trash2 className="w-4 h-4 text-rose-400" /> Reset Local Cache & Restart
              </button>
            </div>

            <div className="text-[10px] text-slate-500">
              DO THIS Productivity Suite • Recovery Mode
            </div>

          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
