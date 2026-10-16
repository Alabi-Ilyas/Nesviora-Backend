const asyncHandler = require('../utils/asyncHandler');
const { ok } = require('../utils/response');

function flatten(obj, prefix = '', out = {}) {
  for (const [k, v] of Object.entries(obj)) {
    if (v && typeof v === 'object' && !Array.isArray(v)) flatten(v, `${prefix}${k}.`, out);
    else if (v !== undefined) out[`${prefix}${k}`] = v;
  }
  return out;
}

exports.updateMe = asyncHandler(async (req, res) => {
  // Body is already limited by the zod schema to safe profile fields.
  req.user.set(flatten(req.body));
  await req.user.save();
  ok(res, req.user);
});
