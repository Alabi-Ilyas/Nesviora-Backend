const mongoose = require('mongoose');
const toJSON = require('../utils/toJSON');

const planSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    minAmount: { type: Number, required: true, min: 0 },
    maxAmount: {
      type: Number,
      required: true,
      min: 0,
      validate: {
        validator(v) {
          return v >= this.minAmount;
        },
        message: 'maxAmount must be greater than or equal to minAmount',
      },
    },
    durationDays: { type: Number, required: true, min: 1 },
    description: { type: String, default: '', maxlength: 2000 },
    riskLevel: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    supportedAssets: { type: [String], default: [] },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    fees: { type: Number, default: 0, min: 0 },
    terms: { type: String, default: '', maxlength: 5000 },
    expectedReturnRate: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

planSchema.plugin(toJSON);

module.exports = mongoose.model('InvestmentPlan', planSchema);
