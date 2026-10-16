const router = require('express').Router();
const c = require('../controllers/auth.controller');
const v = require('../validators');
const validate = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimit');

router.post('/register', authLimiter, validate({ body: v.register }), c.register);
router.post('/login', authLimiter, validate({ body: v.login }), c.login);
router.post('/refresh', c.refresh);
router.post('/logout', c.logout);
router.get('/me', authenticate, c.me);
router.post('/change-password', authenticate, authLimiter, validate({ body: v.changePassword }), c.changePassword);

module.exports = router;
