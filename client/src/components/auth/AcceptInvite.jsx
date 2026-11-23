import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Navigate } from 'react-router-dom';
import useAuthStore from '../../store/authSlice';
import useUIStore from '../../store/uiSlice';
import api from '../../services/api';
import Spinner from '../ui/Spinner';

export default function AcceptInvite() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const boardId = searchParams.get('boardId');
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const { addToast } = useUIStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  if (!isAuthenticated) {
    return <Navigate to={`/login?redirect=/accept-invite?token=${token}%26boardId=${boardId}`} replace />;
  }

  useEffect(() => {
    if (!token || !boardId) {
      setError('Invalid invitation link parameters.');
      setLoading(false);
      return;
    }

    const accept = async () => {
      try {
        await api.post(`/boards/${boardId}/accept-invite`, { token });
        addToast({ message: 'Invitation accepted! Welcome to the board.', type: 'success' });
        navigate(`/boards/${boardId}`, { replace: true });
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to accept invitation. The link may have expired or was issued to a different email.');
        setLoading(false);
      }
    };

    accept();
  }, [token, boardId, navigate, addToast]);

  if (loading) {
    return (
      <div className="flex h-screen bg-[#f8f9fb] dark:bg-[#07080b] items-center justify-center flex-col gap-3 transition-colors">
        <Spinner size="lg" />
        <p className="text-zinc-500 text-xs font-medium">Validating workspace invite...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#f8f9fb] dark:bg-[#07080b] items-center justify-center px-4 transition-colors">
      <div className="w-full max-w-sm bg-white dark:bg-[#0c0d14] border border-black/[0.08] dark:border-white/[0.09] rounded-2xl p-7 text-center shadow-xl">
        <div className="w-12 h-12 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h2 className="text-lg font-bold text-zinc-950 dark:text-white mb-2">Invitation Error</h2>
        <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-6 leading-relaxed">
          {typeof error === 'string' ? error : (error?.message || JSON.stringify(error || ''))}
        </p>
        <div className="flex gap-2.5 justify-center">
          <button
            onClick={() => navigate('/')}
            className="flex-1 px-4 py-2 border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 text-zinc-800 dark:text-zinc-200 rounded-xl text-xs font-medium transition-colors"
          >
            Go Home
          </button>
          <button
            onClick={() => {
              useAuthStore.getState().clearAuth();
              navigate(`/login?redirect=/accept-invite?token=${token}%26boardId=${boardId}`);
            }}
            className="flex-1 px-4 py-2 bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 rounded-xl text-xs font-semibold hover:opacity-90 transition-all shadow-xs"
          >
            Switch Account
          </button>
        </div>
      </div>
    </div>
  );
}
