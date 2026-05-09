import { create } from 'zustand';

let toastId = 0;

const useUIStore = create((set) => ({
  activeCardId: null,
  isActivityOpen: false,
  isRightPanelOpen: false,
  toasts: [],
  isAddingCard: {},
  isAddingColumn: false,

  // ── Board filter state ────────────────────────────────────────────────────
  filters: {
    search: '',       // text search on card title
    labels: [],       // array of color strings
    dueDate: null,    // 'overdue' | 'due_soon' | 'no_date' | null
    hasChecklist: false,
  },

  setFilter: (key, value) =>
    set((s) => ({ filters: { ...s.filters, [key]: value } })),

  clearFilters: () =>
    set({ filters: { search: '', labels: [], dueDate: null, hasChecklist: false } }),

  // ─────────────────────────────────────────────────────────────────────────

  openCard: (cardId) => set({ activeCardId: cardId }),
  closeCard: () => set({ activeCardId: null }),

  toggleActivity: () => set((s) => ({ isActivityOpen: !s.isActivityOpen })),
  toggleRightPanel: () => set((s) => ({ isRightPanelOpen: !s.isRightPanelOpen })),

  addToast: ({ message, type = 'info' }) =>
    set((s) => {
      const id = ++toastId;
      return { toasts: [...s.toasts, { id, message, type }] };
    }),

  removeToast: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

  setAddingCard: (columnId, bool) =>
    set((s) => ({ isAddingCard: { ...s.isAddingCard, [columnId]: bool } })),

  setAddingColumn: (bool) => set({ isAddingColumn: bool }),
}));

export default useUIStore;

