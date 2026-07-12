import { useState, useEffect } from 'react';
import Spinner from '../ui/Spinner';
import useBoardStore from '../../store/boardSlice';
import useUIStore from '../../store/uiSlice';
import * as cardService from '../../services/cardService';
import { getSocket } from '../../hooks/useSocket';

const COVER_COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', '#6366f1', '#0d9488',
];

const STATUS_BADGE = {
  started: { label: 'Started', cls: 'bg-blue-500/10 text-blue-400' },
  completed: { label: 'Done', cls: 'bg-emerald-500/10 text-emerald-400' },
};

export default function CardModal({ boardId }) {
  const { activeCardId, closeCard, addToast } = useUIStore();
  const { board, cards, updateCard } = useBoardStore();
  const card = cards[activeCardId];

  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [description, setDescription] = useState('');
  const [editingDesc, setEditingDesc] = useState(false);
  const [newCheckItem, setNewCheckItem] = useState('');
  const [saving, setSaving] = useState(false);
  const [showChecklist, setShowChecklist] = useState(false);

  useEffect(() => {
    if (!activeCardId) return;
    setLoading(true);
    setShowChecklist(false);
    cardService.getCard(activeCardId)
      .then(({ data }) => {
        setDetail(data);
        setDescription(data.description || '');
        if (data.checklist?.length > 0) setShowChecklist(true);
      })
      .catch(() => addToast({ message: 'Failed to load card', type: 'error' }))
      .finally(() => setLoading(false));
  }, [activeCardId]);

  if (!activeCardId || !card) return null;

  const patch = async (changes) => {
    setSaving(true);
    setDetail(prev => ({ ...prev, ...changes }));
    updateCard(activeCardId, changes);
    try {
      const { data } = await cardService.updateCard(activeCardId, changes);
      setDetail(data);
      getSocket()?.emit('card:update', { boardId, cardId: activeCardId, changes });
    } catch {
      addToast({ message: 'Failed to update card', type: 'error' });
    } finally { setSaving(false); }
  };

  const saveDescription = () => { patch({ description }); setEditingDesc(false); };
  const toggleCheckItem = (idx) => {
    if (!detail) return;
    patch({ checklist: detail.checklist.map((item, i) => i === idx ? { ...item, completed: !item.completed } : item) });
  };
  const deleteCheckItem = (idx) => patch({ checklist: detail.checklist.filter((_, i) => i !== idx) });
  const addCheckItem = (e) => {
    e.preventDefault();
    if (!newCheckItem.trim()) return;
    patch({ checklist: [...(detail?.checklist || []), { text: newCheckItem.trim(), completed: false }] });
    setNewCheckItem('');
  };

  const checkedCount = detail?.checklist?.filter(i => i.completed).length ?? 0;
  const totalCount = detail?.checklist?.length ?? 0;
  const allDone = totalCount > 0 && checkedCount === totalCount;
  const badge = STATUS_BADGE[detail?.status];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 animate-[fadeIn_0.1s_ease-out]"
      onClick={(e) => e.target === e.currentTarget && closeCard()}
    >
      <div className={`bg-[#111114] border border-white/[0.08] rounded-lg shadow-2xl shadow-black/50
        w-full mx-4 flex flex-col overflow-hidden transition-[max-width] duration-200
        ${showChecklist ? 'max-w-[760px]' : 'max-w-[520px]'}`}>

        {/* Cover line */}
        {detail?.coverColor && <div className="h-1" style={{ background: detail.coverColor }} />}

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.06]">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <h2 className="text-[15px] font-semibold text-white truncate">{card.title}</h2>
            {badge && (
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${badge.cls} shrink-0`}>
                {badge.label}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0 ml-3">
            <button
              onClick={() => setShowChecklist(v => !v)}
              className={`flex items-center gap-1.5 px-2 py-1 rounded text-[11px] font-medium transition-colors
                ${showChecklist ? 'bg-white/[0.08] text-white/70' : 'text-white/30 hover:text-white/60 hover:bg-white/[0.04]'}`}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              {totalCount > 0 ? `${checkedCount}/${totalCount}` : 'Checklist'}
            </button>
            <button onClick={closeCard} className="text-white/25 hover:text-white hover:bg-white/[0.06] p-1.5 rounded-lg transition-all duration-200 active:scale-95">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Spinner /></div>
        ) : (
          <div className="flex flex-1 overflow-hidden max-h-[65vh]">

            {/* Left — main content */}
            <div className="flex-1 overflow-y-auto">

              {/* Meta row */}
              <div className="px-5 py-3 border-b border-white/[0.06] flex items-center gap-5 text-[11px]">
                {/* Column */}
                <div className="flex items-center gap-1.5 text-white/30">
                  <span className="text-white/20">Column</span>
                  <span className="font-medium text-white/55">{detail?.column?.title || '—'}</span>
                </div>
                {/* Due */}
                <div className="flex items-center gap-1.5">
                  <span className="text-white/20">Due</span>
                  <input
                    type="date"
                    value={detail?.dueDate ? new Date(detail.dueDate).toISOString().split('T')[0] : ''}
                    onChange={(e) => patch({ dueDate: e.target.value || null })}
                    className="bg-transparent text-[11px] text-white/55 font-medium outline-none cursor-pointer"
                  />
                </div>
              </div>

              {/* Properties */}
              <div className="px-5 py-3 border-b border-white/[0.06] space-y-3">
                {/* Cover */}
                <div className="flex items-center gap-3">
                  <span className="text-[11px] text-white/20 w-16 shrink-0">Cover</span>
                  <div className="flex gap-1.5">
                    {COVER_COLORS.map(c => (
                      <button
                        key={c}
                        onClick={() => patch({ coverColor: detail?.coverColor === c ? null : c })}
                        className={`w-5 h-5 rounded-sm transition-all hover:scale-110 ${detail?.coverColor === c ? 'ring-1.5 ring-white/50 ring-offset-1 ring-offset-[#111114]' : 'opacity-45 hover:opacity-80'}`}
                        style={{ background: c }}
                      />
                    ))}
                  </div>
                </div>
                {/* Assignees */}
                <div className="flex items-center gap-3">
                  <span className="text-[11px] text-white/20 w-16 shrink-0">Assign</span>
                  <div className="flex gap-1">
                    {board?.members?.map(m => {
                      const isAssigned = detail?.assignees?.find(a => a._id === m.user._id);
                      const initial = (m.user.name || m.user.email)?.[0]?.toUpperCase() || '?';
                      return (
                        <button
                          key={m.user._id}
                          onClick={() => {
                            const assignees = detail?.assignees || [];
                            const next = isAssigned
                              ? assignees.filter(a => a._id !== m.user._id)
                              : [...assignees, { _id: m.user._id, name: m.user.name, email: m.user.email }];
                            patch({ assignees: next });
                          }}
                          title={m.user.name || m.user.email}
                          className={`w-6 h-6 rounded flex items-center justify-center text-[9px] font-bold transition-all
                            ${isAssigned ? 'ring-1.5 ring-brand-500 ring-offset-1 ring-offset-[#111114]' : 'opacity-30 hover:opacity-70'}`}
                          style={{ background: `hsl(${(m.user.name?.charCodeAt(0) || 200) * 5 % 360}, 50%, 30%)`, color: '#fff' }}
                        >
                          {initial}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="px-5 py-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] text-white/20 font-medium uppercase tracking-wider">Description</span>
                  {!editingDesc && (
                    <button onClick={() => setEditingDesc(true)} className="px-2 py-1 text-[10px] text-white/40 hover:text-white hover:bg-white/[0.06] rounded-lg transition-all duration-200 active:scale-95">
                      {description ? 'Edit' : 'Add'}
                    </button>
                  )}
                </div>

                {editingDesc ? (
                  <div>
                    <textarea
                      autoFocus rows={3} value={description}
                      onChange={e => setDescription(e.target.value)}
                      className="w-full bg-white/[0.03] border border-white/[0.08] rounded px-3 py-2 text-sm text-white/80
                        outline-none focus:border-brand-500/40 resize-y placeholder-white/15 transition-colors"
                      placeholder="Add description..."
                    />
                    <div className="flex gap-2 mt-2">
                      <button onClick={saveDescription} className="px-3 py-1 bg-brand-600 hover:bg-brand-500 text-white text-[11px] font-medium rounded transition-colors">Save</button>
                      <button onClick={() => { setEditingDesc(false); setDescription(detail?.description || ''); }} className="px-3 py-1.5 text-white/40 hover:text-white hover:bg-white/[0.06] text-[11px] rounded-lg transition-all duration-200">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => setEditingDesc(true)}
                    className={`rounded px-3 py-2 text-sm cursor-pointer transition-colors
                      ${description ? 'text-white/60 leading-relaxed hover:bg-white/[0.03]' : 'text-white/15 italic border border-dashed border-white/[0.06] hover:border-white/[0.10]'}`}
                  >
                    {description || 'No description'}
                  </div>
                )}
              </div>
            </div>

            {/* Right — checklist panel */}
            {showChecklist && (
              <div className="w-64 shrink-0 border-l border-white/[0.06] flex flex-col bg-[#0c0c0f]">

                {/* Header */}
                <div className="px-3.5 py-3 border-b border-white/[0.06]">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-white/20 font-medium uppercase tracking-wider">Checklist</span>
                    {totalCount > 0 && (
                      <span className={`text-[10px] font-mono font-semibold ${allDone ? 'text-emerald-400' : 'text-white/25'}`}>
                        {checkedCount}/{totalCount}
                      </span>
                    )}
                  </div>
                  {totalCount > 0 && (
                    <div className="mt-2 w-full bg-white/[0.04] rounded-sm h-1 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${allDone ? 'bg-emerald-500' : 'bg-brand-500'}`}
                        style={{ width: `${(checkedCount / totalCount) * 100}%` }}
                      />
                    </div>
                  )}
                </div>

                {/* Items */}
                <div className="flex-1 overflow-y-auto py-1">
                  {detail?.checklist?.map((item, idx) => (
                    <div
                      key={idx}
                      onClick={() => toggleCheckItem(idx)}
                      className="group flex items-center gap-2.5 px-3.5 py-2 cursor-pointer hover:bg-white/[0.03] transition-colors"
                    >
                      <div className={`w-3.5 h-3.5 rounded-sm border flex items-center justify-center shrink-0 transition-all
                        ${item.completed
                          ? 'bg-brand-600 border-brand-500 text-white'
                          : 'border-white/15 group-hover:border-white/30'}`}
                      >
                        {item.completed && (
                          <svg className="w-2 h-2" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <span className={`text-[12px] flex-1 transition-colors select-none
                        ${item.completed ? 'line-through text-white/15' : 'text-white/60 group-hover:text-white/80'}`}>
                        {item.text}
                      </span>
                      <button
                        onClick={e => { e.stopPropagation(); deleteCheckItem(idx); }}
                        className="opacity-0 group-hover:opacity-100 text-white/15 hover:text-red-400 transition-all shrink-0"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add form */}
                <form onSubmit={addCheckItem} className="px-3 py-2.5 border-t border-white/[0.06]">
                  <div className="flex gap-1.5">
                    <input
                      type="text" value={newCheckItem}
                      onChange={e => setNewCheckItem(e.target.value)}
                      placeholder="Add item..."
                      className="flex-1 bg-white/[0.03] border border-white/[0.06] rounded px-2.5 py-1.5 text-[12px] text-white
                        placeholder-white/15 outline-none focus:border-white/[0.12] transition-colors"
                    />
                    <button type="submit" disabled={!newCheckItem.trim()}
                      className="group relative flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-all duration-200 text-white/45 hover:text-white hover:bg-white/[0.06] disabled:opacity-30 disabled:cursor-not-allowed">
                      Add
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}

        {saving && (
          <div className="absolute bottom-3 right-3 bg-[#111114] border border-white/[0.08] px-2.5 py-1 rounded text-[10px] text-white/30 shadow-lg">
            Saving…
          </div>
        )}
      </div>
    </div>
  );
}
