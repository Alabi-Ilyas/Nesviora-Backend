const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { ok } = require('../utils/response');
const { getPagination, escapeRegex } = require('../utils/pagination');

exports.list = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = { role: 'user' };
  if (req.query.status) filter.status = req.query.status;
  if (req.query.q) {
    const rx = new RegExp(escapeRegex(req.query.q), 'i');
    filter.$or = [{ email: rx }, { firstName: rx }, { lastName: rx }];
  }
  const [items, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(filter),
  ]);
  ok(res, items, { page, limit, total });
});

exports.get = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, 'User not found');
  ok(res, user);
});

exports.setStatus = asyncHandler(async (req, res) => {
  const target = await User.findById(req.params.id).select('+tokenVersion');
  if (!target) throw new ApiError(404, 'User not found');
  if (target.id === req.user.id) throw new ApiError(400, 'You cannot change your own status');
  if (target.role === 'admin' && req.user.adminRole !== 'super_admin') {
    throw new ApiError(403, 'Only a super admin can change an admin account');
  }

  target.status = req.body.status;
  if (req.body.status !== 'active') target.tokenVersion += 1; // end their sessions immediately
  await target.save();
  ok(res, target);
});
