import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import useUIStore from '../../store/uiSlice';
import useBoardStore from '../../store/boardSlice';
import ContextMenu from '../ui/ContextMenu';
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
  const hasLabels = card.labels?.length > 0;
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

  const menuItems = [
    {
      label: 'Open card',
      icon: <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>,
      onClick: () => openCard(card._id),
    },
    'divider',
    {
      label: 'Archive card',
      icon: <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>,
      onClick: handleArchive,
      danger: true,
    },
  ];

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group relative"
    >
      {/* Card body — drag listeners only on body, not on context menu */}
      <div
        {...attributes}
        {...listeners}
        onClick={() => openCard(card._id)}
        className="bg-[#1c1c1c] border border-white/[0.06] rounded-2xl p-3.5 cursor-pointer
          hover:border-white/[0.12] hover:bg-[#212121] transition-all duration-200
          shadow-sm hover:shadow-lg animate-[fadeIn_0.2s_ease-out]"
      >
        {/* Cover color bar */}
        {card.coverColor && (
          <div className="w-full h-2 rounded-full mb-3" style={{ background: card.coverColor }} />
        )}

        {/* Labels */}
        {hasLabels && (
          <div className="flex flex-wrap gap-1.5 mb-2.5">
            {card.labels.map((lbl, i) => (
              <span
                key={i}
                className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wide"
                style={{ background: lbl.color + '20', color: lbl.color }}
              >
                {lbl.text || '●'}
              </span>
            ))}
          </div>
        )}

        {/* Title */}
        <p className="text-[13px] text-white/90 font-medium leading-snug">{card.title}</p>

        {/* Description snippet */}
        {card.description && (
          <p className="text-[11px] text-white/35 mt-1.5 leading-relaxed line-clamp-2">
            {card.description}
          </p>
        )}

        {/* Footer row */}
        {(hasDue || hasChecklist || assignees.length > 0 || attachmentCount > 0 || commentCount > 0) && (
          <div className="flex items-center gap-2 mt-3 text-[11px] text-white/35">

            {/* Due date */}
            {hasDue && (
              <span className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md font-medium ${
                isDueOverdue ? 'bg-red-500/15 text-red-400' :
                isDueSoon ? 'bg-amber-500/15 text-amber-400' :
                'text-white/35'
              }`}>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                {new Date(card.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
            )}

            {/* Checklist progress */}
            {hasChecklist && (
              <span className={`flex items-center gap-1 ${checkedCount === card.checklist.length ? 'text-emerald-400' : 'text-white/35'}`}>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
                {checkedCount}/{card.checklist.length}
              </span>
            )}

            {/* Attachments */}
            {attachmentCount > 0 && (
              <span className="flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                {attachmentCount}
              </span>
            )}

            {/* Comments */}
            {commentCount > 0 && (
              <span className="flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                {commentCount}
              </span>
            )}

            {/* Assignee avatars */}
            {assignees.length > 0 && (
              <div className="ml-auto flex items-center -space-x-1.5">
                {assignees.slice(0, 3).map((a, i) => (
                  <div
                    key={i}
                    title={a.name || a.email}
                    className="w-5 h-5 rounded-full border border-[#1c1c1c] flex items-center justify-center text-[9px] font-bold uppercase"
                    style={{ background: `hsl(${(a.name?.charCodeAt(0) || 200) * 5 % 360}, 60%, 35%)`, color: '#fff' }}
                  >
                    {(a.name || a.email)?.[0]}
                  </div>
                ))}
                {assignees.length > 3 && (
                  <div className="w-5 h-5 rounded-full border border-[#1c1c1c] bg-white/10 flex items-center justify-center text-[9px] text-white/50">
                    +{assignees.length - 3}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Context menu — floats over card, doesn't trigger drag */}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <ContextMenu items={menuItems}>
          <button
            onClick={e => e.stopPropagation()}
            className="w-6 h-6 flex items-center justify-center rounded-lg bg-[#2a2a2a] hover:bg-white/15 text-white/50 hover:text-white transition-all"
          >
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="5" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="12" cy="19" r="1.5" />
            </svg>
          </button>
        </ContextMenu>
      </div>
    </div>
  );
}
