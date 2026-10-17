const Testimonial = require('../models/Testimonial');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { ok } = require('../utils/response');

// Public: demo/placeholder entries are never exposed on the public site.
exports.listPublic = asyncHandler(async (req, res) => {
  ok(res, await Testimonial.find({ isDemo: { $ne: true } }).sort({ date: -1 }).limit(50));
});

// Admin: everything, including demo entries, so they can be edited or deleted.
exports.adminList = asyncHandler(async (req, res) => {
  ok(res, await Testimonial.find().sort({ date: -1 }).limit(200));
});

exports.create = asyncHandler(async (req, res) => {
  ok(res, await Testimonial.create(req.body), undefined, 201);
});

exports.update = asyncHandler(async (req, res) => {
  const t = await Testimonial.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!t) throw new ApiError(404, 'Testimonial not found');
  ok(res, t);
});

exports.remove = asyncHandler(async (req, res) => {
  const t = await Testimonial.findByIdAndDelete(req.params.id);
  if (!t) throw new ApiError(404, 'Testimonial not found');
  ok(res, { message: 'Testimonial deleted' });
});
