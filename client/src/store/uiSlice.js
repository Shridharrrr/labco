import { create } from 'zustand';

let toastId = 0;

// Initialize theme from localStorage or default to 'dark'
const initialTheme = typeof window !== 'undefined'
  ? localStorage.getItem('labco-theme') || 'dark'
  : 'dark';

if (typeof document !== 'undefined') {
  if (initialTheme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}

const useUIStore = create((set) => ({
  theme: initialTheme,
  setTheme: (theme) => {
    localStorage.setItem('labco-theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    set({ theme });
  },
  toggleTheme: () =>
    set((s) => {
      const nextTheme = s.theme === 'dark' ? 'light' : 'dark';
      localStorage.setItem('labco-theme', nextTheme);
      if (nextTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      return { theme: nextTheme };
    }),

  activeCardId: null,
  isActivityOpen: false,
  isRightPanelOpen: false,
  isMobileSidebarOpen: false,
  toasts: [],
  isAddingCard: {},
  isAddingColumn: false,

  // ── Board filter state ────────────────────────────────────────────────────
  filters: {
    search: '',       // text search on card title
    covers: [],       // array of color strings
    dueDate: null,    // 'overdue' | 'due_soon' | 'no_date' | null
    hasChecklist: false,
  },

  setFilter: (key, value) =>
    set((s) => ({ filters: { ...s.filters, [key]: value } })),

  clearFilters: () =>
    set({ filters: { search: '', covers: [], dueDate: null, hasChecklist: false } }),

  // ─────────────────────────────────────────────────────────────────────────

  openCard: (cardId) => set({ activeCardId: cardId }),
  closeCard: () => set({ activeCardId: null }),

  toggleActivity: () => set((s) => ({ isActivityOpen: !s.isActivityOpen })),
  toggleRightPanel: () => set((s) => ({ isRightPanelOpen: !s.isRightPanelOpen })),
  toggleMobileSidebar: () => set((s) => ({ isMobileSidebarOpen: !s.isMobileSidebarOpen })),
  setMobileSidebarOpen: (bool) => set({ isMobileSidebarOpen: bool }),

  addToast: (toastArg, typeOverride) =>
    set((s) => {
      const id = ++toastId;
      if (typeof toastArg === 'string') {
        return { toasts: [...s.toasts, { id, message: toastArg, type: typeOverride || 'info' }] };
      }
      let rawMsg = toastArg?.message;
      if (rawMsg === undefined || rawMsg === null) {
        rawMsg = toastArg?.error || (typeof toastArg === 'object' ? JSON.stringify(toastArg) : String(toastArg || ''));
      } else if (typeof rawMsg === 'object') {
        rawMsg = rawMsg.message || rawMsg.error || JSON.stringify(rawMsg);
      }
      const message = typeof rawMsg === 'string' ? rawMsg : String(rawMsg || '');
      const type = toastArg?.type || typeOverride || 'info';
      return { toasts: [...s.toasts, { id, message, type }] };
    }),

  removeToast: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

  setAddingCard: (columnId, bool) =>
    set((s) => ({ isAddingCard: { ...s.isAddingCard, [columnId]: bool } })),

  setAddingColumn: (bool) => set({ isAddingColumn: bool }),
}));

export default useUIStore;

