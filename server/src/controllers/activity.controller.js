const Activity = require('../models/Activity');

// GET /api/boards/:boardId/activity?page=1&limit=20
exports.getActivity = async (req, res, next) => {
  try {
    const { boardId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const [activities, total] = await Promise.all([
      Activity.find({ board: boardId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('user', 'name email avatar'),
      Activity.countDocuments({ board: boardId }),
    ]);

    return res.json({
      activities,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
};
