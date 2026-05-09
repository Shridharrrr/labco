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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-[#161616] border border-white/10 rounded-2xl p-6 shadow-2xl relative animate-[slideUp_0.2s_ease-out]">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors"
        >
          ✕
        </button>

        <h2 className="text-xl font-semibold text-white mb-6">Manage Members</h2>

        {isOwner && (
          <form onSubmit={handleInvite} className="mb-6 bg-white/5 p-4 rounded-xl border border-white/5">
            <h3 className="text-sm font-medium text-white/80 mb-3">Invite new member</h3>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="Email address..."
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:border-brand-500/70 focus:outline-none"
                required
              />
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-lg px-2 py-2 text-sm text-white/90 outline-none"
              >
                <option value="editor" className="bg-[#1e1e1e]">Editor</option>
                <option value="viewer" className="bg-[#1e1e1e]">Viewer</option>
              </select>
              <button
                type="submit"
                disabled={loading || !email}
                className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white text-sm font-medium rounded-lg disabled:opacity-50 transition-colors"
              >
                Invite
              </button>
            </div>
          </form>
        )}

        <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
          {board?.members?.map((m) => (
            <div key={m.user._id} className="flex items-center justify-between group">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-brand-500/20 text-brand-400 flex items-center justify-center font-bold text-xs uppercase">
                  {m.user.name?.[0] || m.user.email?.[0]}
                </div>
                <div>
                  <p className="text-sm text-white font-medium">{m.user.name || 'Unnamed'}</p>
                  <p className="text-xs text-white/40">{m.user.email}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {isOwner && m.role !== 'owner' ? (
                  <select
                    value={m.role}
                    onChange={(e) => handleChangeRole(m.user._id, e.target.value)}
                    className="bg-transparent border border-white/10 rounded px-2 py-1 text-xs text-white/60 hover:text-white transition-colors cursor-pointer outline-none"
                  >
                    <option value="editor" className="bg-[#1e1e1e]">Editor</option>
                    <option value="viewer" className="bg-[#1e1e1e]">Viewer</option>
                  </select>
                ) : (
                  <span className="text-xs text-white/50 capitalize px-2">{m.role}</span>
                )}

                {isOwner && m.role !== 'owner' && (
                  <button
                    onClick={() => handleRemove(m.user._id)}
                    className="text-white/20 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all p-1"
                    title="Remove member"
                  >
                    ✕
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
