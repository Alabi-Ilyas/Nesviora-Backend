const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const toJSON = require('../utils/toJSON');

const ADMIN_ROLES = ['super_admin', 'ops_admin', 'finance_admin', 'kyc_admin', 'support_admin', 'content_admin'];

const userSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true, maxlength: 60 },
    lastName: { type: String, required: true, trim: true, maxlength: 60 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 254 },
    phone: { type: String, trim: true, default: '', maxlength: 30 },
    country: { type: String, trim: true, default: '', maxlength: 60 },
    password: { type: String, required: true, select: false },
    status: { type: String, enum: ['active', 'suspended', 'pending', 'deactivated'], default: 'active' },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    adminRole: { type: String, enum: [...ADMIN_ROLES, null], default: null },
    kycStatus: {
      type: String,
      enum: ['not_submitted', 'pending', 'under_review', 'verified', 'rejected'],
      default: 'not_submitted',
    },
    avatar: { type: String, default: '' },
    referralCode: { type: String, unique: true, index: true },
    twoFactorEnabled: { type: Boolean, default: false },
    preferences: {
      currency: { type: String, default: 'USD' },
      language: { type: String, default: 'en' },
      notifications: {
        email: { type: Boolean, default: true },
        push: { type: Boolean, default: true },
        sms: { type: Boolean, default: false },
      },
    },
    // Bump to invalidate every issued token (password change, forced logout).
    tokenVersion: { type: Number, default: 0 },
  },
  { timestamps: true }
);

userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = function comparePassword(plain) {
  return bcrypt.compare(plain, this.password);
};

userSchema.plugin(toJSON);

module.exports = mongoose.model('User', userSchema);
module.exports.ADMIN_ROLES = ADMIN_ROLES;
