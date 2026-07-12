const express = require('express');
const router = express.Router({ mergeParams: true }); // has :boardId from parent
const auth = require('../middleware/auth.middleware');
const boardAccess = require('../middleware/boardAccess.middleware');
const Message = require('../models/Message');
const multer = require('multer');
const cloudinary = require('../config/cloudinary');
const streamifier = require('streamifier');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

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
router.post('/', auth, boardAccess('viewer'), upload.array('files', 5), async (req, res, next) => {
  try {
    const { text } = req.body;
    
    // We must have either text or files
    if ((!text || !text.trim()) && (!req.files || req.files.length === 0)) {
      return res.status(400).json({ message: 'text or files are required' });
    }

    const attachments = [];

    if (req.files && req.files.length > 0) {
      const uploadFromBuffer = (buffer, filename) =>
        new Promise((resolve, reject) => {
          // Add raw resource type for non-images
          const isRaw = !filename.match(/\.(jpeg|jpg|gif|png|webp|svg)($|\?)/i);
          const uploadStream = cloudinary.uploader.upload_stream(
            { folder: 'labco/messages', resource_type: isRaw ? 'raw' : 'auto' },
            (error, result) => (error ? reject(error) : resolve(result))
          );
          streamifier.createReadStream(buffer).pipe(uploadStream);
        });

      for (const file of req.files) {
        const result = await uploadFromBuffer(file.buffer, file.originalname);
        attachments.push({
          url: result.secure_url,
          filename: file.originalname,
        });
      }
    }

    const msg = await Message.create({
      board: req.params.boardId,
      user: req.user.userId,
      text: text ? text.trim() : '',
      attachments,
    });

    await msg.populate('user', 'name email avatar');
    return res.status(201).json(msg);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
