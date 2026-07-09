import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useDroppable } from '@dnd-kit/core';
import { useState } from 'react';
import Card from './Card';
import AddCardForm from './AddCardForm';
import useUIStore from '../../store/uiSlice';
import useBoardStore from '../../store/boardSlice';
import * as boardService from '../../services/boardService';
import * as cardService from '../../services/cardService';
import { getSocket } from '../../hooks/useSocket';
import { applyFilters } from '../../utils/filterCards';

const COLUMN_COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#6366f1'];

export default function Column({ column, boardId }) {
  const { cards, addCard, updateColumn, deleteColumn } = useBoardStore();
  const { isAddingCard, setAddingCard, addToast, filters } = useUIStore();
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(column.title);
  const [showColorPicker, setShowColorPicker] = useState(false);

  // Column drag (for reordering columns)
  const {
    attributes,
    listeners,
    setNodeRef: sortableRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: column._id,
    data: { type: 'column' },
  });

  // Also set as droppable for cards
  const { setNodeRef: droppableRef } = useDroppable({ id: column._id, data: { columnId: column._id } });

  const rawColumnCards = (column.cards || [])
    .map((id) => cards[id])
    .filter(Boolean);
  const columnCards = applyFilters(rawColumnCards, filters);
  const isFiltered = columnCards.length !== rawColumnCards.length;

  const isAdding = isAddingCard[column._id];

  const handleAddCard = async (title) => {
    try {
      const { data } = await cardService.createCard(column._id, { title });
      addCard(data);
      getSocket()?.emit('card:create', { boardId, columnId: column._id, card: data });
      setAddingCard(column._id, false);
    } catch (err) {
      addToast({ message: err.response?.data?.message || 'Failed to add card', type: 'error' });
    }
  };

  const handleRename = async () => {
    const title = renameValue.trim();
    if (!title || title === column.title) { setIsRenaming(false); return; }
    try {
      await boardService.updateColumn(column._id, { title });
      updateColumn(column._id, { title });
      getSocket()?.emit('column:update', { boardId, columnId: column._id, changes: { title } });
    } catch {
      addToast({ message: 'Failed to rename column', type: 'error' });
    }
    setIsRenaming(false);
  };

  const handleDelete = async () => {
    if (!confirm(`Delete "${column.title}" and all its cards?`)) return;
    try {
      await boardService.deleteColumn(column._id);
      deleteColumn(column._id);
      getSocket()?.emit('column:delete', { boardId, columnId: column._id });
    } catch {
      addToast({ message: 'Failed to delete column', type: 'error' });
    }
  };

  const handleColorChange = async (color) => {
    try {
      await boardService.updateColumn(column._id, { color });
      updateColumn(column._id, { color });
      getSocket()?.emit('column:update', { boardId, columnId: column._id, changes: { color } });
    } catch {
      addToast({ message: 'Failed to update color', type: 'error' });
    }
    setShowColorPicker(false);
  };

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // Combine refs
  const setRef = (el) => {
    sortableRef(el);
    droppableRef(el);
  };


  const dotColor = column.color || '#6366f1';

  return (
    <div
      ref={setRef}
      style={style}
      className="shrink-0 w-72 flex flex-col max-h-[calc(100vh-10rem)] select-none"
    >
      {/* Column header */}
      <div className="flex items-center justify-between px-1 pt-1 pb-2.5 group">
        {/* Drag handle area (left side) */}
        <div
          {...attributes}
          {...listeners}
          className="flex items-center gap-2 flex-1 cursor-grab active:cursor-grabbing min-w-0"
        >
          <span
            className="w-2 h-2 rounded-sm shrink-0 cursor-pointer"
            style={{ background: dotColor }}
            onClick={(e) => { e.stopPropagation(); setShowColorPicker(v => !v); }}
          />
          {isRenaming ? (
            <input
              autoFocus
              value={renameValue}
              onChange={e => setRenameValue(e.target.value)}
              onBlur={handleRename}
              onKeyDown={e => { if (e.key === 'Enter') handleRename(); if (e.key === 'Escape') setIsRenaming(false); }}
              className="flex-1 bg-white/[0.05] border border-brand-500/50 rounded px-2 py-0.5 text-sm font-medium text-white outline-none"
              onClick={e => e.stopPropagation()}
            />
          ) : (
            <h3 className="text-[13px] font-semibold text-white/80 truncate tracking-wide uppercase" onDoubleClick={() => { setRenameValue(column.title); setIsRenaming(true); }}>
              {column.title}
            </h3>
          )}
          <span className={`text-[10px] shrink-0 font-mono ${isFiltered ? 'text-brand-400 font-semibold' : 'text-white/25'}`}>
              {isFiltered ? `${columnCards.length}/${rawColumnCards.length}` : rawColumnCards.length}
            </span>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-all">
          {/* Quick add card */}
          <button
            onClick={(e) => { e.stopPropagation(); setAddingCard(column._id, true); }}
            className="text-white/35 hover:text-white/80 p-1 rounded hover:bg-white/[0.06] transition-all cursor-pointer"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
          </button>

          {/* Delete column button */}
          <button
            onClick={(e) => { e.stopPropagation(); handleDelete(); }}
            className="text-white/35 hover:text-red-400 p-1 rounded hover:bg-white/[0.06] transition-all cursor-pointer"
            title="Delete column"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
          </button>
        </div>
      </div>

      {/* Color picker popover */}
      {showColorPicker && (
        <div className="mb-2 px-1 flex flex-wrap gap-1.5 p-2 bg-[#161619] border border-white/[0.10] rounded-lg">
          {COLUMN_COLORS.map(c => (
            <button
              key={c}
              onClick={() => handleColorChange(c)}
              className="w-5 h-5 rounded-sm transition-transform hover:scale-125"
              style={{
                background: c,
                outline: column.color === c ? `2px solid ${c}` : '2px solid transparent',
                outlineOffset: '2px',
              }}
            />
          ))}
        </div>
      )}

      {/* Cards list */}
      <div className="flex-1 overflow-y-auto px-0.5 pb-3 space-y-2">
        <SortableContext
          items={columnCards.map((c) => c._id)}
          strategy={verticalListSortingStrategy}
        >
          {columnCards.map((card) => (
            <Card key={card._id} card={card} boardId={boardId} />
          ))}
        </SortableContext>

        {/* Add card form */}
        {isAdding && (
          <AddCardForm
            onAdd={handleAddCard}
            onCancel={() => setAddingCard(column._id, false)}
          />
        )}
      </div>
    </div>
  );
}
