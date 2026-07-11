const mongoose = require('mongoose');

const columnSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    board: { type: mongoose.Schema.Types.ObjectId, ref: 'Board', required: true },
    cards: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Card' }],
    order: { type: Number, default: 0 },
    color: { type: String, default: '#6366f1' },
    // 'initial' = starting column (cards auto-get 'started' status)
    // 'final'   = completed column (cards auto-get 'completed' status)
    // 'none'    = regular column
    columnType: { type: String, enum: ['none', 'initial', 'final'], default: 'none' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Column', columnSchema);
