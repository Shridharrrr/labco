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

  // Close menu on outside click
  useEffect(() => {
    if (!showMenu) return;
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setShowMenu(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showMenu]);

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
          {/* Color dot — purely decorative now */}
          <span
            className="w-2 h-2 rounded-sm shrink-0"
            style={{ background: dotColor }}
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
            <h3
              className="text-[13px] font-semibold text-white/80 truncate tracking-wide uppercase"
              onDoubleClick={() => { setRenameValue(column.title); setIsRenaming(true); }}
            >
              {column.title}
            </h3>
          )}

          {/* Column type badge */}
          {column.columnType && column.columnType !== 'none' && (
            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wide shrink-0
              ${column.columnType === 'initial' ? 'bg-blue-500/15 text-blue-400' : 'bg-emerald-500/15 text-emerald-400'}`}>
              {column.columnType === 'initial' ? 'Start' : 'Final'}
            </span>
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
            title="Add card"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
          </button>

          {/* 3-dots settings menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={(e) => { e.stopPropagation(); setShowMenu(v => !v); }}
              title="Column settings"
              className={`p-1 rounded transition-all cursor-pointer
                ${showMenu
                  ? 'bg-white/[0.08] text-white/80'
                  : 'text-white/35 hover:text-white/80 hover:bg-white/[0.06]'}`}
            >
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                <circle cx="5" cy="12" r="1.5" />
                <circle cx="12" cy="12" r="1.5" />
                <circle cx="19" cy="12" r="1.5" />
              </svg>
            </button>

            {showMenu && (
              <div className="absolute right-0 top-full mt-1.5 z-50 w-52
                bg-[#1a1a1e] border border-white/[0.10] rounded-xl shadow-2xl shadow-black/60
                animate-[slideUp_0.12s_ease-out] overflow-hidden">

                {/* Rename */}
                <button
                  onClick={(e) => { e.stopPropagation(); setShowMenu(false); setRenameValue(column.title); setIsRenaming(true); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-[12px] text-white/60 hover:text-white hover:bg-white/[0.05] transition-colors"
                >
                  <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Rename column
                </button>

                {/* Divider */}
                <div className="mx-3 border-t border-white/[0.06]" />

                {/* Color label */}
                <div className="px-3 pt-2 pb-1">
                  <p className="text-[9px] font-semibold text-white/25 uppercase tracking-wider mb-2">Color</p>
                  <div className="flex gap-2">
                    {COLUMN_COLORS.map(c => (
                      <button
                        key={c}
                        onClick={() => handleColorChange(c)}
                        className="w-6 h-6 rounded-md transition-all hover:scale-110 flex items-center justify-center"
                        style={{
                          background: c,
                          outline: column.color === c ? `2px solid ${c}` : '2px solid transparent',
                          outlineOffset: '2px',
                        }}
                      >
                        {column.color === c && (
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Divider */}
                <div className="mx-3 border-t border-white/[0.06] mt-2" />

                {/* Column type */}
                <div className="px-3 py-2">
                  <p className="text-[9px] font-semibold text-white/25 uppercase tracking-wider mb-1.5">Column Type</p>
                  <div className="flex gap-1">
                    {[
                      { key: 'none', label: 'Standard', active: 'bg-white/10 text-white/70' },
                      { key: 'initial', label: 'Start', active: 'bg-blue-500/20 text-blue-400' },
                      { key: 'final', label: 'Final', active: 'bg-emerald-500/20 text-emerald-400' },
                    ].map(({ key, label, active }) => (
                      <button
                        key={key}
                        onClick={() => handleColumnTypeChange(key)}
                        className={`flex-1 py-1.5 text-[10px] font-semibold rounded-md transition-all
                          ${column.columnType === key || (!column.columnType && key === 'none')
                            ? active
                            : 'text-white/30 hover:bg-white/[0.05] hover:text-white/60'}`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Divider */}
                <div className="mx-3 border-t border-white/[0.06]" />

                {/* Delete — danger zone */}
                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-[12px] text-red-400/70 hover:text-red-400 hover:bg-red-500/[0.06] transition-colors"
                >
                  <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Delete column
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

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
