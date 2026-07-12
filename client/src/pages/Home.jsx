import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import * as boardService from '../services/boardService';
import Spinner from '../components/ui/Spinner';
import { notifyBoardCreated } from '../components/layout/AppShell';
import useUIStore from '../store/uiSlice';
import Avatar from '../components/ui/Avatar';
import NotificationsModal from '../components/layout/NotificationsModal';

const BG_GRADIENTS = [
  'from-indigo-600 to-indigo-800',
  'from-rose-600 to-rose-800',
  'from-cyan-600 to-cyan-800',
  'from-emerald-600 to-emerald-800',
  'from-amber-600 to-amber-800',
  'from-violet-600 to-violet-800',
];

export default function Home() {
  const navigate = useNavigate();
  const [boards, setBoards] = useState(null); // null = loading
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [invitations, setInvitations] = useState([]);

  // Fetch on mount
  const fetchData = async () => {
    try {
      const [boardsRes, invitesRes] = await Promise.all([
        boardService.getBoards(),
        boardService.getPendingInvitations()
      ]);
      setBoards(boardsRes.data);
      setInvitations(invitesRes.data || []);
    } catch {
      setBoards([]);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setCreating(true);
    try {
      const { data } = await boardService.createBoard({ title: newTitle.trim() });
      setBoards(prev => [...(prev || []), data]);
      notifyBoardCreated(data);
      setNewTitle('');
      setShowCreate(false);
      navigate(`/boards/${data._id}`);
    } catch { }
    finally { setCreating(false); }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#0c0c0f]">
      {/* Page header */}
      <div className="px-8 pt-7 pb-5 border-b border-white/[0.06]">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">My Boards</h1>
            <p className="text-white/35 text-xs mt-1">Pick a board or create a new one</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowNotifications(true)}
              className="relative flex items-center justify-center w-8 h-8 rounded-lg text-white/40 hover:text-white hover:bg-white/[0.06] transition-all duration-200 active:scale-95"
              title="Notifications"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {invitations.length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full shadow-[0_0_8px_rgba(244,63,94,0.8)] border border-[#0c0c0f]"></span>
              )}
            </button>
            <button
              id="create-board-btn"
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-brand-600 hover:bg-brand-500
                text-white text-xs font-semibold rounded-lg transition-all duration-200
                hover:shadow-[0_0_20px_rgba(99,102,241,0.3)] active:scale-[0.96]"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
              New board
            </button>
          </div>
        </div>
      </div>

      <div className="px-8 py-6 max-w-7xl">
        {/* Create board inline form */}
        {showCreate && (
          <form
            onSubmit={handleCreate}
            className="mb-8 flex flex-col sm:flex-row gap-3 items-center p-2 pl-4 bg-[#161619] border border-white/[0.12] shadow-2xl shadow-brand-500/5 rounded-xl relative overflow-hidden transition-all group hover:border-brand-500/30"
            style={{ animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}
          >
            {/* Subtle glow */}
            <div className="absolute inset-0 bg-gradient-to-r from-brand-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

            <div className="flex-1 w-full relative z-10 flex items-center gap-3">
              <input
                autoFocus
                type="text"
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                onKeyDown={e => e.key === 'Escape' && setShowCreate(false)}
                placeholder="Give your board a title..."
                className="w-full bg-transparent border-none px-0 py-2 text-[15px] font-medium
                  text-white placeholder-white/30 outline-none ring-0 focus:ring-0"
              />
            </div>
            <div className="flex items-center gap-2 shrink-0 z-10 w-full sm:w-auto">
              <button type="button" onClick={() => setShowCreate(false)}
                className="flex-1 sm:flex-none px-4 py-2 text-white/40 hover:text-white hover:bg-white/[0.06] text-sm font-medium transition-all duration-200 rounded-lg">
                Cancel
              </button>
              <button
                type="submit"
                disabled={creating || !newTitle.trim()}
                className="flex-1 sm:flex-none px-5 py-2 bg-brand-600 hover:bg-brand-500 shadow-[0_0_15px_rgba(99,102,241,0.25)] text-white text-sm
                  font-semibold rounded-lg transition-all disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2 active:scale-[0.98]"
              >
                {creating ? <Spinner size="sm" /> : 'Create Board'}
              </button>
            </div>
          </form>
        )}

        {boards === null ? (
          <div className="flex justify-center py-20"><Spinner /></div>
        ) : boards.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-14 h-14 rounded-lg bg-white/[0.04] flex items-center justify-center mx-auto mb-4 border border-white/[0.06]">
              <svg className="w-7 h-7 text-white/15" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" /></svg>
            </div>
            <p className="text-white/35 text-sm">No boards yet. Create your first one!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
            {boards.map((board, i) => (
              <Link
                key={board._id}
                to={`/boards/${board._id}`}
                className={`group relative h-36 rounded-xl bg-gradient-to-br ${BG_GRADIENTS[i % BG_GRADIENTS.length]}
                  p-4 flex flex-col justify-end overflow-hidden hover:scale-[1.03] active:scale-[0.98]
                  transition-all duration-200 shadow-md hover:shadow-xl hover:shadow-black/40 cursor-pointer`}
              >
                <div className="absolute inset-0 bg-black/25 group-hover:bg-black/10 transition-colors duration-200" />
                {/* Decorative geometric shapes */}
                <div className="absolute -top-6 -right-6 w-20 h-20 rounded-lg bg-white/[0.07] rotate-12 group-hover:rotate-[18deg] transition-transform duration-300" />
                <div className="absolute top-2 -right-2 w-10 h-10 rounded-lg bg-white/[0.05] rotate-12 group-hover:rotate-[20deg] transition-transform duration-300" />
                <div className="relative">
                  <h2 className="font-semibold text-white text-sm leading-snug truncate">{board.title}</h2>
                  {board.description && (
                    <p className="text-white/50 text-[11px] mt-0.5 truncate">{board.description}</p>
                  )}
                  <p className="text-white/35 group-hover:text-white/50 text-[11px] mt-1.5 font-medium transition-colors">
                    {board.members?.length} member{board.members?.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </Link>
            ))}

            {/* Create new board card */}
            <button
              onClick={() => setShowCreate(true)}
              className="group h-36 rounded-xl border border-dashed border-white/[0.08] hover:border-white/[0.15]
                flex flex-col items-center justify-center gap-2.5 transition-all duration-200
                hover:bg-white/[0.06] cursor-pointer active:scale-[0.98]"
            >
              <div className="w-10 h-10 rounded-lg bg-white/[0.04] group-hover:bg-white/[0.06] flex items-center justify-center transition-all duration-200 border border-white/[0.06] group-hover:border-white/[0.12] group-hover:scale-110">
                <svg className="w-4 h-4 text-white/25 group-hover:text-white/80 transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
              </div>
              <span className="text-xs text-white/25 group-hover:text-white/70 transition-colors duration-200 font-medium">New board</span>
            </button>
          </div>
        )}
      </div>

      {showNotifications && (
        <NotificationsModal 
          onClose={() => setShowNotifications(false)} 
          invitations={invitations}
          onAccept={(token) => {
            setInvitations(prev => prev.filter(i => i.token !== token));
            fetchData();
          }}
        />
      )}
    </div>
  );
}
