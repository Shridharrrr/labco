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
        <div className="absolute top-0 left-0 right-0 h-3 rounded-t-2xl" style={{ background: detail.coverColor }} />
      )}

      {/* Header */}
      <div className={`flex items-start justify-between px-6 pb-5 border-b border-white/[0.06] ${detail?.coverColor ? 'pt-7' : 'pt-6'}`}>
        <div className="pr-4">
          <h2 className="text-xl font-bold text-white leading-tight">{card.title}</h2>
          <p className="text-xs text-white/40 mt-1.5 flex items-center gap-1.5">
            in list <span className="font-semibold text-white/60">{detail?.column?.title || 'Unknown'}</span>
          </p>
        </div>
        <button onClick={closeCard} className="text-white/30 hover:text-white/80 transition-colors p-1 bg-white/[0.04] hover:bg-white/10 rounded-lg shrink-0">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : (
        <div className="px-6 py-6 space-y-8 max-h-[65vh] overflow-y-auto">
          
          {/* Quick Actions (Cover & Due Date) */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-2.5">Due Date</h4>
              <input
                type="date"
                value={detail?.dueDate ? new Date(detail.dueDate).toISOString().split('T')[0] : ''}
                onChange={(e) => patch({ dueDate: e.target.value || null })}
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-white/80 outline-none focus:border-brand-500/70 transition-all cursor-pointer"
              />
            </div>
            <div>
              <h4 className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-2.5">Cover</h4>
              <div className="flex flex-wrap gap-1.5">
                {LABEL_COLORS.slice(0, 6).map((color) => (
                  <button
                    key={color}
                    onClick={() => patch({ coverColor: detail?.coverColor === color ? null : color })}
                    className="w-7 h-7 rounded-lg transition-transform hover:scale-110 flex items-center justify-center"
                    style={{ background: color, opacity: detail?.coverColor === color ? 1 : 0.7 }}
                  >
                    {detail?.coverColor === color && <svg className="w-4 h-4 text-white shadow-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Assignees & Labels */}
          <div className="grid grid-cols-2 gap-4">
            {/* Assignees */}
            <div>
              <h4 className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-2.5">Assignees</h4>
              <div className="flex flex-wrap gap-2">
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
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold transition-all border-2
                        ${isAssigned ? 'border-brand-500 scale-110 shadow-[0_0_10px_rgba(99,102,241,0.5)]' : 'border-transparent opacity-50 hover:opacity-100 hover:scale-105'}`}
                      style={{ background: `hsl(${(m.user.name?.charCodeAt(0) || 200) * 5 % 360}, 60%, 35%)`, color: '#fff' }}
                    >
                      {initial}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Labels */}
            <div>
              <h4 className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-2.5">Labels</h4>
              <div className="flex flex-wrap gap-2">
                {LABEL_COLORS.map((color) => {
                  const isActive = detail?.labels?.find((l) => l.color === color);
                  return (
                    <button
                      key={color}
                      onClick={() => {
                        const labels = detail?.labels || [];
                        const next = isActive
                          ? labels.filter((l) => l.color !== color)
                          : [...labels, { text: '', color }];
                        patch({ labels: next });
                      }}
                      className={`h-7 w-11 rounded-md transition-all flex items-center justify-center border-2
                        ${isActive ? 'border-transparent' : 'border-white/10 opacity-40 hover:opacity-100 hover:border-white/30'}`}
                      style={{ background: isActive ? color : 'transparent' }}
                    >
                      {isActive && <div className="w-1.5 h-1.5 rounded-full bg-white/60" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <div className="flex items-center gap-2 mb-2.5">
              <svg className="w-4 h-4 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h7" /></svg>
              <h4 className="text-[11px] font-bold text-white/70 uppercase tracking-wider">Description</h4>
            </div>
            
            {editingDesc ? (
              <div className="animate-[fadeIn_0.15s_ease-out]">
                <textarea
                  autoFocus
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-white/[0.03] border border-brand-500/50 rounded-xl px-4 py-3 text-sm text-white/90 outline-none focus:bg-white/[0.05] resize-y shadow-inner transition-all"
                  placeholder="Add a more detailed description..."
                />
                <div className="flex gap-2 mt-3">
                  <button onClick={saveDescription} className="px-4 py-1.5 bg-brand-600 hover:bg-brand-500 text-white text-xs font-medium rounded-lg transition-colors">
                    Save
                  </button>
                  <button onClick={() => setEditingDesc(false)} className="px-4 py-1.5 bg-white/[0.05] text-white/60 hover:text-white hover:bg-white/10 text-xs font-medium rounded-lg transition-colors">
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => setEditingDesc(true)}
                className={`min-h-[4rem] rounded-xl px-4 py-3 text-sm transition-colors cursor-pointer border border-transparent
                  ${description ? 'bg-transparent hover:bg-white/[0.03] text-white/80 leading-relaxed' : 'bg-white/[0.03] hover:bg-white/[0.06] text-white/30 italic hover:border-white/10'}`}
              >
                {description || 'Add a more detailed description...'}
              </div>
            )}
          </div>

          {/* Checklist */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
                <h4 className="text-[11px] font-bold text-white/70 uppercase tracking-wider">
                  Checklist
                </h4>
              </div>
              {totalCount > 0 && (
                <span className={`text-xs font-semibold ${checkedCount === totalCount ? 'text-emerald-400' : 'text-white/40'}`}>
                  {Math.round((checkedCount / totalCount) * 100)}%
                </span>
              )}
            </div>

            {totalCount > 0 && (
              <div className="w-full bg-white/5 rounded-full h-1.5 mb-4 overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${checkedCount === totalCount ? 'bg-emerald-500' : 'bg-brand-500'}`}
                  style={{ width: `${(checkedCount / totalCount) * 100}%` }}
                />
              </div>
            )}

            <div className="space-y-1.5 mb-3">
              {detail?.checklist?.map((item, idx) => (
                <label key={idx} className="flex items-start gap-3 p-2 rounded-lg hover:bg-white/[0.03] cursor-pointer transition-colors group">
                  <div className="pt-0.5">
                    <input
                      type="checkbox"
                      checked={item.completed}
                      onChange={() => toggleCheckItem(idx)}
                      className="accent-brand-500 w-4 h-4 rounded border-white/20 cursor-pointer"
                    />
                  </div>
                  <span className={`text-sm leading-tight pt-px transition-colors ${item.completed ? 'line-through text-white/30' : 'text-white/80 group-hover:text-white'}`}>
                    {item.text}
                  </span>
                </label>
              ))}
            </div>

            <form onSubmit={addCheckItem} className="mt-1">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newCheckItem}
                  onChange={(e) => setNewCheckItem(e.target.value)}
                  placeholder="Add an item..."
                  className="flex-1 bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-brand-500/60 focus:bg-white/[0.05] transition-all"
                />
                <button type="submit" disabled={!newCheckItem.trim()}
                  className="px-4 py-2 bg-white/[0.06] hover:bg-white/10 disabled:opacity-50 text-white/80 text-sm font-medium rounded-xl transition-colors">
                  Add
                </button>
              </div>
            </form>
          </div>

          {saving && <div className="fixed bottom-4 right-4 bg-black/80 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-full text-xs text-white/60 shadow-xl animate-[fadeIn_0.2s_ease-out]">Saving…</div>}
        </div>
      )}
    </Modal>
  );
}
