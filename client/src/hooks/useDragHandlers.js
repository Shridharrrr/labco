import { useCallback } from 'react';

import { arrayMove } from '@dnd-kit/sortable';
import useBoardStore from '../store/boardSlice';
import useOptimistic from './useOptimistic';

const useDragHandlers = (boardId) => {
  const { cards, columns, columnOrder, setDragState, clearDragState } = useBoardStore();
  const { moveCard, reorderColumns } = useOptimistic();

  const onDragStart = useCallback(({ active }) => {
    setDragState({
      activeId: active.id,
      overId: null,
      activeType: active.data.current?.type ?? 'card',
      originalColumnId: cards[active.id]?.column,
    });
  }, [setDragState, cards]);

  const onDragOver = useCallback(({ active, over }) => {
    if (!over) return;
    const activeType = active.data.current?.type ?? 'card';
    if (activeType === 'column') return;

    const activeCard = cards[active.id];
    if (!activeCard) return;

    const overId = over.id;
    const isOverColumn = columns[overId] !== undefined;
    const toColumnId = isOverColumn ? overId : cards[overId]?.column;

    if (!toColumnId || activeCard.column === toColumnId) return;

    // Moving across columns during drag
    const toCol = columns[toColumnId];
    const overIndex = isOverColumn ? toCol.cards.length : toCol.cards.indexOf(overId);
    
    // We use the direct Zustand store mutator here (NOT the optimistic API wrapper)
    // so it just updates the UI immediately while dragging.
    useBoardStore.getState().moveCard({
      cardId: active.id,
      fromColumnId: activeCard.column,
      toColumnId,
      newOrder: overIndex >= 0 ? overIndex : toCol.cards.length,
    });
  }, [cards, columns]);

  const onDragEnd = useCallback(
    ({ active, over }) => {
      const { originalColumnId } = useBoardStore.getState().dragState;
      clearDragState();

      if (!over) return;
      const activeType = active.data.current?.type ?? 'card';

      // ── Column reorder ──────────────────────────────────────────────────
      if (activeType === 'column') {
        if (active.id === over.id) return;
        const oldIndex = columnOrder.indexOf(active.id);
        const newIndex = columnOrder.indexOf(over.id);
        if (oldIndex === newIndex) return;

        const newOrder = arrayMove(columnOrder, oldIndex, newIndex);
        reorderColumns({ boardId, orderedIds: newOrder, previousIds: columnOrder });
        return;
      }

      // ── Card drop ───────────────────────────────────────────────────────
      const activeCard = cards[active.id];
      if (!activeCard) return;

      const overId = over.id;
      const isOverColumn = columns[overId] !== undefined;
      const toColumnId = isOverColumn ? overId : cards[overId]?.column;
      if (!toColumnId) return;

      const toCol = columns[toColumnId];
      const overIndex = isOverColumn ? toCol.cards.length : toCol.cards.indexOf(overId);
      let newOrder = overIndex >= 0 ? overIndex : toCol.cards.length;

      // If dropped in the same spot, do nothing
      if (originalColumnId === toColumnId && newOrder === activeCard.order) return;

      // Call the API wrapper (this will persist it and broadcast)
      moveCard({
        cardId: active.id,
        fromColumnId: originalColumnId,
        toColumnId,
        newOrder,
      });
    },
    [cards, columns, columnOrder, boardId, clearDragState, moveCard, reorderColumns]
  );

  return { onDragStart, onDragOver, onDragEnd };
};

export default useDragHandlers;
