const router = require('express').Router();
const c = require('../controllers/investment.controller');
const v = require('../validators');
const validate = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');
const { moneyLimiter } = require('../middleware/rateLimit');

router.use(authenticate);
router.get('/', validate({ query: v.pageQuery }), c.listMine);
router.post('/', moneyLimiter, validate({ body: v.createInvestment }), c.create);
router.get('/:id', validate({ params: v.idParam }), c.getMine);

module.exports = router;
