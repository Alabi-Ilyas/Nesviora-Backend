const SupportTicket = require('../models/SupportTicket');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { ok } = require('../utils/response');
const { getPagination } = require('../utils/pagination');

// ----- user -----
exports.create = asyncHandler(async (req, res) => {
  const { subject, category, priority, message } = req.body;
  const ticket = await SupportTicket.create({
    userId: req.user.id,
    subject,
    category,
    priority,
    message,
    messages: [{ sender: 'user', text: message }],
  });
  ok(res, ticket, undefined, 201);
});

exports.listMine = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = { userId: req.user.id };
  const [items, total] = await Promise.all([
    SupportTicket.find(filter).sort({ updatedAt: -1 }).skip(skip).limit(limit),
    SupportTicket.countDocuments(filter),
  ]);
  ok(res, items, { page, limit, total });
});

exports.getMine = asyncHandler(async (req, res) => {
  const ticket = await SupportTicket.findOne({ _id: req.params.id, userId: req.user.id });
  if (!ticket) throw new ApiError(404, 'Ticket not found');
  ok(res, ticket);
});

exports.userReply = asyncHandler(async (req, res) => {
  const ticket = await SupportTicket.findOne({ _id: req.params.id, userId: req.user.id });
  if (!ticket) throw new ApiError(404, 'Ticket not found');
  if (ticket.status === 'closed') throw new ApiError(409, 'This ticket is closed. Please open a new one.');

  ticket.messages.push({ sender: 'user', text: req.body.text });
  if (ticket.status === 'resolved') ticket.status = 'open'; // user replied, reopen
  await ticket.save();
  ok(res, ticket, undefined, 201);
});

// ----- admin -----
const withUser = (t) => {
  const o = t.toJSON();
  const u = t.userId && t.userId._id ? t.userId : null;
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
  if (req.query.priority) filter.priority = req.query.priority;

  const [items, total] = await Promise.all([
    SupportTicket.find(filter).sort({ updatedAt: -1 }).skip(skip).limit(limit).populate('userId', 'firstName lastName email'),
    SupportTicket.countDocuments(filter),
  ]);
  ok(res, items.map(withUser), { page, limit, total });
});

exports.adminGet = asyncHandler(async (req, res) => {
  const ticket = await SupportTicket.findById(req.params.id).populate('userId', 'firstName lastName email');
  if (!ticket) throw new ApiError(404, 'Ticket not found');
  ok(res, withUser(ticket));
});

exports.adminReply = asyncHandler(async (req, res) => {
  const ticket = await SupportTicket.findById(req.params.id);
  if (!ticket) throw new ApiError(404, 'Ticket not found');
  if (ticket.status === 'closed') throw new ApiError(409, 'This ticket is closed');

  ticket.messages.push({ sender: 'support', text: req.body.text });
  if (ticket.status === 'open') ticket.status = 'in_progress';
  await ticket.save();
  ok(res, ticket, undefined, 201);
});

exports.adminSetStatus = asyncHandler(async (req, res) => {
  const ticket = await SupportTicket.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
  if (!ticket) throw new ApiError(404, 'Ticket not found');
  ok(res, ticket);
});
