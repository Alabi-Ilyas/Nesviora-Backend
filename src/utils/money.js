// All new money fields are stored as integer cents so balances never drift.
// The API still speaks dollars: toJSON converts any "<name>Cents" field to "<name>".
exports.toCents = (usd) => Math.round(usd * 100);
exports.fromCents = (cents) => cents / 100;
exports.percentOf = (cents, pct) => Math.round((cents * pct) / 100);
exports.isTwoDecimals = (v) => Math.abs(v * 100 - Math.round(v * 100)) < 1e-6;
