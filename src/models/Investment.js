const mongoose = require('mongoose');
const toJSON = require('../utils/toJSON');

// Phase 1: read-only on the API. Creation arrives with deposit approval in Phase 2.
const investmentSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    planId: { type: mongoose.Schema.Types.ObjectId, ref: 'InvestmentPlan', required: true, index: true },
    planName: { type: String, required: true },
    principal: { type: Number, required: true, min: 0 },
    currentValue: { type: Number, required: true, min: 0 },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    status: { type: String, enum: ['active', 'completed', 'pending', 'cancelled'], default: 'pending' },
    fees: { type: Number, default: 0, min: 0 },
    asset: { type: String, required: true },
    expectedReturnRate: { type: Number, default: 0 },
  },
  { timestamps: true }
);

investmentSchema.plugin(toJSON);

module.exports = mongoose.model('Investment', investmentSchema);
