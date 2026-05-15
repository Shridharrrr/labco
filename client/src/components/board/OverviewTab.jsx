import { useState, useEffect } from 'react';
import useBoardStore from '../../store/boardSlice';
import useAuthStore from '../../store/authSlice';
import * as boardService from '../../services/boardService';
import Spinner from '../ui/Spinner';

export default function OverviewTab({ boardId }) {
  const { board, cards, columns } = useBoardStore();
  const { user } = useAuthStore();
  
  const [description, setDescription] = useState(board?.description || '');
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [activities, setActivities] = useState([]);
  const [loadingActivities, setLoadingActivities] = useState(true);

  // Sync internal state if board updates
  useEffect(() => {
    if (board && !isEditingDesc) {
      setDescription(board.description || '');
    }
  }, [board, isEditingDesc]);

  // Load activities
  useEffect(() => {
    boardService.getActivity(boardId, { limit: 10 })
      .then(({ data }) => {
        // Handle both { activities: [] } and [ ] structures
        const list = data.activities || data.activity || (Array.isArray(data) ? data : []);
        setActivities(list);
      })
      .catch(() => {})
      .finally(() => setLoadingActivities(false));
  }, [boardId]);

  const handleSaveDescription = async () => {
    try {
      setIsEditingDesc(false);
      useBoardStore.getState().updateBoardInfo({ description });
      await boardService.updateBoard(boardId, { description });
    } catch {
      // Ignore
    }
  };

  // Compute my tasks
  const myCards = Object.values(cards).filter(
    (c) => !c.isArchived && c.assignees?.some((a) => (a._id || a) === (user?._id || user?.userId))
  ).sort((a, b) => new Date(a.dueDate || '2099') - new Date(b.dueDate || '2099'));

  // Compute progress (cards in 'Done' vs total)
  const doneColumn = columns ? Object.values(columns).find(c => c.title?.toLowerCase().includes('done')) : null;
  const allActiveCards = cards ? Object.values(cards).filter(c => !c.isArchived) : [];
  const totalCardsCount = allActiveCards.length;
  const doneCardsCount = doneColumn ? doneColumn.cards.length : 0;
  const progressPercent = totalCardsCount === 0 ? 0 : Math.round((doneCardsCount / totalCardsCount) * 100);

  return (
    <div className="flex-1 overflow-y-auto p-6 flex justify-center">
      <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column - Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Project Description */}
          <section className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">Project README</h2>
              {!isEditingDesc ? (
                <button
                  onClick={() => setIsEditingDesc(true)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors border border-white/[0.06]"
                >
                  Edit
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={() => { setIsEditingDesc(false); setDescription(board.description || ''); }}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium text-white/50 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveDescription}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-brand-600 hover:bg-brand-500 text-white transition-colors shadow-lg shadow-brand-500/20"
                  >
                    Save
                  </button>
                </div>
              )}
            </div>

            {isEditingDesc ? (
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Write a description, project goals, or helpful links here..."
                className="w-full h-48 bg-black/20 border border-white/10 rounded-xl p-4 text-sm text-white/90 placeholder-white/30 outline-none focus:border-brand-500/50 transition-colors resize-y"
              />
            ) : (
              <div className="min-h-[8rem] text-sm text-white/60 leading-relaxed whitespace-pre-wrap">
                {board?.description ? (
                  board.description
                ) : (
                  <span className="italic opacity-50">No description provided. Click Edit to add one.</span>
                )}
              </div>
            )}
          </section>

          {/* My Tasks */}
          <section className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4">My Pending Tasks</h2>
            {myCards.length === 0 ? (
              <div className="text-center py-6 text-white/30 text-sm border border-dashed border-white/10 rounded-xl">
                You have no tasks assigned.
              </div>
            ) : (
              <div className="space-y-3">
                {myCards.map(card => {
                  const col = columns[card.column];
                  return (
                    <div key={card._id} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/[0.04] hover:bg-white/[0.05] transition-colors cursor-pointer">
                      <div className="flex items-center gap-3">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ background: card.coverColor || '#4b5563' }} />
                        <div>
                          <p className="text-sm font-medium text-white/90">{card.title}</p>
                          <p className="text-[11px] text-white/40 mt-0.5">In {col?.title || 'Unknown Column'}</p>
                        </div>
                      </div>
                      {card.dueDate && (
                        <div className="text-[11px] font-medium px-2 py-1 rounded-md bg-white/5 text-white/50">
                          Due {new Date(card.dueDate).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        {/* Right Column - Sidebar Widgets */}
        <div className="space-y-8">
          
          {/* Progress Widget */}
          <section className="bg-gradient-to-b from-brand-900/20 to-transparent border border-brand-500/20 rounded-2xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
            </div>
            <h2 className="text-[11px] font-bold text-brand-400 uppercase tracking-widest mb-1 relative z-10">Project Progress</h2>
            <div className="flex items-end gap-2 mb-4 relative z-10">
              <span className="text-4xl font-black text-white tracking-tighter">{progressPercent}%</span>
              <span className="text-sm text-white/40 mb-1.5">completed</span>
            </div>
            <div className="w-full bg-black/40 rounded-full h-2.5 relative z-10 overflow-hidden border border-white/5">
              <div className="bg-gradient-to-r from-brand-600 to-brand-400 h-2.5 rounded-full transition-all duration-1000 ease-out" style={{ width: `${progressPercent}%` }} />
            </div>
            <p className="text-xs text-white/40 mt-3 relative z-10">
              {doneCardsCount} of {totalCardsCount} cards in "{doneColumn?.title || 'Done'}"
            </p>
          </section>

          {/* Members Summary */}
          <section className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6">
            <h2 className="text-[11px] font-bold text-white/40 uppercase tracking-widest mb-4">Team Members ({board?.members?.length || 0})</h2>
            <div className="flex flex-wrap gap-2">
              {board?.members?.map((m) => (
                <div
                  key={m.user._id}
                  title={`${m.user.name || m.user.email} (${m.role})`}
                  className="w-8 h-8 rounded-full border-2 border-[#1c1c1c] flex items-center justify-center text-[11px] font-bold uppercase shadow-sm"
                  style={{ background: `hsl(${(m.user.name?.charCodeAt(0) || 200) * 5 % 360}, 60%, 35%)`, color: '#fff' }}
                >
                  {(m.user.name || m.user.email)?.[0]}
                </div>
              ))}
            </div>
          </section>

          {/* Recent Activity */}
          <section className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6">
            <h2 className="text-[11px] font-bold text-white/40 uppercase tracking-widest mb-4">Recent Activity</h2>
            {loadingActivities ? (
              <div className="py-4 flex justify-center"><Spinner size="sm" /></div>
            ) : activities.length === 0 ? (
              <p className="text-xs text-white/30 italic">No recent activity.</p>
            ) : (
              <div className="space-y-4">
                {activities.slice(0, 5).map((act, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center shrink-0 text-white/50 border border-white/10 text-[10px]">
                      {act.user?.name?.[0] || '?'}
                    </div>
                    <div>
                      <p className="text-[12px] text-white/80 leading-snug">
                        <span className="font-semibold text-white mr-1">{act.user?.name}</span>
                        {act.type?.replace('.', ' ') || 'performed an action'}
                      </p>
                      <p className="text-[10px] text-white/30 mt-0.5">
                        {new Date(act.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

        </div>
      </div>
    </div>
  );
}
