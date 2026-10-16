const { z } = require('zod');

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid id');
exports.idParam = z.object({ id: objectId });
exports.objectId = objectId;

const password = z.string().min(8, 'Password must be at least 8 characters').max(128);
const email = z.string().trim().toLowerCase().email().max(254);

const pageQuery = {
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
};

// ---- auth / users ----
exports.register = z.object({
  firstName: z.string().trim().min(1).max(60),
  lastName: z.string().trim().min(1).max(60),
  email,
  phone: z.string().trim().max(30).optional().default(''),
  country: z.string().trim().max(60).optional().default(''),
  password,
});

exports.login = z.object({ email, password: z.string().min(1).max(128) });

exports.changePassword = z.object({ currentPassword: z.string().min(1).max(128), newPassword: password });

exports.updateProfile = z.object({
  firstName: z.string().trim().min(1).max(60).optional(),
  lastName: z.string().trim().min(1).max(60).optional(),
  phone: z.string().trim().max(30).optional(),
  country: z.string().trim().max(60).optional(),
  avatar: z.string().url().max(500).optional(),
  preferences: z
    .object({
      currency: z.string().trim().max(10).optional(),
      language: z.string().trim().max(10).optional(),
      notifications: z
        .object({ email: z.boolean().optional(), push: z.boolean().optional(), sms: z.boolean().optional() })
        .optional(),
    })
    .optional(),
});

// ---- plans ----
const planBase = z.object({
  name: z.string().trim().min(1).max(100),
  minAmount: z.number().min(0),
  maxAmount: z.number().min(0),
  durationDays: z.number().int().min(1),
  description: z.string().max(2000).optional(),
  riskLevel: z.enum(['low', 'medium', 'high']).optional(),
  supportedAssets: z.array(z.string().trim().max(20)).max(20).optional(),
  status: z.enum(['active', 'inactive']).optional(),
  fees: z.number().min(0).optional(),
  terms: z.string().max(5000).optional(),
  expectedReturnRate: z.number().min(0).optional(),
});
exports.createPlan = planBase.refine((p) => p.maxAmount >= p.minAmount, {
  message: 'maxAmount must be greater than or equal to minAmount',
  path: ['maxAmount'],
});
exports.updatePlan = planBase.partial();

// ---- testimonials ----
const testimonialBase = z.object({
  name: z.string().trim().min(1).max(100),
  country: z.string().trim().max(60).optional(),
  comment: z.string().trim().min(1).max(1000),
  date: z.coerce.date().optional(),
  verified: z.boolean().optional(),
  isDemo: z.boolean().optional(),
});
exports.createTestimonial = testimonialBase;
exports.updateTestimonial = testimonialBase.partial();

// ---- support ----
exports.createTicket = z.object({
  subject: z.string().trim().min(1).max(200),
  category: z.string().trim().min(1).max(50).optional().default('general'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional().default('medium'),
  message: z.string().trim().min(1).max(2000),
});
exports.ticketReply = z.object({ text: z.string().trim().min(1).max(2000) });
exports.ticketStatus = z.object({ status: z.enum(['open', 'in_progress', 'resolved', 'closed']) });
exports.ticketListQuery = z.object({
  ...pageQuery,
  status: z.enum(['open', 'in_progress', 'resolved', 'closed']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
});

// ---- admin ----
exports.userListQuery = z.object({
  ...pageQuery,
  q: z.string().trim().max(100).optional(),
  status: z.enum(['active', 'suspended', 'pending', 'deactivated']).optional(),
});
exports.userStatus = z.object({ status: z.enum(['active', 'suspended', 'deactivated']) });
exports.investmentListQuery = z.object({
  ...pageQuery,
  status: z.enum(['active', 'completed', 'pending', 'cancelled']).optional(),
  userId: objectId.optional(),
});
exports.pageQuery = z.object(pageQuery);
