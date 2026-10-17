const Withdrawal = require('../models/Withdrawal');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const Settings = require('../models/Settings');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { ok } = require('../utils/response');
const { getPagination } = require('../utils/pagination');
const { atomic } = require('../utils/atomic');
const { toCents, percentOf } = require('../utils/money');
const reference = require('../utils/reference');

// ----- user -----
// The fee is computed here from platform settings; any fee sent by the client is ignored.
// The balance is debited immediately (amount + fee) so the same money cannot be withdrawn or invested twice.
exports.create = asyncHandler(async (req, res) => {
  const { asset, destinationAddress, network } = req.body;
  const amountCents = toCents(req.body.amount);

  const withdrawal = await atomic(async (session) => {
    const settings = await Settings.get(session);
    if (amountCents < settings.limits.minWithdrawalCents) {
      throw new ApiError(400, `Minimum withdrawal is $${(settings.limits.minWithdrawalCents / 100).toFixed(2)}`);
    }
    const feeCents = percentOf(amountCents, settings.fees.withdrawalFee);
    const totalCents = amountCents + feeCents;

    const user = await User.findOneAndUpdate(
      { _id: req.user._id, balanceCents: { $gte: totalCents } },
      { $inc: { balanceCents: -totalCents } },
      { new: true, session }
    );
    if (!user) throw new ApiError(400, 'Insufficient balance');

    const [w] = await Withdrawal.create(
      [{ userId: user._id, amountCents, feeCents, asset, destinationAddress, network, reference: reference('WDR') }],
      { session }
    );
    await Transaction.create(
      [
        {
          userId: user._id,
          type: 'withdrawal',
          asset,
          amountCents,
          feeCents,
          balanceAfterCents: user.balanceCents,
          status: 'pending',
          reference: reference('TXN'),
          description: `Withdrawal ${w.reference} to ${destinationAddress.slice(0, 10)}...`,
          refType: 'Withdrawal',
          refId: w._id,
        },
      ],
      { session }
    );
    return w;
  });

  ok(res, withdrawal, undefined, 201);
});

exports.listMine = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = { userId: req.user.id };
  const [items, total] = await Promise.all([
    Withdrawal.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Withdrawal.countDocuments(filter),
  ]);
  ok(res, items, { page, limit, total });
});

// ----- admin -----
const withUser = (w) => {
  const o = w.toJSON();
  const u = w.userId && w.userId._id ? w.userId : null;
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
  if (req.query.userId) filter.userId = req.query.userId;
  const [items, total] = await Promise.all([
    Withdrawal.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('userId', 'firstName lastName email'),
    Withdrawal.countDocuments(filter),
  ]);
  ok(res, items.map(withUser), { page, limit, total });
});

const ALLOWED_FROM = { processing: ['pending'], completed: ['pending', 'processing'], rejected: ['pending', 'processing'] };

exports.adminReview = asyncHandler(async (req, res) => {
  const { status, hash, note } = req.body;

  const withdrawal = await atomic(async (session) => {
    const set = { status, reviewedBy: req.user._id, reviewedAt: new Date() };
    if (hash) set.hash = hash;
    if (note !== undefined) set.note = note;

    // The status filter makes each transition happen once; a rejected withdrawal cannot be refunded twice.
    const w = await Withdrawal.findOneAndUpdate(
      { _id: req.params.id, status: { $in: ALLOWED_FROM[status] } },
      { $set: set },
      { new: true, session }
    );
    if (!w) {
      const exists = await Withdrawal.exists({ _id: req.params.id }).session(session || null);
      throw new ApiError(exists ? 409 : 404, exists ? `This withdrawal can no longer be set to ${status}` : 'Withdrawal not found');
    }

    const txSet = { status };
    if (hash) txSet.hash = hash;
    await Transaction.findOneAndUpdate({ type: 'withdrawal', refType: 'Withdrawal', refId: w._id }, { $set: txSet }, { session });

    if (status === 'rejected') {
      const refundCents = w.amountCents + w.feeCents;
      const user = await User.findOneAndUpdate({ _id: w.userId }, { $inc: { balanceCents: refundCents } }, { new: true, session });
      if (!user) throw new ApiError(404, 'Withdrawal owner not found');
      await Transaction.create(
        [
          {
            userId: w.userId,
            type: 'adjustment',
            asset: 'USD',
            amountCents: refundCents,
            balanceAfterCents: user.balanceCents,
            status: 'completed',
            reference: reference('TXN'),
            description: `Refund for rejected withdrawal ${w.reference}`,
            refType: 'Withdrawal',
            refId: w._id,
          },
        ],
        { session }
      );
    }
    return w;
  });

  ok(res, withdrawal);
});
