const mongoose = require('mongoose');
const env = require('../config/env');

// Multi-document transactions need a replica set (Atlas has one; a plain local mongod does not).
let supported;
async function supportsTransactions() {
  if (supported !== undefined) return supported;
  const admin = mongoose.connection.db.admin();
  let info;
  try {
    info = await admin.command({ hello: 1 });
  } catch {
    info = await admin.command({ isMaster: 1 });
  }
  supported = Boolean(info.setName) || info.msg === 'isdbgrid';
  return supported;
}
exports.supportsTransactions = supportsTransactions;

// Runs fn(session) in a DB transaction. Pass `session` to every query inside fn.
// Without a replica set: refuses in production, runs unprotected (session undefined) in dev.
exports.atomic = async (fn) => {
  if (!(await supportsTransactions())) {
    if (env.isProd) throw new Error('MongoDB transactions are required in production (use a replica set / Atlas).');
    return fn(undefined);
  }
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      result = await fn(session);
    });
    return result;
  } finally {
    await session.endSession();
  }
};
