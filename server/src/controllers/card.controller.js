const Card = require('../models/Card');
const Column = require('../models/Column');
const cloudinary = require('../config/cloudinary');
const { writeActivity } = require('../services/activity.service');
const streamifier = require('streamifier');

// POST /api/columns/:columnId/cards
exports.createCard = async (req, res, next) => {
  try {
    const { title, description } = req.body;
    if (!title) return res.status(400).json({ message: 'title is required' });

    const column = await Column.findById(req.params.columnId);
    if (!column) return res.status(404).json({ message: 'Column not found' });

    const order = column.cards.length;

    // Auto-assign status based on column type
    const statusMap = { initial: 'started', final: 'completed', none: 'none' };
    const status = statusMap[column.columnType] || 'none';

    const card = await Card.create({
      title,
      description,
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
      payload: { cardId: card._id, columnId: column._id, title },
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
      .populate('assignees', 'name email avatar')
      .populate('comments.author', 'name email avatar');
    if (!card || card.isArchived) return res.status(404).json({ message: 'Card not found' });
    return res.json(card);
  } catch (err) {
    next(err);
  }
};

// PATCH /api/cards/:cardId — update any field
exports.updateCard = async (req, res, next) => {
  try {
    const allowedFields = [
      'title', 'description', 'assignees', 'labels',
      'dueDate', 'checklist', 'coverColor', 'comments',
    ];
    const updates = {};
    allowedFields.forEach((f) => {
      if (req.body[f] !== undefined) updates[f] = req.body[f];
    });

    const card = await Card.findByIdAndUpdate(
      req.params.cardId,
      { $set: updates },
      { new: true, runValidators: true }
    ).populate('assignees', 'name email avatar');

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

// DELETE /api/cards/:cardId — archive card
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

    const isSameColumn = fromColumnId === toColumnId;

    // Remove from source column
    await Column.findByIdAndUpdate(fromColumnId, { $pull: { cards: card._id } });

    // Insert into target column at correct position
    const targetCol = await Column.findById(toColumnId);
    if (!targetCol) return res.status(404).json({ message: 'Target column not found' });

    targetCol.cards.splice(newOrder, 0, card._id);
    await targetCol.save();

    // Auto-assign status based on target column type
    const statusMap = { initial: 'started', final: 'completed', none: 'none' };
    const newStatus = statusMap[targetCol.columnType] || 'none';

    // Update card's column reference, order, and status
    card.column = toColumnId;
    card.order = newOrder;
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
      payload: { cardId: card._id, fromColumnId, toColumnId, newOrder },
    });

    return res.json(card);
  } catch (err) {
    next(err);
  }
};

// POST /api/cards/:cardId/attachments — upload via Multer → Cloudinary
exports.addAttachment = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const card = await Card.findById(req.params.cardId);
    if (!card) return res.status(404).json({ message: 'Card not found' });

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
    if (!card) return res.status(404).json({ message: 'Card not found' });

    card.attachments = card.attachments.filter(
      (a) => a._id.toString() !== req.params.attachmentId
    );
    await card.save();

    return res.json(card);
  } catch (err) {
    next(err);
  }
};
