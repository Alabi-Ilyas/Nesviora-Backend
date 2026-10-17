const router = require('express').Router();
const c = require('../controllers/withdrawal.controller');
const v = require('../validators');
const validate = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');
const { moneyLimiter } = require('../middleware/rateLimit');

router.use(authenticate);
router.get('/', validate({ query: v.pageQuery }), c.listMine);
router.post('/', moneyLimiter, validate({ body: v.createWithdrawal }), c.create);

module.exports = router;
