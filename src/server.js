const env = require('./config/env');
const connectDB = require('./config/db');
const app = require('./app');
const { supportsTransactions } = require('./utils/atomic');

async function start() {
  await connectDB();
  if (!(await supportsTransactions())) {
    const msg = 'MongoDB is not a replica set: deposits/withdrawals/investing will run WITHOUT transactions.';
    if (env.isProd) throw new Error(msg);
    console.warn(`WARNING: ${msg} (dev only)`);
  }
  app.listen(env.port, () => console.log(`API running on port ${env.port}`));
}

process.on('unhandledRejection', (err) => {
  console.error('Unhandled rejection:', err);
  process.exit(1);
});

start().catch((err) => {
  console.error('Failed to start:', err);
  process.exit(1);
});
