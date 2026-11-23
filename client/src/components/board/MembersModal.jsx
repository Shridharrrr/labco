import { useState } from 'react';
import * as boardService from '../../services/boardService';
import useBoardStore from '../../store/boardSlice';
import useUIStore from '../../store/uiSlice';
import useAuthStore from '../../store/authSlice';
import Spinner from '../ui/Spinner';

export default function MembersModal({ boardId, onClose }) {
  const { board, setBoard } = useBoardStore();
  const { addToast } = useUIStore();
  const { user } = useAuthStore();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('editor');
  const [loading, setLoading] = useState(false);

  const currentUserId = user?.userId || user?._id || user?.id;
  const isOwner = board?.members?.find(
    (m) => (m.user?._id || m.user)?.toString() === currentUserId?.toString()
  )?.role === 'owner';
  const pendingInvitations = board?.invitations || [];

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    try {
      const { data } = await boardService.inviteMember(boardId, { email: email.trim(), role });
      addToast({ message: data.message || 'Invitation sent successfully', type: 'success' });
      setEmail('');
      const res = await boardService.getBoard(boardId);
      setBoard({ board: res.data.board, columns: res.data.columns, cards: res.data.cards });
    } catch (err) {
      addToast({
        message: err.response?.data?.message || 'Failed to send invitation',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (userId) => {
    if (!confirm('Are you sure you want to remove this member?')) return;
    try {
      const { data } = await boardService.removeMember(boardId, userId);
      setBoard({
        board: data,
        columns: Object.values(useBoardStore.getState().columns),
        cards: Object.values(useBoardStore.getState().cards),
      });
      addToast({ message: 'Member removed', type: 'success' });
    } catch (err) {
      addToast({
        message: err.response?.data?.message || 'Failed to remove member',
        type: 'error',
      });
    }
  };

  const handleRevoke = async (inviteEmail) => {
    if (!confirm('Revoke this invitation?')) return;
    try {
      const { data } = await boardService.revokeInvitation(boardId, inviteEmail);
      setBoard({
        board: data,
        columns: Object.values(useBoardStore.getState().columns),
        cards: Object.values(useBoardStore.getState().cards),
      });
      addToast({ message: 'Invitation revoked', type: 'success' });
    } catch (err) {
      addToast({
        message: err.response?.data?.message || 'Failed to revoke invitation',
        type: 'error',
      });
    }
  };

  const handleChangeRole = async (userId, newRole) => {
    try {
      const { data } = await boardService.changeMemberRole(boardId, userId, { role: newRole });
      setBoard({
        board: data,
        columns: Object.values(useBoardStore.getState().columns),
        cards: Object.values(useBoardStore.getState().cards),
      });
      addToast({ message: 'Role updated successfully', type: 'success' });
    } catch (err) {
      addToast({
        message: err.response?.data?.message || 'Failed to update role',
        type: 'error',
      });
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-[fadeIn_0.12s_ease-out]"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[440px] bg-white dark:bg-[#111218] border border-black/[0.08] dark:border-white/[0.08] rounded-xl shadow-xl overflow-hidden flex flex-col max-h-[85vh] animate-[modalIn_0.15s_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-black/[0.06] dark:border-white/[0.07] shrink-0">
          <h2 className="text-sm font-semibold tracking-tight text-zinc-950 dark:text-white">
            Workspace members
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

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Invite Form */}
          {isOwner && (
            <form onSubmit={handleInvite} className="space-y-2">
              <label className="block text-[11px] font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">
                Invite by email
              </label>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 px-3 py-1.5 rounded-lg border border-black/[0.1] dark:border-white/[0.1] bg-transparent text-xs text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 outline-none focus:border-zinc-400 dark:focus:border-zinc-500 transition-colors"
                />
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg border border-black/[0.1] dark:border-white/[0.1] bg-white dark:bg-[#111218] text-xs text-zinc-800 dark:text-zinc-200 outline-none cursor-pointer"
                >
                  <option value="editor">Editor</option>
                  <option value="viewer">Viewer</option>
                  <option value="owner">Owner</option>
                </select>
                <button
                  type="submit"
                  disabled={loading || !email.trim()}
                  className="px-3.5 py-1.5 rounded-lg bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 text-xs font-semibold hover:opacity-90 disabled:opacity-35 transition-all shrink-0"
                >
                  {loading ? <Spinner size="sm" /> : 'Invite'}
                </button>
              </div>
            </form>
          )}

          {/* Members List */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">
                Active ({board?.members?.length || 0})
              </span>
            </div>

            <div className="divide-y divide-black/[0.05] dark:divide-white/[0.05] border border-black/[0.07] dark:border-white/[0.07] rounded-lg overflow-hidden bg-white dark:bg-[#0f0f12]">
              {board?.members?.map((m) => {
                const u = m.user;
                const uid = u?._id || u;
                const isSelf = uid?.toString() === currentUserId?.toString();
                const displayName = u?.name || u?.email || 'User';
                const initial = (displayName[0] || 'U').toUpperCase();

                return (
                  <div key={uid} className="flex items-center justify-between p-3 gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-6 h-6 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 flex items-center justify-center text-[10px] font-semibold shrink-0 select-none">
                        {u?.avatar ? (
                          <img src={u.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                        ) : (
                          <span>{initial}</span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-zinc-900 dark:text-white truncate">
                          {displayName} {isSelf && <span className="text-zinc-400 font-normal">(you)</span>}
                        </p>
                        {u?.email && u?.name && (
                          <p className="text-[10px] text-zinc-400 truncate">{u.email}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {isOwner && !isSelf ? (
                        <select
                          value={m.role}
                          onChange={(e) => handleChangeRole(uid, e.target.value)}
                          className="text-[11px] bg-transparent border border-black/[0.08] dark:border-white/[0.08] rounded px-2 py-0.5 text-zinc-600 dark:text-zinc-400 outline-none cursor-pointer"
                        >
                          <option value="owner">Owner</option>
                          <option value="editor">Editor</option>
                          <option value="viewer">Viewer</option>
                        </select>
                      ) : (
                        <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">
                          {m.role}
                        </span>
                      )}

                      {isOwner && !isSelf && (
                        <button
                          onClick={() => handleRemove(uid)}
                          className="text-zinc-400 hover:text-rose-500 p-1 rounded transition-colors"
                          title="Remove member"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Pending Invitations */}
          {pendingInvitations.length > 0 && (
            <div>
              <span className="block text-[11px] font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-2">
                Pending invites ({pendingInvitations.length})
              </span>
              <div className="divide-y divide-black/[0.05] dark:divide-white/[0.05] border border-black/[0.07] dark:border-white/[0.07] rounded-lg overflow-hidden bg-white dark:bg-[#0f0f12]">
                {pendingInvitations.map((inv) => (
                  <div key={inv.email} className="flex items-center justify-between p-3 gap-3">
                    <span className="text-xs text-zinc-700 dark:text-zinc-300 truncate">{inv.email}</span>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] font-mono text-zinc-400">{inv.role}</span>
                      {isOwner && (
                        <button
                          onClick={() => handleRevoke(inv.email)}
                          className="text-xs text-zinc-400 hover:text-rose-500 transition-colors"
                        >
                          Revoke
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
