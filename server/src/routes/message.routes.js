const express = require('express');
const router = express.Router({ mergeParams: true }); // has :boardId from parent
const auth = require('../middleware/auth.middleware');
const boardAccess = require('../middleware/boardAccess.middleware');
const Message = require('../models/Message');

// GET /api/boards/:boardId/messages?limit=50&before=<messageId>
router.get('/', auth, boardAccess('viewer'), async (req, res, next) => {
  try {
    const { limit = 50, before } = req.query;
    const query = { board: req.params.boardId };
    if (before) query._id = { $lt: before };

    const messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .populate('user', 'name email avatar');

    return res.json(messages.reverse()); // oldest first
  } catch (err) {
    next(err);
  }
});

// POST /api/boards/:boardId/messages
router.post('/', auth, boardAccess('viewer'), async (req, res, next) => {
  try {
    const { text } = req.body;
    if (!text?.trim()) return res.status(400).json({ message: 'text is required' });

    const msg = await Message.create({
      board: req.params.boardId,
      user: req.user.userId,
      text: text.trim(),
    });

    await msg.populate('user', 'name email avatar');
    return res.status(201).json(msg);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
