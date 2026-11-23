import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useDroppable } from '@dnd-kit/core';
import { useState, useRef, useEffect } from 'react';
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
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!showMenu) return;
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setShowMenu(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showMenu]);

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

  const { setNodeRef: droppableRef } = useDroppable({ id: column._id, data: { columnId: column._id } });

  const rawColumnCards = (column.cards || []).map((id) => cards[id]).filter(Boolean);
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
    if (!title || title === column.title) {
      setIsRenaming(false);
      return;
    }
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
    setShowMenu(false);
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
  };

  const handleColumnTypeChange = async (columnType) => {
    try {
      await boardService.updateColumn(column._id, { columnType });
      updateColumn(column._id, { columnType });
      getSocket()?.emit('column:update', { boardId, columnId: column._id, changes: { columnType } });
      addToast({ message: `Column marked as ${columnType === 'none' ? 'standard' : columnType}`, type: 'success' });
    } catch {
      addToast({ message: 'Failed to update column type', type: 'error' });
    }
    setShowMenu(false);
  };

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const setRef = (el) => {
    sortableRef(el);
    droppableRef(el);
  };

  const dotColor = column.color || '#6366f1';

  return (
    <div
      ref={setRef}
      style={style}
      className="shrink-0 w-[84vw] sm:w-72 flex flex-col max-h-[calc(100vh-10rem)] p-3 rounded-xl bg-white dark:bg-[#0c0d12] border border-black/[0.07] dark:border-white/[0.07] shadow-xs select-none"
    >
      {/* Column header */}
      <div className="flex items-center justify-between px-1 pt-0.5 pb-2.5 group">
        <div
          {...attributes}
          {...listeners}
          className="flex items-center gap-2 flex-1 cursor-grab active:cursor-grabbing min-w-0"
        >
          <span className="w-1.5 h-1.5 rounded-full shrink-0 opacity-70" style={{ background: dotColor }} />
          {isRenaming ? (
            <input
              autoFocus
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onBlur={handleRename}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleRename();
                if (e.key === 'Escape') setIsRenaming(false);
              }}
              className="flex-1 bg-white dark:bg-zinc-900 border border-black/20 dark:border-zinc-700 rounded px-2 py-0.5 text-xs font-semibold text-zinc-900 dark:text-zinc-100 outline-none"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <h3
              className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 truncate uppercase tracking-wider"
              onDoubleClick={() => {
                setRenameValue(column.title);
                setIsRenaming(true);
              }}
            >
              {column.title}
            </h3>
          )}

          {column.columnType && column.columnType !== 'none' && (
            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide shrink-0 ${
              column.columnType === 'initial' ? 'bg-blue-500/10 text-blue-500' : 'bg-emerald-500/10 text-emerald-500'
            }`}>
              {column.columnType === 'initial' ? 'Start' : 'Final'}
            </span>
          )}

          <span className="text-[10px] shrink-0 font-mono text-zinc-400 dark:text-zinc-500 bg-black/5 dark:bg-white/5 px-1.5 py-0.5 rounded font-medium">
            {isFiltered ? `${columnCards.length}/${rawColumnCards.length}` : rawColumnCards.length}
          </span>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-0.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setAddingCard(column._id, true);
            }}
            className="text-zinc-400 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 p-1 rounded-md transition-colors"
            title="Add task"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
          </button>

          <div className="relative" ref={menuRef}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu((v) => !v);
              }}
              title="Column settings"
              className="text-zinc-400 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 p-1 rounded-md transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                <circle cx="5" cy="12" r="1.5" />
                <circle cx="12" cy="12" r="1.5" />
                <circle cx="19" cy="12" r="1.5" />
              </svg>
            </button>

            {showMenu && (
              <div className="absolute right-0 top-full mt-1.5 z-50 w-48 bg-white dark:bg-[#121319] border border-black/10 dark:border-white/10 rounded-lg shadow-xl overflow-hidden animate-fadeIn">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(false);
                    setRenameValue(column.title);
                    setIsRenaming(true);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-zinc-700 dark:text-zinc-200 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                >
                  <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Rename column
                </button>

                <div className="mx-3 border-t border-black/[0.06] dark:border-white/[0.06]" />

                <div className="px-3 pt-2 pb-1.5">
                  <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-2">Color</p>
                  <div className="flex gap-2">
                    {COLUMN_COLORS.map((c) => (
                      <button
                        key={c}
                        onClick={() => handleColorChange(c)}
                        className="w-4.5 h-4.5 rounded-full transition-all hover:scale-110 flex items-center justify-center"
                        style={{ background: c }}
                      >
                        {column.color === c && (
                          <svg className="w-2.5 h-2.5 text-white stroke-[3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mx-3 border-t border-black/[0.06] dark:border-white/[0.06] mt-1" />

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-rose-500 hover:bg-rose-500/10 transition-colors"
                >
                  <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Delete column
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Cards list */}
      <div className="flex-1 overflow-y-auto px-0.5 pb-2 space-y-2">
        <SortableContext items={columnCards.map((c) => c._id)} strategy={verticalListSortingStrategy}>
          {columnCards.map((card) => (
            <Card key={card._id} card={card} boardId={boardId} />
          ))}
        </SortableContext>

        {isAdding && (
          <AddCardForm
            onAdd={handleAddCard}
            onCancel={() => setAddingCard(column._id, false)}
          />
        )}
      </div>

      {/* Quick Add Button at bottom of column */}
      {!isAdding && (
        <button
          onClick={() => setAddingCard(column._id, true)}
          className="mt-1 flex items-center gap-2 w-full px-3 py-2 rounded-lg text-xs font-medium text-zinc-400 dark:text-zinc-500 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-left"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          <span>Add task</span>
        </button>
      )}
    </div>
  );
}
