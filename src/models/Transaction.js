const mongoose = require('mongoose');
const toJSON = require('../utils/toJSON');

// The ledger: one row per balance movement. Amounts are USD cents.
// A withdrawal row is created when the balance is debited and its status is updated as it is reviewed.
const transactionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: {
      type: String,
      enum: ['deposit', 'withdrawal', 'investment', 'mining', 'transfer', 'fee', 'adjustment', 'reward'],
      required: true,
    },
    asset: { type: String, default: 'USD' },
    amountCents: { type: Number, required: true, min: 0 },
    feeCents: { type: Number, default: 0, min: 0 },
    balanceAfterCents: { type: Number, default: null },
    status: {
      type: String,
      enum: ['completed', 'pending', 'failed', 'processing', 'cancelled', 'rejected'],
      default: 'completed',
    },
    reference: { type: String, required: true, unique: true },
    hash: { type: String, default: '' },
    description: { type: String, default: '', maxlength: 300 },
    refType: { type: String, enum: ['Deposit', 'Withdrawal', 'Investment', null], default: null },
    refId: { type: mongoose.Schema.Types.ObjectId, default: null, index: true },
  },
  { timestamps: true }
);

transactionSchema.plugin(toJSON);

module.exports = mongoose.model('Transaction', transactionSchema);
