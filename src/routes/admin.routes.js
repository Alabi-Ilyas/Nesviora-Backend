const router = require('express').Router();
const v = require('../validators');
const validate = require('../middleware/validate');
const { authenticate, requireAdmin } = require('../middleware/auth');

const users = require('../controllers/adminUser.controller');
const plans = require('../controllers/plan.controller');
const investments = require('../controllers/investment.controller');
const testimonials = require('../controllers/testimonial.controller');
const support = require('../controllers/support.controller');

// Every route here needs a signed-in admin. Role guards below narrow it per area
// (super_admin passes all of them).
router.use(authenticate, requireAdmin());

// ----- users + their investments -----
router.get('/users', requireAdmin('ops_admin', 'support_admin', 'finance_admin'), validate({ query: v.userListQuery }), users.list);
router.get('/users/:id', requireAdmin('ops_admin', 'support_admin', 'finance_admin'), validate({ params: v.idParam }), users.get);
router.patch('/users/:id/status', requireAdmin('ops_admin'), validate({ params: v.idParam, body: v.userStatus }), users.setStatus);
router.get(
  '/users/:id/investments',
  requireAdmin('ops_admin', 'finance_admin'),
  validate({ params: v.idParam, query: v.pageQuery }),
  investments.adminList
);

// ----- investments (read-only) -----
router.get('/investments', requireAdmin('ops_admin', 'finance_admin'), validate({ query: v.investmentListQuery }), investments.adminList);

// ----- plans -----
const planRoles = requireAdmin('ops_admin', 'finance_admin');
router.get('/plans', planRoles, plans.adminList);
router.post('/plans', planRoles, validate({ body: v.createPlan }), plans.create);
router.patch('/plans/:id', planRoles, validate({ params: v.idParam, body: v.updatePlan }), plans.update);
router.delete('/plans/:id', planRoles, validate({ params: v.idParam }), plans.remove);

// ----- testimonials -----
const contentRoles = requireAdmin('content_admin', 'ops_admin');
router.post('/testimonials', contentRoles, validate({ body: v.createTestimonial }), testimonials.create);
router.patch('/testimonials/:id', contentRoles, validate({ params: v.idParam, body: v.updateTestimonial }), testimonials.update);
router.delete('/testimonials/:id', contentRoles, validate({ params: v.idParam }), testimonials.remove);

// ----- support chat -----
const supportRoles = requireAdmin('support_admin', 'ops_admin');
router.get('/support/tickets', supportRoles, validate({ query: v.ticketListQuery }), support.adminList);
router.get('/support/tickets/:id', supportRoles, validate({ params: v.idParam }), support.adminGet);
router.post('/support/tickets/:id/messages', supportRoles, validate({ params: v.idParam, body: v.ticketReply }), support.adminReply);
router.patch('/support/tickets/:id/status', supportRoles, validate({ params: v.idParam, body: v.ticketStatus }), support.adminSetStatus);

module.exports = router;
