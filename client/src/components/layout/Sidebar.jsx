import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import useAuthStore from '../../store/authSlice';
import { disconnectSocket } from '../../hooks/useSocket';
import * as boardService from '../../services/boardService';
import * as authService from '../../services/authService';

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
  const navigate = useNavigate();
  const { boardId: activeBoardId } = useParams();
  const [collapsed, setCollapsed] = useState(false);
  const [search, setSearch] = useState('');
  const [showNewBoard, setShowNewBoard] = useState(false);
  const [newTitle, setNewTitle] = useState('');

  const toggleFavorite = async (boardId, e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Optimistic UI
    setBoards(prev => prev.map(b => {
      if (b._id === boardId) {
        const isFav = b.stars?.includes(user.userId);
        const newStars = isFav 
          ? b.stars.filter(id => id !== user.userId) 
          : [...(b.stars || []), user.userId];
        return { ...b, stars: newStars };
      }
      return b;
    }));

    // Trigger API
    try {
      await boardService.toggleStar(boardId);
    } catch {
      // Ignore error for simple optimistic UI
    }
  };

  const handleLogout = async () => {
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
      navigate(`/boards/${data._id}`);
    } catch {}
    finally { setCreating(false); }
  };

  const filtered = boards.filter(b => b.title.toLowerCase().includes(search.toLowerCase()));
  const favoriteBoards = filtered.filter(b => b.stars?.includes(user?.userId));
  const allBoards = filtered;

  return (
    <aside
      className={`flex flex-col bg-[#0c0c0f] border-r border-white/[0.06] transition-all duration-300 shrink-0 ${
        collapsed ? 'w-14' : 'w-56'
      }`}
    >
      {/* Logo */}
      <div className={`flex items-center h-12 border-b border-white/[0.06] shrink-0 ${collapsed ? 'justify-center' : 'gap-2.5 px-3.5'}`}>
        {!collapsed ? (
          <>
            <div className="w-7 h-7 rounded-md bg-brand-600 flex items-center justify-center font-bold text-white text-xs shrink-0">
              L
            </div>
            <span className="font-bold text-white text-[14px] tracking-tight">LabCo</span>
            <button
              onClick={() => setCollapsed(true)}
              className="ml-auto text-white/40 hover:text-white hover:bg-white/[0.06] p-1.5 rounded-lg active:scale-95 transition-all duration-200"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" /></svg>
            </button>
          </>
        ) : (
          <button
            onClick={() => setCollapsed(false)}
            className="text-white/40 hover:text-white hover:bg-white/[0.06] w-8 h-8 flex items-center justify-center rounded-lg active:scale-95 transition-all duration-200"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg>
          </button>
        )}
      </div>

      {/* Search */}
      {!collapsed && (
        <div className="px-2.5 pt-2.5 pb-1">
          <div className="flex items-center gap-2 bg-white/[0.03] border border-white/[0.06] rounded-md px-2.5 py-1.5">
            <span className="text-white/25">{ICONS.search}</span>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search..."
              className="bg-transparent text-xs text-white/65 placeholder-white/20 outline-none flex-1 w-full"
            />
          </div>
        </div>
      )}

      {/* Nav content */}
      <div className="flex-1 overflow-y-auto py-1.5 space-y-0.5">

        {/* Favorites section */}
        {!collapsed && favoriteBoards.length > 0 && (
          <div className="px-2.5 pt-2">
            <p className="text-[9px] font-semibold text-white/25 uppercase tracking-[0.12em] mb-1 px-2">Favorites</p>
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
            <p className="text-[9px] font-semibold text-white/25 uppercase tracking-[0.12em] mb-1 px-2">
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
                isFav={board.stars?.includes(user?.userId)}
                onFav={toggleFavorite}
                collapsed={collapsed}
              />
            ))}
          </div>

          {/* New board inline form */}
          {!collapsed && showNewBoard && (
            <form 
              onSubmit={handleCreate} 
              className="mt-2 mx-1 p-2 bg-[#161619] border border-white/[0.08] rounded-lg shadow-xl relative overflow-hidden group"
              style={{ animation: 'slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)' }}
            >
              {/* Subtle hover glow */}
              <div className="absolute inset-0 bg-gradient-to-br from-brand-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
              
              <div className="relative z-10 flex items-center gap-1.5 bg-black/20 border border-white/[0.06] rounded-md px-2 py-1.5 mb-2 focus-within:border-brand-500/40 transition-colors">
                <svg className="w-3 h-3 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                <input
                  autoFocus
                  type="text"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  onKeyDown={e => e.key === 'Escape' && setShowNewBoard(false)}
                  placeholder="Board name..."
                  className="w-full bg-transparent border-none p-0 text-xs text-white placeholder-white/30 outline-none ring-0"
                />
              </div>
              
              <div className="relative z-10 flex gap-1.5">
                <button type="submit" disabled={creating || !newTitle.trim()}
                  className="flex-1 py-1.5 bg-brand-600 hover:bg-brand-500 text-white text-[11px] rounded-md disabled:opacity-50 transition-colors font-medium shadow-[0_2px_10px_rgba(99,102,241,0.2)]">
                  Create
                </button>
                <button type="button" onClick={() => setShowNewBoard(false)}
                  className="flex-1 py-1.5 text-white/40 hover:text-white hover:bg-white/[0.06] text-[11px] rounded-lg transition-all duration-200">
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
            text-white/40 hover:text-white border border-dashed border-white/[0.08] hover:border-white/[0.15] bg-transparent transition-all duration-200
            hover:bg-white/[0.06] active:scale-[0.97]
            ${collapsed ? 'justify-center' : ''}`}
        >
          {ICONS.plus}
          {!collapsed && <span>New Board</span>}
        </button>

        {/* User profile + logout */}
        <div className={`flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/[0.06] transition-all duration-200 group ${collapsed ? 'justify-center' : ''}`}>
          <div className="w-6 h-6 rounded-md bg-brand-600/20 text-brand-400 flex items-center justify-center font-bold text-[10px] uppercase shrink-0 overflow-hidden">
            {user?.avatar ? (
              <img src={user.avatar} alt="User Avatar" className="w-full h-full object-cover" />
            ) : (
              user?.name?.[0] || user?.email?.[0]
            )}
          </div>
          {!collapsed && (
            <>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-medium text-white/75 truncate">{user?.name || 'User'}</p>
                <p className="text-[9px] text-white/25 truncate">{user?.email}</p>
              </div>
              <button onClick={handleLogout} className="text-white/40 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all duration-200 p-1.5 rounded-lg active:scale-95" title="Sign out">
                {ICONS.logout}
              </button>
            </>
          )}
        </div>
      </div>
    </aside>
  );
}

function BoardItem({ board, color, active, isFav, onFav, collapsed }) {
  return (
    <Link
      to={`/boards/${board._id}`}
      title={board.title}
      className={`group relative flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-all duration-200
        ${active ? 'bg-white/[0.08] text-white shadow-sm' : 'text-white/45 hover:text-white/80 hover:bg-white/[0.06]'}
        ${collapsed ? 'justify-center' : ''}`}
    >
      <span className="w-1.5 h-1.5 rounded-sm shrink-0" style={{ background: color }} />
      {!collapsed && (
        <>
          <span className="flex-1 truncate text-[12px] font-medium">{board.title}</span>
          <button
            onClick={(e) => onFav(board._id, e)}
            className={`shrink-0 transition-all ${isFav ? 'text-amber-400 opacity-100' : 'text-white/15 opacity-0 group-hover:opacity-100'}`}
          >
            <svg className="w-3 h-3" fill={isFav ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          </button>
        </>
      )}
    </Link>
  );
}
