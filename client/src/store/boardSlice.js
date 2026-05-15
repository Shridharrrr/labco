import { create } from 'zustand';
import { produce } from 'immer';

const useBoardStore = create((set, get) => ({
  // ── State ────────────────────────────────────────────────────────────────
  board: null,
  columns: {},        // { [columnId]: Column }
  cards: {},          // { [cardId]: Card }
  columnOrder: [],    // ordered array of columnIds
  dragState: { activeId: null, overId: null, activeType: null },
  undoStack: [],
  redoStack: [],

  // ── Setters ──────────────────────────────────────────────────────────────
  setBoard: ({ board, columns, cards }) =>
    set(
      produce((s) => {
        s.board = board;
        s.columnOrder = board.columns?.map((c) => (typeof c === 'string' ? c : c._id)) ?? [];
        s.columns = {};
        s.cards = {};
        columns.forEach((col) => { s.columns[col._id] = col; });
        cards.forEach((card) => { s.cards[card._id] = card; });
      })
    ),

  updateBoardInfo: (changes) =>
    set(produce((s) => {
      if (s.board) {
        Object.assign(s.board, changes);
      }
    })),

  clearBoard: () => set({ board: null, columns: {}, cards: {}, columnOrder: [], undoStack: [], redoStack: [] }),

  // ── Column actions ────────────────────────────────────────────────────────
  addColumn: (column) =>
    set(produce((s) => {
      s.columns[column._id] = column;
      s.columnOrder.push(column._id);
    })),

  updateColumn: (columnId, changes) =>
    set(produce((s) => { Object.assign(s.columns[columnId] ?? {}, changes); })),

  deleteColumn: (columnId) =>
    set(produce((s) => {
      const col = s.columns[columnId];
      if (col) col.cards?.forEach((cid) => delete s.cards[cid]);
      delete s.columns[columnId];
      s.columnOrder = s.columnOrder.filter((id) => id !== columnId);
    })),

  reorderColumns: (orderedIds) =>
    set(produce((s) => { s.columnOrder = orderedIds; })),

  // ── Card actions ──────────────────────────────────────────────────────────
  addCard: (card) =>
    set(produce((s) => {
      s.cards[card._id] = card;
      const col = s.columns[card.column];
      if (col && !col.cards.includes(card._id)) col.cards.push(card._id);
    })),

  updateCard: (cardId, changes) =>
    set(produce((s) => { if (s.cards[cardId]) Object.assign(s.cards[cardId], changes); })),

  deleteCard: (cardId) =>
    set(produce((s) => {
      const card = s.cards[cardId];
      if (card) {
        const col = s.columns[card.column];
        if (col) col.cards = col.cards.filter((id) => id !== cardId);
      }
      delete s.cards[cardId];
    })),

  moveCard: ({ cardId, fromColumnId, toColumnId, newOrder }) =>
    set(produce((s) => {
      // Remove from source
      const fromCol = s.columns[fromColumnId];
      if (fromCol) fromCol.cards = fromCol.cards.filter((id) => id !== cardId);

      // Insert into target
      const toCol = s.columns[toColumnId];
      if (toCol) {
        toCol.cards = toCol.cards.filter((id) => id !== cardId);
        toCol.cards.splice(newOrder, 0, cardId);
      }

      // Update card reference
      if (s.cards[cardId]) s.cards[cardId].column = toColumnId;
    })),

  // ── Drag state ────────────────────────────────────────────────────────────
  setDragState: (state) => set({ dragState: state }),
  clearDragState: () => set({ dragState: { activeId: null, overId: null, activeType: null } }),

  // ── Remote update dispatcher ──────────────────────────────────────────────
  applyRemoteUpdate: (event, payload) => {
    const s = get();
    switch (event) {
      case 'card:created':   s.addCard(payload.card); break;
      case 'card:updated':   s.updateCard(payload.cardId, payload.changes); break;
      case 'card:moved':     s.moveCard(payload); break;
      case 'card:deleted':   s.deleteCard(payload.cardId); break;
      case 'column:created': s.addColumn(payload.column); break;
      case 'column:updated': s.updateColumn(payload.columnId, payload.changes); break;
      case 'column:deleted': s.deleteColumn(payload.columnId); break;
      case 'column:reordered': s.reorderColumns(payload.orderedColumnIds); break;
      default: break;
    }
  },
}));

export default useBoardStore;
