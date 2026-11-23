import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams, useLocation } from 'react-router-dom';
import useAuthStore from '../../store/authSlice';
import useBoardStore from '../../store/boardSlice';
import useUIStore from '../../store/uiSlice';
import { disconnectSocket } from '../../hooks/useSocket';
import * as boardService from '../../services/boardService';
import * as authService from '../../services/authService';
import Avatar from '../ui/Avatar';
import Logo from '../ui/Logo';
import CreateBoardModal from '../board/CreateBoardModal';
import ProfileModal from './ProfileModal';

const ICONS = {
  dashboard: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <rect x="3" y="3" width="7" height="7" rx="1.5" strokeWidth="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" strokeWidth="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" strokeWidth="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" strokeWidth="1.5" />
    </svg>
  ),
  boards: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <rect x="3" y="4" width="18" height="16" rx="2" strokeWidth="1.5" />
      <path d="M8 8v8M16 8v5M12 8v10" strokeWidth="1.5" />
    </svg>
  ),
  plus: (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
    </svg>
  ),
  search: (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  ),
  logout: (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  ),
  star: (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" strokeWidth="1.5" />
    </svg>
  ),
  settings: (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="3" strokeWidth="1.5" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" strokeWidth="1.5" />
    </svg>
  ),
  sun: (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="4" strokeWidth="1.5" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" strokeWidth="1.5" />
    </svg>
  ),
  moon: (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" strokeWidth="1.5" />
    </svg>
  ),
  chevronLeft: (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <polyline points="15 18 9 12 15 6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
};

export default function Sidebar({ boards, setBoards, creating, setCreating }) {
  const { user, clearAuth } = useAuthStore();
  const { isMobileSidebarOpen, setMobileSidebarOpen, theme, toggleTheme } = useUIStore();
  const navigate = useNavigate();
  const location = useLocation();
  const { boardId: activeBoardId } = useParams();
  const [collapsed, setCollapsed] = useState(false);
  const [search, setSearch] = useState('');
  const [showNewBoard, setShowNewBoard] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

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
  }, [setBoards]);

  const currentUserId = user?.userId || user?._id || user?.id;

  const toggleFavorite = async (boardId, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!currentUserId) return;

    const targetBoard = boards.find((b) => b._id === boardId);
    const prevStars = targetBoard?.stars || [];
    const isFav = prevStars.some((id) => (id?._id || id)?.toString() === currentUserId.toString());
    const newStars = isFav
      ? prevStars.filter((id) => (id?._id || id)?.toString() !== currentUserId.toString())
      : [...prevStars, currentUserId];

    setBoards((prev) => prev.map((b) => (b._id === boardId ? { ...b, stars: newStars } : b)));

    if (useBoardStore.getState().board?._id === boardId) {
      useBoardStore.getState().updateBoardInfo({ stars: newStars });
    }

    try {
      const { data } = await boardService.toggleStar(boardId);
      if (data?.stars) {
        setBoards((prev) => prev.map((b) => (b._id === boardId ? { ...b, stars: data.stars } : b)));
        if (useBoardStore.getState().board?._id === boardId) {
          useBoardStore.getState().updateBoardInfo({ stars: data.stars });
        }
      }
    } catch {
      setBoards((prev) => prev.map((b) => (b._id === boardId ? { ...b, stars: prevStars } : b)));
    }
  };

  const handleLogout = async () => {
    setMobileSidebarOpen(false);
    await authService.logout().catch(() => {});
    clearAuth();
    disconnectSocket();
    navigate('/login');
  };

  const handleCreateBoard = async ({ title, description, accentColor }) => {
    const { data } = await boardService.createBoard({ title, description, accentColor });
    setBoards((prev) => [...prev, data]);
    setShowNewBoard(false);
    setMobileSidebarOpen(false);
    navigate(`/boards/${data._id}`);
  };

  const filtered = (boards || []).filter((b) =>
    b.title.toLowerCase().includes(search.toLowerCase())
  );
  const favoriteBoards = filtered.filter((b) =>
    b.stars?.some((id) => (id?._id || id)?.toString() === currentUserId?.toString())
  );

  return (
    <>
      {/* Mobile backdrop */}
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-xs z-40 transition-opacity duration-200 md:hidden ${
          isMobileSidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setMobileSidebarOpen(false)}
      />

      <aside
        className={`
          fixed md:relative inset-y-0 left-0 z-50 md:z-auto
          flex flex-col bg-white dark:bg-[#08090d] border-r border-black/[0.07] dark:border-white/[0.07] transition-all duration-300 shrink-0 select-none
          ${isMobileSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'}
          ${collapsed ? 'md:w-16' : 'w-64 md:w-60'}
        `}
      >
        {/* Brand Header (Matches Solaris Reference 1) */}
        <div className={`flex items-center h-14 border-b border-black/[0.06] dark:border-white/[0.06] px-4 shrink-0 ${collapsed ? 'justify-center' : 'justify-between'}`}>
          <Link
            to="/"
            onClick={() => setMobileSidebarOpen(false)}
            className="flex items-center group cursor-pointer"
          >
            <Logo size="sm" showText={!collapsed} />
          </Link>

          {!collapsed && (
            <button
              onClick={() => setCollapsed(true)}
              className="hidden md:flex text-zinc-400 hover:text-black dark:hover:text-white p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              title="Collapse sidebar"
            >
              {ICONS.chevronLeft}
            </button>
          )}

          {collapsed && (
            <button
              onClick={() => setCollapsed(false)}
              className="text-zinc-400 hover:text-black dark:hover:text-white p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              title="Expand sidebar"
            >
              <div className="rotate-180">{ICONS.chevronLeft}</div>
            </button>
          )}
        </div>

        {/* Search input (Solaris style) */}
        {!collapsed && (
          <div className="px-3 pt-3 pb-1">
            <div className="flex items-center gap-2 bg-black/[0.03] dark:bg-white/[0.04] border border-black/[0.06] dark:border-white/[0.07] rounded-lg px-2.5 py-1.5 focus-within:border-black/20 dark:focus-within:border-white/20 transition-colors">
              <span className="text-zinc-400">{ICONS.search}</span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search..."
                className="bg-transparent text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 outline-none flex-1 w-full"
              />
            </div>
          </div>
        )}

        {/* Scrollable Navigation Area */}
        <div className="flex-1 overflow-y-auto px-2.5 py-2 space-y-4">
          
          {/* Main Links */}
          <div className="space-y-0.5">
            <Link
              to="/"
              onClick={() => setMobileSidebarOpen(false)}
              className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-all ${
                location.pathname === '/'
                  ? 'bg-black/5 dark:bg-white/[0.09] text-zinc-950 dark:text-white font-semibold'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white hover:bg-black/[0.03] dark:hover:bg-white/[0.04]'
              } ${collapsed ? 'justify-center' : ''}`}
            >
              <span className="text-zinc-500 dark:text-zinc-400">{ICONS.dashboard}</span>
              {!collapsed && <span>Dashboard</span>}
            </Link>

            <Link
              to="/"
              onClick={() => setMobileSidebarOpen(false)}
              className={`flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition-all text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white hover:bg-black/[0.03] dark:hover:bg-white/[0.04] ${collapsed ? 'justify-center' : ''}`}
            >
              <div className="flex items-center gap-2.5">
                <span className="text-zinc-500 dark:text-zinc-400">{ICONS.boards}</span>
                {!collapsed && <span>Projects</span>}
              </div>
              {!collapsed && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-black/5 dark:bg-white/10 text-zinc-600 dark:text-zinc-400">
                  {boards.length}
                </span>
              )}
            </Link>
          </div>

          {/* Favorites (if any) */}
          {!collapsed && favoriteBoards.length > 0 && (
            <div>
              <p className="px-2.5 text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-1">
                Favorites
              </p>
              <div className="space-y-0.5">
                {favoriteBoards.map((b) => (
                  <BoardLink
                    key={b._id}
                    board={b}
                    active={b._id === activeBoardId}
                    isFav={true}
                    onFav={toggleFavorite}
                    collapsed={false}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Workspaces / Board List */}
          <div>
            {!collapsed && (
              <div className="flex items-center justify-between px-2.5 mb-1.5">
                <p className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                  Workspaces
                </p>
                <button
                  onClick={() => setShowNewBoard((v) => !v)}
                  className="text-zinc-400 hover:text-black dark:hover:text-white p-0.5 rounded hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                  title="Create board"
                >
                  {ICONS.plus}
                </button>
              </div>
            )}

            <div className="space-y-0.5">
              {filtered.map((b) => (
                <BoardLink
                  key={b._id}
                  board={b}
                  active={b._id === activeBoardId}
                  isFav={b.stars?.some((id) => (id?._id || id)?.toString() === currentUserId?.toString())}
                  onFav={toggleFavorite}
                  collapsed={collapsed}
                />
              ))}
            </div>

            {/* Create Board Modal */}
            <CreateBoardModal
              isOpen={showNewBoard}
              onClose={() => setShowNewBoard(false)}
              onCreate={handleCreateBoard}
            />
          </div>

        </div>

        {/* Bottom Section (Matching Solaris Reference 1) */}
        <div className="border-t border-black/[0.06] dark:border-white/[0.06] p-2.5 space-y-2 shrink-0">
          
          {/* Quick Actions (Upgrade + Theme Toggle) */}
          {!collapsed ? (
            <div className="flex items-center gap-1.5">
              <div className="flex-1 px-3 py-1.5 rounded-lg border border-black/[0.07] dark:border-white/[0.08] bg-black/[0.02] dark:bg-white/[0.03] text-center text-[11px] font-medium text-zinc-700 dark:text-zinc-300">
                Pro Workspace
              </div>
              <button
                onClick={toggleTheme}
                className="w-8 h-8 rounded-lg flex items-center justify-center border border-black/[0.07] dark:border-white/[0.08] text-zinc-500 hover:text-black dark:text-zinc-400 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-all"
                title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              >
                {theme === 'dark' ? ICONS.sun : ICONS.moon}
              </button>
            </div>
          ) : (
            <div className="flex justify-center">
              <button
                onClick={toggleTheme}
                className="w-8 h-8 rounded-lg flex items-center justify-center border border-black/[0.07] dark:border-white/[0.08] text-zinc-500 hover:text-black dark:text-zinc-400 dark:hover:text-white"
                title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              >
                {theme === 'dark' ? ICONS.sun : ICONS.moon}
              </button>
            </div>
          )}

          {/* User Profile Card (Solaris format: Avatar, Name, Role, Logout) */}
          <div
            onClick={() => setShowProfile(true)}
            className={`flex items-center gap-2.5 p-1.5 rounded-lg border border-black/[0.05] dark:border-white/[0.06] bg-black/[0.01] dark:bg-white/[0.02] cursor-pointer hover:bg-black/[0.04] dark:hover:bg-white/[0.05] transition-all ${collapsed ? 'justify-center' : ''}`}
            title="Click to view profile & settings"
          >
            <Avatar
              name={user?.name || user?.email}
              src={user?.avatar}
              size="xs"
              className="w-7 h-7 rounded-md shrink-0"
            />
            {!collapsed && (
              <>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-zinc-900 dark:text-white truncate leading-tight">
                    {user?.name || 'User'}
                  </p>
                  <p className="text-[10px] text-zinc-400 dark:text-zinc-500 truncate mt-0.5">
                    Account &amp; Settings
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleLogout();
                  }}
                  className="text-zinc-400 hover:text-rose-500 p-1.5 rounded-md hover:bg-rose-500/10 transition-colors"
                  title="Sign out"
                >
                  {ICONS.logout}
                </button>
              </>
            )}
          </div>

        </div>
      </aside>

      {/* User Profile & Preferences Modal */}
      <ProfileModal
        isOpen={showProfile}
        onClose={() => setShowProfile(false)}
        onLogout={handleLogout}
      />
    </>
  );
}

function BoardLink({ board, active, isFav, onFav, collapsed }) {
  const { setMobileSidebarOpen } = useUIStore();
  return (
    <Link
      to={`/boards/${board._id}`}
      title={board.title}
      onClick={() => setMobileSidebarOpen(false)}
      className={`group flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
        active
          ? 'bg-black/5 dark:bg-white/[0.09] text-zinc-950 dark:text-white font-semibold'
          : 'text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white hover:bg-black/[0.03] dark:hover:bg-white/[0.04]'
      } ${collapsed ? 'justify-center' : ''}`}
    >
      <div className="flex items-center gap-2 min-w-0">
        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
        {!collapsed && <span className="truncate">{board.title}</span>}
      </div>

      {!collapsed && (
        <button
          onClick={(e) => onFav(board._id, e)}
          className={`p-0.5 rounded cursor-pointer transition-opacity ${
            isFav
              ? 'text-amber-400 opacity-100'
              : 'text-zinc-400 opacity-0 group-hover:opacity-100 hover:text-amber-400'
          }`}
        >
          <svg className="w-3 h-3" fill={isFav ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" strokeWidth="1.5" />
          </svg>
        </button>
      )}
    </Link>
  );
}
