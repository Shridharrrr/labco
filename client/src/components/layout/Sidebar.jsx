import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import useAuthStore from '../../store/authSlice';
import useBoardStore from '../../store/boardSlice';
import useUIStore from '../../store/uiSlice';
import { disconnectSocket } from '../../hooks/useSocket';
import * as boardService from '../../services/boardService';
import * as authService from '../../services/authService';
import Avatar from '../ui/Avatar';

const BG_DOTS = [
  '#6366f1', '#ec4899', '#06b6d4', '#10b981', '#f59e0b', '#8b5cf6',
];

const ICONS = {
  boards: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
    </svg>
  ),
  chevron: (
    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
    </svg>
  ),
  plus: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
    </svg>
  ),
  search: (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  ),
  logout: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  ),
  star: (
    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  ),
};

export default function Sidebar({ boards, setBoards, creating, setCreating }) {
  const { user, clearAuth } = useAuthStore();
  const { isMobileSidebarOpen, setMobileSidebarOpen } = useUIStore();
  const navigate = useNavigate();
  const { boardId: activeBoardId } = useParams();
  const [collapsed, setCollapsed] = useState(false);
  const [search, setSearch] = useState('');
  const [showNewBoard, setShowNewBoard] = useState(false);
  const [newTitle, setNewTitle] = useState('');

  // Keep sidebar in sync if board is starred elsewhere
  useEffect(() => {
    const handleBoardStarred = (e) => {
      const { boardId, stars } = e.detail || {};
      if (!boardId) return;
      setBoards((prev) =>
        prev.map((b) => (b._id === boardId ? { ...b, stars: stars || [] } : b))
      );
    };
    window.addEventListener('board:starred', handleBoardStarred);
    return () => window.removeEventListener('board:starred', handleBoardStarred);
  }, []);

  const currentUserId = user?.userId || user?._id || user?.id;

  const toggleFavorite = async (boardId, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!currentUserId) return;
    
    const targetBoard = boards.find(b => b._id === boardId);
    const prevStars = targetBoard?.stars || [];
    const isFav = prevStars.some(id => (id?._id || id)?.toString() === currentUserId.toString());
    const newStars = isFav 
      ? prevStars.filter(id => (id?._id || id)?.toString() !== currentUserId.toString()) 
      : [...prevStars, currentUserId];

    // Optimistic UI in sidebar
    setBoards(prev => prev.map(b => b._id === boardId ? { ...b, stars: newStars } : b));

    // Update active board in BoardStore if open
    if (useBoardStore.getState().board?._id === boardId) {
      useBoardStore.getState().updateBoardInfo({ stars: newStars });
    }

    // Trigger API
    try {
      const { data } = await boardService.toggleStar(boardId);
      if (data?.stars) {
        setBoards(prev => prev.map(b => b._id === boardId ? { ...b, stars: data.stars } : b));
        if (useBoardStore.getState().board?._id === boardId) {
          useBoardStore.getState().updateBoardInfo({ stars: data.stars });
        }
      }
    } catch {
      // Revert on failure
      setBoards(prev => prev.map(b => b._id === boardId ? { ...b, stars: prevStars } : b));
      if (useBoardStore.getState().board?._id === boardId) {
        useBoardStore.getState().updateBoardInfo({ stars: prevStars });
      }
    }
  };

  const handleLogout = async () => {
    setMobileSidebarOpen(false);
    await authService.logout().catch(() => {});
    clearAuth();
    disconnectSocket();
    navigate('/login');
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setCreating(true);
    try {
      const { data } = await boardService.createBoard({ title: newTitle.trim() });
      setBoards(prev => [...prev, data]);
      setNewTitle('');
      setShowNewBoard(false);
      setMobileSidebarOpen(false);
      navigate(`/boards/${data._id}`);
    } catch {}
    finally { setCreating(false); }
  };

  const filtered = boards.filter(b => b.title.toLowerCase().includes(search.toLowerCase()));
  const favoriteBoards = filtered.filter(b => 
    b.stars?.some(id => (id?._id || id)?.toString() === currentUserId?.toString())
  );
  const allBoards = filtered;

  return (
    <>
      {/* Mobile backdrop */}
      <div
        className={`fixed inset-0 bg-black/70 backdrop-blur-xs z-40 transition-opacity duration-200 md:hidden ${
          isMobileSidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setMobileSidebarOpen(false)}
      />

      <aside
        className={`
          fixed md:relative inset-y-0 left-0 z-50 md:z-auto
          flex flex-col bg-[#0c0c0f] border-r border-white/[0.06] transition-all duration-300 shrink-0
          ${isMobileSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'}
          ${collapsed ? 'md:w-14' : 'w-64 md:w-56'}
        `}
      >
        {/* Logo */}
        <div className={`flex items-center h-12 border-b border-zinc-800/80 shrink-0 ${collapsed ? 'justify-center' : 'gap-2.5 px-3.5'}`}>
          {!collapsed ? (
            <>
              <Link
                to="/"
                onClick={() => setMobileSidebarOpen(false)}
                className="flex items-center gap-2.5 group cursor-pointer"
              >
                <div className="w-6 h-6 rounded bg-zinc-100 flex items-center justify-center font-bold text-zinc-950 text-xs shrink-0">
                  <svg className="w-3.5 h-3.5 stroke-[2]" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <path d="M8 7v7M16 7v4M12 7v10" />
                  </svg>
                </div>
                <span className="font-semibold text-zinc-100 text-sm tracking-tight">LabCo</span>
              </Link>
              <button
                onClick={() => setCollapsed(true)}
                className="hidden md:block ml-auto text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/60 p-1.5 rounded-md transition-colors cursor-pointer"
                title="Collapse sidebar"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" /></svg>
              </button>
              <button
                onClick={() => setMobileSidebarOpen(false)}
                className="md:hidden ml-auto text-zinc-400 hover:text-white hover:bg-zinc-800/60 p-1.5 rounded-md transition-colors cursor-pointer"
                title="Close menu"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </>
          ) : (
            <button
              onClick={() => setCollapsed(false)}
              className="text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/60 w-8 h-8 flex items-center justify-center rounded-md transition-colors cursor-pointer"
              title="Expand sidebar"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg>
            </button>
          )}
        </div>

      {/* Search */}
      {!collapsed && (
        <div className="px-2.5 pt-2.5 pb-1">
          <div className="flex items-center gap-2 bg-zinc-900/60 border border-zinc-800 rounded-md px-2.5 py-1.5 focus-within:border-zinc-700 transition-colors">
            <span className="text-zinc-500">{ICONS.search}</span>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search boards..."
              className="bg-transparent text-xs text-zinc-200 placeholder-zinc-500 outline-none flex-1 w-full"
            />
          </div>
        </div>
      )}

      {/* Nav content */}
      <div className="flex-1 overflow-y-auto py-1.5 space-y-0.5">

        {/* Favorites section */}
        {!collapsed && favoriteBoards.length > 0 && (
          <div className="px-2.5 pt-2">
            <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-1 px-2">Favorites</p>
            <div className="space-y-[1px]">
              {favoriteBoards.map((board, i) => (
                <BoardItem
                  key={board._id}
                  board={board}
                  color={BG_DOTS[i % BG_DOTS.length]}
                  active={board._id === activeBoardId}
                  isFav={true}
                  onFav={toggleFavorite}
                  collapsed={false}
                />
              ))}
            </div>
          </div>
        )}

        {/* All boards section */}
        <div className="px-2.5 pt-2">
          {!collapsed && (
            <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-1 px-2">
              All Boards
            </p>
          )}
          <div className="space-y-[1px]">
            {allBoards.map((board, i) => (
              <BoardItem
                key={board._id}
                board={board}
                color={BG_DOTS[i % BG_DOTS.length]}
                active={board._id === activeBoardId}
                isFav={board.stars?.some(id => (id?._id || id)?.toString() === currentUserId?.toString())}
                onFav={toggleFavorite}
                collapsed={collapsed}
              />
            ))}
          </div>

          {/* New board inline form */}
          {!collapsed && showNewBoard && (
            <form 
              onSubmit={handleCreate} 
              className="mt-2 mx-1 p-2 bg-[#161619] border border-white/[0.12] rounded-lg shadow-xl relative overflow-hidden group"
              style={{ animation: 'slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)' }}
            >
              {/* Subtle hover glow */}
              <div className="absolute inset-0 bg-gradient-to-br from-brand-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
              
              <div className="relative z-10 flex items-center gap-1.5 bg-black/20 border border-white/[0.1] rounded-md px-2 py-1.5 mb-2 focus-within:border-brand-500/50 transition-colors">
                <svg className="w-3 h-3 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                <input
                  autoFocus
                  type="text"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  onKeyDown={e => e.key === 'Escape' && setShowNewBoard(false)}
                  placeholder="Board name..."
                  className="w-full bg-transparent border-none p-0 text-xs text-zinc-100 placeholder-zinc-500 outline-none ring-0"
                />
              </div>
              
              <div className="relative z-10 flex gap-1.5">
                <button type="submit" disabled={creating || !newTitle.trim()}
                  className="flex-1 py-1.5 bg-brand-600 hover:bg-brand-500 text-white text-[11px] font-medium rounded-lg transition-all duration-200 disabled:opacity-50">
                  Create
                </button>
                <button type="button" onClick={() => setShowNewBoard(false)}
                  className="flex-1 py-1.5 text-zinc-400 hover:text-white hover:bg-white/[0.06] text-[11px] rounded-lg transition-all duration-200">
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Bottom section */}
      <div className="border-t border-white/[0.06] p-2.5 space-y-1 shrink-0">
        {/* + New Board */}
        <button
          onClick={() => { if (collapsed) { setCollapsed(false); setTimeout(() => setShowNewBoard(true), 300); } else setShowNewBoard(v => !v); }}
          className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-semibold
            text-zinc-300 hover:text-white border border-dashed border-white/[0.12] hover:border-white/[0.25] bg-transparent transition-all duration-200
            hover:bg-white/[0.06] active:scale-[0.97]
            ${collapsed ? 'justify-center' : ''}`}
        >
          {ICONS.plus}
          {!collapsed && <span>New Board</span>}
        </button>

        {/* User profile + logout */}
        <div className={`flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-white/[0.06] transition-all duration-200 group ${collapsed ? 'justify-center' : ''}`}>
          <Avatar
            name={user?.name || user?.email}
            src={user?.avatar}
            size="xs"
            className="w-7 h-7 rounded-md shrink-0"
          />
          {!collapsed && (
            <>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-medium text-zinc-200 truncate">{user?.name || 'User'}</p>
                <p className="text-[10px] text-zinc-400 truncate">{user?.email}</p>
              </div>
              <button onClick={handleLogout} className="text-zinc-400 hover:text-red-400 hover:bg-red-500/10 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all duration-200 p-1.5 rounded-lg active:scale-95" title="Sign out">
                {ICONS.logout}
              </button>
            </>
          )}
        </div>
      </div>
    </aside>
    </>
  );
}

function BoardItem({ board, color, active, isFav, onFav, collapsed }) {
  const { setMobileSidebarOpen } = useUIStore();
  return (
    <Link
      to={`/boards/${board._id}`}
      title={board.title}
      onClick={() => setMobileSidebarOpen(false)}
      className={`group relative flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs transition-colors
        ${active ? 'bg-zinc-800 text-zinc-100 font-medium' : 'text-zinc-300 hover:text-white hover:bg-zinc-800/50'}
        ${collapsed ? 'justify-center' : ''}`}
    >
      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: color }} />
      {!collapsed && (
        <>
          <span className="flex-1 truncate text-xs">{board.title}</span>
          <button
            onClick={(e) => onFav(board._id, e)}
            className={`shrink-0 transition-opacity p-0.5 rounded cursor-pointer ${isFav ? 'text-amber-400 opacity-100' : 'text-zinc-500 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 hover:text-zinc-300'}`}
          >
            <svg className="w-3 h-3" fill={isFav ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </button>
        </>
      )}
    </Link>
  );
}
