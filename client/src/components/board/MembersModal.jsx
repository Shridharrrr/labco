import { useState } from 'react';
import * as boardService from '../../services/boardService';
import useBoardStore from '../../store/boardSlice';
import useUIStore from '../../store/uiSlice';
import useAuthStore from '../../store/authSlice';
import Avatar from '../ui/Avatar';

export default function MembersModal({ boardId, onClose }) {
  const { board, setBoard } = useBoardStore();
  const { addToast } = useUIStore();
  const { user } = useAuthStore();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('editor');
  const [loading, setLoading] = useState(false);

  const isOwner = board?.members?.find((m) => m.user._id === user.userId || m.user._id === user._id)?.role === 'owner';
  const pendingInvitations = board?.invitations || [];

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      const { data } = await boardService.inviteMember(boardId, { email, role });
      addToast({ message: data.message || 'Invitation sent successfully', type: 'success' });
      setEmail('');
      // Refresh board data to show pending invitations (we might need to refetch or assume data returns board state if backend is modified, but currently it returns { message: 'Invitation sent' }, so we should ideally refetch the board, or just manually append if we don't return the full board. Wait, the modified backend returns `{ message: 'Invitation sent' }`, so we need to fetch board to see pending invites.)
      const res = await boardService.getBoard(boardId);
      setBoard({ board: res.data.board, columns: res.data.columns, cards: res.data.cards });
    } catch (err) {
      addToast({ message: err.response?.data?.message || 'Failed to invite member', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (userId) => {
    if (!confirm('Are you sure you want to remove this member?')) return;
    try {
      const { data } = await boardService.removeMember(boardId, userId);
      setBoard({ board: data, columns: Object.values(useBoardStore.getState().columns), cards: Object.values(useBoardStore.getState().cards) });
      addToast({ message: 'Member removed', type: 'success' });
    } catch (err) {
      addToast({ message: err.response?.data?.message || 'Failed to remove member', type: 'error' });
    }
  };

  const handleRevoke = async (inviteEmail) => {
    if (!confirm('Revoke this invitation?')) return;
    try {
      const { data } = await boardService.revokeInvitation(boardId, inviteEmail);
      setBoard({ board: data, columns: Object.values(useBoardStore.getState().columns), cards: Object.values(useBoardStore.getState().cards) });
      addToast({ message: 'Invitation revoked', type: 'success' });
    } catch (err) {
      addToast({ message: err.response?.data?.message || 'Failed to revoke invitation', type: 'error' });
    }
  };

  const handleChangeRole = async (userId, newRole) => {
    try {
      const { data } = await boardService.changeMemberRole(boardId, userId, { role: newRole });
      setBoard({ board: data, columns: Object.values(useBoardStore.getState().columns), cards: Object.values(useBoardStore.getState().cards) });
      addToast({ message: 'Role updated', type: 'success' });
    } catch (err) {
      addToast({ message: err.response?.data?.message || 'Failed to update role', type: 'error' });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-3 sm:p-4">
      <div className="w-full max-w-lg bg-[#111114] border border-white/[0.08] rounded-xl p-4 sm:p-6 shadow-2xl shadow-black/80 relative animate-[modalIn_0.15s_ease-out] flex flex-col max-h-[85vh]">
        <button
          onClick={onClose}
          className="absolute top-3.5 right-3.5 sm:top-4 sm:right-4 text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-all duration-200 p-2 rounded-lg active:scale-95"
          title="Close"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>

        <div className="mb-5 sm:mb-6 pr-8">
          <h2 className="text-lg font-bold text-white tracking-tight">Manage Members</h2>
          <p className="text-xs text-zinc-400 mt-0.5">Invite team members to collaborate on this board.</p>
        </div>

        {isOwner && (
          <form onSubmit={handleInvite} className="mb-6 sm:mb-8">
            <label className="block text-[11px] font-semibold text-zinc-300 uppercase tracking-widest mb-2">Invite People</label>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                </div>
                <input
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#0c0c0f] border border-white/[0.12] rounded-lg pl-9 pr-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-brand-500/50 focus:bg-white/[0.02] outline-none transition-colors"
                  required
                />
              </div>
              <div className="flex gap-2">
                <div className="relative flex-1 sm:flex-none">
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full appearance-none bg-[#0c0c0f] border border-white/[0.12] rounded-lg pl-3 pr-8 py-2 text-sm text-zinc-200 outline-none focus:border-brand-500/50 transition-colors"
                  >
                    <option value="editor" className="bg-[#111114]">Editor</option>
                    <option value="viewer" className="bg-[#111114]">Viewer</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none text-zinc-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 9l4-4 4 4m0 6l-4 4-4-4" /></svg>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading || !email}
                  className="flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-200 bg-brand-600 hover:bg-brand-500 text-white disabled:opacity-40 disabled:pointer-events-none active:scale-[0.96]"
                >
                  Send Invite
                </button>
              </div>
            </div>
          </form>
        )}

        <div className="flex-1 overflow-y-auto pr-2 -mr-2 space-y-6">
          {/* Active Members Section */}
          <section>
            <h3 className="text-[11px] font-semibold text-zinc-300 uppercase tracking-widest mb-3 border-b border-white/[0.06] pb-2">Active Members ({board?.members?.length || 0})</h3>
            <div className="space-y-1">
              {board?.members?.map((m) => (
                <div key={m.user._id} className="flex items-center justify-between group p-2 hover:bg-white/[0.03] rounded-lg transition-colors">
                  <div className="flex items-center gap-3">
                    <Avatar name={m.user.name || m.user.email} src={m.user.avatar} size="md" />
                    <div className="min-w-0">
                      <p className="text-[13px] text-white font-medium truncate flex items-center gap-2">
                        {m.user.name || 'Unnamed'}
                        {(m.user._id === user?.userId || m.user._id === user?._id) && <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/10 text-zinc-200 uppercase font-semibold">You</span>}
                      </p>
                      <p className="text-[11px] text-zinc-400 truncate">{m.user.email}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {isOwner && m.role !== 'owner' ? (
                      <div className="relative">
                        <select
                          value={m.role}
                          onChange={(e) => handleChangeRole(m.user._id, e.target.value)}
                          className="appearance-none bg-transparent border border-white/[0.1] rounded-md pl-2 pr-6 py-1 text-[11px] font-medium text-zinc-200 hover:text-white hover:border-white/[0.2] transition-colors cursor-pointer outline-none"
                        >
                          <option value="editor" className="bg-[#111114]">Editor</option>
                          <option value="viewer" className="bg-[#111114]">Viewer</option>
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center pr-1.5 pointer-events-none text-zinc-400">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                        </div>
                      </div>
                    ) : (
                      <span className="text-[11px] font-medium text-zinc-300 capitalize px-2">{m.role}</span>
                    )}

                    {isOwner && m.role !== 'owner' && (
                      <button
                        onClick={() => handleRemove(m.user._id)}
                        className="text-zinc-400 hover:text-red-400 hover:bg-red-500/10 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all duration-200 p-1.5 rounded-md active:scale-95"
                        title="Remove member"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Pending Invitations Section */}
          {pendingInvitations.length > 0 && (
            <section>
              <h3 className="text-[11px] font-semibold text-zinc-300 uppercase tracking-widest mb-3 border-b border-white/[0.06] pb-2">Pending Invitations ({pendingInvitations.length})</h3>
              <div className="space-y-1">
                {pendingInvitations.map((inv) => (
                  <div key={inv.token} className="flex items-center justify-between group p-2 hover:bg-white/[0.03] rounded-lg transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-white/[0.04] border border-white/[0.08] border-dashed flex items-center justify-center shrink-0">
                        <svg className="w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                      </div>
                      <div className="min-w-0">
                        <p className="text-[13px] text-zinc-100 font-medium truncate flex items-center gap-2">
                          {inv.email}
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-brand-500/10 text-brand-400 font-semibold uppercase tracking-wider">Pending</span>
                        </p>
                        <p className="text-[10px] text-zinc-400 mt-0.5 truncate">Invited on {new Date(inv.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <span className="text-[11px] font-medium text-zinc-300 capitalize px-2">{inv.role}</span>
                      
                      {isOwner && (
                        <button
                          onClick={() => handleRevoke(inv.email)}
                          className="text-[11px] font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 px-2 py-1 rounded-md opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all duration-200 active:scale-95"
                          title="Revoke invitation"
                        >
                          Revoke
                        </button>
                      )}
                    </div>
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
