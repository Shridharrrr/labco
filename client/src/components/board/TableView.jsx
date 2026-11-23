import useBoardStore from '../../store/boardSlice';
import useUIStore from '../../store/uiSlice';
import * as cardService from '../../services/cardService';
import { getSocket } from '../../hooks/useSocket';
import { applyFilters } from '../../utils/filterCards';

export default function TableView() {
  const { board, columns, cards, columnOrder, moveCard } = useBoardStore();
  const { openCard, filters, addToast } = useUIStore();

  const orderedColumns = columnOrder.map((id) => columns[id]).filter(Boolean);

  // Flatten all cards across columns in order, applying filters
  const allCards = orderedColumns.flatMap((col) =>
    applyFilters(
      (col.cards || []).map((id) => cards[id]).filter(Boolean),
      filters
    ).map((card) => ({
      ...card,
      _columnId: col._id,
      _columnTitle: col.title,
      _columnColor: col.color || '#6366f1',
    }))
  );

  const handleColumnChange = async (card, newColId) => {
    if (newColId === card.column) return;
    const fromColId = card.column;
    const boardId = board?._id;

    // Optimistic store update
    moveCard({
      cardId: card._id,
      fromColumnId: fromColId,
      toColumnId: newColId,
      newOrder: 0,
    });

    try {
      await cardService.moveCard(card._id, {
        fromColumnId,
        toColumnId: newColId,
        newOrder: 0,
      });
      const socket = getSocket();
      if (socket) {
        socket.emit('card:move', {
          boardId,
          cardId: card._id,
          fromColumnId: fromColId,
          toColumnId: newColId,
          newOrder: 0,
        });
      }
      addToast({ message: 'Task moved successfully', type: 'success' });
    } catch {
      // Revert on failure
      moveCard({
        cardId: card._id,
        fromColumnId: newColId,
        toColumnId: fromColId,
        newOrder: 0,
      });
      addToast({ message: 'Failed to move task', type: 'error' });
    }
  };

  if (allCards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-zinc-400 gap-3 py-20">
        <div className="w-12 h-12 rounded-xl bg-black/[0.03] dark:bg-white/[0.04] border border-black/[0.06] dark:border-white/[0.06] flex items-center justify-center">
          <svg className="w-6 h-6 text-zinc-400 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 10h18M3 6h18M3 14h18M3 18h18" />
          </svg>
        </div>
        <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">No tasks found</span>
        <p className="text-xs text-zinc-400">Add tasks to columns or adjust your active filters.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto p-4 sm:p-6">
      <div className="border border-black/[0.07] dark:border-white/[0.07] rounded-xl overflow-hidden bg-white dark:bg-[#0c0d12] shadow-xs">
        <table className="w-full min-w-[620px] border-collapse text-left">
          <thead>
            <tr className="border-b border-black/[0.06] dark:border-white/[0.06] bg-black/[0.02] dark:bg-white/[0.02]">
              {['Task Title', 'Status / Column', 'Due Date', 'Subtasks', 'Assignees'].map((h) => (
                <th
                  key={h}
                  className="py-3 px-4 text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-black/[0.04] dark:divide-white/[0.04]">
            {allCards.map((card) => {
              const isDueOverdue = card.dueDate && new Date(card.dueDate) < new Date();
              const isDueSoon =
                card.dueDate &&
                !isDueOverdue &&
                new Date(card.dueDate) - new Date() < 48 * 60 * 60 * 1000;
              const checkedCount = card.checklist?.filter((i) => i.completed).length ?? 0;

              return (
                <tr
                  key={card._id}
                  onClick={() => openCard(card._id)}
                  className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02] cursor-pointer transition-colors group"
                >
                  {/* Title & Description */}
                  <td className="py-3.5 px-4 max-w-[280px]">
                    <div className="flex items-center gap-2.5">
                      {card.coverColor && (
                        <span
                          className="w-2.5 h-2.5 rounded-xs shrink-0"
                          style={{ background: card.coverColor }}
                        />
                      )}
                      <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">
                        {card.title}
                      </span>
                    </div>
                    {card.description && (
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 truncate pl-5">
                        {card.description}
                      </p>
                    )}
                  </td>

                  {/* Column / Status Quick Switcher */}
                  <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                    <select
                      value={card.column}
                      onChange={(e) => handleColumnChange(card, e.target.value)}
                      className="bg-black/[0.03] dark:bg-white/[0.04] border border-black/[0.08] dark:border-white/[0.08] rounded-md px-2.5 py-1 text-xs font-medium text-zinc-800 dark:text-zinc-200 outline-none cursor-pointer hover:border-black/20 dark:hover:border-white/20 transition-colors"
                    >
                      {orderedColumns.map((c) => (
                        <option
                          key={c._id}
                          value={c._id}
                          className="bg-white dark:bg-[#12131b] text-zinc-900 dark:text-zinc-100"
                        >
                          {c.title}
                        </option>
                      ))}
                    </select>
                  </td>

                  {/* Due date */}
                  <td className="py-3.5 px-4">
                    {card.dueDate ? (
                      <span
                        className={`inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-0.5 rounded-full border ${
                          isDueOverdue
                            ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                            : isDueSoon
                            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                            : 'bg-black/[0.03] dark:bg-white/[0.04] text-zinc-600 dark:text-zinc-300 border-black/[0.06] dark:border-white/[0.06]'
                        }`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
                        {new Date(card.dueDate).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    ) : (
                      <span className="text-zinc-400 text-xs">-</span>
                    )}
                  </td>

                  {/* Checklist */}
                  <td className="py-3.5 px-4">
                    {card.checklist?.length > 0 ? (
                      <div className="flex items-center gap-2.5">
                        <div className="w-16 h-1.5 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${(checkedCount / card.checklist.length) * 100}%`,
                              background:
                                checkedCount === card.checklist.length ? '#10b981' : '#6366f1',
                            }}
                          />
                        </div>
                        <span
                          className={`text-[11px] font-mono font-medium ${
                            checkedCount === card.checklist.length
                              ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                              : 'text-zinc-500 dark:text-zinc-400'
                          }`}
                        >
                          {checkedCount}/{card.checklist.length}
                        </span>
                      </div>
                    ) : (
                      <span className="text-zinc-400 text-xs">-</span>
                    )}
                  </td>

                  {/* Assignees */}
                  <td className="py-3.5 px-4">
                    {(card.assignees || []).length > 0 ? (
                      <div className="flex items-center -space-x-1.5">
                        {card.assignees.slice(0, 3).map((a, i) => {
                          const name = typeof a === 'string' ? a : a?.name || a?.email || 'User';
                          return (
                            <div
                              key={i}
                              title={name}
                              className="w-6 h-6 rounded-md border border-white dark:border-[#0c0d12] flex items-center justify-center text-[9px] font-bold uppercase bg-indigo-600 text-white shadow-xs"
                            >
                              {name[0]}
                            </div>
                          );
                        })}
                        {card.assignees.length > 3 && (
                          <div className="w-6 h-6 rounded-md border border-white dark:border-[#0c0d12] bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-[8px] font-bold text-zinc-600 dark:text-zinc-300">
                            +{card.assignees.length - 3}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-zinc-400 text-xs">-</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
