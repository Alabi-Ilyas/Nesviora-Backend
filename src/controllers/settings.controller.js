const Settings = require('../models/Settings');
const asyncHandler = require('../utils/asyncHandler');
const { ok } = require('../utils/response');
const { toCents } = require('../utils/money');

const shape = (s) => ({
  fees: {
    depositFee: s.fees.depositFee,
    withdrawalFee: s.fees.withdrawalFee,
    investmentFee: s.fees.investmentFee,
  },
  limits: { minWithdrawal: s.limits.minWithdrawalCents / 100 },
});

exports.get = asyncHandler(async (req, res) => ok(res, shape(await Settings.get())));

exports.adminUpdate = asyncHandler(async (req, res) => {
  const s = await Settings.get();
  if (req.body.fees) Object.assign(s.fees, req.body.fees);
  if (req.body.minWithdrawal !== undefined) s.limits.minWithdrawalCents = toCents(req.body.minWithdrawal);
  await s.save();
  ok(res, shape(s));
});
