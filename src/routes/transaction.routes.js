const router = require('express').Router();
const c = require('../controllers/wallet.controller');
const v = require('../validators');
const validate = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);
router.get('/', validate({ query: v.transactionListQuery }), c.listMine);

module.exports = router;
