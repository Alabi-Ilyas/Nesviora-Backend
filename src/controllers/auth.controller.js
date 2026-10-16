const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { ok } = require('../utils/response');
const { issueSession, clearSession, verifyRefresh, COOKIE_NAME } = require('../utils/tokens');

// Compared against when the email is unknown so response time doesn't reveal whether an account exists.
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', 12);

async function uniqueReferralCode() {
  for (let i = 0; i < 5; i += 1) {
    const code = crypto.randomBytes(4).toString('hex').toUpperCase();
    // eslint-disable-next-line no-await-in-loop
    if (!(await User.exists({ referralCode: code }))) return code;
  }
  throw new ApiError(500, 'Could not generate referral code');
}

exports.register = asyncHandler(async (req, res) => {
  const { firstName, lastName, email, phone, country, password } = req.body;

  if (await User.exists({ email })) throw new ApiError(409, 'An account with this email already exists');

  // role/adminRole/status are never taken from the request.
  const user = await User.create({
    firstName,
    lastName,
    email,
    phone,
    country,
    password,
    referralCode: await uniqueReferralCode(),
  });

  const accessToken = issueSession(res, user);
  ok(res, { user, accessToken }, undefined, 201);
});

exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select('+password +tokenVersion');

  const valid = user ? await user.comparePassword(password) : await bcrypt.compare(password, DUMMY_HASH).then(() => false);
  if (!valid) throw new ApiError(401, 'Invalid email or password');
  if (user.status !== 'active') throw new ApiError(403, 'This account is not active. Please contact support.');

  const accessToken = issueSession(res, user);
  ok(res, { user, accessToken });
});

exports.refresh = asyncHandler(async (req, res) => {
  const token = req.cookies && req.cookies[COOKIE_NAME];
  if (!token) throw new ApiError(401, 'No refresh token');

  let payload;
  try {
    payload = verifyRefresh(token);
  } catch {
    clearSession(res);
    throw new ApiError(401, 'Invalid or expired refresh token');
  }

  const user = await User.findById(payload.sub).select('+tokenVersion');
  if (!user || user.tokenVersion !== payload.tv || user.status !== 'active') {
    clearSession(res);
    throw new ApiError(401, 'Session is no longer valid');
  }

  const accessToken = issueSession(res, user);
  ok(res, { user, accessToken });
});

exports.logout = asyncHandler(async (req, res) => {
  clearSession(res);
  ok(res, { message: 'Logged out' });
});

exports.me = asyncHandler(async (req, res) => ok(res, req.user));

exports.changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user.id).select('+password +tokenVersion');

  if (!(await user.comparePassword(currentPassword))) throw new ApiError(400, 'Current password is incorrect');

  user.password = newPassword;
  user.tokenVersion += 1; // signs the user out everywhere else
  await user.save();

  const accessToken = issueSession(res, user);
  ok(res, { message: 'Password updated', accessToken });
});
