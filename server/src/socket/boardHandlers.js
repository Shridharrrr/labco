const mongoose = require('mongoose');
const Board = require('../models/Board');

/**
 * Verify the socket user is a member of the given board.
 */
const verifyMember = async (boardId, userId) => {
  if (!boardId || !mongoose.isValidObjectId(boardId)) return false;
  const board = await Board.findById(boardId).select('members isArchived');
  if (!board || board.isArchived) return false;
  return board.members.some((m) => m.user && m.user.toString() === userId);
};

/**
 * Verify the socket user is an editor+ of the given board.
 */
const verifyEditor = async (boardId, userId) => {
  if (!boardId || !mongoose.isValidObjectId(boardId)) return false;
  const board = await Board.findById(boardId).select('members isArchived');
  if (!board || board.isArchived) return false;
  const member = board.members.find((m) => m.user && m.user.toString() === userId);
  if (!member) return false;
  return ['editor', 'owner'].includes(member.role);
};

const boardHandlers = (io, socket) => {
  const { userId } = socket.user;

  // ── CARD EVENTS ──────────────────────────────────────────────────────────

  socket.on('card:create', async ({ boardId, columnId, card }) => {
    try {
      if (!(await verifyEditor(boardId, userId))) return socket.emit('error', { message: 'Permission denied', code: 403 });
      socket.to(boardId).emit('card:created', { card, columnId });
    } catch (err) {
      socket.emit('error', { message: err.message, code: 500 });
    }
  });

  socket.on('card:update', async ({ boardId, cardId, changes }) => {
    try {
      if (!(await verifyEditor(boardId, userId))) return socket.emit('error', { message: 'Permission denied', code: 403 });
      socket.to(boardId).emit('card:updated', { cardId, changes });
    } catch (err) {
      socket.emit('error', { message: err.message, code: 500 });
    }
  });

  socket.on('card:move', async ({ boardId, cardId, fromColumnId, toColumnId, newOrder }) => {
    try {
      if (!(await verifyEditor(boardId, userId))) return socket.emit('error', { message: 'Permission denied', code: 403 });
      socket.to(boardId).emit('card:moved', { cardId, fromColumnId, toColumnId, newOrder });
    } catch (err) {
      socket.emit('error', { message: err.message, code: 500 });
    }
  });

  socket.on('card:delete', async ({ boardId, cardId, columnId }) => {
    try {
      if (!(await verifyEditor(boardId, userId))) return socket.emit('error', { message: 'Permission denied', code: 403 });
      socket.to(boardId).emit('card:deleted', { cardId, columnId });
    } catch (err) {
      socket.emit('error', { message: err.message, code: 500 });
    }
  });

  // ── COLUMN EVENTS ─────────────────────────────────────────────────────────

  socket.on('column:create', async ({ boardId, column }) => {
    try {
      if (!(await verifyEditor(boardId, userId))) return socket.emit('error', { message: 'Permission denied', code: 403 });
      socket.to(boardId).emit('column:created', { column });
    } catch (err) {
      socket.emit('error', { message: err.message, code: 500 });
    }
  });

  socket.on('column:update', async ({ boardId, columnId, changes }) => {
    try {
      if (!(await verifyEditor(boardId, userId))) return socket.emit('error', { message: 'Permission denied', code: 403 });
      socket.to(boardId).emit('column:updated', { columnId, changes });
    } catch (err) {
      socket.emit('error', { message: err.message, code: 500 });
    }
  });

  socket.on('column:delete', async ({ boardId, columnId }) => {
    try {
      if (!(await verifyEditor(boardId, userId))) return socket.emit('error', { message: 'Permission denied', code: 403 });
      socket.to(boardId).emit('column:deleted', { columnId });
    } catch (err) {
      socket.emit('error', { message: err.message, code: 500 });
    }
  });

  socket.on('column:reorder', async ({ boardId, orderedColumnIds }) => {
    try {
      if (!(await verifyEditor(boardId, userId))) return socket.emit('error', { message: 'Permission denied', code: 403 });
      socket.to(boardId).emit('column:reordered', { orderedColumnIds });
    } catch (err) {
      socket.emit('error', { message: err.message, code: 500 });
    }
  });

  // ── CHAT EVENTS ───────────────────────────────────────────────────────────

  socket.on('chat:message', async ({ boardId, message }) => {
    try {
      if (!(await verifyMember(boardId, userId))) {
        return socket.emit('error', { message: 'Permission denied: not a board member', code: 403 });
      }
      socket.to(boardId).emit('chat:message', { message });
    } catch (err) {
      socket.emit('error', { message: err.message, code: 500 });
    }
  });
};

module.exports = boardHandlers;
