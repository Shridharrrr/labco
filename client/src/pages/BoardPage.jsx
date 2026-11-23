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
import DiscussionTab from '../components/board/DiscussionTab';
import OnlineAvatars from '../components/presence/OnlineAvatars';
import LiveCursor from '../components/presence/LiveCursor';
import ActivityDrawer from '../components/activity/ActivityDrawer';
import MembersModal from '../components/board/MembersModal';
import BoardSettingsModal from '../components/board/BoardSettingsModal';
import CardModal from '../components/board/CardModal';
import Spinner from '../components/ui/Spinner';
import { isFiltering } from '../utils/filterCards';

const THROTTLE_MS = 50;
const TABS = ['Kanban', 'Table', 'Discussion'];

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
  const { isActivityOpen, toggleActivity, isRightPanelOpen, toggleRightPanel, toggleMobileSidebar, addToast, filters, clearFilters } = useUIStore();
  const { user } = useAuthStore();
  const socket = useSocket();
  const lastCursor = useRef(0);
  const [isMembersOpen, setIsMembersOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('kanban');
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
      useBoardStore.getState().updateBoardInfo({ stars: prevStars });
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
      <div className="flex-1 flex items-center justify-center bg-[#f8f9fb] dark:bg-[#07080b]">
        <Spinner size="lg" />
      </div>
    );
  }

  const filterActive = isFiltering(filters);

  return (
    <div className="flex flex-col flex-1 overflow-hidden bg-[#f8f9fb] dark:bg-[#07080b] text-zinc-900 dark:text-zinc-100 transition-colors" onMouseMove={handleMouseMove}>

      {/* ── Top bar (Solaris aesthetic) ─────────────────────────────────── */}
      <header className="shrink-0 border-b border-black/[0.06] dark:border-white/[0.06] bg-white/70 dark:bg-[#090a0f]/85 backdrop-blur-md">

        {/* Row 1: breadcrumb + actions */}
        <div className="flex items-center justify-between px-4 sm:px-6 pt-3 pb-2 gap-3">
          <div className="flex items-center gap-2 text-xs min-w-0">
            {/* Mobile Sidebar Hamburger */}
            <button
              onClick={toggleMobileSidebar}
              className="md:hidden p-1.5 -ml-1 text-zinc-500 hover:text-black dark:text-zinc-400 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors cursor-pointer shrink-0"
              title="Open sidebar"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <div className="hidden sm:flex items-center gap-1.5 shrink-0 select-none text-zinc-400 dark:text-zinc-500">
              <Link to="/" className="hover:text-black dark:hover:text-white transition-colors">Boards</Link>
              <span>/</span>
            </div>

            <span className="text-zinc-950 dark:text-white font-semibold text-xs sm:text-sm truncate max-w-[140px] sm:max-w-xs">{board.title}</span>

            {/* Star Favorite Button */}
            <button
              onClick={handleToggleStar}
              title={isStarred ? "Remove from favorites" : "Add to favorites"}
              className={`p-1 rounded-md transition-colors cursor-pointer ${
                isStarred 
                  ? 'text-amber-400 bg-amber-400/10' 
                  : 'text-zinc-400 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'
              }`}
            >
              <svg className="w-3.5 h-3.5" fill={isStarred ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            </button>

            {/* Share / Invite */}
            <button
              onClick={() => setIsMembersOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-black/[0.07] dark:border-white/[0.08] text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-all shadow-xs"
              title="Share & Members"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
              <span>Share</span>
            </button>

            {/* Workspace Settings */}
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-black/[0.07] dark:border-white/[0.08] text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-all shadow-xs"
              title="Workspace Settings"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="hidden sm:inline">Settings</span>
            </button>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <OnlineAvatars />

            {/* Filter toggle */}
            {activeTab === 'kanban' && (
              <button
                onClick={() => setShowFilters((v) => !v)}
                title="Filter tasks"
                className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg transition-all border ${
                  showFilters || filterActive
                    ? 'bg-white dark:bg-[#1a1c27] text-zinc-950 dark:text-white border-black/15 dark:border-white/15 shadow-xs'
                    : 'border-black/[0.07] dark:border-white/[0.08] text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'
                }`}
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
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg transition-all border ${
                isActivityOpen
                  ? 'bg-white dark:bg-[#1a1c27] text-zinc-950 dark:text-white border-black/15 dark:border-white/15 shadow-xs'
                  : 'border-black/[0.07] dark:border-white/[0.08] text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <span className="hidden sm:inline">Activity</span>
            </button>

            {/* Chat */}
            <button
              onClick={toggleRightPanel}
              title="Board Chat"
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg transition-all border ${
                isRightPanelOpen
                  ? 'bg-white dark:bg-[#1a1c27] text-zinc-950 dark:text-white border-black/15 dark:border-white/15 shadow-xs'
                  : 'border-black/[0.07] dark:border-white/[0.08] text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span className="hidden sm:inline">Chat</span>
            </button>
          </div>
        </div>

        {/* Row 2: tabs with clean underline */}
        <div className="flex items-center gap-1 px-4 sm:px-6 overflow-x-auto no-scrollbar">
          {TABS.map((tab) => {
            const key = tab.toLowerCase();
            const isActive = activeTab === key;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(key)}
                className={`px-3 py-2 text-xs font-medium border-b-2 transition-all -mb-px cursor-pointer shrink-0 ${
                  isActive
                    ? 'text-zinc-950 dark:text-white border-zinc-950 dark:border-white font-semibold'
                    : 'text-zinc-500 hover:text-black dark:hover:text-zinc-200 border-transparent'
                }`}
              >
                {tab}
              </button>
            );
          })}
        </div>
      </header>

      {/* ── Filter bar ────────────────────────────────────────────── */}
      {activeTab === 'kanban' && showFilters && <FilterBar />}

      {/* ── Board canvas ─────────────────────────────────────────── */}
      <div className="flex-1 overflow-hidden relative flex flex-col">
        {activeTab === 'kanban' ? (
          <>
            <Board boardId={boardId} />
            <LiveCursor />
          </>
        ) : activeTab === 'table' ? (
          <TableView />
        ) : activeTab === 'discussion' ? (
          <DiscussionTab boardId={boardId} />
        ) : (
          <>
            <Board boardId={boardId} />
            <LiveCursor />
          </>
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

      {/* Board settings modal */}
      <BoardSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        boardId={boardId}
      />

      {/* Card detail modal */}
      <CardModal boardId={boardId} />
    </div>
  );
}
