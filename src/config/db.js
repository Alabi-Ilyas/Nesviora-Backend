const mongoose = require('mongoose');
const env = require('./env');

mongoose.set('strictQuery', true);

module.exports = async function connectDB() {
  await mongoose.connect(env.mongoUri);
  console.log('MongoDB connected');
};
