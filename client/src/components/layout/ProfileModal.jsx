import { useState, useEffect } from 'react';
import useAuthStore from '../../store/authSlice';
import useUIStore from '../../store/uiSlice';
import * as authService from '../../services/authService';
import Avatar from '../ui/Avatar';
import Spinner from '../ui/Spinner';

export default function ProfileModal({ isOpen, onClose, onLogout }) {
  const { user, updateUser } = useAuthStore();
  const { theme, setTheme, addToast } = useUIStore();

  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user && isOpen) {
      setName(user.name || '');
    }
  }, [user, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSave = async (e) => {
    e.preventDefault();
    const cleanName = name.trim();
    if (!cleanName) {
      addToast({ message: 'Name cannot be empty', type: 'error' });
      return;
    }

    setSaving(true);
    try {
      const { data } = await authService.updateProfile({ name: cleanName });
      updateUser({ name: data.name });
      addToast({ message: 'Profile updated successfully', type: 'success' });
      onClose();
    } catch {
      addToast({ message: 'Failed to update profile', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-[fadeIn_0.12s_ease-out]"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-[#0d0e15] border border-black/[0.08] dark:border-white/[0.09] shadow-2xl p-6 relative text-zinc-900 dark:text-white animate-[modalIn_0.15s_ease-out]">
        
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

        {/* Profile Card Header */}
        <div className="flex flex-col items-center text-center pb-5 border-b border-black/[0.06] dark:border-white/[0.07]">
          <Avatar
            name={user?.name || user?.email}
            src={user?.avatar}
            size="lg"
            className="w-16 h-16 rounded-2xl mb-3 shadow-md"
          />
          <h2 className="text-base font-bold text-zinc-950 dark:text-white">
            {user?.name || 'User'}
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            {user?.email}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSave} className="space-y-4 pt-4">
          
          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              Display Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="w-full px-3.5 py-2 rounded-xl border border-black/[0.08] dark:border-white/[0.08] bg-black/[0.02] dark:bg-white/[0.03] text-sm text-zinc-900 dark:text-white outline-none focus:border-indigo-500 transition-all"
            />
          </div>

          {/* Theme Selector */}
          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              Appearance Theme
            </label>
            <div className="grid grid-cols-2 gap-2 bg-black/5 dark:bg-white/5 p-1 rounded-xl border border-black/[0.06] dark:border-white/[0.08]">
              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all ${
                  theme === 'dark'
                    ? 'bg-[#181924] text-white shadow-xs'
                    : 'text-zinc-500 hover:text-black dark:hover:text-white'
                }`}
              >
                <span>🌙</span>
                <span>Dark Obsidian</span>
              </button>
              <button
                type="button"
                onClick={() => setTheme('light')}
                className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all ${
                  theme === 'light'
                    ? 'bg-white text-zinc-950 shadow-xs'
                    : 'text-zinc-500 hover:text-black dark:hover:text-white'
                }`}
              >
                <span>☀️</span>
                <span>Studio Light</span>
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-black/[0.06] dark:border-white/[0.07]">
            <button
              type="button"
              onClick={onLogout}
              className="text-xs font-medium text-rose-500 hover:text-rose-600 transition-colors"
            >
              Sign Out
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 text-xs font-medium text-zinc-500 hover:text-black dark:hover:text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving || !name.trim()}
                className="px-4 py-1.5 rounded-xl bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 text-xs font-semibold hover:opacity-90 disabled:opacity-40 transition-all shadow-xs flex items-center gap-1.5"
              >
                {saving ? <Spinner size="sm" /> : <span>Save</span>}
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
}

