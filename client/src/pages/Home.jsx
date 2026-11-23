import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import * as boardService from '../services/boardService';
import Spinner from '../components/ui/Spinner';
import CreateBoardModal from '../components/board/CreateBoardModal';
import { notifyBoardCreated } from '../components/layout/AppShell';
import useUIStore from '../store/uiSlice';
import useAuthStore from '../store/authSlice';
import Avatar from '../components/ui/Avatar';
import NotificationsModal from '../components/layout/NotificationsModal';

// Clean icons
const Icons = {
  Plus: (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  ),
  Boards: (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M8 7v7M16 7v4M12 7v10" />
    </svg>
  ),
  Star: (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  ),
  StarFilled: (props) => (
    <svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1" {...props}>
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  ),
  Users: (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  Mail: (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  ),
  Bell: (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  ),
  ArrowUpRight: (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <line x1="7" y1="17" x2="17" y2="7" />
      <polyline points="7 7 17 7 17 17" />
    </svg>
  ),
  Search: (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
};

export default function Home() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { toggleMobileSidebar } = useUIStore();
  const [boards, setBoards] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [invitations, setInvitations] = useState([]);
  const [search, setSearch] = useState('');
  const [filterTab, setFilterTab] = useState('all'); // 'all' | 'starred'

  const currentUserId = user?.userId || user?._id || user?.id;

  const fetchData = async () => {
    try {
      const [boardsRes, invitesRes] = await Promise.all([
        boardService.getBoards(),
        boardService.getPendingInvitations(),
      ]);
      setBoards(boardsRes.data || []);
      setInvitations(invitesRes.data || []);
    } catch {
      setBoards([]);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateBoard = async ({ title, description, accentColor }) => {
    const { data } = await boardService.createBoard({
      title,
      description,
      background: accentColor || '#1e1b4b',
    });
    setBoards((prev) => [...(prev || []), data]);
    notifyBoardCreated(data);
    navigate(`/boards/${data._id}`);
  };

  const handleToggleStar = async (boardId, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!currentUserId) return;

    const targetBoard = boards?.find((b) => b._id === boardId);
    const prevStars = targetBoard?.stars || [];
    const isFav = prevStars.some((id) => (id?._id || id)?.toString() === currentUserId.toString());
    const newStars = isFav
      ? prevStars.filter((id) => (id?._id || id)?.toString() !== currentUserId.toString())
      : [...prevStars, currentUserId];

    setBoards((prev) => prev?.map((b) => (b._id === boardId ? { ...b, stars: newStars } : b)));

    try {
      const { data } = await boardService.toggleStar(boardId);
      if (data?.stars) {
        setBoards((prev) => prev?.map((b) => (b._id === boardId ? { ...b, stars: data.stars } : b)));
      }
    } catch {
      setBoards((prev) => prev?.map((b) => (b._id === boardId ? { ...b, stars: prevStars } : b)));
    }
  };

  // Compute metrics with 100% real database data
  const favoriteBoards = useMemo(() => {
    if (!boards || !currentUserId) return [];
    return boards.filter((b) =>
      b.stars?.some((id) => (id?._id || id)?.toString() === currentUserId.toString())
    );
  }, [boards, currentUserId]);

  const uniqueCollaborators = useMemo(() => {
    if (!boards) return 0;
    const ids = new Set();
    boards.forEach((b) => {
      b.members?.forEach((m) => {
        const uid = m.user?._id || m.user || m._id;
        if (uid) ids.add(uid.toString());
      });
    });
    return ids.size || 1;
  }, [boards]);

  // Filtered boards based on search and active tab
  const displayedBoards = useMemo(() => {
    if (!boards) return [];
    let list = boards;
    if (filterTab === 'starred') {
      list = favoriteBoards;
    }
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter(
        (b) =>
          b.title?.toLowerCase().includes(q) ||
          b.description?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [boards, filterTab, search, favoriteBoards]);

  const firstName = user?.name?.trim()?.split(/\s+/)[0] || 'there';

  return (
    <div className="flex-1 overflow-y-auto bg-[#f8f9fb] dark:bg-[#07080b] text-zinc-900 dark:text-zinc-100 transition-colors">
      
      {/* ── Top Bar / Header ────────────────────────────────────────────── */}
      <div className="px-5 sm:px-8 py-5 border-b border-black/[0.06] dark:border-white/[0.06] bg-white/70 dark:bg-[#090a0f]/80 backdrop-blur-md sticky top-0 z-20 transition-colors">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          
          <div className="flex items-center gap-3">
            <button
              onClick={toggleMobileSidebar}
              className="md:hidden p-1.5 text-zinc-500 hover:text-black dark:text-zinc-400 dark:hover:text-white rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              title="Open sidebar"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-950 dark:text-white">
                Welcome back, {firstName}!
              </h1>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Real-time collaborative workspaces and active sprint boards.
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => setShowNotifications(true)}
              className="relative p-2 rounded-lg border border-black/[0.07] dark:border-white/[0.08] text-zinc-600 hover:text-black dark:text-zinc-400 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-all shadow-xs"
              title="Notifications"
            >
              <Icons.Bell className="w-4 h-4" />
              {invitations.length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 shadow-xs animate-pulse" />
              )}
            </button>

            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 text-xs font-semibold hover:opacity-90 transition-all shadow-sm active:scale-98"
            >
              <Icons.Plus className="w-3.5 h-3.5" />
              <span>Add Project</span>
            </button>
          </div>

        </div>
      </div>

      <div className="max-w-7xl mx-auto px-5 sm:px-8 py-6 space-y-6">

        {/* ── Real Metric Cards Row (No fake numbers) ──────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          
          <div className="p-4 rounded-xl border border-black/[0.06] dark:border-white/[0.07] bg-white dark:bg-[#0d0e14] shadow-xs flex items-center gap-3.5 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 flex items-center justify-center">
              <Icons.Boards className="w-5 h-5 stroke-[1.8]" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">Active Workspaces</p>
              <p className="text-2xl font-bold tracking-tight text-zinc-950 dark:text-white mt-0.5">
                {boards ? boards.length : '—'}
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-black/[0.06] dark:border-white/[0.07] bg-white dark:bg-[#0d0e14] shadow-xs flex items-center gap-3.5 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center justify-center">
              <Icons.Star className="w-5 h-5 stroke-[1.8]" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">Starred Boards</p>
              <p className="text-2xl font-bold tracking-tight text-zinc-950 dark:text-white mt-0.5">
                {favoriteBoards.length}
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-black/[0.06] dark:border-white/[0.07] bg-white dark:bg-[#0d0e14] shadow-xs flex items-center gap-3.5 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 text-blue-500 border border-blue-500/20 flex items-center justify-center">
              <Icons.Users className="w-5 h-5 stroke-[1.8]" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">Collaborators</p>
              <p className="text-2xl font-bold tracking-tight text-zinc-950 dark:text-white mt-0.5">
                {uniqueCollaborators}
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-black/[0.06] dark:border-white/[0.07] bg-white dark:bg-[#0d0e14] shadow-xs flex items-center gap-3.5 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center justify-center">
              <Icons.Mail className="w-5 h-5 stroke-[1.8]" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">Pending Invites</p>
              <p className="text-2xl font-bold tracking-tight text-zinc-950 dark:text-white mt-0.5">
                {invitations.length}
              </p>
            </div>
          </div>

        </div>

        {/* ── Search & Filter Controls ─────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
          
          {/* Tabs: All Workspaces vs Starred */}
          <div className="flex items-center bg-black/5 dark:bg-white/5 p-1 rounded-xl border border-black/[0.06] dark:border-white/[0.08] w-fit">
            <button
              onClick={() => setFilterTab('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                filterTab === 'all'
                  ? 'bg-white dark:bg-[#12131b] text-zinc-950 dark:text-white shadow-xs'
                  : 'text-zinc-500 hover:text-black dark:hover:text-white'
              }`}
            >
              All Projects ({boards ? boards.length : 0})
            </button>
            <button
              onClick={() => setFilterTab('starred')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                filterTab === 'starred'
                  ? 'bg-white dark:bg-[#12131b] text-zinc-950 dark:text-white shadow-xs'
                  : 'text-zinc-500 hover:text-black dark:hover:text-white'
              }`}
            >
              <Icons.Star className="w-3.5 h-3.5" />
              <span>Starred ({favoriteBoards.length})</span>
            </button>
          </div>

          {/* Search bar */}
          <div className="relative flex-1 sm:max-w-xs">
            <Icons.Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search projects..."
              className="w-full pl-9 pr-3.5 py-1.5 rounded-xl border border-black/[0.08] dark:border-white/[0.08] bg-white dark:bg-[#0c0d14] text-xs text-zinc-900 dark:text-white placeholder-zinc-400 outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

        </div>

        {/* ── Boards Grid ─────────────────────────────────────────────── */}
        <div>
          {boards === null ? (
            <div className="flex justify-center py-20"><Spinner /></div>
          ) : displayedBoards.length === 0 ? (
            <div className="text-center py-16 px-4 border border-dashed border-black/10 dark:border-white/10 rounded-2xl bg-white dark:bg-[#0c0d14] transition-colors">
              <div className="w-12 h-12 rounded-2xl bg-black/5 dark:bg-white/5 flex items-center justify-center mx-auto mb-3 text-zinc-400">
                <Icons.Boards className="w-6 h-6 stroke-[1.5]" />
              </div>
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-1">
                {search.trim() ? 'No matching projects found' : filterTab === 'starred' ? 'No starred projects yet' : 'No workspaces created yet'}
              </h3>
              <p className="text-xs text-zinc-500 max-w-sm mx-auto mb-4">
                {search.trim()
                  ? 'Try searching with different keywords or clear your search query.'
                  : filterTab === 'starred'
                  ? 'Star any workspace to access it quickly from this tab.'
                  : 'Get started by creating your first project workspace to collaborate in real time.'}
              </p>
              {filterTab !== 'starred' && !search.trim() && (
                <button
                  onClick={() => setShowCreate(true)}
                  className="px-4 py-2 bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 text-xs font-semibold rounded-xl shadow-sm hover:opacity-90 transition-all inline-flex items-center gap-1.5"
                >
                  <Icons.Plus className="w-3.5 h-3.5" />
                  <span>Create Your First Project</span>
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {displayedBoards.map((b) => {
                const isFav = b.stars?.some(
                  (id) => (id?._id || id)?.toString() === currentUserId?.toString()
                );
                return (
                  <Link
                    key={b._id}
                    to={`/boards/${b._id}`}
                    className="group p-5 rounded-2xl border border-black/[0.06] dark:border-white/[0.07] bg-white dark:bg-[#0c0d14] hover:border-black/15 dark:hover:border-white/15 shadow-xs hover:shadow-md transition-all flex flex-col justify-between h-48 cursor-pointer relative overflow-hidden"
                  >
                    {/* Top color indicator accent stripe */}
                    <div
                      className="absolute top-0 left-0 right-0 h-1"
                      style={{ backgroundColor: b.background || '#6366f1' }}
                    />

                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-1.5">
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: b.background || '#6366f1' }}
                          />
                          <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">
                            Active
                          </span>
                        </div>

                        {/* Star Button */}
                        <button
                          type="button"
                          onClick={(e) => handleToggleStar(b._id, e)}
                          className={`p-1 rounded-md transition-colors ${
                            isFav
                              ? 'text-amber-400 hover:text-amber-500'
                              : 'text-zinc-400 hover:text-amber-400 hover:bg-black/5 dark:hover:bg-white/5'
                          }`}
                          title={isFav ? 'Unstar workspace' : 'Star workspace'}
                        >
                          {isFav ? (
                            <Icons.StarFilled className="w-4 h-4" />
                          ) : (
                            <Icons.Star className="w-4 h-4" />
                          )}
                        </button>
                      </div>

                      <h3 className="text-sm font-semibold text-zinc-950 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {b.title}
                      </h3>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 mt-1 leading-relaxed">
                        {b.description || 'Sprint & task collaboration workspace.'}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-black/[0.05] dark:border-white/[0.06] flex items-center justify-between text-xs text-zinc-500">
                      <div className="flex items-center -space-x-1.5">
                        {b.members?.slice(0, 3).map((m, i) => (
                          <div
                            key={i}
                            className="w-5 h-5 rounded-full border border-white dark:border-[#0c0d14] overflow-hidden"
                          >
                            <Avatar name={m.user?.name || m.user?.email || 'Member'} size="xs" />
                          </div>
                        ))}
                        {(b.members?.length || 1) > 3 && (
                          <span className="w-5 h-5 rounded-full bg-zinc-200 dark:bg-zinc-800 text-[9px] font-bold text-zinc-600 dark:text-zinc-300 flex items-center justify-center border border-white dark:border-[#0c0d14]">
                            +{(b.members?.length || 1) - 3}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] text-zinc-400">
                          {b.columns?.length || 0} columns
                        </span>
                        <Icons.ArrowUpRight className="w-3.5 h-3.5 text-zinc-400 group-hover:text-black dark:group-hover:text-white transition-colors" />
                      </div>
                    </div>
                  </Link>
                );
              })}

              {/* Add Board Card */}
              <button
                type="button"
                onClick={() => setShowCreate(true)}
                className="p-5 rounded-2xl border border-dashed border-black/10 dark:border-white/10 hover:border-black/20 dark:hover:border-white/20 bg-black/[0.01] dark:bg-white/[0.01] hover:bg-black/[0.03] dark:hover:bg-white/[0.03] flex flex-col items-center justify-center gap-2.5 h-48 transition-all text-zinc-500 hover:text-black dark:hover:text-white cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-black/5 dark:bg-white/5 flex items-center justify-center">
                  <Icons.Plus className="w-5 h-5 stroke-[1.8]" />
                </div>
                <div className="text-center">
                  <p className="text-xs font-semibold">New Workspace</p>
                  <p className="text-[11px] text-zinc-400 mt-0.5">Create a sprint board</p>
                </div>
              </button>
            </div>
          )}
        </div>

      </div>

      {/* Create Project Modal Popup */}
      <CreateBoardModal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        onCreate={handleCreateBoard}
      />

      {showNotifications && (
        <NotificationsModal
          onClose={() => setShowNotifications(false)}
          invitations={invitations}
          onAccept={(token) => {
            setInvitations((prev) => prev.filter((i) => i.token !== token));
            fetchData();
          }}
        />
      )}

    </div>
  );
}
