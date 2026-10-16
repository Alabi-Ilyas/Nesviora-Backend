const mongoose = require('mongoose');
const toJSON = require('../utils/toJSON');

const messageSchema = new mongoose.Schema(
  {
    sender: { type: String, enum: ['user', 'support'], required: true },
    text: { type: String, required: true, trim: true, maxlength: 2000 },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

const ticketSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    subject: { type: String, required: true, trim: true, maxlength: 200 },
    category: { type: String, default: 'general', trim: true, maxlength: 50 },
    priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
    status: { type: String, enum: ['open', 'in_progress', 'resolved', 'closed'], default: 'open', index: true },
    message: { type: String, required: true, maxlength: 2000 },
    messages: { type: [messageSchema], default: [] },
  },
  { timestamps: true }
);

ticketSchema.plugin(toJSON);

module.exports = mongoose.model('SupportTicket', ticketSchema);
