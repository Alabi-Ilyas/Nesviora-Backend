const mongoose = require('mongoose');
const toJSON = require('../utils/toJSON');

// amount/currency = what the user says they sent (crypto units). creditedAmountCents = the USD value
// an admin credits to the wallet on approval; it is the only number that touches the balance.
const depositSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, required: true, uppercase: true, trim: true, maxlength: 10 },
    method: { type: String, default: 'Crypto transfer', trim: true, maxlength: 100 },
    txHash: { type: String, default: '', trim: true, maxlength: 200 },
    reference: { type: String, required: true, unique: true },
    status: { type: String, enum: ['pending', 'confirmed', 'failed', 'cancelled'], default: 'pending', index: true },
    creditedAmountCents: { type: Number, default: null, min: 0 },
    note: { type: String, default: '', maxlength: 500 },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    reviewedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

depositSchema.plugin(toJSON);

module.exports = mongoose.model('Deposit', depositSchema);
