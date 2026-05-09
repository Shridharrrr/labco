const express = require('express');
const router = express.Router({ mergeParams: true });
const auth = require('../middleware/auth.middleware');
const boardAccess = require('../middleware/boardAccess.middleware');
const { updateColumn, deleteColumn } = require('../controllers/column.controller');
const { createCard } = require('../controllers/card.controller');

// For boardAccess to work on standalone column routes, boardId must come from the column's board field
// We use a custom middleware to load board from column
const Column = require('../models/Column');

const loadBoardFromColumn = async (req, res, next) => {
  try {
    const column = await Column.findById(req.params.columnId);
    if (!column) return res.status(404).json({ message: 'Column not found' });
    req.params.boardId = column.board.toString();
    next();
  } catch (err) {
    next(err);
  }
};

router.post('/:columnId/cards', auth, loadBoardFromColumn, boardAccess('editor'), createCard);
router.patch('/:columnId', auth, loadBoardFromColumn, boardAccess('editor'), updateColumn);
router.delete('/:columnId', auth, loadBoardFromColumn, boardAccess('editor'), deleteColumn);

module.exports = router;
