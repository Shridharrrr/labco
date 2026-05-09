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
import OnlineAvatars from '../components/presence/OnlineAvatars';
import LiveCursor from '../components/presence/LiveCursor';
import ActivityDrawer from '../components/activity/ActivityDrawer';
import MembersModal from '../components/board/MembersModal';
import Spinner from '../components/ui/Spinner';

const THROTTLE_MS = 50;
const TABS = ['Discussion', 'Tasks', 'Timeline', 'Files', 'Overview'];

export default function BoardPage() {
  const { boardId } = useParams();
  const navigate = useNavigate();
  const { setBoard, clearBoard, board } = useBoardStore();
  const { isActivityOpen, toggleActivity, addToast } = useUIStore();
  const { user } = useAuthStore();
  const socket = useSocket();
  const lastCursor = useRef(0);
  const [isMembersOpen, setIsMembersOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('tasks');

  useBoardSync(socket, boardId);

  useEffect(() => {
    if (!boardId) return;
    boardService.getBoard(boardId)
      .then(({ data }) => setBoard(data))
      .catch(() => {
        addToast({ message: 'Board not found or access denied', type: 'error' });
        navigate('/');
      });
    return () => clearBoard();
  }, [boardId]);

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

  return (
    <div className="flex flex-col flex-1 overflow-hidden bg-[#111111]" onMouseMove={handleMouseMove}>

      {/* ── Top bar ─────────────────────────────────────────────────────── */}
      <header className="shrink-0 border-b border-white/[0.06]">
        {/* Row 1: breadcrumb + actions */}
        <div className="flex items-center justify-between px-6 pt-4 pb-0">
          <div className="flex items-center gap-2 text-sm">
            <Link to="/" className="text-white/30 hover:text-white/60 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
            </Link>
            <span className="text-white/20">/</span>
            <span className="text-white/40 text-xs">Projects</span>
            <span className="text-white/20">/</span>
            <span className="text-white font-semibold text-[15px] truncate max-w-[200px]">{board.title}</span>
            <button
              onClick={() => setIsMembersOpen(true)}
              className="ml-2 flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-white/5 hover:bg-white/10 text-white/50 hover:text-white/90 transition-all border border-white/[0.06]"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              Share
            </button>
          </div>

          <div className="flex items-center gap-3">
            <OnlineAvatars />
            <button
              id="activity-toggle"
              onClick={toggleActivity}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all
                ${isActivityOpen
                  ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/20'
                  : 'bg-white/5 text-white/50 hover:text-white hover:bg-white/10 border border-white/[0.06]'}`}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Activity
            </button>
          </div>
        </div>

        {/* Row 2: tabs */}
        <div className="flex items-center gap-1 px-5 pt-3">
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
                    : 'text-white/40 border-transparent hover:text-white/70 hover:border-white/20'
                }`}
              >
                {tab}
                {tab === 'Tasks' && (
                  <span className="ml-2 text-[10px] font-bold px-1.5 py-0.5 bg-brand-500/20 text-brand-400 rounded-full">
                    ●
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </header>

      {/* ── Board canvas ──────────────────────────────────────────────── */}
      <div className="flex-1 overflow-hidden relative">
        {activeTab === 'tasks' ? (
          <>
            <Board boardId={boardId} />
            <LiveCursor />
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-white/20 text-sm gap-3">
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

      {/* Members modal */}
      {isMembersOpen && (
        <MembersModal boardId={boardId} onClose={() => setIsMembersOpen(false)} />
      )}
    </div>
  );
}
