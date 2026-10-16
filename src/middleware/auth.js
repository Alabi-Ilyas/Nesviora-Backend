const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { verifyAccess } = require('../utils/tokens');

// Requires a valid access token; loads the user and rejects suspended/changed accounts.
exports.authenticate = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) throw new ApiError(401, 'Authentication required');

  let payload;
  try {
    payload = verifyAccess(token);
  } catch {
    throw new ApiError(401, 'Invalid or expired token');
  }

  const user = await User.findById(payload.sub).select('+tokenVersion');
  if (!user || user.tokenVersion !== payload.tv) throw new ApiError(401, 'Session is no longer valid');
  if (user.status !== 'active') throw new ApiError(403, 'This account is not active');

  req.user = user;
  next();
});

// Admin-only. With no roles listed any admin passes; otherwise the admin must hold one of them.
// super_admin always passes.
exports.requireAdmin =
  (...roles) =>
  (req, res, next) => {
    const u = req.user;
    if (!u || u.role !== 'admin') return next(new ApiError(403, 'Admin access required'));
    if (roles.length === 0 || u.adminRole === 'super_admin' || roles.includes(u.adminRole)) return next();
    return next(new ApiError(403, 'You do not have permission for this action'));
  };
