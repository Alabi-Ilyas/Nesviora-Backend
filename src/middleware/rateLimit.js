const rateLimit = require('express-rate-limit');

const handler = (req, res) =>
  res.status(429).json({ success: false, message: 'Too many requests, please try again later.' });

exports.apiLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 300, standardHeaders: true, legacyHeaders: false, handler });

// Tight limit for login/register/password endpoints.
exports.authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: true, legacyHeaders: false, handler });
