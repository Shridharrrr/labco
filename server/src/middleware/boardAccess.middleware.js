const mongoose = require('mongoose');
const Board = require('../models/Board');

/**
 * Checks that the authenticated user is a member of the board with at least
 * the required role. Attaches `req.board` and `req.memberRole`.
 *
 * Usage:
 *   router.patch('/:boardId', auth, boardAccess('editor'), controller)
 */
const boardAccess = (minRole = 'viewer') => async (req, res, next) => {
  const roleRank = { viewer: 0, editor: 1, owner: 2 };
  const boardId = req.params.boardId || req.body.boardId;

  if (!boardId || !mongoose.isValidObjectId(boardId)) {
    return res.status(400).json({ message: 'Invalid or missing board identifier' });
  }

  try {
    const board = await Board.findById(boardId);
    if (!board || board.isArchived) {
      return res.status(404).json({ message: 'Board not found' });
    }

    const member = board.members.find(
      (m) => m.user && m.user.toString() === req.user.userId
    );

    if (!member) {
      return res.status(403).json({ message: 'Access denied: not a board member' });
    }

    if (roleRank[member.role] === undefined || roleRank[member.role] < roleRank[minRole]) {
      return res.status(403).json({ message: `Requires ${minRole} role or higher` });
    }

    req.board = board;
    req.memberRole = member.role;
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = boardAccess;
