import { useState, useEffect } from 'react';
import useAuthStore from '../../store/authSlice';
import useUIStore from '../../store/uiSlice';
import * as authService from '../../services/authService';
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

  const displayName = user?.name || user?.email || 'User';
  const initial = (displayName[0] || 'U').toUpperCase();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-[fadeIn_0.12s_ease-out]"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-[380px] rounded-xl bg-white dark:bg-[#111218] border border-black/[0.08] dark:border-white/[0.08] shadow-xl p-5 relative text-zinc-900 dark:text-white animate-[modalIn_0.15s_ease-out]">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-black/[0.06] dark:border-white/[0.07]">
          <h2 className="text-sm font-semibold tracking-tight text-zinc-950 dark:text-white">
            Profile &amp; Settings
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

        {/* Profile Card Header */}
        <div className="flex items-center gap-3.5 py-4 border-b border-black/[0.06] dark:border-white/[0.07]">
          <div className="w-11 h-11 rounded-lg bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 flex items-center justify-center text-base font-semibold shrink-0 select-none border border-black/[0.06] dark:border-white/[0.08]">
            {user?.avatar ? (
              <img src={user.avatar} alt="" className="w-full h-full rounded-lg object-cover" />
            ) : (
              <span>{initial}</span>
            )}
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-zinc-950 dark:text-white truncate">
              {displayName}
            </h3>
            <p className="text-xs text-zinc-400 truncate mt-0.5">
              {user?.email}
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSave} className="space-y-4 pt-4">
          <div>
            <label className="block text-[11px] font-medium uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-1.5">
              Display Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="w-full px-3 py-2 rounded-lg border border-black/[0.1] dark:border-white/[0.1] bg-transparent text-sm text-zinc-900 dark:text-white outline-none focus:border-zinc-400 dark:focus:border-zinc-500 transition-colors"
            />
          </div>

          {/* Theme Selector */}
          <div>
            <label className="block text-[11px] font-medium uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-1.5">
              Theme
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={`flex items-center justify-center gap-2 py-2 rounded-lg border text-xs font-medium transition-all ${
                  theme === 'dark'
                    ? 'border-zinc-950 dark:border-white bg-black/5 dark:bg-white/10 text-zinc-950 dark:text-white font-semibold'
                    : 'border-black/[0.08] dark:border-white/[0.08] text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
                }`}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" strokeWidth="1.5" />
                </svg>
                <span>Dark</span>
              </button>
              <button
                type="button"
                onClick={() => setTheme('light')}
                className={`flex items-center justify-center gap-2 py-2 rounded-lg border text-xs font-medium transition-all ${
                  theme === 'light'
                    ? 'border-zinc-950 dark:border-white bg-black/5 dark:bg-white/10 text-zinc-950 dark:text-white font-semibold'
                    : 'border-black/[0.08] dark:border-white/[0.08] text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
                }`}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="4" strokeWidth="1.5" />
                  <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" strokeWidth="1.5" />
                </svg>
                <span>Light</span>
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-black/[0.06] dark:border-white/[0.07]">
            <button
              type="button"
              onClick={() => {
                onClose();
                if (onLogout) onLogout();
              }}
              className="text-xs font-medium text-rose-500 hover:text-rose-600 transition-colors"
            >
              Sign out
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="text-xs font-medium text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving || !name.trim()}
                className="px-4 py-2 rounded-lg bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 text-xs font-semibold hover:opacity-90 disabled:opacity-35 transition-all flex items-center gap-2"
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
