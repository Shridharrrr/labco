import { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import Spinner from '../ui/Spinner';
import useBoardStore from '../../store/boardSlice';
import useUIStore from '../../store/uiSlice';
import * as cardService from '../../services/cardService';
import { getSocket } from '../../hooks/useSocket';

const LABEL_COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#6366f1'];

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

  useEffect(() => {
    if (!activeCardId) return;
    setLoading(true);
    cardService.getCard(activeCardId)
      .then(({ data }) => {
        setDetail(data);
        setDescription(data.description || '');
      })
      .catch(() => addToast({ message: 'Failed to load card', type: 'error' }))
      .finally(() => setLoading(false));
  }, [activeCardId]);

  if (!activeCardId || !card) return null;

  const patch = async (changes) => {
    setSaving(true);
    // Optimistic update locally
    setDetail((prev) => ({ ...prev, ...changes }));
    updateCard(activeCardId, changes);

    try {
      const { data } = await cardService.updateCard(activeCardId, changes);
      setDetail(data);
      getSocket()?.emit('card:update', { boardId, cardId: activeCardId, changes });
    } catch {
      addToast({ message: 'Failed to update card', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const saveDescription = () => {
    patch({ description });
    setEditingDesc(false);
  };

  const toggleCheckItem = (idx) => {
    if (!detail) return;
    const checklist = detail.checklist.map((item, i) =>
      i === idx ? { ...item, completed: !item.completed } : item
    );
    patch({ checklist });
  };

  const addCheckItem = (e) => {
    e.preventDefault();
    if (!newCheckItem.trim()) return;
    const checklist = [...(detail?.checklist || []), { text: newCheckItem.trim(), completed: false }];
    patch({ checklist });
    setNewCheckItem('');
  };

  const checkedCount = detail?.checklist?.filter((i) => i.completed).length ?? 0;
  const totalCount = detail?.checklist?.length ?? 0;

  return (
    <Modal onClose={closeCard}>
      {/* Cover Bar */}
      {detail?.coverColor && (
        <div className="h-1.5 rounded-t-lg" style={{ background: detail.coverColor }} />
      )}

      {/* Header */}
      <div className={`flex items-start justify-between px-5 pb-4 border-b border-white/[0.08] ${detail?.coverColor ? 'pt-5' : 'pt-5'}`}>
        <div className="pr-4 min-w-0">
          <h2 className="text-base font-semibold text-white leading-tight truncate">{card.title}</h2>
          <p className="text-[11px] text-white/35 mt-1 flex items-center gap-1.5">
            in <span className="font-medium text-white/55">{detail?.column?.title || 'Unknown'}</span>
          </p>
        </div>
        <button onClick={closeCard} className="text-white/30 hover:text-white/80 transition-colors p-1.5 hover:bg-white/[0.06] rounded-md shrink-0">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : (
        <div className="px-5 py-5 space-y-6 max-h-[65vh] overflow-y-auto">
          
          {/* Properties Grid */}
          <div className="grid grid-cols-2 gap-3">
            {/* Due Date */}
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-lg p-3">
              <h4 className="text-[10px] font-semibold text-white/35 uppercase tracking-wider mb-2">Due Date</h4>
              <input
                type="date"
                value={detail?.dueDate ? new Date(detail.dueDate).toISOString().split('T')[0] : ''}
                onChange={(e) => patch({ dueDate: e.target.value || null })}
                className="w-full bg-transparent text-sm text-white/80 outline-none cursor-pointer"
              />
            </div>

            {/* Cover */}
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-lg p-3">
              <h4 className="text-[10px] font-semibold text-white/35 uppercase tracking-wider mb-2">Cover</h4>
              <div className="flex flex-wrap gap-1.5">
                {LABEL_COLORS.slice(0, 6).map((color) => (
                  <button
                    key={color}
                    onClick={() => patch({ coverColor: detail?.coverColor === color ? null : color })}
                    className="w-6 h-6 rounded transition-all hover:scale-110 flex items-center justify-center"
                    style={{ background: color, opacity: detail?.coverColor === color ? 1 : 0.55 }}
                  >
                    {detail?.coverColor === color && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Assignees */}
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-lg p-3">
            <h4 className="text-[10px] font-semibold text-white/35 uppercase tracking-wider mb-2">Assignees</h4>
            <div className="flex flex-wrap gap-1.5">
              {board?.members?.map((m) => {
                const isAssigned = detail?.assignees?.find((a) => a._id === m.user._id);
                const initial = (m.user.name || m.user.email)?.[0]?.toUpperCase() || '?';
                return (
                  <button
                    key={m.user._id}
                    onClick={() => {
                      const assignees = detail?.assignees || [];
                      const next = isAssigned
                        ? assignees.filter((a) => a._id !== m.user._id)
                        : [...assignees, { _id: m.user._id, name: m.user.name, email: m.user.email, avatar: m.user.avatar }];
                      patch({ assignees: next });
                    }}
                    title={m.user.name || m.user.email}
                    className={`w-7 h-7 rounded-md flex items-center justify-center text-[10px] font-bold transition-all
                      ${isAssigned ? 'ring-2 ring-brand-500 ring-offset-1 ring-offset-[#111114]' : 'opacity-40 hover:opacity-90'}`}
                    style={{ background: `hsl(${(m.user.name?.charCodeAt(0) || 200) * 5 % 360}, 55%, 32%)`, color: '#fff' }}
                  >
                    {initial}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Description */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-3.5 h-3.5 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h7" /></svg>
              <h4 className="text-[11px] font-semibold text-white/50 uppercase tracking-wider">Description</h4>
            </div>
            
            {editingDesc ? (
              <div className="animate-[fadeIn_0.12s_ease-out]">
                <textarea
                  autoFocus
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-white/[0.03] border border-brand-500/40 rounded-lg px-3.5 py-2.5 text-sm text-white/85 outline-none focus:bg-white/[0.04] resize-y transition-all"
                  placeholder="Add a more detailed description..."
                />
                <div className="flex gap-2 mt-2">
                  <button onClick={saveDescription} className="px-3.5 py-1.5 bg-brand-600 hover:bg-brand-500 text-white text-xs font-medium rounded-md transition-colors">
                    Save
                  </button>
                  <button onClick={() => setEditingDesc(false)} className="px-3.5 py-1.5 bg-white/[0.05] text-white/50 hover:text-white hover:bg-white/10 text-xs font-medium rounded-md transition-colors">
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => setEditingDesc(true)}
                className={`min-h-[3.5rem] rounded-lg px-3.5 py-2.5 text-sm transition-all cursor-pointer border
                  ${description ? 'border-transparent hover:bg-white/[0.03] text-white/75 leading-relaxed' : 'border-dashed border-white/[0.08] hover:border-white/[0.15] bg-white/[0.02] text-white/25 italic'}`}
              >
                {description || 'Add a more detailed description...'}
              </div>
            )}
          </div>

          {/* Checklist */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <svg className="w-3.5 h-3.5 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
                <h4 className="text-[11px] font-semibold text-white/50 uppercase tracking-wider">
                  Checklist
                </h4>
              </div>
              {totalCount > 0 && (
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded ${checkedCount === totalCount ? 'text-emerald-400 bg-emerald-500/10' : 'text-white/35 bg-white/[0.04]'}`}>
                  {checkedCount}/{totalCount}
                </span>
              )}
            </div>

            {totalCount > 0 && (
              <div className="w-full bg-white/[0.06] rounded h-1 mb-3 overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 rounded ${checkedCount === totalCount ? 'bg-emerald-500' : 'bg-brand-500'}`}
                  style={{ width: `${(checkedCount / totalCount) * 100}%` }}
                />
              </div>
            )}

            <div className="space-y-0.5 mb-3">
              {detail?.checklist?.map((item, idx) => (
                <label key={idx} className="flex items-start gap-2.5 py-1.5 px-2 rounded-md hover:bg-white/[0.03] cursor-pointer transition-colors group">
                  <div className="pt-0.5">
                    <input
                      type="checkbox"
                      checked={item.completed}
                      onChange={() => toggleCheckItem(idx)}
                      className="sr-only"
                    />
                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                      item.completed
                        ? 'bg-brand-600 border-brand-500/80 text-white shadow-sm shadow-brand-500/20'
                        : 'border-white/20 group-hover:border-white/35 bg-white/[0.02]'
                    }`}>
                      {item.completed && (
                        <svg className="w-2.5 h-2.5 animate-[fadeIn_0.1s_ease-out]" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </div>
                  <span className={`text-sm leading-snug transition-colors ${item.completed ? 'line-through text-white/25' : 'text-white/75 group-hover:text-white/90'}`}>
                    {item.text}
                  </span>
                </label>
              ))}
            </div>

            <form onSubmit={addCheckItem}>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newCheckItem}
                  onChange={(e) => setNewCheckItem(e.target.value)}
                  placeholder="Add an item..."
                  className="flex-1 bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-1.5 text-sm text-white placeholder-white/25 outline-none focus:border-brand-500/40 transition-all"
                />
                <button type="submit" disabled={!newCheckItem.trim()}
                  className="px-3 py-1.5 bg-white/[0.06] hover:bg-white/10 disabled:opacity-40 text-white/70 text-sm font-medium rounded-lg transition-colors">
                  Add
                </button>
              </div>
            </form>
          </div>

          {saving && <div className="fixed bottom-4 right-4 bg-[#111114] border border-white/[0.10] px-3 py-1.5 rounded-md text-[11px] text-white/50 shadow-xl animate-[fadeIn_0.15s_ease-out]">Saving…</div>}
        </div>
      )}
    </Modal>
  );
}
