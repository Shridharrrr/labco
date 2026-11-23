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

const PlusIcon = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);
const BellIcon = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);
const StarIcon = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);
const StarFilledIcon = (p) => (
  <svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1" {...p}>
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);
const SearchIcon = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);
const ArrowIcon = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <line x1="7" y1="17" x2="17" y2="7" /><polyline points="7 7 17 7 17 17" />
  </svg>
);
const MenuIcon = (p) => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" {...p}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);

export default function Home() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { toggleMobileSidebar } = useUIStore();
  const [boards, setBoards] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [invitations, setInvitations] = useState([]);
  const [search, setSearch] = useState('');
  const [filterTab, setFilterTab] = useState('all');

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

  useEffect(() => { fetchData(); }, []);

  const handleCreateBoard = async ({ title, description, accentColor }) => {
    const { data } = await boardService.createBoard({ title, description, background: accentColor || '#1e1b4b' });
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
      if (data?.stars) setBoards((prev) => prev?.map((b) => (b._id === boardId ? { ...b, stars: data.stars } : b)));
    } catch {
      setBoards((prev) => prev?.map((b) => (b._id === boardId ? { ...b, stars: prevStars } : b)));
    }
  };

  const favoriteBoards = useMemo(() => {
    if (!boards || !currentUserId) return [];
    return boards.filter((b) => b.stars?.some((id) => (id?._id || id)?.toString() === currentUserId.toString()));
  }, [boards, currentUserId]);

  const uniqueCollaborators = useMemo(() => {
    if (!boards) return 0;
    const ids = new Set();
    boards.forEach((b) => b.members?.forEach((m) => { const uid = m.user?._id || m.user || m._id; if (uid) ids.add(uid.toString()); }));
    return ids.size || 1;
  }, [boards]);

  const displayedBoards = useMemo(() => {
    if (!boards) return [];
    let list = filterTab === 'starred' ? favoriteBoards : boards;
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter((b) => b.title?.toLowerCase().includes(q) || b.description?.toLowerCase().includes(q));
    }
    return list;
  }, [boards, filterTab, search, favoriteBoards]);

  const firstName = user?.name?.trim()?.split(/\s+/)[0] || 'there';

  // Stat rows - purely textual, no color icons
  const stats = [
    { label: 'Workspaces', value: boards ? boards.length : null },
    { label: 'Starred', value: favoriteBoards.length },
    { label: 'Collaborators', value: uniqueCollaborators },
    { label: 'Invites', value: invitations.length },
  ];

  return (
    <div className="flex-1 overflow-y-auto bg-[#f7f7f8] dark:bg-[#0a0a0c] text-zinc-900 dark:text-zinc-100 transition-colors">

      {/* Header */}
      <div className="px-6 sm:px-10 py-4 border-b border-black/[0.07] dark:border-white/[0.06] bg-white/80 dark:bg-[#0a0a0c]/90 backdrop-blur-md sticky top-0 z-20 transition-colors">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">

          <div className="flex items-center gap-3">
            <button
              onClick={toggleMobileSidebar}
              className="md:hidden p-1.5 text-zinc-500 hover:text-black dark:text-zinc-400 dark:hover:text-white rounded-md transition-colors"
              title="Open sidebar"
            >
              <MenuIcon className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg font-semibold tracking-tight text-zinc-950 dark:text-white">
                Welcome back, {firstName}
              </h1>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-500 mt-px">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowNotifications(true)}
              className="relative p-2 rounded-md text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              title="Notifications"
            >
              <BellIcon className="w-4 h-4" />
              {invitations.length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-zinc-800 dark:bg-white" />
              )}
            </button>
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 text-xs font-medium hover:opacity-90 transition-opacity"
            >
              <PlusIcon className="w-3.5 h-3.5" />
              New project
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 sm:px-10 py-7 space-y-7">

        {/* Stat strip - horizontal, no icons, just numbers */}
        <div className="grid grid-cols-4 divide-x divide-black/[0.07] dark:divide-white/[0.07] border border-black/[0.07] dark:border-white/[0.07] rounded-lg bg-white dark:bg-[#0f0f12] overflow-hidden">
          {stats.map((s) => (
            <div key={s.label} className="px-5 py-4">
              <p className="text-[11px] text-zinc-500 dark:text-zinc-500 uppercase tracking-wide font-medium">{s.label}</p>
              <p className="text-2xl font-semibold text-zinc-950 dark:text-white mt-1 tracking-tight">
                {s.value === null ? <span className="text-zinc-300 dark:text-zinc-700 text-base">...</span> : s.value}
              </p>
            </div>
          ))}
        </div>

        {/* Controls row */}
        <div className="flex items-center justify-between gap-4">

          {/* Underline tabs */}
          <div className="flex items-center gap-5 border-b border-black/[0.07] dark:border-white/[0.07] w-fit">
            {[
              { id: 'all', label: `All (${boards?.length ?? 0})` },
              { id: 'starred', label: `Starred (${favoriteBoards.length})` },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterTab(tab.id)}
                className={`pb-2.5 text-xs font-medium transition-colors border-b-[1.5px] -mb-px ${
                  filterTab === tab.id
                    ? 'border-zinc-950 dark:border-white text-zinc-950 dark:text-white'
                    : 'border-transparent text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative w-56">
            <SearchIcon className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search projects..."
              className="w-full pl-8 pr-3 py-1.5 rounded-md border border-black/[0.09] dark:border-white/[0.08] bg-white dark:bg-[#0f0f12] text-xs text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 outline-none focus:border-zinc-400 dark:focus:border-zinc-500 transition-colors"
            />
          </div>
        </div>

        {/* Board list */}
        <div>
          {boards === null ? (
            <div className="flex justify-center py-20"><Spinner /></div>
          ) : displayedBoards.length === 0 ? (
            <div className="py-16 text-center border border-dashed border-black/10 dark:border-white/[0.07] rounded-lg">
              <p className="text-sm font-medium text-zinc-900 dark:text-white mb-1">
                {search.trim() ? 'No results' : filterTab === 'starred' ? 'No starred projects' : 'No projects yet'}
              </p>
              <p className="text-xs text-zinc-400 mb-5">
                {search.trim()
                  ? 'Try a different search term.'
                  : filterTab === 'starred'
                  ? 'Star a project to find it here quickly.'
                  : 'Create your first project to get started.'}
              </p>
              {filterTab !== 'starred' && !search.trim() && (
                <button
                  onClick={() => setShowCreate(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 text-xs font-medium hover:opacity-90 transition-opacity"
                >
                  <PlusIcon className="w-3.5 h-3.5" />
                  Create project
                </button>
              )}
            </div>
          ) : (
            /* Table-style list */
            <div className="border border-black/[0.07] dark:border-white/[0.07] rounded-lg overflow-hidden bg-white dark:bg-[#0f0f12]">
              {/* Header row */}
              <div className="grid grid-cols-[1fr_140px_100px_48px] gap-4 items-center px-5 py-2.5 border-b border-black/[0.07] dark:border-white/[0.07] text-[10px] font-medium uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                <span>Project</span>
                <span>Members</span>
                <span>Columns</span>
                <span className="text-right">Action</span>
              </div>

              {displayedBoards.map((b, i) => {
                const isFav = b.stars?.some((id) => (id?._id || id)?.toString() === currentUserId?.toString());
                return (
                  <Link
                    key={b._id}
                    to={`/boards/${b._id}`}
                    className={`group grid grid-cols-[1fr_140px_100px_48px] gap-4 items-center px-5 py-3.5 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors ${
                      i !== 0 ? 'border-t border-black/[0.05] dark:border-white/[0.05]' : ''
                    }`}
                  >
                    {/* Title + description */}
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Color dot */}
                      <span
                        className="w-2 h-2 rounded-full shrink-0 opacity-70"
                        style={{ backgroundColor: b.background || '#6366f1' }}
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-zinc-900 dark:text-white truncate group-hover:text-zinc-700 dark:group-hover:text-zinc-200 transition-colors">
                          {b.title}
                        </p>
                        {b.description && (
                          <p className="text-[11px] text-zinc-400 dark:text-zinc-600 truncate mt-px">
                            {b.description}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Members */}
                    <div className="flex items-center -space-x-1.5 min-w-0">
                      {b.members?.slice(0, 4).map((m, idx) => {
                        const memberName = m.user?.name || m.user?.email || 'M';
                        const initial = (memberName[0] || 'M').toUpperCase();
                        return (
                          <div
                            key={idx}
                            title={memberName}
                            className="w-5 h-5 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-white dark:border-[#0f0f12] flex items-center justify-center text-[9px] font-semibold select-none shrink-0"
                          >
                            {m.user?.avatar ? (
                              <img src={m.user.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                            ) : (
                              <span className="leading-none">{initial}</span>
                            )}
                          </div>
                        );
                      })}
                      {(b.members?.length || 0) > 4 && (
                        <span className="w-5 h-5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-[9px] font-semibold text-zinc-500 dark:text-zinc-400 flex items-center justify-center border border-white dark:border-[#0f0f12] shrink-0 leading-none">
                          +{(b.members?.length || 0) - 4}
                        </span>
                      )}
                    </div>

                    {/* Columns count */}
                    <span className="text-xs text-zinc-400 dark:text-zinc-600 tabular-nums">
                      {b.columns?.length || 0} col
                    </span>

                    {/* Star + arrow */}
                    <div className="flex items-center gap-1 justify-end">
                      <button
                        type="button"
                        onClick={(e) => handleToggleStar(b._id, e)}
                        className={`p-1 rounded transition-colors ${
                          isFav
                            ? 'text-zinc-700 dark:text-zinc-300'
                            : 'text-zinc-300 dark:text-zinc-700 hover:text-zinc-500 dark:hover:text-zinc-400'
                        }`}
                        title={isFav ? 'Unstar' : 'Star'}
                      >
                        {isFav ? <StarFilledIcon className="w-3.5 h-3.5" /> : <StarIcon className="w-3.5 h-3.5" />}
                      </button>
                      <ArrowIcon className="w-3.5 h-3.5 text-zinc-300 dark:text-zinc-700 group-hover:text-zinc-500 dark:group-hover:text-zinc-400 transition-colors" />
                    </div>
                  </Link>
                );
              })}

              {/* New project row */}
              <button
                type="button"
                onClick={() => setShowCreate(true)}
                className="w-full grid grid-cols-[1fr_140px_100px_48px] gap-4 items-center px-5 py-3 border-t border-black/[0.05] dark:border-white/[0.05] text-zinc-400 dark:text-zinc-600 hover:text-zinc-600 dark:hover:text-zinc-400 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors text-left"
              >
                <span className="flex items-center gap-2.5 text-xs font-medium">
                  <PlusIcon className="w-3.5 h-3.5" />
                  New project
                </span>
                <span />
                <span />
                <span />
              </button>
            </div>
          )}
        </div>

      </div>

      <CreateBoardModal isOpen={showCreate} onClose={() => setShowCreate(false)} onCreate={handleCreateBoard} />

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
