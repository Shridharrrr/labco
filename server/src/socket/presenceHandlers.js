const mongoose = require('mongoose');
const Board = require('../models/Board');
const User = require('../models/User');
const { addUser, removeUser, getOnlineUsers } = require('../services/presence.service');

// Assign a consistent color to each user for cursor display
const COLORS = ['#f87171','#fb923c','#facc15','#4ade80','#34d399','#22d3ee','#818cf8','#c084fc','#f472b6'];
const userColor = (userId) => {
  if (!userId || typeof userId !== 'string') return COLORS[0];
  return COLORS[parseInt(userId.slice(-2), 16) % COLORS.length];
};

const presenceHandlers = (io, socket) => {
  const { userId, email } = socket.user;

  // board:join - join socket room and update Redis presence
  socket.on('board:join', async ({ boardId }) => {
    try {
      if (!boardId || !mongoose.isValidObjectId(boardId)) {
        return socket.emit('error', { message: 'Invalid board ID', code: 400 });
      }

      // Verify user is a member of this board
      const board = await Board.findById(boardId).select('members isArchived');
      if (!board || board.isArchived) return socket.emit('error', { message: 'Board not found', code: 404 });

      const isMember = board.members.some((m) => m.user && m.user.toString() === userId);
      if (!isMember) return socket.emit('error', { message: 'Not a board member', code: 403 });

      socket.join(boardId);
      socket.currentBoardId = boardId;

      const userDoc = await User.findById(userId).select('name avatar');

      const userInfo = {
        userId,
        email,
        name: userDoc?.name,
        avatar: userDoc?.avatar,
        color: userColor(userId),
      };

      await addUser(boardId, userInfo);
      const onlineUsers = await getOnlineUsers(boardId);

      // Tell the joining user who's already online
      socket.emit('presence:init', { onlineUsers });

      // Tell everyone else this user joined
      socket.to(boardId).emit('user:joined', { user: userInfo });
    } catch (err) {
      socket.emit('error', { message: err.message, code: 500 });
    }
  });

  // board:leave
  socket.on('board:leave', async ({ boardId }) => {
    if (!boardId) return;
    socket.leave(boardId);
    await removeUser(boardId, userId);
    socket.to(boardId).emit('user:left', { userId });
    if (socket.currentBoardId === boardId) {
      socket.currentBoardId = null;
    }
  });

  // cursor:move - throttle on client side (50ms), relay ephemerally
  socket.on('cursor:move', ({ boardId, x, y }) => {
    // Only broadcast if socket actually joined this board room
    if (socket.currentBoardId !== boardId) return;
    socket.to(boardId).emit('cursor:moved', { userId, x, y });
  });

  // On disconnect, remove from presence
  socket.on('disconnect', async () => {
    if (socket.currentBoardId) {
      await removeUser(socket.currentBoardId, userId);
      socket.to(socket.currentBoardId).emit('user:left', { userId });
    }
  });
};

module.exports = presenceHandlers;
