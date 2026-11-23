const mongoose = require('mongoose');
const Column = require('../models/Column');
const Board = require('../models/Board');
const Card = require('../models/Card');
const { writeActivity } = require('../services/activity.service');

const ALLOWED_COLUMN_TYPES = ['none', 'initial', 'final'];

// POST /api/boards/:boardId/columns
exports.createColumn = async (req, res, next) => {
  try {
    const { title } = req.body;
    if (typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({ message: 'title is required' });
    }

    const cleanTitle = title.trim().slice(0, 80);
    const board = req.board;
    const order = board.columns.length;

    const column = await Column.create({
      title: cleanTitle,
      board: board._id,
      order,
    });

    board.columns.push(column._id);
    await board.save();

    await writeActivity({
      boardId: board._id,
      userId: req.user.userId,
      type: 'column.created',
      payload: { columnId: column._id, title: cleanTitle },
    });

    return res.status(201).json(column);
  } catch (err) {
    next(err);
  }
};

// PATCH /api/columns/:columnId - rename / update color / update columnType
exports.updateColumn = async (req, res, next) => {
  try {
    const { title, color, columnType } = req.body;
    const column = await Column.findById(req.params.columnId);
    if (!column) return res.status(404).json({ message: 'Column not found' });

    if (title !== undefined) {
      if (typeof title !== 'string' || !title.trim()) {
        return res.status(400).json({ message: 'title cannot be empty' });
      }
      column.title = title.trim().slice(0, 80);
    }

    if (color !== undefined && typeof color === 'string') {
      column.color = color;
    }

    if (columnType !== undefined) {
      if (!ALLOWED_COLUMN_TYPES.includes(columnType)) {
        return res.status(400).json({ message: 'columnType must be none, initial, or final' });
      }
      column.columnType = columnType;
      // Auto-update all cards in this column with the corresponding status
      const statusMap = { initial: 'started', final: 'completed', none: 'none' };
      const newStatus = statusMap[columnType] || 'none';
      await Card.updateMany({ column: column._id }, { status: newStatus });
    }

    await column.save();

    if (title) {
      await writeActivity({
        boardId: column.board,
        userId: req.user.userId,
        type: 'column.renamed',
        payload: { columnId: column._id, title: column.title },
      });
    }

    return res.json(column);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/columns/:columnId - delete column and its cards
exports.deleteColumn = async (req, res, next) => {
  try {
    const column = await Column.findById(req.params.columnId);
    if (!column) return res.status(404).json({ message: 'Column not found' });

    // Remove all cards in this column
    await Card.deleteMany({ column: column._id });

    // Remove column ref from board
    await Board.findByIdAndUpdate(column.board, {
      $pull: { columns: column._id },
    });

    await writeActivity({
      boardId: column.board,
      userId: req.user.userId,
      type: 'column.deleted',
      payload: { columnId: column._id, title: column.title },
    });

    await column.deleteOne();
    return res.json({ message: 'Column deleted' });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/boards/:boardId/columns/reorder
exports.reorderColumns = async (req, res, next) => {
  try {
    const { orderedColumnIds } = req.body;
    if (!Array.isArray(orderedColumnIds)) {
      return res.status(400).json({ message: 'orderedColumnIds must be an array' });
    }

    const board = req.board;

    // Validate that all orderedColumnIds are valid ObjectIds and exist in the board
    const boardColumnSet = new Set(board.columns.map((c) => c.toString()));
    const valid = orderedColumnIds.every(
      (id) => typeof id === 'string' && mongoose.isValidObjectId(id) && boardColumnSet.has(id)
    );

    if (!valid) {
      return res.status(400).json({ message: 'Invalid column ID in reorder list' });
    }

    board.columns = orderedColumnIds;
    await board.save();

    // Update order field on each column
    await Promise.all(
      orderedColumnIds.map((id, idx) =>
        Column.findByIdAndUpdate(id, { order: idx })
      )
    );

    return res.json({ orderedColumnIds });
  } catch (err) {
    next(err);
  }
};
