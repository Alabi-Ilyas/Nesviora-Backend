const mongoose = require('mongoose');
const toJSON = require('../utils/toJSON');

// amountCents/feeCents are USD. The user is debited amount + fee when the request is made.
const withdrawalSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    amountCents: { type: Number, required: true, min: 1 },
    feeCents: { type: Number, required: true, min: 0 },
    asset: { type: String, required: true, uppercase: true, trim: true, maxlength: 10 },
    destinationAddress: { type: String, required: true, trim: true, maxlength: 200 },
    network: { type: String, default: '', trim: true, maxlength: 30 },
    reference: { type: String, required: true, unique: true },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'rejected', 'cancelled'],
      default: 'pending',
      index: true,
    },
    hash: { type: String, default: '', trim: true, maxlength: 200 },
    note: { type: String, default: '', maxlength: 500 },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    reviewedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

withdrawalSchema.plugin(toJSON);

module.exports = mongoose.model('Withdrawal', withdrawalSchema);
