import { create } from 'zustand';

let toastId = 0;

const useUIStore = create((set) => ({
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
      const { message = '', type = 'info' } = toastArg || {};
      return { toasts: [...s.toasts, { id, message, type }] };
    }),

  removeToast: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

  setAddingCard: (columnId, bool) =>
    set((s) => ({ isAddingCard: { ...s.isAddingCard, [columnId]: bool } })),

  setAddingColumn: (bool) => set({ isAddingColumn: bool }),
}));

export default useUIStore;

