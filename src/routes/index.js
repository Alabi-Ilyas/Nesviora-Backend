const router = require('express').Router();

router.use('/auth', require('./auth.routes'));
router.use('/users', require('./user.routes'));
router.use('/plans', require('./plan.routes'));
router.use('/investments', require('./investment.routes'));
router.use('/wallet', require('./wallet.routes'));
router.use('/transactions', require('./transaction.routes'));
router.use('/deposits', require('./deposit.routes'));
router.use('/withdrawals', require('./withdrawal.routes'));
router.use('/settings', require('./settings.routes'));
router.use('/testimonials', require('./testimonial.routes'));
router.use('/support', require('./support.routes'));
router.use('/admin', require('./admin.routes'));

module.exports = router;
