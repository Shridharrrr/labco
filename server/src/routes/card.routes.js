const express = require('express');
const router = express.Router({ mergeParams: true });
const auth = require('../middleware/auth.middleware');
const boardAccess = require('../middleware/boardAccess.middleware');
const multer = require('multer');
const {
  getCard,
  updateCard,
  archiveCard,
  moveCard,
  addAttachment,
  removeAttachment,
  addComment,
  deleteComment,
} = require('../controllers/card.controller');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// Load board from card for boardAccess
const Card = require('../models/Card');
const loadBoardFromCard = async (req, res, next) => {
  try {
    const card = await Card.findById(req.params.cardId);
    if (!card) return res.status(404).json({ message: 'Card not found' });
    req.params.boardId = card.board.toString();
    next();
  } catch (err) {
    next(err);
  }
};

// GET /api/cards/:cardId
router.get('/:cardId', auth, loadBoardFromCard, boardAccess('viewer'), getCard);

// PATCH /api/cards/:cardId
router.patch('/:cardId', auth, loadBoardFromCard, boardAccess('editor'), updateCard);

// DELETE /api/cards/:cardId
router.delete('/:cardId', auth, loadBoardFromCard, boardAccess('editor'), archiveCard);

// PATCH /api/cards/:cardId/move
router.patch('/:cardId/move', auth, loadBoardFromCard, boardAccess('editor'), moveCard);

// POST /api/cards/:cardId/comments
router.post('/:cardId/comments', auth, loadBoardFromCard, boardAccess('editor'), addComment);

// DELETE /api/cards/:cardId/comments/:commentId
router.delete('/:cardId/comments/:commentId', auth, loadBoardFromCard, boardAccess('editor'), deleteComment);

// POST /api/cards/:cardId/attachments
router.post('/:cardId/attachments', auth, loadBoardFromCard, boardAccess('editor'), upload.single('file'), addAttachment);

// DELETE /api/cards/:cardId/attachments/:attachmentId
router.delete('/:cardId/attachments/:attachmentId', auth, loadBoardFromCard, boardAccess('editor'), removeAttachment);

module.exports = router;
