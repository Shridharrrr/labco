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
    invitations: [
      {
        email: { type: String, required: true },
        role: { type: String, enum: ['editor', 'viewer'], default: 'editor' },
        token: { type: String, required: true },
        createdAt: { type: Date, default: Date.now, expires: '7d' } // auto delete after 7 days
      }
    ],
    columns: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Column' }],
    background: { type: String, default: '#1e1b4b' },
    stars: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    isArchived: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Board', boardSchema);
