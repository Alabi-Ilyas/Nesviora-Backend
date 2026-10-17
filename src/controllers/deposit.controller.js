const Deposit = require('../models/Deposit');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { ok } = require('../utils/response');
const { getPagination } = require('../utils/pagination');
const { atomic } = require('../utils/atomic');
const { toCents } = require('../utils/money');
const reference = require('../utils/reference');

const MAX_PENDING_PER_USER = 10;

// ----- user -----
exports.create = asyncHandler(async (req, res) => {
  const pending = await Deposit.countDocuments({ userId: req.user.id, status: 'pending' });
  if (pending >= MAX_PENDING_PER_USER) {
    throw new ApiError(429, 'You have too many pending deposits. Please wait for them to be reviewed.');
  }
  const deposit = await Deposit.create({ ...req.body, userId: req.user.id, reference: reference('DEP') });
  ok(res, deposit, undefined, 201);
});

exports.listMine = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = { userId: req.user.id };
  const [items, total] = await Promise.all([
    Deposit.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Deposit.countDocuments(filter),
  ]);
  ok(res, items, { page, limit, total });
});

// ----- admin -----
const withUser = (d) => {
  const o = d.toJSON();
  const u = d.userId && d.userId._id ? d.userId : null;
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
    Deposit.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('userId', 'firstName lastName email'),
    Deposit.countDocuments(filter),
  ]);
  ok(res, items.map(withUser), { page, limit, total });
});

// Only a pending deposit can be reviewed, and the status flip is the guard against crediting twice:
// the second of two concurrent approvals matches nothing and gets a 409.
exports.adminReview = asyncHandler(async (req, res) => {
  const { status, note, creditedAmount } = req.body;
  const creditCents = status === 'confirmed' ? toCents(creditedAmount) : null;

  const deposit = await atomic(async (session) => {
    const set = { status, reviewedBy: req.user._id, reviewedAt: new Date() };
    if (note !== undefined) set.note = note;
    if (creditCents !== null) set.creditedAmountCents = creditCents;

    const dep = await Deposit.findOneAndUpdate({ _id: req.params.id, status: 'pending' }, { $set: set }, { new: true, session });
    if (!dep) {
      const exists = await Deposit.exists({ _id: req.params.id }).session(session || null);
      throw new ApiError(exists ? 409 : 404, exists ? 'This deposit has already been reviewed' : 'Deposit not found');
    }

    if (status === 'confirmed') {
      const user = await User.findOneAndUpdate({ _id: dep.userId }, { $inc: { balanceCents: creditCents } }, { new: true, session });
      if (!user) throw new ApiError(404, 'Deposit owner not found');
      await Transaction.create(
        [
          {
            userId: dep.userId,
            type: 'deposit',
            asset: dep.currency,
            amountCents: creditCents,
            balanceAfterCents: user.balanceCents,
            status: 'completed',
            reference: reference('TXN'),
            hash: dep.txHash,
            description: `Deposit ${dep.reference} (${dep.amount} ${dep.currency})`,
            refType: 'Deposit',
            refId: dep._id,
          },
        ],
        { session }
      );
    }
    return dep;
  });

  ok(res, deposit);
});
