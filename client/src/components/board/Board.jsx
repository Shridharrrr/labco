import {
  DndContext,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from '@dnd-kit/core';
import { SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import useBoardStore from '../../store/boardSlice';
import useUIStore from '../../store/uiSlice';
import useDragHandlers from '../../hooks/useDragHandlers';
import Column from './Column';
import Card from './Card';
import AddColumnForm from './AddColumnForm';
import * as boardService from '../../services/boardService';
import { getSocket } from '../../hooks/useSocket';

export default function Board({ boardId }) {
  const { columns, cards, columnOrder, addColumn, dragState } = useBoardStore();
  const { isAddingColumn, setAddingColumn, addToast } = useUIStore();

  const { onDragStart, onDragOver, onDragEnd } = useDragHandlers(boardId);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const orderedColumns = columnOrder.map((id) => columns[id]).filter(Boolean);

  const handleAddColumn = async (title) => {
    try {
      const { data } = await boardService.createColumn(boardId, { title });
      addColumn(data);
      getSocket()?.emit('column:create', { boardId, column: data });
      setAddingColumn(false);
    } catch (err) {
      addToast({ message: err.response?.data?.message || 'Failed to add column', type: 'error' });
    }
  };

  // What to show in the drag overlay
  const activeCard = dragState.activeId && dragState.activeType === 'card'
    ? cards[dragState.activeId]
    : null;

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDragEnd={onDragEnd}
      >
        <SortableContext
          items={orderedColumns.map((c) => c._id)}
          strategy={horizontalListSortingStrategy}
        >
          <div className="flex gap-4 items-start p-5 overflow-x-auto h-full pb-8">
            {orderedColumns.map((col) => (
              <Column key={col._id} column={col} boardId={boardId} />
            ))}

            {/* Add column */}
            {isAddingColumn ? (
              <AddColumnForm onAdd={handleAddColumn} onCancel={() => setAddingColumn(false)} />
            ) : (
              <button
                id="add-column-btn"
                onClick={() => setAddingColumn(true)}
                className="shrink-0 w-64 flex items-center gap-2 px-3.5 py-2.5
                  border border-dashed border-white/[0.08] hover:border-white/[0.16]
                  text-white/25 hover:text-white/55 rounded-lg transition-all text-xs font-medium group"
              >
                <svg className="w-3.5 h-3.5 text-white/15 group-hover:text-white/45 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                Add column
              </button>
            )}
          </div>
        </SortableContext>

        {/* Drag overlay — ghost card while dragging */}
        <DragOverlay dropAnimation={{ duration: 150, easing: 'ease' }}>
          {activeCard ? (
            <div className="rotate-1 scale-103 shadow-2xl opacity-90">
              <Card card={activeCard} boardId={boardId} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </>
  );
}
