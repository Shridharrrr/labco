import { useEffect, useCallback, useRef, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import useBoardStore from '../store/boardSlice';
import useUIStore from '../store/uiSlice';
import useAuthStore from '../store/authSlice';
import useSocket from '../hooks/useSocket';
import useBoardSync from '../hooks/useBoardSync';
import { getSocket } from '../hooks/useSocket';
import * as boardService from '../services/boardService';
import Board from '../components/board/Board';
import FilterBar from '../components/board/FilterBar';
import TableView from '../components/board/TableView';
import RightPanel from '../components/board/RightPanel';
import OverviewTab from '../components/board/OverviewTab';
import FilesTab from '../components/board/FilesTab';
import TimelineTab from '../components/board/TimelineTab';
import DiscussionTab from '../components/board/DiscussionTab';
import OnlineAvatars from '../components/presence/OnlineAvatars';
import LiveCursor from '../components/presence/LiveCursor';
import ActivityDrawer from '../components/activity/ActivityDrawer';
import MembersModal from '../components/board/MembersModal';
import CardModal from '../components/board/CardModal';
import Spinner from '../components/ui/Spinner';
import { isFiltering } from '../utils/filterCards';

const THROTTLE_MS = 50;
const TABS = ['Discussion', 'Tasks', 'Timeline', 'Files', 'Overview'];

const KanbanIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
  </svg>
);

const TableIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M3 6h18M3 14h18M3 18h18" />
  </svg>
);

export default function BoardPage() {
  const { boardId } = useParams();
  const navigate = useNavigate();
  const { setBoard, clearBoard, board } = useBoardStore();
  const { isActivityOpen, toggleActivity, isRightPanelOpen, toggleRightPanel, isMobileSidebarOpen, toggleMobileSidebar, addToast, filters, clearFilters } = useUIStore();
  const { user } = useAuthStore();
  const socket = useSocket();
  const lastCursor = useRef(0);
  const [isMembersOpen, setIsMembersOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('tasks');
  const [viewMode, setViewMode] = useState('kanban'); // 'kanban' | 'table'
  const [showFilters, setShowFilters] = useState(false);

  useBoardSync(socket, boardId);

  useEffect(() => {
    if (!boardId) return;
    boardService.getBoard(boardId)
      .then(({ data }) => setBoard(data))
      .catch(() => {
        addToast({ message: 'Board not found or access denied', type: 'error' });
        navigate('/');
      });
    return () => { clearBoard(); clearFilters(); };
  }, [boardId]);

  const currentUserId = user?.userId || user?._id || user?.id;
  const isStarred = Boolean(
    board?.stars?.some((id) => (id?._id || id)?.toString() === currentUserId?.toString())
  );

  const handleToggleStar = async () => {
    if (!board || !currentUserId) return;
    const prevStars = board.stars || [];
    const isCurrentlyStarred = prevStars.some(
      (id) => (id?._id || id)?.toString() === currentUserId.toString()
    );
    const newStars = isCurrentlyStarred
      ? prevStars.filter((id) => (id?._id || id)?.toString() !== currentUserId.toString())
      : [...prevStars, currentUserId];

    useBoardStore.getState().updateBoardInfo({ stars: newStars });

    window.dispatchEvent(
      new CustomEvent('board:starred', { detail: { boardId, stars: newStars } })
    );

    try {
      const { data } = await boardService.toggleStar(boardId);
      if (data?.stars) {
        useBoardStore.getState().updateBoardInfo({ stars: data.stars });
        window.dispatchEvent(
          new CustomEvent('board:starred', { detail: { boardId, stars: data.stars } })
        );
      }
    } catch {
      useBoardStore.getState().updateBoardInfo({ stars: prevStars }); // Revert on failure
      window.dispatchEvent(
        new CustomEvent('board:starred', { detail: { boardId, stars: prevStars } })
      );
    }
  };

  const handleMouseMove = useCallback((e) => {
    const now = Date.now();
    if (now - lastCursor.current < THROTTLE_MS) return;
    lastCursor.current = now;
    getSocket()?.emit('cursor:move', { boardId, x: e.clientX, y: e.clientY });
  }, [boardId]);

  if (!board) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#0c0c0f]">
        <Spinner size="lg" />
      </div>
    );
  }

  const filterActive = isFiltering(filters);

  return (
    <div className="flex flex-col flex-1 overflow-hidden bg-[#0c0c0f]" onMouseMove={handleMouseMove}>

      {/* ── Top bar ─────────────────────────────────────────────────── */}
      <header className="shrink-0 border-b border-zinc-800/80 bg-[#09090c]">

        {/* Row 1: breadcrumb + actions */}
        <div className="flex items-center justify-between px-3 sm:px-5 pt-2.5 sm:pt-3 pb-1 gap-2">
          <div className="flex items-center gap-1.5 sm:gap-2 text-xs min-w-0">
            {/* Mobile Sidebar Hamburger */}
            <button
              onClick={toggleMobileSidebar}
              className="md:hidden p-1 -ml-1 text-zinc-400 hover:text-white hover:bg-zinc-800/60 rounded-md transition-colors cursor-pointer shrink-0"
              title="Open sidebar"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <div className="hidden sm:flex items-center gap-1.5 shrink-0 select-none">
              <div className="text-zinc-500 shrink-0">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
              </div>
              <span className="text-zinc-600">/</span>
              <Link to="/" className="text-zinc-400 hover:text-zinc-200 transition-colors">Boards</Link>
              <span className="text-zinc-600">/</span>
            </div>
            <span className="text-zinc-100 font-medium text-xs truncate max-w-[110px] sm:max-w-[200px] md:max-w-xs">{board.title}</span>

            {/* Star Button */}
            <button
              onClick={handleToggleStar}
              title={isStarred ? "Remove from favorites" : "Add to favorites"}
              className={`shrink-0 ml-0.5 sm:ml-1 p-1 rounded-md transition-colors cursor-pointer ${
                isStarred 
                  ? 'text-amber-400 bg-amber-400/10 hover:bg-amber-400/20' 
                  : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/60'
              }`}
            >
              <svg className="w-3.5 h-3.5" fill={isStarred ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            </button>
            <button
              onClick={() => setIsMembersOpen(true)}
              className="shrink-0 ml-0.5 sm:ml-1 flex items-center gap-1 sm:gap-1.5 px-2 py-1 rounded-md text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 transition-colors active:scale-95 cursor-pointer"
              title="Share & Members"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
              <span className="hidden sm:inline">Share</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <OnlineAvatars />

            {/* View switcher */}
            {activeTab === 'tasks' && (
              <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-md p-0.5">
                <button
                  onClick={() => setViewMode('kanban')}
                  title="Kanban view"
                  className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors ${viewMode === 'kanban' ? 'bg-zinc-800 text-zinc-100 shadow-xs' : 'text-zinc-400 hover:text-zinc-200'}`}
                >
                  <KanbanIcon /> <span className="hidden sm:inline">Board</span>
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  title="Table view"
                  className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors ${viewMode === 'table' ? 'bg-zinc-800 text-zinc-100 shadow-xs' : 'text-zinc-400 hover:text-zinc-200'}`}
                >
                  <TableIcon /> <span className="hidden sm:inline">Table</span>
                </button>
              </div>
            )}

            {/* Filter toggle */}
            {activeTab === 'tasks' && (
              <button
                onClick={() => setShowFilters(v => !v)}
                title="Filter tasks"
                className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 text-xs font-medium rounded-md transition-colors border
                  ${showFilters || filterActive
                    ? 'bg-zinc-800 text-zinc-100 border-zinc-700'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'}`}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                <span className="hidden sm:inline">Filter{filterActive ? ' •' : ''}</span>
              </button>
            )}

            {/* Activity */}
            <button
              onClick={toggleActivity}
              title="Activity Log"
              className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 text-xs font-medium rounded-md transition-colors border
                ${isActivityOpen
                  ? 'bg-zinc-800 text-zinc-100 border-zinc-700'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'}`}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <span className="hidden sm:inline">Activity</span>
            </button>

            {/* Chat / Members Panel */}
            <button
              onClick={toggleRightPanel}
              title="Board Chat"
              className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 text-xs font-medium rounded-md transition-colors border
                ${isRightPanelOpen
                  ? 'bg-zinc-800 text-zinc-100 border-zinc-700'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'}`}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span className="hidden sm:inline">Chat</span>
            </button>
          </div>
        </div>

        {/* Row 2: tabs with smooth horizontal scroll on mobile */}
        <div className="flex items-center gap-1 px-3 sm:px-5 pt-1 overflow-x-auto no-scrollbar scroll-smooth">
          {TABS.map((tab) => {
            const key = tab.toLowerCase();
            const isActive = activeTab === key;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(key)}
                className={`px-3 py-1.5 text-xs font-medium border-b-2 transition-colors duration-150 -mb-px cursor-pointer shrink-0 ${
                  isActive
                    ? 'text-zinc-100 border-zinc-100 font-semibold'
                    : 'text-zinc-400 border-transparent hover:text-zinc-200 hover:border-zinc-700'
                }`}
              >
                {tab}
              </button>
            );
          })}
        </div>
      </header>

      {/* ── Filter bar ────────────────────────────────────────────── */}
      {activeTab === 'tasks' && showFilters && <FilterBar />}

      {/* ── Board canvas ─────────────────────────────────────────── */}
      <div className="flex-1 overflow-hidden relative flex flex-col">
        {activeTab === 'tasks' ? (
          viewMode === 'kanban' ? (
            <>
              <Board boardId={boardId} />
              <LiveCursor />
            </>
          ) : (
            <TableView />
          )
        ) : activeTab === 'overview' ? (
          <OverviewTab boardId={boardId} />
        ) : activeTab === 'files' ? (
          <FilesTab />
        ) : activeTab === 'timeline' ? (
          <TimelineTab />
        ) : activeTab === 'discussion' ? (
          <DiscussionTab boardId={boardId} />
        ) : (
          <div className="flex flex-col items-center justify-center flex-1 text-white/15 text-sm gap-3">
            <svg className="w-10 h-10 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{TABS.find(t => t.toLowerCase() === activeTab)} — coming soon</span>
          </div>
        )}
      </div>

      {/* Activity drawer */}
      {isActivityOpen && (
        <ActivityDrawer boardId={boardId} onClose={toggleActivity} />
      )}

      {/* Chat / Members panel */}
      {isRightPanelOpen && (
        <RightPanel boardId={boardId} onClose={toggleRightPanel} />
      )}

      {/* Members modal */}
      {isMembersOpen && (
        <MembersModal boardId={boardId} onClose={() => setIsMembersOpen(false)} />
      )}

      {/* Card detail modal */}
      <CardModal boardId={boardId} />
    </div>
  );
}
