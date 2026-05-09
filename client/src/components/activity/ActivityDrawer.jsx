import { useEffect, useState, useCallback } from 'react';
import * as boardService from '../../services/boardService';
import Avatar from '../ui/Avatar';
import Spinner from '../ui/Spinner';

const TYPE_LABELS = {
  'card.created': 'created card',
  'card.moved': 'moved card',
  'card.deleted': 'archived card',
  'card.updated': 'updated card',
  'column.created': 'created column',
  'column.deleted': 'deleted column',
  'column.renamed': 'renamed column',
  'member.added': 'added member',
  'member.removed': 'removed member',
  'board.created': 'created board',
};

export default function ActivityDrawer({ boardId, onClose }) {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const load = useCallback(async (p = 1) => {
    try {
      setLoading(true);
      const { data } = await boardService.getActivity(boardId, { page: p, limit: 20 });
      setActivities((prev) => p === 1 ? data.activities : [...prev, ...data.activities]);
      setHasMore(p < data.pagination.pages);
      setPage(p);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [boardId]);

  useEffect(() => { load(1); }, [load]);

  const timeAgo = (date) => {
    const diff = Math.floor((Date.now() - new Date(date)) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="fixed right-0 top-0 bottom-0 w-80 bg-[#13121f] border-l border-white/10
      z-40 flex flex-col shadow-2xl animate-[slideIn_0.25s_ease-out]">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
        <h3 className="text-sm font-semibold text-white">Activity Log</h3>
        <button
          onClick={onClose}
          className="text-white/40 hover:text-white transition-colors text-lg"
        >
          ✕
        </button>
      </div>

      {/* Feed */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {loading && page === 1 ? (
          <div className="flex justify-center py-8"><Spinner /></div>
        ) : activities.length === 0 ? (
          <p className="text-center text-white/30 text-sm py-8">No activity yet</p>
        ) : (
          activities.map((act) => (
            <div key={act._id} className="flex gap-3 animate-[fadeIn_0.2s_ease-out]">
              <Avatar
                name={act.user?.name || act.user?.email || '?'}
                src={act.user?.avatar}
                size="sm"
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-white/70 leading-snug">
                  <span className="font-medium text-white/90">
                    {act.user?.name || act.user?.email?.split('@')[0]}
                  </span>{' '}
                  {TYPE_LABELS[act.type] || act.type}
                  {act.payload?.title && (
                    <span className="text-brand-400"> "{act.payload.title}"</span>
                  )}
                </p>
                <p className="text-[10px] text-white/30 mt-0.5">{timeAgo(act.createdAt)}</p>
              </div>
            </div>
          ))
        )}

        {hasMore && (
          <button
            onClick={() => load(page + 1)}
            disabled={loading}
            className="w-full py-2 text-xs text-brand-400 hover:text-brand-300 transition-colors"
          >
            {loading ? 'Loading…' : 'Load more'}
          </button>
        )}
      </div>
    </div>
  );
}
