const app = require('./src/app');
const config = require('./src/config');

process.on('uncaughtException', (err) => {
  console.error(`FATAL: Uncaught exception - ${err.message}`);
  console.error(err.stack);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error(`ERROR: Unhandled rejection - ${reason.message || reason}`);
  if (reason.stack) console.error(reason.stack);
});

function shutdown(signal) {
  console.log(`Received ${signal}, shutting down gracefully...`);
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
  setTimeout(() => {
    console.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

const server = app.listen(config.PORT, (err) => {
  if (err) {
    console.error(`FATAL: Failed to start server on port ${config.PORT} - ${err.message}`);
    process.exit(1);
  }
  console.log(`Sentinel backend running on port ${config.PORT}`);
});
