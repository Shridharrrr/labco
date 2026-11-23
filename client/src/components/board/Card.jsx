import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import useUIStore from '../../store/uiSlice';

export default function Card({ card }) {
  const { openCard } = useUIStore();

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: card._id,
    data: { type: 'card', columnId: card.column },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : 1,
  };

  const hasChecklist = card.checklist?.length > 0;
  const checkedCount = card.checklist?.filter((i) => i.completed).length ?? 0;
  const hasDue = card.dueDate;
  const assignees = card.assignees || [];
  const attachmentCount = card.attachments?.length ?? 0;
  const commentCount = card.comments?.length ?? 0;

  const isDueOverdue = hasDue && new Date(card.dueDate) < new Date();
  const isDueSoon = hasDue && !isDueOverdue && new Date(card.dueDate) - new Date() < 48 * 60 * 60 * 1000;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group relative"
    >
      <div
        {...attributes}
        {...listeners}
        onClick={() => openCard(card._id)}
        className="bg-white dark:bg-[#13141b] border border-black/[0.07] dark:border-white/[0.07] rounded-lg cursor-pointer overflow-hidden
          hover:border-black/20 dark:hover:border-white/20 transition-all
          shadow-xs flex flex-col"
      >
        {/* Cover stripe (thin accent line at top) */}
        {card.coverColor && (
          <div className="w-full h-1 shrink-0 opacity-80" style={{ background: card.coverColor }} />
        )}

        <div className="p-3 flex flex-col gap-2">
          {/* Title */}
          <div className="flex items-start justify-between gap-1.5">
            <p className="text-xs text-zinc-900 dark:text-zinc-100 font-medium leading-snug flex-1">
              {card.title}
            </p>
            <span className="opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-opacity shrink-0 pt-0.5" title="Open task details">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </span>
          </div>

          {/* Description snippet */}
          {card.description && (
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed line-clamp-2 font-normal">
              {card.description}
            </p>
          )}

          {/* Subtasks inline preview */}
          {hasChecklist && (
            <div className="space-y-1 pt-0.5">
              {card.checklist.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 select-none">
                  <div className={`shrink-0 w-3.5 h-3.5 rounded border flex items-center justify-center transition-colors ${
                    item.completed
                      ? 'bg-zinc-900 dark:bg-white border-zinc-900 dark:border-white text-white dark:text-zinc-900'
                      : 'border-black/20 dark:border-white/20'
                  }`}>
                    {item.completed && (
                      <svg className="w-2.5 h-2.5 stroke-[3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <span className={`text-[11px] truncate flex-1 transition-colors ${
                    item.completed ? 'text-zinc-400 dark:text-zinc-600 line-through' : 'text-zinc-700 dark:text-zinc-300'
                  }`}>
                    {item.text}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Footer metadata row */}
          {(hasDue || hasChecklist || assignees.length > 0 || attachmentCount > 0 || commentCount > 0) && (
            <div className="flex items-center flex-wrap gap-2 mt-0.5 text-[10px] text-zinc-400 dark:text-zinc-500 font-medium">
              
              {/* Due date badge */}
              {hasDue && (
                <span className={`flex items-center gap-1 px-1.5 py-0.5 rounded border ${
                  isDueOverdue
                    ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                    : isDueSoon
                    ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                    : 'bg-black/[0.03] dark:bg-white/[0.04] text-zinc-500 dark:text-zinc-400 border-black/[0.06] dark:border-white/[0.06]'
                }`}>
                  <svg className="w-3 h-3 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>{new Date(card.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                </span>
              )}

              {/* Checklist count */}
              {hasChecklist && (
                <span className={`flex items-center gap-1 ${checkedCount === card.checklist.length ? 'text-zinc-800 dark:text-zinc-200' : 'text-zinc-400 dark:text-zinc-500'}`}>
                  <svg className="w-3 h-3 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <span className="tabular-nums">{checkedCount}/{card.checklist.length}</span>
                </span>
              )}

              {/* Attachments */}
              {attachmentCount > 0 && (
                <span className="flex items-center gap-1">
                  <svg className="w-3 h-3 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
                  <span className="tabular-nums">{attachmentCount}</span>
                </span>
              )}

              {/* Comments */}
              {commentCount > 0 && (
                <span className="flex items-center gap-1">
                  <svg className="w-3 h-3 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <span className="tabular-nums">{commentCount}</span>
                </span>
              )}

              {/* Assignee avatars */}
              {assignees.length > 0 && (
                <div className="ml-auto flex items-center -space-x-1">
                  {assignees.slice(0, 3).map((a, i) => {
                    const displayName = typeof a === 'string' ? a : (a?.name || a?.email || 'User');
                    const initial = (displayName[0] || 'U').toUpperCase();
                    return (
                      <div
                        key={i}
                        title={displayName}
                        className="w-4.5 h-4.5 rounded-full border border-white dark:border-[#13141b] flex items-center justify-center text-[8px] font-semibold text-zinc-700 dark:text-zinc-300 bg-zinc-200 dark:bg-zinc-800 shrink-0 leading-none"
                      >
                        {initial}
                      </div>
                    );
                  })}
                </div>
              )}

            </div>
          )}
        </div>
      </div>
    </div>
  );
}
