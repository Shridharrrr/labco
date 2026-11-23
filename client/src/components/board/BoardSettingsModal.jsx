import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useBoardStore from '../../store/boardSlice';
import useAuthStore from '../../store/authSlice';
import useUIStore from '../../store/uiSlice';
import * as boardService from '../../services/boardService';
import Spinner from '../ui/Spinner';

const ACCENT_COLORS = [
  { name: 'Indigo',  value: '#6366f1', ring: 'ring-indigo-500' },
  { name: 'Cyan',    value: '#06b6d4', ring: 'ring-cyan-500'   },
  { name: 'Emerald', value: '#10b981', ring: 'ring-emerald-500'},
  { name: 'Amber',   value: '#f59e0b', ring: 'ring-amber-500'  },
  { name: 'Rose',    value: '#f43f5e', ring: 'ring-rose-500'   },
  { name: 'Purple',  value: '#a855f7', ring: 'ring-purple-500' },
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-[fadeIn_0.12s_ease-out]"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-[420px] rounded-xl bg-white dark:bg-[#111218] border border-black/[0.08] dark:border-white/[0.08] shadow-xl relative text-zinc-900 dark:text-white animate-[modalIn_0.15s_ease-out]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-black/[0.06] dark:border-white/[0.07]">
          <h2 className="text-sm font-semibold tracking-tight text-zinc-950 dark:text-white">
            Workspace settings
          </h2>
          <button
            onClick={onClose}
            type="button"
            className="p-1 rounded-md text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            title="Close"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSave} className="px-5 py-4 space-y-4">
          
          <div>
            <label className="block text-[11px] font-medium uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-1.5">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-black/[0.1] dark:border-white/[0.1] bg-transparent text-sm text-zinc-900 dark:text-white outline-none focus:border-zinc-400 dark:focus:border-zinc-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-1.5">
              Description <span className="normal-case tracking-normal font-normal text-zinc-400">(optional)</span>
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Workspace goals and scope..."
              className="w-full px-3 py-2 rounded-lg border border-black/[0.1] dark:border-white/[0.1] bg-transparent text-sm text-zinc-900 dark:text-white outline-none focus:border-zinc-400 dark:focus:border-zinc-500 transition-colors resize-none"
            />
          </div>

          {/* Color Presets */}
          <div>
            <label className="block text-[11px] font-medium uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-2">
              Color
            </label>
            <div className="flex items-center gap-2">
              {ACCENT_COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setBackground(c.value)}
                  className={`w-5 h-5 rounded-full transition-all ${
                    background === c.value
                      ? 'ring-2 ring-offset-2 ring-offset-white dark:ring-offset-[#111218] ' + c.ring
                      : 'opacity-60 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: c.value }}
                  title={c.name}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="text-xs font-medium text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !title.trim()}
              className="px-4 py-2 rounded-lg bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 text-xs font-semibold hover:opacity-90 disabled:opacity-35 transition-all flex items-center gap-2"
            >
              {saving ? <Spinner size="sm" /> : <span>Save</span>}
            </button>
          </div>

        </form>

        {/* Danger Zone */}
        <div className="px-5 py-4 border-t border-black/[0.06] dark:border-white/[0.07] bg-black/[0.01] dark:bg-white/[0.01]">
          <p className="text-[10px] font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-2">Danger zone</p>
          
          {!showConfirmDelete ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-zinc-800 dark:text-zinc-200">
                  {isOwner ? 'Archive workspace' : 'Leave workspace'}
                </p>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  {isOwner ? 'Archive all board data and cards.' : 'Remove yourself from member roster.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowConfirmDelete(true)}
                className="px-2.5 py-1 text-xs font-medium text-rose-600 dark:text-rose-400 border border-rose-500/20 rounded-md hover:bg-rose-500/10 transition-colors"
              >
                {isOwner ? 'Archive' : 'Leave'}
              </button>
            </div>
          ) : (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 space-y-2">
              <p className="text-xs font-medium text-rose-600 dark:text-rose-400">
                {isOwner ? 'Are you sure you want to archive this workspace?' : 'Are you sure you want to leave this workspace?'}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowConfirmDelete(false)}
                  className="px-2.5 py-1 text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteOrLeave}
                  disabled={deleting}
                  className="px-3 py-1 bg-rose-600 text-white rounded-md text-xs font-medium hover:bg-rose-500 transition-colors"
                >
                  {deleting ? <Spinner size="sm" /> : <span>Confirm</span>}
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
