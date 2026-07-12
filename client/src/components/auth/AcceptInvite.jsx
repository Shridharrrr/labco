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
  const { isAuthenticated, user } = useAuthStore();
  const { addToast } = useUIStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // If not authenticated, redirect to login, but preserve the intent in URL
  if (!isAuthenticated) {
    return <Navigate to={`/login?redirect=/accept-invite?token=${token}%26boardId=${boardId}`} replace />;
  }

  useEffect(() => {
    if (!token || !boardId) {
      setError('Invalid invitation link.');
      setLoading(false);
      return;
    }

    const accept = async () => {
      try {
        await api.post(`/boards/${boardId}/accept-invite`, { token });
        addToast('Invitation accepted successfully!', 'success');
        navigate(`/boards/${boardId}`, { replace: true });
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to accept invitation. It may have expired or was sent to a different email.');
        setLoading(false);
      }
    };

    accept();
  }, [token, boardId, navigate, addToast]);

  if (loading) {
    return (
      <div className="flex h-screen bg-[#09090b] items-center justify-center flex-col gap-4">
        <Spinner />
        <p className="text-white/50 text-sm">Accepting invitation...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#09090b] items-center justify-center">
      <div className="w-full max-w-md bg-[#111114] border border-white/[0.06] rounded-xl p-8 text-center">
        <div className="w-12 h-12 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Invitation Error</h2>
        <p className="text-sm text-white/60 mb-6">{error}</p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-white/[0.04] hover:bg-white/[0.08] text-white rounded-lg text-sm font-medium transition-colors"
          >
            Go Home
          </button>
          <button
            onClick={() => {
              useAuthStore.getState().logout();
              navigate(`/login?redirect=/accept-invite?token=${token}%26boardId=${boardId}`);
            }}
            className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Switch Account
          </button>
        </div>
      </div>
    </div>
  );
}
