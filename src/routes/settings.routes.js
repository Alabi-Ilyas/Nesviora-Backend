const router = require('express').Router();
const c = require('../controllers/settings.controller');

// Public: the frontend needs the fee percentages to show estimates. The server recomputes fees itself.
router.get('/', c.get);

module.exports = router;
