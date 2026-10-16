const jwt = require('jsonwebtoken');
const env = require('../config/env');

const COOKIE_NAME = 'refreshToken';

const cookieOptions = () => ({
  httpOnly: true,
  secure: env.isProd || env.cookieSameSite === 'none',
  sameSite: env.cookieSameSite,
  path: '/api/auth',
  maxAge: 7 * 24 * 60 * 60 * 1000,
});

exports.COOKIE_NAME = COOKIE_NAME;

exports.signAccess = (user) =>
  jwt.sign({ sub: user.id, tv: user.tokenVersion }, env.accessSecret, { expiresIn: env.accessTtl });

exports.signRefresh = (user) =>
  jwt.sign({ sub: user.id, tv: user.tokenVersion }, env.refreshSecret, { expiresIn: env.refreshTtl });

exports.verifyAccess = (token) => jwt.verify(token, env.accessSecret);
exports.verifyRefresh = (token) => jwt.verify(token, env.refreshSecret);

// Sets the refresh cookie and returns the access token to send in the response body.
exports.issueSession = (res, user) => {
  res.cookie(COOKIE_NAME, exports.signRefresh(user), cookieOptions());
  return exports.signAccess(user);
};

exports.clearSession = (res) => {
  const { maxAge, ...opts } = cookieOptions();
  res.clearCookie(COOKIE_NAME, opts);
};
