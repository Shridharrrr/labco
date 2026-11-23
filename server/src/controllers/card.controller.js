const path = require('path');
const Card = require('../models/Card');
const Column = require('../models/Column');
const Board = require('../models/Board');
const cloudinary = require('../config/cloudinary');
const { writeActivity } = require('../services/activity.service');
const streamifier = require('streamifier');

// Disallowed dangerous file extensions
const BLOCKED_EXTENSIONS = new Set([
  '.exe', '.bat', '.cmd', '.sh', '.bash', '.bin',
  '.php', '.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs',
  '.html', '.htm', '.vbs', '.ps1', '.py', '.rb'
]);

// POST /api/columns/:columnId/cards
exports.createCard = async (req, res, next) => {
  try {
    const { title, description = '' } = req.body;
    if (typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({ message: 'title is required' });
    }

    const column = await Column.findById(req.params.columnId);
    if (!column) return res.status(404).json({ message: 'Column not found' });

    const cleanTitle = title.trim().slice(0, 200);
    const cleanDesc = typeof description === 'string' ? description.slice(0, 10000) : '';
    const order = column.cards.length;

    // Auto-assign status based on column type
    const statusMap = { initial: 'started', final: 'completed', none: 'none' };
    const status = statusMap[column.columnType] || 'none';

    const card = await Card.create({
      title: cleanTitle,
      description: cleanDesc,
      column: column._id,
      board: column.board,
      order,
      status,
    });

    column.cards.push(card._id);
    await column.save();

    await writeActivity({
      boardId: column.board,
      userId: req.user.userId,
      type: 'card.created',
      payload: { cardId: card._id, columnId: column._id, title: cleanTitle },
    });

    return res.status(201).json(card);
  } catch (err) {
    next(err);
  }
};

// GET /api/cards/:cardId
exports.getCard = async (req, res, next) => {
  try {
    const card = await Card.findById(req.params.cardId)
      .populate('column', 'title')
      .populate('assignees', 'name email avatar')
      .populate('comments.author', 'name email avatar');
    if (!card || card.isArchived) return res.status(404).json({ message: 'Card not found' });
    return res.json(card);
  } catch (err) {
    next(err);
  }
};

// PATCH /api/cards/:cardId - update card properties (comments excluded for security)
exports.updateCard = async (req, res, next) => {
  try {
    // Note: 'comments' is strictly excluded to prevent comment forgery/tampering
    const allowedFields = [
      'title', 'description', 'assignees', 'labels',
      'dueDate', 'checklist', 'coverColor',
    ];
    const updates = {};
    allowedFields.forEach((f) => {
      if (req.body[f] !== undefined) updates[f] = req.body[f];
    });

    if (updates.title !== undefined) {
      if (typeof updates.title !== 'string' || !updates.title.trim()) {
        return res.status(400).json({ message: 'title cannot be empty' });
      }
      updates.title = updates.title.trim().slice(0, 200);
    }

    if (updates.description !== undefined && typeof updates.description === 'string') {
      updates.description = updates.description.slice(0, 10000);
    }

    const card = await Card.findByIdAndUpdate(
      req.params.cardId,
      { $set: updates },
      { new: true, runValidators: true }
    )
      .populate('assignees', 'name email avatar')
      .populate('comments.author', 'name email avatar');

    if (!card) return res.status(404).json({ message: 'Card not found' });

    await writeActivity({
      boardId: card.board,
      userId: req.user.userId,
      type: 'card.updated',
      payload: { cardId: card._id, changes: Object.keys(updates) },
    });

    return res.json(card);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/cards/:cardId - archive card
exports.archiveCard = async (req, res, next) => {
  try {
    const card = await Card.findByIdAndUpdate(
      req.params.cardId,
      { isArchived: true },
      { new: true }
    );
    if (!card) return res.status(404).json({ message: 'Card not found' });

    // Remove from column.cards array
    await Column.findByIdAndUpdate(card.column, { $pull: { cards: card._id } });

    await writeActivity({
      boardId: card.board,
      userId: req.user.userId,
      type: 'card.deleted',
      payload: { cardId: card._id, columnId: card.column },
    });

    return res.json({ message: 'Card archived' });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/cards/:cardId/move
exports.moveCard = async (req, res, next) => {
  try {
    const { fromColumnId, toColumnId, newOrder } = req.body;
    const card = await Card.findById(req.params.cardId);
    if (!card) return res.status(404).json({ message: 'Card not found' });

    const targetCol = await Column.findById(toColumnId);
    if (!targetCol) return res.status(404).json({ message: 'Target column not found' });

    // SECURITY: Ensure target column belongs to the same board (prevent cross-board card theft)
    if (targetCol.board.toString() !== card.board.toString()) {
      return res.status(400).json({ message: 'Cannot move card to a column on a different board' });
    }

    const isSameColumn = fromColumnId === toColumnId;

    // Remove from source column
    await Column.findByIdAndUpdate(fromColumnId, { $pull: { cards: card._id } });

    // Insert into target column at correct position
    const safeOrder = Math.max(0, Math.min(newOrder, targetCol.cards.length));
    targetCol.cards.splice(safeOrder, 0, card._id);
    await targetCol.save();

    // Auto-assign status based on target column type
    const statusMap = { initial: 'started', final: 'completed', none: 'none' };
    const newStatus = statusMap[targetCol.columnType] || 'none';

    // Update card's column reference, order, and status
    card.column = toColumnId;
    card.order = safeOrder;
    card.status = newStatus;
    await card.save();

    // Re-sync order field for all cards in affected columns
    const syncOrder = async (colId) => {
      const col = await Column.findById(colId);
      if (!col) return;
      await Promise.all(
        col.cards.map((cid, idx) => Card.findByIdAndUpdate(cid, { order: idx }))
      );
    };
    await syncOrder(toColumnId);
    if (!isSameColumn) await syncOrder(fromColumnId);

    await writeActivity({
      boardId: card.board,
      userId: req.user.userId,
      type: 'card.moved',
      payload: { cardId: card._id, fromColumnId, toColumnId, newOrder: safeOrder },
    });

    return res.json(card);
  } catch (err) {
    next(err);
  }
};

// POST /api/cards/:cardId/comments - add a comment
exports.addComment = async (req, res, next) => {
  try {
    const { text } = req.body;
    if (typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({ message: 'Comment text is required' });
    }

    const card = await Card.findById(req.params.cardId);
    if (!card || card.isArchived) return res.status(404).json({ message: 'Card not found' });

    const newComment = {
      author: req.user.userId,
      text: text.trim().slice(0, 2000),
      createdAt: new Date(),
    };

    card.comments.push(newComment);
    await card.save();
    await card.populate('comments.author', 'name email avatar');

    return res.status(201).json(card);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/cards/:cardId/comments/:commentId - delete a comment
exports.deleteComment = async (req, res, next) => {
  try {
    const card = await Card.findById(req.params.cardId);
    if (!card || card.isArchived) return res.status(404).json({ message: 'Card not found' });

    const comment = card.comments.id(req.params.commentId);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });

    // Check ownership: author can delete, or board owner can delete
    const isAuthor = comment.author.toString() === req.user.userId;
    const isOwner = req.memberRole === 'owner';

    if (!isAuthor && !isOwner) {
      return res.status(403).json({ message: 'Not authorized to delete this comment' });
    }

    card.comments.pull({ _id: req.params.commentId });
    await card.save();

    return res.json(card);
  } catch (err) {
    next(err);
  }
};

// POST /api/cards/:cardId/attachments - upload via Multer → Cloudinary
exports.addAttachment = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const ext = path.extname(req.file.originalname).toLowerCase();
    if (BLOCKED_EXTENSIONS.has(ext)) {
      return res.status(400).json({ message: 'This file type is not permitted for security reasons' });
    }

    const card = await Card.findById(req.params.cardId);
    if (!card || card.isArchived) return res.status(404).json({ message: 'Card not found' });

    // Upload buffer to Cloudinary via stream
    const uploadFromBuffer = (buffer) =>
      new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { folder: 'labco/attachments' },
          (error, result) => (error ? reject(error) : resolve(result))
        );
        streamifier.createReadStream(buffer).pipe(uploadStream);
      });

    const result = await uploadFromBuffer(req.file.buffer);

    card.attachments.push({
      url: result.secure_url,
      filename: req.file.originalname,
    });
    await card.save();

    return res.json(card);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/cards/:cardId/attachments/:attachmentId
exports.removeAttachment = async (req, res, next) => {
  try {
    const card = await Card.findById(req.params.cardId);
    if (!card || card.isArchived) return res.status(404).json({ message: 'Card not found' });

    card.attachments = card.attachments.filter(
      (a) => a._id.toString() !== req.params.attachmentId
    );
    await card.save();

    return res.json(card);
  } catch (err) {
    next(err);
  }
};
