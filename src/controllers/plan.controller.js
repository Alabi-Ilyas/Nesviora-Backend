const InvestmentPlan = require('../models/InvestmentPlan');
const Investment = require('../models/Investment');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { ok } = require('../utils/response');

// ----- public -----
exports.listActive = asyncHandler(async (req, res) => {
  const plans = await InvestmentPlan.find({ status: 'active' }).sort({ minAmount: 1 });
  ok(res, plans);
});

exports.getActive = asyncHandler(async (req, res) => {
  const plan = await InvestmentPlan.findOne({ _id: req.params.id, status: 'active' });
  if (!plan) throw new ApiError(404, 'Plan not found');
  ok(res, plan);
});

// ----- admin -----
exports.adminList = asyncHandler(async (req, res) => {
  ok(res, await InvestmentPlan.find().sort({ createdAt: -1 }));
});

exports.create = asyncHandler(async (req, res) => {
  ok(res, await InvestmentPlan.create(req.body), undefined, 201);
});

exports.update = asyncHandler(async (req, res) => {
  const plan = await InvestmentPlan.findById(req.params.id);
  if (!plan) throw new ApiError(404, 'Plan not found');
  plan.set(req.body);
  await plan.save(); // save() so the min/max validator runs
  ok(res, plan);
});

exports.remove = asyncHandler(async (req, res) => {
  const plan = await InvestmentPlan.findById(req.params.id);
  if (!plan) throw new ApiError(404, 'Plan not found');
  if (await Investment.exists({ planId: plan.id })) {
    throw new ApiError(409, 'This plan has investments and cannot be deleted. Set its status to inactive instead.');
  }
  await plan.deleteOne();
  ok(res, { message: 'Plan deleted' });
});
