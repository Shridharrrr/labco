import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useDroppable } from '@dnd-kit/core';
import { useState } from 'react';
import Card from './Card';
import AddCardForm from './AddCardForm';
import ContextMenu from '../ui/ContextMenu';
import useUIStore from '../../store/uiSlice';
import useBoardStore from '../../store/boardSlice';
import * as boardService from '../../services/boardService';
import * as cardService from '../../services/cardService';
import { getSocket } from '../../hooks/useSocket';
import { applyFilters } from '../../utils/filterCards';

const COLUMN_COLORS = [
  '#6366f1', '#ec4899', '#06b6d4', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#84cc16',
];

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

  const menuItems = [
    {
      label: 'Rename',
      icon: <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>,
      onClick: () => { setRenameValue(column.title); setIsRenaming(true); },
    },
    {
      label: 'Change color',
      icon: <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" /></svg>,
      onClick: () => setShowColorPicker(v => !v),
    },
    {
      label: 'Add card',
      icon: <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>,
      onClick: () => setAddingCard(column._id, true),
    },
    'divider',
    {
      label: 'Delete column',
      icon: <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>,
      onClick: handleDelete,
      danger: true,
    },
  ];

  const dotColor = column.color || '#6366f1';

  return (
    <div
      ref={setRef}
      style={style}
      className="shrink-0 w-72 flex flex-col max-h-[calc(100vh-10rem)] select-none"
    >
      {/* Column header */}
      <div className="flex items-center justify-between px-1 pt-1 pb-3 group">
        {/* Drag handle area (left side) */}
        <div
          {...attributes}
          {...listeners}
          className="flex items-center gap-2.5 flex-1 cursor-grab active:cursor-grabbing min-w-0"
        >
          <span
            className="w-2.5 h-2.5 rounded-full shrink-0 cursor-pointer"
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
              className="flex-1 bg-white/5 border border-brand-500/60 rounded-lg px-2 py-0.5 text-sm font-medium text-white outline-none"
              onClick={e => e.stopPropagation()}
            />
          ) : (
            <h3 className="text-[14px] font-medium text-white/90 truncate tracking-wide" onDoubleClick={() => { setRenameValue(column.title); setIsRenaming(true); }}>
              {column.title}
            </h3>
          )}
          <span className={`text-[11px] shrink-0 ${isFiltered ? 'text-brand-400 font-semibold' : 'text-white/30'}`}>
              {isFiltered ? `${columnCards.length}/${rawColumnCards.length}` : rawColumnCards.length}
            </span>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-all">
          {/* Quick add card */}
          <button
            onClick={(e) => { e.stopPropagation(); setAddingCard(column._id, true); }}
            className="text-white/40 hover:text-white/90 p-1.5 rounded-lg hover:bg-white/8 transition-all cursor-pointer"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
          </button>

          {/* Context menu trigger */}
          <ContextMenu items={menuItems}>
            <button className="text-white/40 hover:text-white/90 p-1.5 rounded-lg hover:bg-white/8 transition-all cursor-pointer">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="5" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="12" cy="19" r="1.5" /></svg>
            </button>
          </ContextMenu>
        </div>
      </div>

      {/* Color picker popover */}
      {showColorPicker && (
        <div className="mb-2 px-1 flex flex-wrap gap-1.5 p-2 bg-white/[0.04] border border-white/[0.08] rounded-xl">
          {COLUMN_COLORS.map(c => (
            <button
              key={c}
              onClick={() => handleColorChange(c)}
              className="w-5 h-5 rounded-full transition-transform hover:scale-125"
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
      <div className="flex-1 overflow-y-auto px-0.5 pb-3 space-y-3">
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
