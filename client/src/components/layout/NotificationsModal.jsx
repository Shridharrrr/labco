import { useState } from 'react';
import * as boardService from '../../services/boardService';
import useUIStore from '../../store/uiSlice';
import Avatar from '../ui/Avatar';

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
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/50 backdrop-blur-xs p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm bg-white dark:bg-[#0e0f16] border border-black/[0.08] dark:border-white/[0.09] rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-black/[0.06] dark:border-white/[0.06] bg-black/[0.01] dark:bg-white/[0.02]">
          <h2 className="text-sm font-bold text-zinc-950 dark:text-white flex items-center gap-2">
            <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            Notifications
          </h2>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-black dark:hover:text-white p-1 rounded-md transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-3">
          {visibleInvitations.length === 0 ? (
            <div className="py-10 text-center flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center mb-3">
                <svg className="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
              </div>
              <p className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">No pending invitations</p>
            </div>
          ) : (
            <div className="space-y-2">
              {visibleInvitations.map((inv) => (
                <div key={inv.token} className="p-3 rounded-xl border border-black/[0.05] dark:border-white/[0.06] bg-black/[0.02] dark:bg-white/[0.03] space-y-2.5">
                  <div className="flex gap-2.5 items-start">
                    <Avatar name={inv.owner?.name || inv.owner?.email} src={inv.owner?.avatar} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-zinc-800 dark:text-zinc-200 leading-snug">
                        <span className="font-semibold text-zinc-950 dark:text-white">{inv.owner?.name || 'Collaborator'}</span> invited you to <span className="font-semibold text-zinc-950 dark:text-white">{inv.boardTitle}</span>
                      </p>
                      <p className="text-[10px] text-zinc-400 font-mono mt-0.5">
                        {new Date(inv.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => handleAccept(inv.boardId, inv.token)}
                      disabled={loadingId === inv.token}
                      className="flex-1 py-1.5 rounded-lg bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 text-xs font-medium hover:opacity-90 disabled:opacity-50 transition-all shadow-xs"
                    >
                      {loadingId === inv.token ? 'Accepting...' : 'Accept'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleIgnore(inv.token)}
                      className="px-3 py-1.5 rounded-lg border border-black/10 dark:border-white/10 text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white text-xs font-medium transition-colors"
                    >
                      Ignore
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
