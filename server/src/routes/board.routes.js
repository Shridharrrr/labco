const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth.middleware');
const boardAccess = require('../middleware/boardAccess.middleware');
const {
  getBoards,
  createBoard,
  getBoard,
  updateBoard,
  archiveBoard,
  inviteMember,
  changeMemberRole,
  removeMember,
  toggleStar,
} = require('../controllers/board.controller');
const { reorderColumns, createColumn } = require('../controllers/column.controller');

router.get('/', auth, getBoards);
router.post('/', auth, createBoard);
router.get('/:boardId', auth, boardAccess('viewer'), getBoard);
router.patch('/:boardId', auth, boardAccess('editor'), updateBoard);
router.delete('/:boardId', auth, boardAccess('owner'), archiveBoard);
router.post('/:boardId/star', auth, boardAccess('viewer'), toggleStar);

// Members
router.post('/:boardId/members', auth, boardAccess('owner'), inviteMember);
router.patch('/:boardId/members/:userId', auth, boardAccess('owner'), changeMemberRole);
router.delete('/:boardId/members/:userId', auth, boardAccess('owner'), removeMember);

// Columns nested under board
router.post('/:boardId/columns', auth, boardAccess('editor'), createColumn);
router.patch('/:boardId/columns/reorder', auth, boardAccess('editor'), reorderColumns);

module.exports = router;
