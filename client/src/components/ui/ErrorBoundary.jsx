import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Unhandled Application Error:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#050507] text-[#ededed] flex items-center justify-center p-6 selection:bg-brand-500/25">
          <div className="w-full max-w-md bg-[#0c0c0f] border border-white/[0.08] rounded-2xl p-6 sm:p-8 shadow-2xl shadow-black/80 text-center">
            <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center mx-auto mb-5">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            
            <h1 className="text-xl font-bold text-white mb-2">Something went wrong</h1>
            <p className="text-xs sm:text-sm text-zinc-400 mb-6 leading-relaxed">
              An unexpected error occurred while rendering this view. You can reload the page or return to safety.
            </p>

            {this.state.error?.message && (
              <div className="mb-6 p-3 bg-white/[0.03] border border-white/[0.06] rounded-lg text-left overflow-x-auto max-h-32 text-xs font-mono text-zinc-400">
                {this.state.error.message}
              </div>
            )}

            <div className="flex gap-3 justify-center">
              <button
                onClick={this.handleReload}
                className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-xs font-semibold transition-all shadow-sm active:scale-95"
              >
                Reload page
              </button>
              <button
                onClick={() => {
                  window.location.href = '/';
                }}
                className="px-4 py-2 bg-white/[0.06] hover:bg-white/[0.1] text-zinc-300 hover:text-white rounded-lg text-xs font-medium transition-colors"
              >
                Go to home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

