import useBoardStore from '../../store/boardSlice';
import useUIStore from '../../store/uiSlice';
import { applyFilters } from '../../utils/filterCards';

export default function TableView() {
  const { columns, cards, columnOrder } = useBoardStore();
  const { openCard, filters } = useUIStore();

  const orderedColumns = columnOrder.map((id) => columns[id]).filter(Boolean);

  // Flatten all cards across columns in order, applying filters
  const allCards = orderedColumns.flatMap((col) =>
    applyFilters(
      (col.cards || []).map((id) => cards[id]).filter(Boolean),
      filters
    ).map((card) => ({ ...card, _columnTitle: col.title, _columnColor: col.color || '#6366f1' }))
  );

  if (allCards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-zinc-400 gap-3">
        <svg className="w-10 h-10 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 10h18M3 6h18M3 14h18M3 18h18" />
        </svg>
        <span className="text-sm font-medium">No cards match the current filters</span>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto p-3 sm:p-6">
      <table className="w-full min-w-[560px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-white/[0.08]">
            {['Title', 'Column', 'Due Date', 'Checklist', 'Assignees'].map((h) => (
              <th key={h} className="text-left text-[11px] font-semibold text-zinc-400 uppercase tracking-wider pb-3 px-3 first:pl-0">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {allCards.map((card) => {
            const isDueOverdue = card.dueDate && new Date(card.dueDate) < new Date();
            const isDueSoon = card.dueDate && !isDueOverdue && new Date(card.dueDate) - new Date() < 48 * 60 * 60 * 1000;
            const checkedCount = card.checklist?.filter((i) => i.completed).length ?? 0;

            return (
              <tr
                key={card._id}
                onClick={() => openCard(card._id)}
                className="border-b border-white/[0.04] hover:bg-white/[0.03] cursor-pointer transition-colors group"
              >
                {/* Title */}
                <td className="py-3 px-3 pl-0 max-w-[260px]">
                  <div className="flex items-center gap-2.5">
                    {card.coverColor && (
                      <span className="w-2 h-2 rounded-sm shrink-0" style={{ background: card.coverColor }} />
                    )}
                    <span className="text-zinc-100 font-medium group-hover:text-white transition-colors truncate">
                      {card.title}
                    </span>
                  </div>
                  {card.description && (
                    <p className="text-[11px] text-zinc-400 mt-0.5 truncate pl-4">{card.description}</p>
                  )}
                </td>

                {/* Column */}
                <td className="py-3 px-3">
                  <span className="flex items-center gap-1.5 text-zinc-300 text-xs font-medium">
                    <span className="w-1.5 h-1.5 rounded-sm" style={{ background: card._columnColor }} />
                    {card._columnTitle}
                  </span>
                </td>

                {/* Due date */}
                <td className="py-3 px-3">
                  {card.dueDate ? (
                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded ${
                      isDueOverdue ? 'bg-red-500/12 text-red-400' :
                      isDueSoon    ? 'bg-amber-500/12 text-amber-400' :
                                     'text-zinc-300 bg-white/[0.04]'
                    }`}>
                      {new Date(card.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  ) : (
                    <span className="text-zinc-500 text-xs">—</span>
                  )}
                </td>

                {/* Checklist */}
                <td className="py-3 px-3">
                  {card.checklist?.length > 0 ? (
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1 bg-white/[0.06] rounded overflow-hidden">
                        <div
                          className="h-full rounded transition-all"
                          style={{
                            width: `${(checkedCount / card.checklist.length) * 100}%`,
                            background: checkedCount === card.checklist.length ? '#22c55e' : '#6366f1',
                          }}
                        />
                      </div>
                      <span className={`text-[11px] font-medium ${checkedCount === card.checklist.length ? 'text-emerald-400' : 'text-zinc-400'}`}>
                        {checkedCount}/{card.checklist.length}
                      </span>
                    </div>
                  ) : (
                    <span className="text-zinc-500 text-xs">—</span>
                  )}
                </td>

                {/* Assignees */}
                <td className="py-3 px-3">
                  {(card.assignees || []).length > 0 ? (
                    <div className="flex items-center -space-x-1">
                      {card.assignees.slice(0, 4).map((a, i) => (
                        <div
                          key={i}
                          title={a.name || a.email}
                          className="w-6 h-6 rounded-md border border-[#0c0c0f] flex items-center justify-center text-[9px] font-bold uppercase"
                          style={{ background: `hsl(${(a.name?.charCodeAt(0) || 200) * 5 % 360}, 55%, 32%)`, color: '#fff' }}
                        >
                          {(a.name || a.email)?.[0]}
                        </div>
                      ))}
                      {card.assignees.length > 4 && (
                        <div className="w-6 h-6 rounded-md border border-[#0c0c0f] bg-white/10 flex items-center justify-center text-[8px] text-zinc-300">
                          +{card.assignees.length - 4}
                        </div>
                      )}
                    </div>
                  ) : (
                    <span className="text-zinc-500 text-xs">—</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
