import { useState } from 'react';
import * as boardService from '../../services/boardService';
import useBoardStore from '../../store/boardSlice';
import useUIStore from '../../store/uiSlice';
import useAuthStore from '../../store/authSlice';
import Avatar from '../ui/Avatar';
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-white dark:bg-[#0e0f16] border border-black/[0.08] dark:border-white/[0.09] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-[modalIn_0.15s_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-black/[0.06] dark:border-white/[0.06] bg-black/[0.01] dark:bg-white/[0.02] shrink-0">
          <div>
            <h2 className="text-sm font-bold text-zinc-950 dark:text-white flex items-center gap-2">
              <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              Workspace Collaborators
            </h2>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
              Manage member permissions and send team invitations.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-black dark:hover:text-white p-1 rounded-md transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Invite Form */}
          {isOwner && (
            <form onSubmit={handleInvite} className="space-y-2">
              <label className="block text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                Invite by Email
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="email"
                  placeholder="collaborator@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.08] dark:border-white/[0.08] rounded-xl px-3.5 py-2 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 outline-none focus:border-zinc-950 dark:focus:border-white transition-colors"
                  required
                />
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.08] dark:border-white/[0.08] rounded-xl px-3 py-2 text-xs text-zinc-800 dark:text-zinc-200 outline-none cursor-pointer"
                >
                  <option value="editor" className="bg-white dark:bg-[#0e0f16]">Editor</option>
                  <option value="viewer" className="bg-white dark:bg-[#0e0f16]">Viewer</option>
                </select>
                <button
                  type="submit"
                  disabled={loading || !email.trim()}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 hover:opacity-90 disabled:opacity-40 transition-all shadow-xs shrink-0 flex items-center justify-center gap-1.5"
                >
                  {loading && <Spinner size="xs" />}
                  <span>Send Invite</span>
                </button>
              </div>
            </form>
          )}

          {/* Active Members List */}
          <section className="space-y-2">
            <h3 className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider pb-1 border-b border-black/[0.06] dark:border-white/[0.06]">
              Active Members ({board?.members?.length || 0})
            </h3>
            <div className="space-y-1">
              {board?.members?.map((m) => {
                const memberId = m.user?._id || m.user;
                const isCurrent = memberId?.toString() === currentUserId?.toString();
                return (
                  <div
                    key={memberId}
                    className="flex items-center justify-between p-2 rounded-xl hover:bg-black/[0.02] dark:hover:bg-white/[0.03] transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar
                        name={m.user?.name || m.user?.email || 'User'}
                        src={m.user?.avatar}
                        size="sm"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate flex items-center gap-1.5">
                          <span>{m.user?.name || 'Unnamed'}</span>
                          {isCurrent && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-black/5 dark:bg-white/10 text-zinc-500 font-mono">
                              You
                            </span>
                          )}
                        </p>
                        <p className="text-[10px] text-zinc-400 dark:text-zinc-500 truncate">
                          {m.user?.email}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {isOwner && m.role !== 'owner' ? (
                        <select
                          value={m.role}
                          onChange={(e) => handleChangeRole(memberId, e.target.value)}
                          className="bg-black/[0.03] dark:bg-white/[0.04] border border-black/[0.08] dark:border-white/[0.08] rounded-lg px-2 py-1 text-xs text-zinc-800 dark:text-zinc-200 outline-none cursor-pointer"
                        >
                          <option value="editor" className="bg-white dark:bg-[#0e0f16]">Editor</option>
                          <option value="viewer" className="bg-white dark:bg-[#0e0f16]">Viewer</option>
                        </select>
                      ) : (
                        <span className="text-[11px] font-medium text-zinc-500 capitalize px-2">
                          {m.role}
                        </span>
                      )}

                      {isOwner && m.role !== 'owner' && (
                        <button
                          onClick={() => handleRemove(memberId)}
                          className="text-zinc-400 hover:text-rose-500 p-1.5 rounded-lg hover:bg-rose-500/10 transition-colors"
                          title="Remove member"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Pending Invitations */}
          {pendingInvitations.length > 0 && (
            <section className="space-y-2">
              <h3 className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider pb-1 border-b border-black/[0.06] dark:border-white/[0.06]">
                Pending Invitations ({pendingInvitations.length})
              </h3>
              <div className="space-y-1">
                {pendingInvitations.map((inv) => (
                  <div
                    key={inv.token || inv.email}
                    className="flex items-center justify-between p-2 rounded-xl hover:bg-black/[0.02] dark:hover:bg-white/[0.03] transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-black/[0.03] dark:bg-white/[0.04] border border-dashed border-black/15 dark:border-white/15 flex items-center justify-center shrink-0">
                        <svg className="w-3.5 h-3.5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate flex items-center gap-1.5">
                          <span>{inv.email}</span>
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 font-mono">
                            Pending
                          </span>
                        </p>
                        <p className="text-[10px] text-zinc-400">
                          Role: {inv.role}
                        </p>
                      </div>
                    </div>

                    {isOwner && (
                      <button
                        onClick={() => handleRevoke(inv.email)}
                        className="text-xs text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 px-2.5 py-1 rounded-md transition-colors"
                      >
                        Revoke
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
