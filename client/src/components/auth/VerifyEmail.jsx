import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import * as authService from '../../services/authService';
import Spinner from '../ui/Spinner';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  
  const [status, setStatus] = useState('verifying');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('No verification token provided in URL.');
      return;
    }

    const verify = async () => {
      try {
        await authService.verifyEmail(token);
        setStatus('success');
        setMessage('Your email address has been successfully verified! You can now access all workspaces.');
      } catch (err) {
        setStatus('error');
        setMessage(err.response?.data?.message || 'Verification token is invalid or has expired.');
      }
    };

    verify();
  }, [token]);

  return (
    <div className="min-h-screen flex bg-[#f8f9fb] dark:bg-[#07080b] text-zinc-900 dark:text-zinc-100 relative overflow-hidden items-center justify-center px-6 transition-colors">
      <div className="hero-aurora pointer-events-none" />

      <div className="w-full max-w-sm relative z-10 p-8 bg-white dark:bg-[#0c0d14] border border-black/[0.08] dark:border-white/[0.09] rounded-2xl shadow-2xl text-center">
        
        {/* Logo mark */}
        <div className="w-11 h-11 rounded-xl bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 flex items-center justify-center font-bold text-lg mx-auto mb-6 shadow-sm">
          <span className="font-editorial">L</span>
        </div>
        
        <h2 className="text-xl font-bold text-zinc-950 dark:text-white mb-2">Email Verification</h2>
        
        {status === 'verifying' && (
          <div className="flex flex-col items-center gap-4 mt-6">
            <Spinner size="md" />
            <p className="text-zinc-500 dark:text-zinc-400 text-xs font-medium">Verifying your token with Atlas...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="mt-6">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-zinc-600 dark:text-zinc-300 text-xs sm:text-sm mb-6 leading-relaxed">{message}</p>
            <Link
              to="/login"
              className="w-full inline-flex items-center justify-center py-2.5 bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 font-medium text-xs rounded-xl hover:opacity-90 transition-all shadow-xs"
            >
              Continue to Login
            </Link>
          </div>
        )}

        {status === 'error' && (
          <div className="mt-6">
            <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-500 border border-rose-500/20 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <p className="text-zinc-600 dark:text-zinc-300 text-xs sm:text-sm mb-6 leading-relaxed">{message}</p>
            <Link
              to="/login"
              className="w-full inline-flex items-center justify-center py-2.5 border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 text-zinc-900 dark:text-white font-medium text-xs rounded-xl hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
            >
              Back to Login
            </Link>
          </div>
        )}

      </div>
    </div>
  );
}
