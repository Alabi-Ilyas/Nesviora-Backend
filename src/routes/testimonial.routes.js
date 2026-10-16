const router = require('express').Router();
const c = require('../controllers/testimonial.controller');

router.get('/', c.listPublic);

module.exports = router;
