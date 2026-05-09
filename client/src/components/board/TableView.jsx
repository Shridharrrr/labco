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
      <div className="flex flex-col items-center justify-center h-full text-white/20 gap-3">
        <svg className="w-10 h-10 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 10h18M3 6h18M3 14h18M3 18h18" />
        </svg>
        <span className="text-sm">No cards match the current filters</span>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto p-6">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-white/[0.06]">
            {['Title', 'Column', 'Labels', 'Due Date', 'Checklist', 'Assignees'].map((h) => (
              <th key={h} className="text-left text-[11px] font-semibold text-white/30 uppercase tracking-wider pb-3 px-3 first:pl-0">
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
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: card.coverColor }} />
                    )}
                    <span className="text-white/85 font-medium group-hover:text-white transition-colors truncate">
                      {card.title}
                    </span>
                  </div>
                  {card.description && (
                    <p className="text-[11px] text-white/30 mt-0.5 truncate pl-4">{card.description}</p>
                  )}
                </td>

                {/* Column */}
                <td className="py-3 px-3">
                  <span className="flex items-center gap-1.5 text-white/50 text-xs">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: card._columnColor }} />
                    {card._columnTitle}
                  </span>
                </td>

                {/* Labels */}
                <td className="py-3 px-3">
                  <div className="flex flex-wrap gap-1">
                    {(card.labels || []).map((lbl, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
                        style={{ background: lbl.color + '20', color: lbl.color }}
                      >
                        {lbl.text || '●'}
                      </span>
                    ))}
                  </div>
                </td>

                {/* Due date */}
                <td className="py-3 px-3">
                  {card.dueDate ? (
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-md ${
                      isDueOverdue ? 'bg-red-500/15 text-red-400' :
                      isDueSoon    ? 'bg-amber-500/15 text-amber-400' :
                                     'text-white/40'
                    }`}>
                      {new Date(card.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  ) : (
                    <span className="text-white/20 text-xs">—</span>
                  )}
                </td>

                {/* Checklist */}
                <td className="py-3 px-3">
                  {card.checklist?.length > 0 ? (
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${(checkedCount / card.checklist.length) * 100}%`,
                            background: checkedCount === card.checklist.length ? '#22c55e' : '#6366f1',
                          }}
                        />
                      </div>
                      <span className={`text-xs ${checkedCount === card.checklist.length ? 'text-emerald-400' : 'text-white/40'}`}>
                        {checkedCount}/{card.checklist.length}
                      </span>
                    </div>
                  ) : (
                    <span className="text-white/20 text-xs">—</span>
                  )}
                </td>

                {/* Assignees */}
                <td className="py-3 px-3">
                  {(card.assignees || []).length > 0 ? (
                    <div className="flex items-center -space-x-1.5">
                      {card.assignees.slice(0, 4).map((a, i) => (
                        <div
                          key={i}
                          title={a.name || a.email}
                          className="w-6 h-6 rounded-full border-2 border-[#111111] flex items-center justify-center text-[10px] font-bold uppercase"
                          style={{ background: `hsl(${(a.name?.charCodeAt(0) || 200) * 5 % 360}, 55%, 38%)`, color: '#fff' }}
                        >
                          {(a.name || a.email)?.[0]}
                        </div>
                      ))}
                      {card.assignees.length > 4 && (
                        <div className="w-6 h-6 rounded-full border-2 border-[#111111] bg-white/10 flex items-center justify-center text-[9px] text-white/50">
                          +{card.assignees.length - 4}
                        </div>
                      )}
                    </div>
                  ) : (
                    <span className="text-white/20 text-xs">—</span>
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
