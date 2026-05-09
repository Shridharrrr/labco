import { useCallback, useRef } from 'react';
import useBoardStore from '../store/boardSlice';
import useUIStore from '../store/uiSlice';
import * as cardService from '../services/cardService';
import * as boardService from '../services/boardService';
import { getSocket } from './useSocket';

const useOptimistic = () => {
  const store = useBoardStore();
  const { addToast } = useUIStore();
  const snapshotRef = useRef(null);

  /**
   * Perform an optimistic update.
   * @param {Function} localUpdate  - instantly mutates Zustand state
   * @param {Function} remoteCall   - async REST call (source of truth)
   * @param {Function} rollback     - reverses the local update on error
   */
  const optimistic = useCallback(
    async (localUpdate, remoteCall, rollback) => {
      localUpdate();
      try {
        await remoteCall();
      } catch (err) {
        rollback();
        addToast({
          message: err?.response?.data?.message || 'Action failed — changes reverted',
          type: 'error',
        });
      }
    },
    [addToast]
  );

  // ── Convenience wrappers ──────────────────────────────────────────────────

  const moveCard = useCallback(
    ({ cardId, fromColumnId, toColumnId, newOrder }) => {
      const socket = getSocket();
      return optimistic(
        () => store.moveCard({ cardId, fromColumnId, toColumnId, newOrder }),
        () => cardService.moveCard(cardId, { fromColumnId, toColumnId, newOrder }),
        () => store.moveCard({ cardId, fromColumnId: toColumnId, toColumnId: fromColumnId, newOrder: 0 })
      ).then(() => {
        socket?.emit('card:move', {
          boardId: store.board?._id,
          cardId, fromColumnId, toColumnId, newOrder,
        });
      });
    },
    [store, optimistic]
  );

  const reorderColumns = useCallback(
    ({ boardId, orderedIds, previousIds }) => {
      const socket = getSocket();
      return optimistic(
        () => store.reorderColumns(orderedIds),
        () => boardService.reorderColumns(boardId, { orderedColumnIds: orderedIds }),
        () => store.reorderColumns(previousIds)
      ).then(() => {
        socket?.emit('column:reorder', { boardId, orderedColumnIds: orderedIds });
      });
    },
    [store, optimistic]
  );

  return { optimistic, moveCard, reorderColumns };
};

export default useOptimistic;
