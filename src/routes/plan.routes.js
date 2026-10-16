const router = require('express').Router();
const c = require('../controllers/plan.controller');
const v = require('../validators');
const validate = require('../middleware/validate');

// Public: only active plans are visible.
router.get('/', c.listActive);
router.get('/:id', validate({ params: v.idParam }), c.getActive);

module.exports = router;
