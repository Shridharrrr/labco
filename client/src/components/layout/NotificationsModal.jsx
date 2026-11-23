import { useState } from 'react';
import * as boardService from '../../services/boardService';
import useUIStore from '../../store/uiSlice';
import Spinner from '../ui/Spinner';

export default function NotificationsModal({ onClose, onAccept, onIgnore, invitations }) {
  const { addToast } = useUIStore();
  const [loadingId, setLoadingId] = useState(null);
  const [ignoredTokens, setIgnoredTokens] = useState([]);

  const visibleInvitations = (invitations || []).filter((i) => !ignoredTokens.includes(i.token));

  const handleIgnore = (token) => {
    setIgnoredTokens((prev) => [...prev, token]);
    if (onIgnore) onIgnore(token);
  };

  const handleAccept = async (boardId, token) => {
    setLoadingId(token);
    try {
      await boardService.acceptInvitation(boardId, token);
      addToast({ message: 'Invitation accepted!', type: 'success' });
      if (onAccept) onAccept(token);
    } catch (err) {
      addToast({ message: err.response?.data?.message || 'Failed to accept invitation', type: 'error' });
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/60 backdrop-blur-sm p-4 animate-[fadeIn_0.12s_ease-out]"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[380px] bg-white dark:bg-[#111218] border border-black/[0.08] dark:border-white/[0.08] rounded-xl shadow-xl overflow-hidden animate-[modalIn_0.15s_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 pt-4 pb-3.5 border-b border-black/[0.06] dark:border-white/[0.07]">
          <h2 className="text-sm font-semibold tracking-tight text-zinc-950 dark:text-white">
            Notifications
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            title="Close"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-4">
          {visibleInvitations.length === 0 ? (
            <div className="py-10 text-center flex flex-col items-center">
              <p className="text-zinc-400 text-xs">No pending notifications</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {visibleInvitations.map((inv) => {
                const ownerName = inv.owner?.name || inv.owner?.email || 'Collaborator';
                const initial = (ownerName[0] || 'C').toUpperCase();
                return (
                  <div key={inv.token} className="p-3.5 rounded-lg border border-black/[0.07] dark:border-white/[0.07] bg-black/[0.01] dark:bg-white/[0.02] space-y-3">
                    <div className="flex gap-2.5 items-start">
                      <div className="w-6 h-6 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 flex items-center justify-center text-[10px] font-semibold shrink-0 select-none">
                        {inv.owner?.avatar ? (
                          <img src={inv.owner.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                        ) : (
                          <span>{initial}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-zinc-800 dark:text-zinc-200 leading-snug">
                          <span className="font-semibold text-zinc-950 dark:text-white">{ownerName}</span> invited you to <span className="font-semibold text-zinc-950 dark:text-white">{inv.boardTitle}</span>
                        </p>
                        <p className="text-[10px] text-zinc-400 font-mono mt-0.5">
                          {new Date(inv.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAccept(inv.boardId, inv.token)}
                        disabled={loadingId === inv.token}
                        className="flex-1 py-1.5 rounded-md bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 text-xs font-semibold hover:opacity-90 disabled:opacity-40 transition-opacity flex items-center justify-center gap-1.5"
                      >
                        {loadingId === inv.token ? <Spinner size="sm" /> : 'Accept'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleIgnore(inv.token)}
                        className="px-3 py-1.5 rounded-md border border-black/10 dark:border-white/10 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 text-xs font-medium transition-colors"
                      >
                        Ignore
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
