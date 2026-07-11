import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import * as authService from '../../services/authService';
import Spinner from '../ui/Spinner';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  
  const [status, setStatus] = useState('verifying'); // verifying, success, error
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('No verification token provided.');
      return;
    }

    const verify = async () => {
      try {
        await authService.verifyEmail(token);
        setStatus('success');
        setMessage('Your email has been successfully verified! You can now log in.');
      } catch (err) {
        setStatus('error');
        setMessage(err.response?.data?.message || 'Failed to verify email. The token may be expired or invalid.');
      }
    };

    verify();
  }, [token]);

  return (
    <div className="min-h-screen flex bg-[#09090b] relative overflow-hidden items-center justify-center px-6">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff01_1px,transparent_1px),linear-gradient(to_bottom,#ffffff01_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-sm relative z-10 p-8 bg-gradient-to-br from-[#0c0c0f] to-[#121217] border border-white/[0.08] rounded-2xl shadow-2xl text-center">
        <div className="w-12 h-12 rounded-xl bg-black border border-white/[0.08] flex items-center justify-center font-bold text-white text-lg mx-auto mb-6">
          L
        </div>
        
        <h2 className="text-2xl font-bold text-white mb-2">Email Verification</h2>
        
        {status === 'verifying' && (
          <div className="flex flex-col items-center gap-4 mt-6">
            <Spinner size="md" />
            <p className="text-white/60 text-sm">Verifying your email address...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="mt-6">
            <div className="w-12 h-12 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-white/80 text-sm mb-6">{message}</p>
            <Link to="/login" className="w-full inline-flex items-center justify-center py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm rounded-lg transition-colors">
              Continue to Login
            </Link>
          </div>
        )}

        {status === 'error' && (
          <div className="mt-6">
            <div className="w-12 h-12 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <p className="text-white/80 text-sm mb-6">{message}</p>
            <Link to="/login" className="w-full inline-flex items-center justify-center py-2.5 bg-white/10 hover:bg-white/20 text-white font-semibold text-sm rounded-lg transition-colors">
              Back to Login
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
