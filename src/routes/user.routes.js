const router = require('express').Router();
const c = require('../controllers/user.controller');
const v = require('../validators');
const validate = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');

router.patch('/me', authenticate, validate({ body: v.updateProfile }), c.updateMe);

module.exports = router;
