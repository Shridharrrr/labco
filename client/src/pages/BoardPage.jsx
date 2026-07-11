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
      <div className="flex-1 flex items-center justify-center bg-[#0c0c0f]">
        <Spinner size="lg" />
      </div>
    );
  }

  const filterActive = isFiltering(filters);

  return (
    <div className="flex flex-col flex-1 overflow-hidden bg-[#0c0c0f]" onMouseMove={handleMouseMove}>

      {/* ── Top bar ─────────────────────────────────────────────────── */}
      <header className="shrink-0 border-b border-white/[0.06]">

        {/* Row 1: breadcrumb + actions */}
        <div className="flex items-center justify-between px-5 pt-3 pb-0">
          <div className="flex items-center gap-2 text-xs min-w-0">
            <div className="text-white/25 shrink-0 select-none">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
            </div>
            <span className="text-white/15 shrink-0">/</span>
            <Link to="/" className="text-white/30 hover:text-white/60 transition-colors text-[11px] shrink-0">Boards</Link>
            <span className="text-white/15 shrink-0">/</span>
            <span className="text-white font-semibold text-[13px] truncate">{board.title}</span>

            {/* Star Button */}
            <button
              onClick={handleToggleStar}
              title={isStarred ? "Remove from favorites" : "Add to favorites"}
              className={`shrink-0 ml-1 p-1.5 rounded-md transition-colors ${
                isStarred 
                  ? 'text-yellow-400 hover:bg-yellow-400/10' 
                  : 'text-white/25 hover:text-white/60 hover:bg-white/[0.04]'
              }`}
            >
              <svg className={`w-3.5 h-3.5 ${isStarred ? 'fill-current' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            </button>
            <button
              onClick={() => setIsMembersOpen(true)}
              className="shrink-0 ml-1 flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-medium bg-white/[0.04] hover:bg-white/[0.08] text-white/40 hover:text-white/80 transition-all border border-white/[0.06]"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              Share
            </button>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <OnlineAvatars />

            {/* View switcher */}
            {activeTab === 'tasks' && (
              <div className="flex items-center bg-white/[0.03] border border-white/[0.06] rounded-md p-0.5">
                <button
                  onClick={() => setViewMode('kanban')}
                  title="Kanban view"
                  className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium transition-all ${viewMode === 'kanban' ? 'bg-white/[0.08] text-white' : 'text-white/35 hover:text-white/60'}`}
                >
                  <KanbanIcon /> Board
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  title="Table view"
                  className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium transition-all ${viewMode === 'table' ? 'bg-white/[0.08] text-white' : 'text-white/35 hover:text-white/60'}`}
                >
                  <TableIcon /> Table
                </button>
              </div>
            )}

            {/* Filter toggle */}
            {activeTab === 'tasks' && (
              <button
                onClick={() => setShowFilters(v => !v)}
                className={`flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium rounded-md transition-all
                  ${showFilters || filterActive
                    ? 'bg-brand-600/15 text-brand-400 border border-brand-500/25'
                    : 'bg-white/[0.03] text-white/40 hover:text-white/70 hover:bg-white/[0.06] border border-white/[0.06]'}`}
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                Filter{filterActive ? ' ●' : ''}
              </button>
            )}

            {/* Activity */}
            <button
              onClick={toggleActivity}
              className={`flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium rounded-md transition-all
                ${isActivityOpen
                  ? 'bg-brand-600 text-white'
                  : 'bg-white/[0.03] text-white/40 hover:text-white/70 hover:bg-white/[0.06] border border-white/[0.06]'}`}
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Activity
            </button>

            {/* Chat / Members Panel */}
            <button
              onClick={toggleRightPanel}
              className={`flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium rounded-md transition-all
                ${isRightPanelOpen
                  ? 'bg-brand-600 text-white'
                  : 'bg-white/[0.03] text-white/40 hover:text-white/70 hover:bg-white/[0.06] border border-white/[0.06]'}`}
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              Chat
            </button>
          </div>
        </div>

        {/* Row 2: tabs */}
        <div className="flex items-center gap-0 px-5 pt-1.5">
          {TABS.map((tab) => {
            const key = tab.toLowerCase();
            const isActive = activeTab === key;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(key)}
                className={`px-3 py-2 text-[12px] font-medium border-b-2 transition-all -mb-px ${
                  isActive
                    ? 'text-white border-brand-500'
                    : 'text-white/30 border-transparent hover:text-white/55 hover:border-white/10'
                }`}
              >
                {tab}
                {tab === 'Tasks' && (
                  <span className="ml-1.5 text-[8px] font-bold px-1 py-px bg-brand-500/20 text-brand-400 rounded">●</span>
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
