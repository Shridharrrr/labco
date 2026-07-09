import { useState } from 'react';
import * as boardService from '../../services/boardService';
import useBoardStore from '../../store/boardSlice';
import useUIStore from '../../store/uiSlice';
import useAuthStore from '../../store/authSlice';

export default function MembersModal({ boardId, onClose }) {
  const { board, setBoard } = useBoardStore();
  const { addToast } = useUIStore();
  const { user } = useAuthStore();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('editor');
  const [loading, setLoading] = useState(false);

  const isOwner = board?.members?.find((m) => m.user._id === user._id)?.role === 'owner';

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      const { data } = await boardService.inviteMember(boardId, { email, role });
      setBoard({ board: data, columns: Object.values(useBoardStore.getState().columns), cards: Object.values(useBoardStore.getState().cards) });
      addToast({ message: 'Member invited successfully', type: 'success' });
      setEmail('');
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-[#111114] border border-white/[0.10] rounded-lg p-5 shadow-2xl shadow-black/60 relative animate-[modalIn_0.15s_ease-out]">
        <button
          onClick={onClose}
          className="absolute top-3.5 right-3.5 text-white/30 hover:text-white/70 transition-colors p-1 rounded hover:bg-white/[0.06]"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>

        <h2 className="text-base font-semibold text-white mb-5">Manage Members</h2>

        {isOwner && (
          <form onSubmit={handleInvite} className="mb-5 bg-white/[0.03] p-3.5 rounded-lg border border-white/[0.06]">
            <h3 className="text-[11px] font-semibold text-white/50 uppercase tracking-wider mb-3">Invite new member</h3>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="Email address..."
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 bg-[#0c0c0f] border border-white/[0.10] rounded-md px-3 py-1.5 text-sm text-white placeholder-white/25 focus:border-brand-500/50 focus:outline-none"
                required
              />
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="bg-[#0c0c0f] border border-white/[0.10] rounded-md px-2 py-1.5 text-xs text-white/80 outline-none"
              >
                <option value="editor" className="bg-[#111114]">Editor</option>
                <option value="viewer" className="bg-[#111114]">Viewer</option>
              </select>
              <button
                type="submit"
                disabled={loading || !email}
                className="px-3.5 py-1.5 bg-brand-600 hover:bg-brand-500 text-white text-xs font-medium rounded-md disabled:opacity-50 transition-colors"
              >
                Invite
              </button>
            </div>
          </form>
        )}

        <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
          {board?.members?.map((m) => (
            <div key={m.user._id} className="flex items-center justify-between group py-1">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-md bg-brand-600/20 text-brand-400 flex items-center justify-center font-bold text-[10px] uppercase">
                  {m.user.name?.[0] || m.user.email?.[0]}
                </div>
                <div>
                  <p className="text-[13px] text-white font-medium">{m.user.name || 'Unnamed'}</p>
                  <p className="text-[11px] text-white/35">{m.user.email}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {isOwner && m.role !== 'owner' ? (
                  <select
                    value={m.role}
                    onChange={(e) => handleChangeRole(m.user._id, e.target.value)}
                    className="bg-transparent border border-white/[0.08] rounded-md px-2 py-1 text-[11px] text-white/50 hover:text-white transition-colors cursor-pointer outline-none"
                  >
                    <option value="editor" className="bg-[#111114]">Editor</option>
                    <option value="viewer" className="bg-[#111114]">Viewer</option>
                  </select>
                ) : (
                  <span className="text-[11px] text-white/40 capitalize px-2">{m.role}</span>
                )}

                {isOwner && m.role !== 'owner' && (
                  <button
                    onClick={() => handleRemove(m.user._id)}
                    className="text-white/15 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all p-1 rounded hover:bg-white/[0.04]"
                    title="Remove member"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
