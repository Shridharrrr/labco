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
  const { isActivityOpen, toggleActivity, isRightPanelOpen, toggleRightPanel, addToast, filters, clearFilters } = useUIStore();
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

  const isStarred = board?.stars?.includes(user?.userId);

  const handleToggleStar = async () => {
    try {
      const newStars = isStarred
        ? board.stars.filter(id => id !== user.userId)
        : [...(board.stars || []), user.userId];
        
      useBoardStore.getState().updateBoardInfo({ stars: newStars });
      await boardService.toggleStar(boardId);
    } catch {
      useBoardStore.getState().updateBoardInfo({ stars: board.stars }); // Revert on failure
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
      <div className="flex-1 flex items-center justify-center bg-[#111111]">
        <Spinner size="lg" />
      </div>
    );
  }

  const filterActive = isFiltering(filters);

  return (
    <div className="flex flex-col flex-1 overflow-hidden bg-[#111111]" onMouseMove={handleMouseMove}>

      {/* ── Top bar ─────────────────────────────────────────────────── */}
      <header className="shrink-0 border-b border-white/[0.06]">

        {/* Row 1: breadcrumb + actions */}
        <div className="flex items-center justify-between px-5 pt-3.5 pb-0">
          <div className="flex items-center gap-2 text-sm min-w-0">
            <Link to="/" className="text-white/30 hover:text-white/60 transition-colors shrink-0">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
            </Link>
            <span className="text-white/20 shrink-0">/</span>
            <span className="text-white/40 text-xs shrink-0">Projects</span>
            <span className="text-white/20 shrink-0">/</span>
            <span className="text-white font-semibold text-[15px] truncate">{board.title}</span>

            {/* Star Button */}
            <button
              onClick={handleToggleStar}
              title={isStarred ? "Remove from favorites" : "Add to favorites"}
              className={`ml-1 p-1 rounded-md transition-colors ${
                isStarred 
                  ? 'text-yellow-400 hover:bg-yellow-400/10' 
                  : 'text-white/30 hover:text-white/70 hover:bg-white/5'
              }`}
            >
              <svg className={`w-4 h-4 ${isStarred ? 'fill-current' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </button>
            <button
              onClick={() => setIsMembersOpen(true)}
              className="shrink-0 ml-1 flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium bg-white/5 hover:bg-white/10 text-white/45 hover:text-white/90 transition-all border border-white/[0.06]"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              Share
            </button>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <OnlineAvatars />

            {/* View switcher */}
            {activeTab === 'tasks' && (
              <div className="flex items-center bg-white/[0.04] border border-white/[0.07] rounded-lg p-0.5">
                <button
                  onClick={() => setViewMode('kanban')}
                  title="Kanban view"
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${viewMode === 'kanban' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/70'}`}
                >
                  <KanbanIcon /> Board
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  title="Table view"
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${viewMode === 'table' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/70'}`}
                >
                  <TableIcon /> Table
                </button>
              </div>
            )}

            {/* Filter toggle */}
            {activeTab === 'tasks' && (
              <button
                onClick={() => setShowFilters(v => !v)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all
                  ${showFilters || filterActive
                    ? 'bg-brand-600/20 text-brand-400 border border-brand-500/30'
                    : 'bg-white/[0.04] text-white/45 hover:text-white/80 hover:bg-white/[0.08] border border-white/[0.07]'}`}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                Filter{filterActive ? ' ●' : ''}
              </button>
            )}

            {/* Activity */}
            <button
              onClick={toggleActivity}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all
                ${isActivityOpen
                  ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/20'
                  : 'bg-white/[0.04] text-white/45 hover:text-white/80 hover:bg-white/[0.08] border border-white/[0.07]'}`}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Activity
            </button>

            {/* Chat / Members Panel */}
            <button
              onClick={toggleRightPanel}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all
                ${isRightPanelOpen
                  ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/20'
                  : 'bg-white/[0.04] text-white/45 hover:text-white/80 hover:bg-white/[0.08] border border-white/[0.07]'}`}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              Chat
            </button>
          </div>
        </div>

        {/* Row 2: tabs */}
        <div className="flex items-center gap-0 px-5 pt-2">
          {TABS.map((tab) => {
            const key = tab.toLowerCase();
            const isActive = activeTab === key;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(key)}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-all -mb-px ${
                  isActive
                    ? 'text-white border-brand-500'
                    : 'text-white/35 border-transparent hover:text-white/65 hover:border-white/15'
                }`}
              >
                {tab}
                {tab === 'Tasks' && (
                  <span className="ml-2 text-[9px] font-bold px-1.5 py-0.5 bg-brand-500/20 text-brand-400 rounded-full">●</span>
                )}
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
          <div className="flex flex-col items-center justify-center flex-1 text-white/20 text-sm gap-3">
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
    </div>
  );
}
