import { useEffect } from 'react';
import useBoardStore from '../store/boardSlice';
import usePresenceStore from '../store/presenceSlice';
import useUIStore from '../store/uiSlice';

/**
 * Binds all socket events to the corresponding Zustand store actions.
 * Must be called inside BoardPage after the socket is available.
 */
const useBoardSync = (socket, boardId) => {
  const { applyRemoteUpdate } = useBoardStore();
  const { setOnlineUsers, userJoined, userLeft, updateCursor } = usePresenceStore();
  const { addToast } = useUIStore();

  useEffect(() => {
    if (!socket || !boardId) return;

    // Join the board room
    socket.emit('board:join', { boardId });

    // ── Presence ─────────────────────────────────────────────────────────
    socket.on('presence:init', ({ onlineUsers }) => setOnlineUsers(onlineUsers));
    socket.on('user:joined', ({ user }) => {
      userJoined(user);
      addToast({ message: `${user.email} joined the board`, type: 'info' });
    });
    socket.on('user:left', ({ userId }) => userLeft(userId));
    socket.on('cursor:moved', ({ userId, x, y }) => updateCursor(userId, { x, y }));

    // ── Board events ──────────────────────────────────────────────────────
    const boardEvents = [
      'card:created', 'card:updated', 'card:moved', 'card:deleted',
      'column:created', 'column:updated', 'column:deleted', 'column:reordered',
    ];
    boardEvents.forEach((event) => {
      socket.on(event, (payload) => applyRemoteUpdate(event, payload));
    });

    // ── Error ─────────────────────────────────────────────────────────────
    socket.on('error', ({ message }) => addToast({ message, type: 'error' }));

    return () => {
      socket.emit('board:leave', { boardId });
      socket.off('presence:init');
      socket.off('user:joined');
      socket.off('user:left');
      socket.off('cursor:moved');
      boardEvents.forEach((e) => socket.off(e));
      socket.off('error');
    };
  }, [socket, boardId]);
};

export default useBoardSync;
