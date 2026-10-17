const crypto = require('crypto');
module.exports = (prefix) => `${prefix}-${crypto.randomBytes(5).toString('hex').toUpperCase()}`;
