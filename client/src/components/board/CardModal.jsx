import { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import Spinner from '../ui/Spinner';
import useBoardStore from '../../store/boardSlice';
import useUIStore from '../../store/uiSlice';
import * as cardService from '../../services/cardService';
import { getSocket } from '../../hooks/useSocket';

const LABEL_COLORS = ['#f87171','#fb923c','#facc15','#4ade80','#34d399','#22d3ee','#818cf8','#c084fc','#f472b6'];

export default function CardModal({ boardId }) {
  const { activeCardId, closeCard, addToast } = useUIStore();
  const { cards, updateCard } = useBoardStore();

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
    try {
      const { data } = await cardService.updateCard(activeCardId, changes);
      updateCard(activeCardId, changes);
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
    setDetail({ ...detail, checklist });
    patch({ checklist });
  };

  const addCheckItem = (e) => {
    e.preventDefault();
    if (!newCheckItem.trim()) return;
    const checklist = [...(detail?.checklist || []), { text: newCheckItem.trim(), completed: false }];
    setDetail({ ...detail, checklist });
    patch({ checklist });
    setNewCheckItem('');
  };

  const checkedCount = detail?.checklist?.filter((i) => i.completed).length ?? 0;
  const totalCount = detail?.checklist?.length ?? 0;

  return (
    <Modal onClose={closeCard} title={card.title}>
      {loading ? (
        <div className="flex justify-center py-8"><Spinner /></div>
      ) : (
        <div className="space-y-5 max-h-[65vh] overflow-y-auto pr-1">

          {/* Description */}
          <div>
            <h4 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">Description</h4>
            {editingDesc ? (
              <div>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm
                    text-white outline-none focus:border-brand-500/70 resize-none"
                  placeholder="Add a description..."
                />
                <div className="flex gap-2 mt-2">
                  <button onClick={saveDescription}
                    className="px-3 py-1.5 bg-brand-600 hover:bg-brand-500 text-white text-xs rounded-lg transition-colors">
                    Save
                  </button>
                  <button onClick={() => setEditingDesc(false)}
                    className="px-3 py-1.5 text-white/40 hover:text-white text-xs transition-colors">
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => setEditingDesc(true)}
                className="min-h-[2.5rem] cursor-pointer rounded-xl px-3 py-2 text-sm text-white/60
                  hover:bg-white/5 transition-colors"
              >
                {description || <span className="text-white/25 italic">Click to add description...</span>}
              </div>
            )}
          </div>

          {/* Labels */}
          <div>
            <h4 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">Labels</h4>
            <div className="flex flex-wrap gap-1.5">
              {LABEL_COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => {
                    const labels = detail?.labels || [];
                    const exists = labels.find((l) => l.color === color);
                    const next = exists
                      ? labels.filter((l) => l.color !== color)
                      : [...labels, { text: '', color }];
                    setDetail({ ...detail, labels: next });
                    patch({ labels: next });
                  }}
                  className="w-6 h-6 rounded-full ring-2 transition-all"
                  style={{
                    background: color,
                    ringColor: detail?.labels?.find((l) => l.color === color) ? color : 'transparent',
                    outline: detail?.labels?.find((l) => l.color === color) ? `2px solid ${color}` : '2px solid transparent',
                    outlineOffset: '2px',
                  }}
                />
              ))}
            </div>
          </div>

          {/* Due date */}
          <div>
            <h4 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">Due date</h4>
            <input
              type="date"
              value={detail?.dueDate ? new Date(detail.dueDate).toISOString().split('T')[0] : ''}
              onChange={(e) => patch({ dueDate: e.target.value || null })}
              className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white
                outline-none focus:border-brand-500/70 transition-all"
            />
          </div>

          {/* Checklist */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-semibold text-white/40 uppercase tracking-wider">
                Checklist {totalCount > 0 && `(${checkedCount}/${totalCount})`}
              </h4>
            </div>
            {totalCount > 0 && (
              <div className="w-full bg-white/5 rounded-full h-1.5 mb-3">
                <div
                  className="bg-brand-500 h-1.5 rounded-full transition-all"
                  style={{ width: `${(checkedCount / totalCount) * 100}%` }}
                />
              </div>
            )}
            <div className="space-y-2">
              {detail?.checklist?.map((item, idx) => (
                <label key={idx} className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={item.completed}
                    onChange={() => toggleCheckItem(idx)}
                    className="accent-brand-500 w-4 h-4"
                  />
                  <span className={`text-sm ${item.completed ? 'line-through text-white/30' : 'text-white/80'}`}>
                    {item.text}
                  </span>
                </label>
              ))}
            </div>
            <form onSubmit={addCheckItem} className="flex gap-2 mt-2">
              <input
                type="text"
                value={newCheckItem}
                onChange={(e) => setNewCheckItem(e.target.value)}
                placeholder="Add an item..."
                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm
                  text-white placeholder-white/25 outline-none focus:border-brand-500/70 transition-all"
              />
              <button type="submit"
                className="px-3 py-1.5 bg-white/10 hover:bg-white/15 text-white/70 text-sm rounded-lg transition-colors">
                Add
              </button>
            </form>
          </div>

          {saving && <div className="text-xs text-white/30 text-right">Saving…</div>}
        </div>
      )}
    </Modal>
  );
}
