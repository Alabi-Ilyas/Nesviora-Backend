// Creates the first super admin. Run once: npm run seed:admin
// Admins can never be created through the public API.
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');

(async () => {
  const email = (process.env.ADMIN_EMAIL || '').toLowerCase();
  const password = process.env.ADMIN_PASSWORD || '';
  if (!email || password.length < 12) {
    console.error('Set ADMIN_EMAIL and an ADMIN_PASSWORD of at least 12 characters in .env');
    process.exit(1);
  }

  await connectDB();
  if (await User.exists({ email })) {
    console.log('An account with that email already exists. Nothing changed.');
  } else {
    await User.create({
      firstName: process.env.ADMIN_FIRST_NAME || 'Admin',
      lastName: process.env.ADMIN_LAST_NAME || 'User',
      email,
      password,
      role: 'admin',
      adminRole: 'super_admin',
      referralCode: `ADM${Date.now().toString(36).toUpperCase()}`,
    });
    console.log(`Super admin created: ${email}`);
  }
  await mongoose.disconnect();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
