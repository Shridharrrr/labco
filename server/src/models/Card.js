const mongoose = require('mongoose');

const cardSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' }, // markdown supported
    column: { type: mongoose.Schema.Types.ObjectId, ref: 'Column', required: true },
    board: { type: mongoose.Schema.Types.ObjectId, ref: 'Board', required: true },
    order: { type: Number, default: 0 },
    assignees: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    labels: [
      {
        text: { type: String },
        color: { type: String },
      },
    ],
    dueDate: { type: Date, default: null },
    checklist: [
      {
        text: { type: String },
        completed: { type: Boolean, default: false },
      },
    ],
    attachments: [
      {
        url: { type: String },
        filename: { type: String },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    comments: [
      {
        author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        text: { type: String },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    coverColor: { type: String, default: '' },
    isArchived: { type: Boolean, default: false },
    // 'none' | 'started' | 'completed'
    status: { type: String, enum: ['none', 'started', 'completed'], default: 'none' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Card', cardSchema);
