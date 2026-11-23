import { useState, useEffect, useRef } from 'react';
import Spinner from '../ui/Spinner';
import Avatar from '../ui/Avatar';
import useBoardStore from '../../store/boardSlice';
import useUIStore from '../../store/uiSlice';
import useAuthStore from '../../store/authSlice';
import * as cardService from '../../services/cardService';
import { getSocket } from '../../hooks/useSocket';

const COVER_COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', '#6366f1', '#0d9488', '#a855f7', '#ec4899',
];

export default function CardModal({ boardId }) {
  const { activeCardId, closeCard, addToast } = useUIStore();
  const { board, cards, columns, columnOrder, updateCard, deleteCard: storeDeleteCard, moveCard: storeMoveCard } = useBoardStore();
  const { user } = useAuthStore();
  const card = cards[activeCardId];

  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [description, setDescription] = useState('');
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [newCheckItem, setNewCheckItem] = useState('');
  const [newCommentText, setNewCommentText] = useState('');
  const [saving, setSaving] = useState(false);
  const [postingComment, setPostingComment] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [showChecklist, setShowChecklist] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const fileInputRef = useRef(null);

  const currentUserId = user?.userId || user?._id || user?.id;

  useEffect(() => {
    if (!activeCardId) return;
    setLoading(true);
    setConfirmDelete(false);
    setIsEditingTitle(false);
    setIsEditingDesc(false);
    cardService.getCard(activeCardId)
      .then(({ data }) => {
        setDetail(data);
        setTitle(data.title || '');
        setDescription(data.description || '');
      })
      .catch(() => addToast({ message: 'Failed to load task details', type: 'error' }))
      .finally(() => setLoading(false));
  }, [activeCardId]);

  // Handle escape to close
  useEffect(() => {
    if (!activeCardId) return;
    const onKey = (e) => {
      if (e.key === 'Escape') closeCard();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [activeCardId, closeCard]);

  if (!activeCardId || !card) return null;

  const patch = async (changes) => {
    setSaving(true);
    setDetail((prev) => ({ ...prev, ...changes }));
    updateCard(activeCardId, changes);
    try {
      const { data } = await cardService.updateCard(activeCardId, changes);
      setDetail(data);
      getSocket()?.emit('card:update', { boardId, cardId: activeCardId, changes });
    } catch {
      addToast({ message: 'Failed to update task', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveTitle = () => {
    const cleanTitle = title.trim();
    if (!cleanTitle || cleanTitle === card.title) {
      setTitle(card.title);
      setIsEditingTitle(false);
      return;
    }
    patch({ title: cleanTitle });
    setIsEditingTitle(false);
  };

  const handleSaveDescription = () => {
    patch({ description });
    setIsEditingDesc(false);
  };

  const handleMoveColumn = async (toColumnId) => {
    if (!toColumnId || toColumnId === (detail?.column?._id || card.column)) return;
    const fromColId = detail?.column?._id || card.column;
    setSaving(true);
    try {
      await cardService.moveCard(activeCardId, {
        fromColumnId: fromColId,
        toColumnId,
        newOrder: 0,
      });
      storeMoveCard({ cardId: activeCardId, fromColumnId: fromColId, toColumnId, newOrder: 0 });
      getSocket()?.emit('card:move', { boardId, cardId: activeCardId, fromColumnId: fromColId, toColumnId, newOrder: 0 });
      setDetail((prev) => ({
        ...prev,
        column: { _id: toColumnId, title: columns[toColumnId]?.title || 'Column' },
      }));
      addToast({ message: `Moved to ${columns[toColumnId]?.title || 'column'}`, type: 'info' });
    } catch {
      addToast({ message: 'Failed to move task', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCard = async () => {
    try {
      await cardService.archiveCard(activeCardId);
      storeDeleteCard(activeCardId);
      getSocket()?.emit('card:delete', { boardId, cardId: activeCardId, columnId: card.column });
      addToast({ message: 'Task deleted', type: 'info' });
      closeCard();
    } catch {
      addToast({ message: 'Failed to delete task', type: 'error' });
    }
  };

  // Checklist actions
  const toggleCheckItem = (idx) => {
    if (!detail) return;
    patch({
      checklist: detail.checklist.map((item, i) => (i === idx ? { ...item, completed: !item.completed } : item)),
    });
  };

  const deleteCheckItem = (idx) => {
    patch({ checklist: detail.checklist.filter((_, i) => i !== idx) });
  };

  const addCheckItem = (e) => {
    e.preventDefault();
    if (!newCheckItem.trim()) return;
    patch({
      checklist: [...(detail?.checklist || []), { text: newCheckItem.trim(), completed: false }],
    });
    setNewCheckItem('');
  };

  // Comments actions
  const handleAddComment = async (e) => {
    e.preventDefault();
    const text = newCommentText.trim();
    if (!text) return;
    setPostingComment(true);
    try {
      const { data } = await cardService.addComment(activeCardId, { text });
      setDetail(data);
      updateCard(activeCardId, { comments: data.comments });
      setNewCommentText('');
      addToast({ message: 'Comment posted', type: 'success' });
    } catch {
      addToast({ message: 'Failed to post comment', type: 'error' });
    } finally {
      setPostingComment(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      const { data } = await cardService.deleteComment(activeCardId, commentId);
      setDetail(data);
      updateCard(activeCardId, { comments: data.comments });
    } catch {
      addToast({ message: 'Failed to delete comment', type: 'error' });
    }
  };

  // Attachment upload
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingFile(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const { data } = await cardService.addAttachment(activeCardId, formData);
      setDetail(data);
      updateCard(activeCardId, { attachments: data.attachments });
      addToast({ message: 'File uploaded successfully', type: 'success' });
    } catch {
      addToast({ message: 'Failed to upload attachment', type: 'error' });
    } finally {
      setUploadingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveAttachment = async (attachmentId) => {
    try {
      const { data } = await cardService.removeAttachment(activeCardId, attachmentId);
      setDetail(data);
      updateCard(activeCardId, { attachments: data.attachments });
    } catch {
      addToast({ message: 'Failed to remove attachment', type: 'error' });
    }
  };

  const checkedCount = detail?.checklist?.filter((i) => i.completed).length ?? 0;
  const totalCount = detail?.checklist?.length ?? 0;
  const allDone = totalCount > 0 && checkedCount === totalCount;
  const colTitle = columns[detail?.column?._id || card.column]?.title || 'Column';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-4 animate-[fadeIn_0.1s_ease-out]"
      onClick={(e) => e.target === e.currentTarget && closeCard()}
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white dark:bg-[#0f1015] border border-black/[0.08] dark:border-white/[0.08] rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden text-zinc-900 dark:text-zinc-100 transition-all">
        
        {/* Cover line */}
        {detail?.coverColor && (
          <div className="h-1 w-full shrink-0" style={{ background: detail.coverColor }} />
        )}

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-black/[0.06] dark:border-white/[0.07] shrink-0">
          <div className="flex items-center gap-2.5 flex-1 min-w-0 pr-4">
            <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-black/5 dark:bg-white/[0.06] text-zinc-600 dark:text-zinc-400 shrink-0">
              {colTitle}
            </span>

            {isEditingTitle ? (
              <input
                autoFocus
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={handleSaveTitle}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveTitle()}
                className="w-full bg-black/5 dark:bg-white/5 border border-black/20 dark:border-white/20 rounded-md px-2.5 py-1 text-sm font-semibold outline-none text-zinc-950 dark:text-white"
              />
            ) : (
              <div
                onClick={() => setIsEditingTitle(true)}
                className="flex items-center gap-2 group cursor-pointer max-w-full"
                title="Click to rename"
              >
                <h2 className="text-sm sm:text-base font-semibold text-zinc-950 dark:text-white truncate">
                  {card.title}
                </h2>
                <svg className="w-3.5 h-3.5 text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowChecklist((v) => !v)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                showChecklist
                  ? 'bg-black/5 dark:bg-white/10 text-zinc-900 dark:text-white'
                  : 'text-zinc-400 hover:text-black dark:hover:text-white'
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              <span>Subtasks</span>
              {totalCount > 0 && (
                <span className="font-mono text-[10px]">({checkedCount}/{totalCount})</span>
              )}
            </button>

            <button
              onClick={closeCard}
              className="text-zinc-400 hover:text-black dark:hover:text-white p-1.5 rounded-md hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              title="Close"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-24"><Spinner /></div>
        ) : (
          <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-black/[0.06] dark:divide-white/[0.07]">
            
            {/* Left Column: Details (Col span 7) */}
            <div className="md:col-span-7 p-5 space-y-5 overflow-y-auto">
              
              {/* Status and Due Date Strip */}
              <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.05] dark:border-white/[0.06]">
                <div>
                  <span className="block text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-1">
                    Status / Column
                  </span>
                  <select
                    value={detail?.column?._id || card.column}
                    onChange={(e) => handleMoveColumn(e.target.value)}
                    className="w-full bg-white dark:bg-[#15161d] border border-black/[0.08] dark:border-white/[0.09] rounded-md px-2.5 py-1.5 text-xs text-zinc-900 dark:text-zinc-100 font-medium outline-none cursor-pointer"
                  >
                    {columnOrder.map((colId) => (
                      <option key={colId} value={colId}>
                        {columns[colId]?.title || 'Column'}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <span className="block text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-1">
                    Due Date
                  </span>
                  <input
                    type="date"
                    value={detail?.dueDate ? new Date(detail.dueDate).toISOString().split('T')[0] : ''}
                    onChange={(e) => patch({ dueDate: e.target.value || null })}
                    className="w-full bg-white dark:bg-[#15161d] border border-black/[0.08] dark:border-white/[0.09] rounded-md px-2.5 py-1.5 text-xs text-zinc-900 dark:text-zinc-100 font-medium outline-none cursor-pointer"
                  />
                </div>
              </div>

              {/* Cover Color & Assignees */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-medium text-zinc-500 w-16 shrink-0">Cover</span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {COVER_COLORS.map((c) => (
                      <button
                        key={c}
                        onClick={() => patch({ coverColor: detail?.coverColor === c ? null : c })}
                        className={`w-4 h-4 rounded transition-transform ${
                          detail?.coverColor === c ? 'scale-125 ring-2 ring-offset-2 ring-offset-white dark:ring-offset-[#0f1015]' : 'opacity-60 hover:opacity-100'
                        }`}
                        style={{ backgroundColor: c }}
                        title="Set cover color"
                      />
                    ))}
                    {detail?.coverColor && (
                      <button
                        onClick={() => patch({ coverColor: null })}
                        className="text-[10px] text-zinc-400 hover:text-rose-500 ml-1 underline cursor-pointer"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs font-medium text-zinc-500 w-16 shrink-0">Assign</span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {board?.members?.map((m) => {
                      const memberId = m.user?._id || m.user;
                      const memberName = m.user?.name || m.user?.email || 'Member';
                      const isAssigned = detail?.assignees?.some(
                        (a) => (a._id || a).toString() === memberId?.toString()
                      );
                      return (
                        <button
                          key={memberId}
                          type="button"
                          onClick={() => {
                            const current = detail?.assignees || [];
                            const next = isAssigned
                              ? current.filter((a) => (a._id || a).toString() !== memberId.toString())
                              : [...current, { _id: memberId, name: m.user?.name, email: m.user?.email }];
                            patch({ assignees: next });
                          }}
                          className={`flex items-center gap-1.5 px-2 py-1 rounded-md border text-xs font-medium transition-all cursor-pointer ${
                            isAssigned
                              ? 'bg-black/10 dark:bg-white/10 border-black/20 dark:border-white/20 text-zinc-950 dark:text-white'
                              : 'border-black/[0.08] dark:border-white/[0.08] text-zinc-500 hover:text-black dark:hover:text-white'
                          }`}
                        >
                          <Avatar name={memberName} size="2xs" />
                          <span className="max-w-[100px] truncate">{memberName.split(' ')[0]}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                    Description
                  </span>
                  {!isEditingDesc && (
                    <button
                      onClick={() => setIsEditingDesc(true)}
                      className="text-xs text-zinc-500 hover:text-black dark:hover:text-white font-medium cursor-pointer"
                    >
                      {description ? 'Edit' : '+ Add'}
                    </button>
                  )}
                </div>

                {isEditingDesc ? (
                  <div className="space-y-2">
                    <textarea
                      autoFocus
                      rows={3}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Add task specifications, acceptance criteria, or context..."
                      className="w-full p-3 rounded-lg border border-black/20 dark:border-white/20 bg-transparent text-xs text-zinc-900 dark:text-zinc-100 outline-none resize-y"
                    />
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleSaveDescription}
                        className="px-3 py-1.5 bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 rounded-md text-xs font-semibold cursor-pointer"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => {
                          setIsEditingDesc(false);
                          setDescription(detail?.description || '');
                        }}
                        className="px-2.5 py-1.5 text-xs text-zinc-500 hover:text-black dark:hover:text-white cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => setIsEditingDesc(true)}
                    className="p-3 rounded-lg border border-black/[0.06] dark:border-white/[0.07] bg-black/[0.01] dark:bg-white/[0.01] text-xs text-zinc-700 dark:text-zinc-300 min-h-[50px] cursor-pointer hover:border-black/15 dark:hover:border-white/15 transition-colors leading-relaxed whitespace-pre-wrap"
                  >
                    {description || <span className="text-zinc-400 italic">No description provided yet. Click to add.</span>}
                  </div>
                )}
              </div>

              {/* Attachments Section */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                    Attachments ({detail?.attachments?.length || 0})
                  </span>
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      disabled={uploadingFile}
                      onClick={() => fileInputRef.current?.click()}
                      className="text-xs text-zinc-500 hover:text-black dark:hover:text-white font-medium flex items-center gap-1 cursor-pointer"
                    >
                      {uploadingFile ? <Spinner size="sm" /> : '+ Upload File'}
                    </button>
                  </div>
                </div>

                {detail?.attachments?.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {detail.attachments.map((att) => (
                      <div
                        key={att._id}
                        className="p-2 rounded-lg border border-black/[0.06] dark:border-white/[0.07] bg-black/[0.02] dark:bg-white/[0.03] flex items-center justify-between gap-2"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-xs">📎</span>
                          <a
                            href={att.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs font-medium text-zinc-900 dark:text-zinc-200 hover:underline truncate"
                          >
                            {att.name}
                          </a>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveAttachment(att._id)}
                          className="text-zinc-400 hover:text-rose-500 p-1 rounded cursor-pointer"
                          title="Delete attachment"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-zinc-400">No files attached.</p>
                )}
              </div>

              {/* Danger Zone: Delete Card */}
              <div className="pt-4 border-t border-black/[0.06] dark:border-white/[0.07] flex items-center justify-between">
                {!confirmDelete ? (
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(true)}
                    className="text-xs font-medium text-rose-500 hover:text-rose-600 transition-colors cursor-pointer"
                  >
                    Delete task
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-rose-500 font-medium">Delete this task?</span>
                    <button
                      type="button"
                      onClick={handleDeleteCard}
                      className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded text-xs font-semibold cursor-pointer"
                    >
                      Yes, delete
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(false)}
                      className="px-2 py-1 text-xs text-zinc-400 hover:text-zinc-100 cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>

            </div>

            {/* Right Column: Checklist & Comments (Col span 5) */}
            <div className="md:col-span-5 p-5 space-y-6 bg-black/[0.01] dark:bg-white/[0.01] flex flex-col justify-between overflow-y-auto">
              
              <div className="space-y-6">
                
                {/* Checklist Section */}
                {showChecklist && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                        Subtasks
                      </span>
                      {totalCount > 0 && (
                        <span className={`text-[11px] font-mono font-semibold ${allDone ? 'text-emerald-500' : 'text-zinc-400'}`}>
                          {checkedCount}/{totalCount}
                        </span>
                      )}
                    </div>

                    {totalCount > 0 && (
                      <div className="mb-3 w-full bg-black/10 dark:bg-white/10 rounded-full h-1 overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${allDone ? 'bg-emerald-500' : 'bg-zinc-400 dark:bg-white'}`}
                          style={{ width: `${(checkedCount / totalCount) * 100}%` }}
                        />
                      </div>
                    )}

                    <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                      {detail?.checklist?.map((item, idx) => (
                        <div
                          key={idx}
                          onClick={() => toggleCheckItem(idx)}
                          className="group flex items-center gap-2 p-1.5 rounded-md hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer transition-colors"
                        >
                          <div
                            className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 transition-colors ${
                              item.completed
                                ? 'bg-zinc-950 dark:bg-white border-zinc-950 dark:border-white text-white dark:text-zinc-950'
                                : 'border-black/30 dark:border-white/30'
                            }`}
                          >
                            {item.completed && (
                              <svg className="w-2.5 h-2.5 stroke-[3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                          <span className={`text-xs flex-1 transition-colors select-none ${
                            item.completed ? 'line-through text-zinc-400' : 'text-zinc-800 dark:text-zinc-200'
                          }`}>
                            {item.text}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteCheckItem(idx);
                            }}
                            className="opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-rose-500 p-0.5"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>

                    <form onSubmit={addCheckItem} className="mt-2.5 flex gap-2">
                      <input
                        type="text"
                        value={newCheckItem}
                        onChange={(e) => setNewCheckItem(e.target.value)}
                        placeholder="Add subtask..."
                        className="flex-1 px-2.5 py-1.5 rounded-md border border-black/[0.08] dark:border-white/[0.09] bg-transparent text-xs text-zinc-900 dark:text-white placeholder-zinc-400 outline-none"
                      />
                      <button
                        type="submit"
                        disabled={!newCheckItem.trim()}
                        className="px-3 py-1.5 bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 rounded-md text-xs font-semibold disabled:opacity-40 cursor-pointer"
                      >
                        Add
                      </button>
                    </form>
                  </div>
                )}

                {/* Task Comments */}
                <div>
                  <h3 className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-2.5">
                    Comments ({detail?.comments?.length || 0})
                  </h3>

                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {detail?.comments?.length > 0 ? (
                      detail.comments.map((c) => {
                        const authorName = c.author?.name || c.author?.email || 'User';
                        const isOwn = c.author?._id === currentUserId || c.author === currentUserId;
                        return (
                          <div
                            key={c._id}
                            className="p-2.5 rounded-lg border border-black/[0.05] dark:border-white/[0.06] bg-black/[0.02] dark:bg-white/[0.02] text-xs space-y-1"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Avatar name={authorName} size="2xs" />
                                <span className="font-semibold text-zinc-900 dark:text-white">
                                  {authorName}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] text-zinc-400 font-mono">
                                  {new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                                {isOwn && (
                                  <button
                                    onClick={() => handleDeleteComment(c._id)}
                                    className="text-zinc-400 hover:text-rose-500 cursor-pointer"
                                    title="Delete comment"
                                  >
                                    ✕
                                  </button>
                                )}
                              </div>
                            </div>
                            <p className="text-zinc-700 dark:text-zinc-300 pl-6 leading-relaxed">
                              {c.text}
                            </p>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-[11px] text-zinc-400 italic">No comments yet.</p>
                    )}
                  </div>

                  {/* Add comment box */}
                  <form onSubmit={handleAddComment} className="mt-3 flex gap-2">
                    <input
                      type="text"
                      value={newCommentText}
                      onChange={(e) => setNewCommentText(e.target.value)}
                      placeholder="Write a comment..."
                      className="flex-1 px-2.5 py-1.5 rounded-md border border-black/[0.08] dark:border-white/[0.09] bg-transparent text-xs text-zinc-900 dark:text-white placeholder-zinc-400 outline-none"
                    />
                    <button
                      type="submit"
                      disabled={postingComment || !newCommentText.trim()}
                      className="px-3 py-1.5 bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 rounded-md text-xs font-semibold disabled:opacity-40 cursor-pointer"
                    >
                      {postingComment ? <Spinner size="sm" /> : 'Send'}
                    </button>
                  </form>
                </div>

              </div>

            </div>

          </div>
        )}

        {saving && (
          <div className="absolute bottom-3 right-3 bg-zinc-950 text-white px-2.5 py-1 rounded text-[10px] font-mono shadow-md">
            Syncing...
          </div>
        )}

      </div>
    </div>
  );
}
