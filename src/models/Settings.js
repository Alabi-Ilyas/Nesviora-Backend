const mongoose = require('mongoose');

// Single document. Fees are percentages.
const settingsSchema = new mongoose.Schema(
  {
    key: { type: String, default: 'platform', unique: true },
    fees: {
      depositFee: { type: Number, default: 0, min: 0, max: 100 },
      withdrawalFee: { type: Number, default: 1, min: 0, max: 100 },
      investmentFee: { type: Number, default: 0, min: 0, max: 100 },
    },
    limits: {
      minWithdrawalCents: { type: Number, default: 1000, min: 0 }, // $10
    },
  },
  { timestamps: true }
);

settingsSchema.statics.get = async function get(session) {
  const found = await this.findOne({ key: 'platform' }).session(session || null);
  if (found) return found;
  try {
    const [created] = await this.create([{ key: 'platform' }], { session });
    return created;
  } catch (err) {
    if (err && err.code === 11000) return this.findOne({ key: 'platform' }).session(session || null); // lost a race
    throw err;
  }
};

module.exports = mongoose.model('Settings', settingsSchema);
