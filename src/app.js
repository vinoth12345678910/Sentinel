const express = require('express');
const helmet = require('helmet');
const timeoutMiddleware = require('./middleware/timeout');
const webhookRoutes = require('./routes/webhook');
const deploymentRoutes = require('./routes/deployments');
const healthRoutes = require('./routes/health');
const appRoutes = require('./routes/apps');

const app = express();
app.set('trust proxy', 1);

app.use(helmet());
app.use(timeoutMiddleware);

app.use('/', webhookRoutes);

app.use(express.json({ limit: '1mb' }));
app.use('/', healthRoutes);
app.use('/', deploymentRoutes);
app.use('/', appRoutes);

app.use((err, req, res, next) => {
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ message: 'Request body too large' });
  }
  console.error('Unhandled error:', err);
  res.status(500).json({ message: 'Internal server error' });
});

module.exports = app;
