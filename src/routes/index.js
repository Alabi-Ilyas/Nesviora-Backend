const router = require('express').Router();

router.use('/auth', require('./auth.routes'));
router.use('/users', require('./user.routes'));
router.use('/plans', require('./plan.routes'));
router.use('/investments', require('./investment.routes'));
router.use('/testimonials', require('./testimonial.routes'));
router.use('/support', require('./support.routes'));
router.use('/admin', require('./admin.routes'));

module.exports = router;
