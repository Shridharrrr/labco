import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useBoardStore from '../../store/boardSlice';
import useAuthStore from '../../store/authSlice';
import useUIStore from '../../store/uiSlice';
import * as boardService from '../../services/boardService';
import Spinner from '../ui/Spinner';

const ACCENT_COLORS = [
  { name: 'Indigo', value: '#6366f1', ring: 'ring-indigo-500' },
  { name: 'Cyan', value: '#06b6d4', ring: 'ring-cyan-500' },
  { name: 'Emerald', value: '#10b981', ring: 'ring-emerald-500' },
  { name: 'Amber', value: '#f59e0b', ring: 'ring-amber-500' },
  { name: 'Rose', value: '#f43f5e', ring: 'ring-rose-500' },
  { name: 'Purple', value: '#a855f7', ring: 'ring-purple-500' },
];

export default function BoardSettingsModal({ isOpen, onClose, boardId }) {
  const navigate = useNavigate();
  const { board, updateBoardInfo } = useBoardStore();
  const { user } = useAuthStore();
  const { addToast } = useUIStore();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [background, setBackground] = useState(ACCENT_COLORS[0].value);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  const currentUserId = user?.userId || user?._id || user?.id;
  const isOwner = board?.owner && (board.owner._id || board.owner).toString() === currentUserId?.toString();

  useEffect(() => {
    if (board && isOpen) {
      setTitle(board.title || '');
      setDescription(board.description || '');
      setBackground(board.background || ACCENT_COLORS[0].value);
      setShowConfirmDelete(false);
    }
  }, [board, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !board) return null;

  const handleSave = async (e) => {
    e.preventDefault();
    const cleanTitle = title.trim();
    if (!cleanTitle) {
      addToast({ message: 'Title cannot be empty', type: 'error' });
      return;
    }

    setSaving(true);
    try {
      const { data } = await boardService.updateBoard(boardId, {
        title: cleanTitle,
        description: description.trim(),
        background,
      });
      updateBoardInfo({
        title: data.title,
        description: data.description,
        background: data.background,
      });
      addToast({ message: 'Workspace updated successfully', type: 'success' });
      onClose();
    } catch {
      addToast({ message: 'Failed to update workspace', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteOrLeave = async () => {
    setDeleting(true);
    try {
      if (isOwner) {
        await boardService.archiveBoard(boardId);
        addToast({ message: 'Workspace archived', type: 'success' });
      } else {
        await boardService.removeMember(boardId, currentUserId);
        addToast({ message: 'You left the workspace', type: 'info' });
      }
      onClose();
      navigate('/');
    } catch {
      addToast({ message: isOwner ? 'Failed to delete workspace' : 'Failed to leave workspace', type: 'error' });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-[fadeIn_0.12s_ease-out]"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-[#0d0e15] border border-black/[0.08] dark:border-white/[0.09] shadow-2xl p-6 relative text-zinc-900 dark:text-white animate-[modalIn_0.15s_ease-out]">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          type="button"
          className="absolute top-5 right-5 p-1.5 rounded-lg text-zinc-400 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
          title="Close"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-black/5 dark:bg-white/5 border border-black/[0.06] dark:border-white/[0.08] flex items-center justify-center text-zinc-700 dark:text-zinc-300">
            <svg className="w-5 h-5 stroke-[1.8]" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="12" cy="12" r="3" strokeWidth="2" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" strokeWidth="1.5" />
            </svg>
          </div>
          <div>
            <h2 className="text-base font-bold tracking-tight text-zinc-950 dark:text-white">
              Workspace Settings
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Manage workspace configuration and permissions.
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSave} className="space-y-4">
          
          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              Workspace Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-black/[0.08] dark:border-white/[0.08] bg-black/[0.02] dark:bg-white/[0.03] text-sm text-zinc-900 dark:text-white placeholder-zinc-400 outline-none focus:border-indigo-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              Description
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Workspace goals and scope..."
              className="w-full px-3.5 py-2 rounded-xl border border-black/[0.08] dark:border-white/[0.08] bg-black/[0.02] dark:bg-white/[0.03] text-sm text-zinc-900 dark:text-white placeholder-zinc-400 outline-none focus:border-indigo-500 transition-all resize-none"
            />
          </div>

          {/* Accent Color */}
          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              Accent Color
            </label>
            <div className="flex items-center gap-2.5">
              {ACCENT_COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setBackground(c.value)}
                  className={`w-7 h-7 rounded-lg transition-transform ${c.ring} flex items-center justify-center ${
                    background === c.value ? 'scale-110 ring-2 ring-offset-2 ring-offset-white dark:ring-offset-[#0d0e15]' : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: c.value }}
                  title={c.name}
                >
                  {background === c.value && (
                    <svg className="w-3.5 h-3.5 text-white stroke-[3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-black/[0.06] dark:border-white/[0.07]">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !title.trim()}
              className="px-5 py-2 rounded-xl bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 text-xs font-semibold hover:opacity-90 disabled:opacity-40 transition-all shadow-sm flex items-center gap-2"
            >
              {saving ? <Spinner size="sm" /> : <span>Save Changes</span>}
            </button>
          </div>

        </form>

        {/* Danger Zone */}
        <div className="mt-5 pt-4 border-t border-rose-500/20">
          <p className="text-[11px] font-semibold text-rose-500 uppercase tracking-wider mb-2">Danger Zone</p>
          
          {!showConfirmDelete ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-zinc-900 dark:text-zinc-200">
                  {isOwner ? 'Delete this workspace' : 'Leave this workspace'}
                </p>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  {isOwner ? 'Archive all board data and cards.' : 'Remove yourself from the workspace member roster.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowConfirmDelete(true)}
                className="px-3 py-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 border border-rose-500/30 rounded-lg hover:bg-rose-500/10 transition-colors"
              >
                {isOwner ? 'Delete' : 'Leave'}
              </button>
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 space-y-2.5">
              <p className="text-xs font-semibold text-rose-600 dark:text-rose-400">
                {isOwner ? 'Are you sure you want to delete this workspace?' : 'Are you sure you want to leave this workspace?'}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowConfirmDelete(false)}
                  className="px-3 py-1 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white rounded-md"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteOrLeave}
                  disabled={deleting}
                  className="px-3.5 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-md text-xs font-semibold shadow-xs flex items-center gap-1.5"
                >
                  {deleting ? <Spinner size="sm" /> : <span>Confirm {isOwner ? 'Delete' : 'Leave'}</span>}
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

