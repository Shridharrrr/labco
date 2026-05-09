const Activity = require('../models/Activity');

/**
 * Write an activity log entry. Called from every mutating controller action.
 * @param {Object} param0 - { boardId, userId, type, payload }
 */
const writeActivity = async ({ boardId, userId, type, payload = {} }) => {
  try {
    await Activity.create({ board: boardId, user: userId, type, payload });
  } catch (err) {
    // Non-fatal — log and continue
    console.error('Activity log write failed:', err.message);
  }
};

module.exports = { writeActivity };
