import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import * as boardService from '../services/boardService';
import Spinner from '../components/ui/Spinner';
import { notifyBoardCreated } from '../components/layout/AppShell';

const BG_GRADIENTS = [
  'from-indigo-600 to-indigo-800',
  'from-rose-600 to-rose-800',
  'from-cyan-600 to-cyan-800',
  'from-emerald-600 to-emerald-800',
  'from-amber-600 to-amber-800',
  'from-violet-600 to-violet-800',
];

/**
 * Home page — board grid.
 * NOTE: Board list state is now owned by AppShell → Sidebar.
 * This component receives nothing from parent; it has its own local copy
 * to render the grid. Both fetch from the same API so they stay in sync.
 */
export default function Home() {
  const navigate = useNavigate();
  const [boards, setBoards] = useState(null); // null = loading
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  // Fetch on mount
  useEffect(() => {
    boardService.getBoards()
      .then(({ data }) => setBoards(data))
      .catch(() => setBoards([]));
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setCreating(true);
    try {
      const { data } = await boardService.createBoard({ title: newTitle.trim() });
      setBoards(prev => [...(prev || []), data]);
      // Immediately push new board into the sidebar
      notifyBoardCreated(data);
      setNewTitle('');
      setShowCreate(false);
      navigate(`/boards/${data._id}`);
    } catch {}
    finally { setCreating(false); }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#0c0c0f]">
      {/* Page header */}
      <div className="px-8 pt-7 pb-5 border-b border-white/[0.06]">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">My Boards</h1>
            <p className="text-white/35 text-xs mt-1">Pick a board or create a new one</p>
          </div>
          <button
            id="create-board-btn"
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-brand-600 hover:bg-brand-500
              text-white text-xs font-medium rounded-md transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
            New board
          </button>
        </div>
      </div>

      <div className="px-8 py-6">
        {/* Create board inline form */}
        {showCreate && (
          <form onSubmit={handleCreate} className="mb-5 flex gap-3 items-center p-3.5 bg-white/[0.02] border border-white/[0.08] rounded-lg">
            <input
              autoFocus
              type="text"
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              onKeyDown={e => e.key === 'Escape' && setShowCreate(false)}
              placeholder="Board name..."
              className="flex-1 bg-[#111114] border border-white/[0.10] rounded-md px-3.5 py-2 text-sm
                text-white placeholder-white/25 outline-none focus:border-brand-500/60 transition-all"
            />
            <button
              type="submit"
              disabled={creating || !newTitle.trim()}
              className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white text-sm
                font-medium rounded-md transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {creating ? <Spinner size="sm" /> : null}
              Create
            </button>
            <button type="button" onClick={() => setShowCreate(false)}
              className="px-3 py-2 text-white/35 hover:text-white text-sm transition-colors rounded-md hover:bg-white/[0.04]">
              Cancel
            </button>
          </form>
        )}

        {boards === null ? (
          <div className="flex justify-center py-20"><Spinner /></div>
        ) : boards.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-14 h-14 rounded-lg bg-white/[0.04] flex items-center justify-center mx-auto mb-4 border border-white/[0.06]">
              <svg className="w-7 h-7 text-white/15" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" /></svg>
            </div>
            <p className="text-white/35 text-sm">No boards yet. Create your first one!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
            {boards.map((board, i) => (
              <Link
                key={board._id}
                to={`/boards/${board._id}`}
                className={`group relative h-36 rounded-lg bg-gradient-to-br ${BG_GRADIENTS[i % BG_GRADIENTS.length]}
                  p-4 flex flex-col justify-end overflow-hidden hover:scale-[1.02] active:scale-[0.99]
                  transition-transform shadow-md cursor-pointer`}
              >
                <div className="absolute inset-0 bg-black/25 group-hover:bg-black/15 transition-colors" />
                {/* Decorative geometric shapes */}
                <div className="absolute -top-6 -right-6 w-20 h-20 rounded-lg bg-white/[0.07] rotate-12" />
                <div className="absolute top-2 -right-2 w-10 h-10 rounded-lg bg-white/[0.05] rotate-12" />
                <div className="relative">
                  <h2 className="font-semibold text-white text-sm leading-snug truncate">{board.title}</h2>
                  {board.description && (
                    <p className="text-white/50 text-[11px] mt-0.5 truncate">{board.description}</p>
                  )}
                  <p className="text-white/35 text-[11px] mt-1.5 font-medium">
                    {board.members?.length} member{board.members?.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </Link>
            ))}

            {/* Create new board card */}
            <button
              onClick={() => setShowCreate(true)}
              className="group h-36 rounded-lg border border-dashed border-white/[0.08] hover:border-brand-500/30
                flex flex-col items-center justify-center gap-2 transition-all hover:bg-brand-500/[0.04] cursor-pointer"
            >
              <div className="w-9 h-9 rounded-lg bg-white/[0.04] group-hover:bg-brand-500/10 flex items-center justify-center transition-colors border border-white/[0.06]">
                <svg className="w-4 h-4 text-white/25 group-hover:text-brand-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
              </div>
              <span className="text-xs text-white/25 group-hover:text-white/50 transition-colors font-medium">New board</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
