import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import * as boardService from '../services/boardService';
import Spinner from '../components/ui/Spinner';

const BG_GRADIENTS = [
  'from-violet-600 to-indigo-700',
  'from-pink-600 to-rose-700',
  'from-cyan-600 to-blue-700',
  'from-emerald-600 to-teal-700',
  'from-amber-600 to-orange-700',
  'from-purple-600 to-fuchsia-700',
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
      setNewTitle('');
      setShowCreate(false);
      navigate(`/boards/${data._id}`);
    } catch {}
    finally { setCreating(false); }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#111111]">
      {/* Page header */}
      <div className="px-8 pt-8 pb-6 border-b border-white/[0.06]">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">My Boards</h1>
            <p className="text-white/40 text-sm mt-1">Pick a board or create a new one</p>
          </div>
          <button
            id="create-board-btn"
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-500
              text-white text-sm font-medium rounded-xl transition-colors shadow-lg shadow-brand-500/20"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
            New board
          </button>
        </div>
      </div>

      <div className="px-8 py-6">
        {/* Create board inline form */}
        {showCreate && (
          <form onSubmit={handleCreate} className="mb-6 flex gap-3 items-center p-4 bg-white/[0.03] border border-white/[0.06] rounded-2xl">
            <input
              autoFocus
              type="text"
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              onKeyDown={e => e.key === 'Escape' && setShowCreate(false)}
              placeholder="Board name..."
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm
                text-white placeholder-white/30 outline-none focus:border-brand-500/70 transition-all"
            />
            <button
              type="submit"
              disabled={creating || !newTitle.trim()}
              className="px-5 py-2.5 bg-brand-600 hover:bg-brand-500 text-white text-sm
                font-medium rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {creating ? <Spinner size="sm" /> : null}
              Create
            </button>
            <button type="button" onClick={() => setShowCreate(false)}
              className="px-4 py-2.5 text-white/40 hover:text-white text-sm transition-colors rounded-xl hover:bg-white/5">
              Cancel
            </button>
          </form>
        )}

        {boards === null ? (
          <div className="flex justify-center py-20"><Spinner /></div>
        ) : boards.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" /></svg>
            </div>
            <p className="text-white/40 text-sm">No boards yet. Create your first one!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
            {boards.map((board, i) => (
              <Link
                key={board._id}
                to={`/boards/${board._id}`}
                className={`group relative h-40 rounded-2xl bg-gradient-to-br ${BG_GRADIENTS[i % BG_GRADIENTS.length]}
                  p-5 flex flex-col justify-end overflow-hidden hover:scale-[1.02] active:scale-[0.99]
                  transition-transform shadow-lg cursor-pointer`}
              >
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
                {/* Decorative circles */}
                <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full bg-white/10" />
                <div className="absolute -top-1 -right-1 w-14 h-14 rounded-full bg-white/10" />
                <div className="relative">
                  <h2 className="font-bold text-white text-base leading-snug truncate">{board.title}</h2>
                  {board.description && (
                    <p className="text-white/60 text-xs mt-0.5 truncate">{board.description}</p>
                  )}
                  <p className="text-white/40 text-xs mt-1.5">
                    {board.members?.length} member{board.members?.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </Link>
            ))}

            {/* Create new board card */}
            <button
              onClick={() => setShowCreate(true)}
              className="group h-40 rounded-2xl border-2 border-dashed border-white/10 hover:border-brand-500/40
                flex flex-col items-center justify-center gap-2 transition-all hover:bg-brand-500/5 cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-white/5 group-hover:bg-brand-500/10 flex items-center justify-center transition-colors">
                <svg className="w-5 h-5 text-white/30 group-hover:text-brand-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
              </div>
              <span className="text-sm text-white/30 group-hover:text-white/60 transition-colors font-medium">New board</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
