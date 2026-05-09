const mongoose = require('mongoose');

const boardSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    members: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        role: { type: String, enum: ['owner', 'editor', 'viewer'], default: 'editor' },
      },
    ],
    columns: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Column' }],
    background: { type: String, default: '#1e1b4b' },
    isArchived: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Board', boardSchema);
