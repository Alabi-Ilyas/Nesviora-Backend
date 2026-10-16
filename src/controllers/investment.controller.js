const Investment = require('../models/Investment');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { ok } = require('../utils/response');
const { getPagination } = require('../utils/pagination');

// ----- user (read-only) -----
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
