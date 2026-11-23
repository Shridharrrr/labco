const mongoose = require('mongoose');
const Board = require('../models/Board');
const Column = require('../models/Column');
const Card = require('../models/Card');
const User = require('../models/User');
const { writeActivity } = require('../services/activity.service');
const { sendInviteEmail } = require('../services/email.service');
const crypto = require('crypto');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ALLOWED_MEMBER_ROLES = ['editor', 'viewer'];

// GET /api/boards/invitations/pending — get invitations for current user
exports.getPendingInvitations = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const boards = await Board.find({
      'invitations.email': user.email,
      isArchived: false,
    })
      .select('title invitations owner')
      .populate('owner', 'name email avatar');

    const pending = boards.map((b) => {
      const inv = b.invitations.find((i) => i.email === user.email);
      return {
        boardId: b._id,
        boardTitle: b.title,
        owner: b.owner,
        role: inv?.role,
        token: inv?.token,
        createdAt: inv?.createdAt,
      };
    }).filter((i) => i.token);

    return res.json(pending);
  } catch (err) {
    next(err);
  }
};

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
    const { title, description = '', background = '#1e1b4b' } = req.body;
    if (typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({ message: 'title is required' });
    }

    const cleanTitle = title.trim().slice(0, 100);
    const cleanDesc = typeof description === 'string' ? description.slice(0, 5000) : '';

    const board = await Board.create({
      title: cleanTitle,
      description: cleanDesc,
      background: typeof background === 'string' ? background : '#1e1b4b',
      owner: req.user.userId,
      members: [{ user: req.user.userId, role: 'owner' }],
    });

    await writeActivity({
      boardId: board._id,
      userId: req.user.userId,
      type: 'board.created',
      payload: { boardTitle: cleanTitle },
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

    if (!board || board.isArchived) return res.status(404).json({ message: 'Board not found' });

    // Load columns in order
    const columns = await Column.find({ board: board._id }).sort('order');

    // Load cards for all columns
    const cards = await Card.find({
      board: board._id,
      isArchived: false,
    })
      .populate('assignees', 'name email avatar')
      .populate('comments.author', 'name email avatar')
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
    const board = req.board;

    if (title !== undefined) {
      if (typeof title !== 'string' || !title.trim()) {
        return res.status(400).json({ message: 'title cannot be empty' });
      }
      board.title = title.trim().slice(0, 100);
    }

    if (description !== undefined) {
      board.description = typeof description === 'string' ? description.slice(0, 5000) : '';
    }

    if (background !== undefined && typeof background === 'string') {
      board.background = background;
    }

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
    if (typeof email !== 'string' || !email.trim()) {
      return res.status(400).json({ message: 'email is required' });
    }

    const cleanEmail = email.trim().toLowerCase();
    if (!EMAIL_REGEX.test(cleanEmail)) {
      return res.status(400).json({ message: 'Invalid email address format' });
    }

    if (!ALLOWED_MEMBER_ROLES.includes(role)) {
      return res.status(400).json({ message: 'role must be editor or viewer' });
    }

    const board = req.board;

    // Check if inviter is trying to invite themselves
    if (cleanEmail === req.user.email) {
      return res.status(400).json({ message: 'You are already the owner of this board' });
    }

    // Check if already a member
    const invitee = await User.findOne({ email: cleanEmail });
    if (invitee) {
      const alreadyMember = board.members.find(
        (m) => m.user && m.user.toString() === invitee._id.toString()
      );
      if (alreadyMember) return res.status(409).json({ message: 'User is already a member' });
    }

    // Check if already invited
    const alreadyInvited = board.invitations?.find((i) => i.email === cleanEmail);
    if (alreadyInvited) return res.status(409).json({ message: 'User is already invited' });

    // Generate token
    const token = crypto.randomBytes(24).toString('hex');

    if (!board.invitations) board.invitations = [];
    board.invitations.push({ email: cleanEmail, role, token });
    await board.save();

    // Send email
    const inviter = await User.findById(req.user.userId);
    await sendInviteEmail({
      to: cleanEmail,
      inviterName: inviter?.name || inviter?.email || 'A team member',
      boardTitle: board.title,
      boardId: board._id,
      token,
    });

    return res.json({ message: 'Invitation sent' });
  } catch (err) {
    next(err);
  }
};

// POST /api/boards/:boardId/accept-invite
exports.acceptInvite = async (req, res, next) => {
  try {
    const { token } = req.body;
    if (typeof token !== 'string' || !token.trim()) {
      return res.status(400).json({ message: 'token is required' });
    }

    const board = await Board.findById(req.params.boardId);
    if (!board || board.isArchived) return res.status(404).json({ message: 'Board not found' });

    const invitationIndex = board.invitations.findIndex((i) => i.token === token.trim());
    if (invitationIndex === -1) {
      return res.status(400).json({ message: 'Invalid or expired invitation token' });
    }

    const invitation = board.invitations[invitationIndex];
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.email.toLowerCase() !== invitation.email.toLowerCase()) {
      return res.status(403).json({ message: `This invitation was sent to ${invitation.email}` });
    }

    const alreadyMember = board.members.find(
      (m) => m.user && m.user.toString() === user._id.toString()
    );

    if (!alreadyMember) {
      board.members.push({ user: user._id, role: invitation.role });
    }

    // Remove invitation
    board.invitations.splice(invitationIndex, 1);
    await board.save();

    await writeActivity({
      boardId: board._id,
      userId: user._id,
      type: 'member.added',
      payload: { inviteeId: user._id, role: invitation.role },
    });

    return res.json({ message: 'Invitation accepted successfully' });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/boards/:boardId/invitations/:email (owner only)
exports.revokeInvitation = async (req, res, next) => {
  try {
    const board = req.board;
    const cleanEmail = req.params.email ? decodeURIComponent(req.params.email).toLowerCase() : '';

    const initialLength = board.invitations?.length || 0;
    board.invitations = board.invitations?.filter((i) => i.email.toLowerCase() !== cleanEmail) || [];

    if (board.invitations.length === initialLength) {
      return res.status(404).json({ message: 'Invitation not found' });
    }

    await board.save();
    await board.populate('members.user', 'name email avatar');

    return res.json(board);
  } catch (err) {
    next(err);
  }
};

// PATCH /api/boards/:boardId/members/:userId — change member role (owner only)
exports.changeMemberRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    const { userId } = req.params;
    const board = req.board;

    if (!ALLOWED_MEMBER_ROLES.includes(role)) {
      return res.status(400).json({ message: 'Role must be editor or viewer' });
    }

    // Prevent changing the role of the board owner
    if (userId === board.owner.toString()) {
      return res.status(400).json({ message: 'Cannot modify board owner role' });
    }

    const member = board.members.find(
      (m) => m.user && m.user.toString() === userId
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
    const { userId } = req.params;
    const board = req.board;

    // Prevent removing the board owner
    if (userId === board.owner.toString()) {
      return res.status(400).json({ message: 'Cannot remove board owner' });
    }

    board.members = board.members.filter(
      (m) => m.user && m.user.toString() !== userId
    );
    await board.save();
    await board.populate('members.user', 'name email avatar');

    await writeActivity({
      boardId: board._id,
      userId: req.user.userId,
      type: 'member.removed',
      payload: { removedUserId: userId },
    });

    return res.json(board);
  } catch (err) {
    next(err);
  }
};

// POST /api/boards/:boardId/star — toggle favorite star for user
exports.toggleStar = async (req, res, next) => {
  try {
    const board = req.board;
    const userId = req.user.userId;

    if (!board.stars) board.stars = [];
    const index = board.stars.findIndex((id) => id && id.toString() === userId.toString());

    if (index > -1) {
      board.stars.splice(index, 1);
    } else {
      board.stars.push(userId);
    }

    await board.save();
    return res.json(board);
  } catch (err) {
    next(err);
  }
};
