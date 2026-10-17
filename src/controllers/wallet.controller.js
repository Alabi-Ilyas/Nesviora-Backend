const Transaction = require('../models/Transaction');
const asyncHandler = require('../utils/asyncHandler');
const { ok } = require('../utils/response');
const { getPagination } = require('../utils/pagination');

exports.getWallet = asyncHandler(async (req, res) => {
  ok(res, { balance: req.user.balanceCents / 100, currency: 'USD' });
});

const withUser = (tx) => {
  const o = tx.toJSON();
  const u = tx.userId && tx.userId._id ? tx.userId : null;
  if (u) {
    o.userId = u.id;
    o.user = { id: u.id, name: `${u.firstName} ${u.lastName}`, email: u.email };
  }
  return o;
};

exports.listMine = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = { userId: req.user.id };
  if (req.query.type) filter.type = req.query.type;
  if (req.query.status) filter.status = req.query.status;
  const [items, total] = await Promise.all([
    Transaction.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Transaction.countDocuments(filter),
  ]);
  ok(res, items, { page, limit, total });
});

exports.adminList = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = {};
  for (const k of ['type', 'status', 'userId']) if (req.query[k]) filter[k] = req.query[k];
  const [items, total] = await Promise.all([
    Transaction.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('userId', 'firstName lastName email'),
    Transaction.countDocuments(filter),
  ]);
  ok(res, items.map(withUser), { page, limit, total });
});
