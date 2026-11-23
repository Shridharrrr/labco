const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema(
  {
    board: { type: mongoose.Schema.Types.ObjectId, ref: 'Board', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      enum: [
        'card.created',
        'card.moved',
        'card.deleted',
        'card.updated',
        'column.created',
        'column.deleted',
        'column.renamed',
        'member.added',
        'member.removed',
        'board.created',
      ],
      required: true,
    },
    payload: { type: Object, default: {} },
  },
  { timestamps: true }
);

// Activity is append-only - no updates or deletes
module.exports = mongoose.model('Activity', activitySchema);
