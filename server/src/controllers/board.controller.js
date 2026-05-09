const Board = require('../models/Board');
const Column = require('../models/Column');
const Card = require('../models/Card');
const User = require('../models/User');
const { writeActivity } = require('../services/activity.service');

// GET /api/boards — all boards for current user
exports.getBoards = async (req, res, next) => {
  try {
    const boards = await Board.find({
      'members.user': req.user.userId,
      isArchived: false,
    }).populate('owner', 'name email avatar');
    return res.json(boards);
  } catch (err) {
    next(err);
  }
};

// POST /api/boards — create board
exports.createBoard = async (req, res, next) => {
  try {
    const { title, description, background } = req.body;
    if (!title) return res.status(400).json({ message: 'title is required' });

    const board = await Board.create({
      title,
      description,
      background,
      owner: req.user.userId,
      members: [{ user: req.user.userId, role: 'owner' }],
    });

    await writeActivity({
      boardId: board._id,
      userId: req.user.userId,
      type: 'board.created',
      payload: { boardTitle: title },
    });

    return res.status(201).json(board);
  } catch (err) {
    next(err);
  }
};

// GET /api/boards/:boardId — full board with columns + cards
exports.getBoard = async (req, res, next) => {
  try {
    const board = await Board.findById(req.params.boardId)
      .populate('owner', 'name email avatar')
      .populate('members.user', 'name email avatar');

    if (!board) return res.status(404).json({ message: 'Board not found' });

    // Load columns in order
    const columns = await Column.find({ board: board._id }).sort('order');

    // Load cards for all columns
    const cards = await Card.find({
      board: board._id,
      isArchived: false,
    })
      .populate('assignees', 'name email avatar')
      .sort('order');

    return res.json({ board, columns, cards });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/boards/:boardId — update title/description/background
exports.updateBoard = async (req, res, next) => {
  try {
    const { title, description, background } = req.body;
    const board = req.board; // set by boardAccess middleware

    if (title) board.title = title;
    if (description !== undefined) board.description = description;
    if (background) board.background = background;

    await board.save();
    return res.json(board);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/boards/:boardId — archive board (owner only)
exports.archiveBoard = async (req, res, next) => {
  try {
    req.board.isArchived = true;
    await req.board.save();
    return res.json({ message: 'Board archived' });
  } catch (err) {
    next(err);
  }
};

// POST /api/boards/:boardId/members — invite member (owner only)
exports.inviteMember = async (req, res, next) => {
  try {
    const { email, role = 'editor' } = req.body;
    if (!email) return res.status(400).json({ message: 'email is required' });

    const invitee = await User.findOne({ email });
    if (!invitee) return res.status(404).json({ message: 'User not found' });

    const board = req.board;
    const alreadyMember = board.members.find(
      (m) => m.user.toString() === invitee._id.toString()
    );
    if (alreadyMember) return res.status(409).json({ message: 'User is already a member' });

    board.members.push({ user: invitee._id, role });
    await board.save();
    await board.populate('members.user', 'name email avatar');

    await writeActivity({
      boardId: board._id,
      userId: req.user.userId,
      type: 'member.added',
      payload: { inviteeId: invitee._id, role },
    });

    return res.json(board);
  } catch (err) {
    next(err);
  }
};

// PATCH /api/boards/:boardId/members/:userId — change member role (owner only)
exports.changeMemberRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    const board = req.board;

    const member = board.members.find(
      (m) => m.user.toString() === req.params.userId
    );
    if (!member) return res.status(404).json({ message: 'Member not found' });
    member.role = role;
    await board.save();
    await board.populate('members.user', 'name email avatar');
    
    return res.json(board);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/boards/:boardId/members/:userId — remove member (owner only)
exports.removeMember = async (req, res, next) => {
  try {
    const board = req.board;
    board.members = board.members.filter(
      (m) => m.user.toString() !== req.params.userId
    );
    await board.save();
    await board.populate('members.user', 'name email avatar');

    await writeActivity({
      boardId: board._id,
      userId: req.user.userId,
      type: 'member.removed',
      payload: { removedUserId: req.params.userId },
    });

    return res.json(board);
  } catch (err) {
    next(err);
  }
};
