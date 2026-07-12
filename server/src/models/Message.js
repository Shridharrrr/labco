const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    board: { type: mongoose.Schema.Types.ObjectId, ref: 'Board', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, trim: true, maxlength: 2000, default: '' },
    type: { type: String, enum: ['text', 'system'], default: 'text' },
    attachments: [
      {
        url: { type: String },
        filename: { type: String },
        uploadedAt: { type: Date, default: Date.now },
        publicId: { type: String },
      },
    ],
  },
  { timestamps: true }
);

messageSchema.index({ board: 1, createdAt: -1 });

module.exports = mongoose.model('Message', messageSchema);
