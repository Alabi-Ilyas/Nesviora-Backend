const router = require('express').Router();
const c = require('../controllers/support.controller');
const v = require('../validators');
const validate = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);
router.post('/tickets', validate({ body: v.createTicket }), c.create);
router.get('/tickets', validate({ query: v.pageQuery }), c.listMine);
router.get('/tickets/:id', validate({ params: v.idParam }), c.getMine);
router.post('/tickets/:id/messages', validate({ params: v.idParam, body: v.ticketReply }), c.userReply);

module.exports = router;
