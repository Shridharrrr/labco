import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import useUIStore from '../../store/uiSlice';
import useBoardStore from '../../store/boardSlice';
import * as cardService from '../../services/cardService';
import { getSocket } from '../../hooks/useSocket';

export default function Card({ card, boardId }) {
  const { openCard, addToast } = useUIStore();
  const { deleteCard } = useBoardStore();

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
    opacity: isDragging ? 0.3 : 1,
  };

  const hasChecklist = card.checklist?.length > 0;
  const checkedCount = card.checklist?.filter((i) => i.completed).length ?? 0;
  const hasDue = card.dueDate;
  const assignees = card.assignees || [];
  const attachmentCount = card.attachments?.length ?? 0;
  const commentCount = card.comments?.length ?? 0;

  const isDueOverdue = hasDue && new Date(card.dueDate) < new Date();
  const isDueSoon = hasDue && !isDueOverdue && new Date(card.dueDate) - new Date() < 48 * 60 * 60 * 1000;

  const handleArchive = async (e) => {
    e.stopPropagation();
    try {
      await cardService.archiveCard(card._id);
      deleteCard(card._id);
      getSocket()?.emit('card:delete', { boardId, cardId: card._id, columnId: card.column });
    } catch {
      addToast({ message: 'Failed to archive card', type: 'error' });
    }
  };



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
        className="bg-[#161619] border border-white/[0.08] rounded-lg cursor-pointer overflow-hidden
          hover:border-white/[0.16] hover:bg-[#1a1a1e] transition-all duration-150
          shadow-sm hover:shadow-md animate-[fadeIn_0.15s_ease-out] flex flex-col"
      >
        {/* Cover stripe */}
        {card.coverColor && (
          <div className="w-full h-1.5 shrink-0" style={{ background: card.coverColor }} />
        )}

        <div className="p-3.5 flex flex-col gap-2.5">
          {/* Title */}
          <p className="text-[13px] text-white/90 font-medium leading-snug">{card.title}</p>

          {/* Description snippet */}
          {card.description && (
            <p className="text-[11px] text-white/35 leading-relaxed line-clamp-2">
              {card.description}
            </p>
          )}

          {/* Subtasks inline preview */}
          {hasChecklist && (
            <div className="space-y-1 pt-0.5">
              {card.checklist.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2 select-none"
                >
                  <div className="pt-[2px]">
                    <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-colors ${
                      item.completed
                        ? 'bg-brand-500/20 border-brand-500/30 text-brand-400'
                        : 'border-white/15'
                    }`}>
                      {item.completed && (
                        <svg className="w-2 h-2" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </div>
                  <span className={`text-[11px] leading-tight flex-1 transition-colors ${item.completed ? 'text-white/20 line-through' : 'text-white/45'}`}>
                    {item.text}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Footer row */}
          {(hasDue || hasChecklist || assignees.length > 0 || attachmentCount > 0 || commentCount > 0) && (
            <div className="flex items-center flex-wrap gap-2 mt-0.5 text-[10px] text-white/35 font-medium">

              {/* Due date */}
              {hasDue && (
                <span className={`flex items-center gap-1 px-1.5 py-0.5 rounded ${
                  isDueOverdue ? 'bg-red-500/12 text-red-400' :
                  isDueSoon ? 'bg-amber-500/12 text-amber-400' :
                  'bg-white/[0.04] text-white/45'
                }`}>
                  <svg className="w-3 h-3 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  {new Date(card.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              )}

              {/* Checklist progress */}
              {hasChecklist && (
                <span className={`flex items-center gap-1 ${checkedCount === card.checklist.length ? 'text-emerald-400' : ''}`}>
                  <svg className="w-3 h-3 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
                  {checkedCount}/{card.checklist.length}
                </span>
              )}

              {/* Attachments */}
              {attachmentCount > 0 && (
                <span className="flex items-center gap-1">
                  <svg className="w-3 h-3 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                  {attachmentCount}
                </span>
              )}

              {/* Comments */}
              {commentCount > 0 && (
                <span className="flex items-center gap-1">
                  <svg className="w-3 h-3 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                  {commentCount}
                </span>
              )}

              {/* Assignee avatars */}
              {assignees.length > 0 && (
                <div className="ml-auto flex items-center -space-x-1">
                  {assignees.slice(0, 3).map((a, i) => (
                    <div
                      key={i}
                      title={a.name || a.email}
                      className="w-5 h-5 rounded-md border border-[#161619] flex items-center justify-center text-[8px] font-bold uppercase"
                      style={{ background: `hsl(${(a.name?.charCodeAt(0) || 200) * 5 % 360}, 55%, 32%)`, color: '#fff' }}
                    >
                      {(a.name || a.email)?.[0]}
                    </div>
                  ))}
                  {assignees.length > 3 && (
                    <div className="w-5 h-5 rounded-md border border-[#161619] bg-white/10 flex items-center justify-center text-[8px] text-white/50">
                      +{assignees.length - 3}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
