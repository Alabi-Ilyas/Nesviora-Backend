const router = require('express').Router();
const c = require('../controllers/investment.controller');
const v = require('../validators');
const validate = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);
router.get('/', validate({ query: v.pageQuery }), c.listMine);
router.get('/:id', validate({ params: v.idParam }), c.getMine);

module.exports = router;
