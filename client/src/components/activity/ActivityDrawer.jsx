import { useEffect, useState, useCallback } from 'react';
import * as boardService from '../../services/boardService';
import Avatar from '../ui/Avatar';
import Spinner from '../ui/Spinner';

const TYPE_LABELS = {
  'card.created': 'created task',
  'card.moved': 'moved task',
  'card.deleted': 'archived task',
  'card.updated': 'updated task',
  'column.created': 'created column',
  'column.deleted': 'deleted column',
  'column.renamed': 'renamed column',
  'member.added': 'added member',
  'member.removed': 'removed member',
  'board.created': 'created workspace',
};

export default function ActivityDrawer({ boardId, onClose }) {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const load = useCallback(
    async (p = 1) => {
      try {
        setLoading(true);
        const { data } = await boardService.getActivity(boardId, { page: p, limit: 20 });
        setActivities((prev) => (p === 1 ? data.activities : [...prev, ...data.activities]));
        setHasMore(p < data.pagination.pages);
        setPage(p);
      } catch {
        /* ignore */
      } finally {
        setLoading(false);
      }
    },
    [boardId]
  );

  useEffect(() => {
    load(1);
  }, [load]);

  const timeAgo = (date) => {
    const diff = Math.floor((Date.now() - new Date(date)) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <>
      {/* Mobile backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 sm:hidden"
        onClick={onClose}
      />

      <div className="fixed right-0 top-0 bottom-0 w-full sm:w-80 bg-white dark:bg-[#0a0b10] border-l border-black/[0.07] dark:border-white/[0.07] z-50 sm:z-40 flex flex-col shadow-2xl animate-[slideIn_0.15s_ease-out]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-black/[0.06] dark:border-white/[0.06] bg-black/[0.01] dark:bg-white/[0.01]">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-[11px] font-semibold text-zinc-950 dark:text-white uppercase tracking-widest">
              Activity History
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-black dark:hover:text-white p-1 rounded hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
            title="Close"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Feed */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
          {loading && page === 1 ? (
            <div className="flex justify-center py-8">
              <Spinner />
            </div>
          ) : activities.length === 0 ? (
            <div className="text-center py-12 flex flex-col items-center">
              <div className="w-9 h-9 rounded-lg bg-black/5 dark:bg-white/5 flex items-center justify-center mb-2 text-zinc-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">No activity yet</p>
              <p className="text-[11px] text-zinc-400 mt-0.5">Actions taken on this workspace will appear here.</p>
            </div>
          ) : (
            activities.map((act) => (
              <div key={act._id} className="flex gap-2.5 p-2 rounded-lg hover:bg-black/[0.02] dark:hover:bg-white/[0.03] transition-colors">
                <Avatar
                  name={act.user?.name || act.user?.email || '?'}
                  src={act.user?.avatar}
                  size="2xs"
                  className="shrink-0 mt-0.5"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-zinc-800 dark:text-zinc-200 leading-snug">
                    <span className="font-semibold text-zinc-950 dark:text-white">
                      {act.user?.name || act.user?.email?.split('@')[0]}
                    </span>{' '}
                    <span className="text-zinc-500 dark:text-zinc-400">
                      {TYPE_LABELS[act.type] || act.type}
                    </span>
                    {act.payload?.title && (
                      <span className="font-medium text-zinc-900 dark:text-zinc-100"> "{act.payload.title}"</span>
                    )}
                  </p>
                  <p className="text-[10px] text-zinc-400 mt-0.5 font-mono">{timeAgo(act.createdAt)}</p>
                </div>
              </div>
            ))
          )}

          {hasMore && (
            <button
              onClick={() => load(page + 1)}
              disabled={loading}
              className="w-full py-2 text-xs font-medium border border-black/[0.08] dark:border-white/[0.08] hover:bg-black/5 dark:hover:bg-white/5 rounded-md text-zinc-700 dark:text-zinc-300 transition-colors cursor-pointer"
            >
              {loading ? 'Loading...' : 'Load more'}
            </button>
          )}
        </div>
      </div>
    </>
  );
}
