const Investment = require('../models/Investment');
const InvestmentPlan = require('../models/InvestmentPlan');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const { atomic } = require('../utils/atomic');
const { toCents, percentOf } = require('../utils/money');
const reference = require('../utils/reference');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { ok } = require('../utils/response');
const { getPagination } = require('../utils/pagination');

// ----- user -----
// Invests from the wallet balance. The plan is re-read here and the amount re-checked against its
// limits; the debit only succeeds if the balance covers amount + fee.
exports.create = asyncHandler(async (req, res) => {
  const { planId } = req.body;
  const amountCents = toCents(req.body.amount);

  const investment = await atomic(async (session) => {
    const plan = await InvestmentPlan.findOne({ _id: planId, status: 'active' }).session(session || null);
    if (!plan) throw new ApiError(404, 'Plan not found');

    if (amountCents < toCents(plan.minAmount) || amountCents > toCents(plan.maxAmount)) {
      throw new ApiError(400, `Amount must be between $${plan.minAmount} and $${plan.maxAmount} for this plan`);
    }
    const asset = req.body.asset || plan.supportedAssets[0] || 'USD';
    if (plan.supportedAssets.length > 0 && !plan.supportedAssets.includes(asset)) {
      throw new ApiError(400, 'This asset is not supported by the selected plan');
    }

    const feeCents = percentOf(amountCents, plan.fees); // plan.fees is a percentage, charged on top of the amount
    const totalCents = amountCents + feeCents;

    const user = await User.findOneAndUpdate(
      { _id: req.user._id, balanceCents: { $gte: totalCents } },
      { $inc: { balanceCents: -totalCents } },
      { new: true, session }
    );
    if (!user) throw new ApiError(400, 'Insufficient balance');

    const start = new Date();
    const [inv] = await Investment.create(
      [
        {
          userId: user._id,
          planId: plan._id,
          planName: plan.name,
          principal: amountCents / 100,
          currentValue: amountCents / 100,
          startDate: start,
          endDate: new Date(start.getTime() + plan.durationDays * 86400000),
          status: 'active',
          fees: feeCents / 100,
          asset,
          expectedReturnRate: plan.expectedReturnRate,
        },
      ],
      { session }
    );
    await Transaction.create(
      [
        {
          userId: user._id,
          type: 'investment',
          asset,
          amountCents,
          feeCents,
          balanceAfterCents: user.balanceCents,
          status: 'completed',
          reference: reference('TXN'),
          description: `Investment in ${plan.name} plan`,
          refType: 'Investment',
          refId: inv._id,
        },
      ],
      { session }
    );
    return inv;
  });

  ok(res, investment, undefined, 201);
});

// ----- user (read) -----
exports.listMine = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = { userId: req.user.id };
  const [items, total] = await Promise.all([
    Investment.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Investment.countDocuments(filter),
  ]);
  ok(res, items, { page, limit, total });
});

exports.getMine = asyncHandler(async (req, res) => {
  const inv = await Investment.findOne({ _id: req.params.id, userId: req.user.id });
  if (!inv) throw new ApiError(404, 'Investment not found');
  ok(res, inv);
});

// ----- admin (read-only) -----
const withUser = (inv) => {
  const o = inv.toJSON();
  const u = inv.userId && inv.userId._id ? inv.userId : null;
  if (u) {
    o.userId = u.id;
    o.user = { id: u.id, name: `${u.firstName} ${u.lastName}`, email: u.email };
  }
  return o;
};

exports.adminList = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  const userId = req.params.id || req.query.userId; // /admin/users/:id/investments or ?userId=
  if (userId) filter.userId = userId;

  const [items, total] = await Promise.all([
    Investment.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('userId', 'firstName lastName email'),
    Investment.countDocuments(filter),
  ]);
  ok(res, items.map(withUser), { page, limit, total });
});
