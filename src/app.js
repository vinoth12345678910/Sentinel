const express = require('express');
const path = require('path');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const timeoutMiddleware = require('./middleware/timeout');
const webhookRoutes = require('./routes/webhook');
const authRoutes = require('./routes/auth');
const githubRoutes = require('./routes/github');
const deploymentRoutes = require('./routes/deployments');
const healthRoutes = require('./routes/health');
const appRoutes = require('./routes/apps');
const projectRoutes = require('./routes/projects');
const { router: envRoutes } = require('./routes/env');
const streamRoutes = require('./routes/deploymentStream');

const app = express();
app.set('trust proxy', 1);

app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
app.use(cookieParser());
app.use(timeoutMiddleware);

app.use('/', webhookRoutes);

app.use(express.json({ limit: '1mb' }));
app.use('/', healthRoutes);
app.use('/', authRoutes);
app.use('/', githubRoutes);
app.use('/', deploymentRoutes);
app.use('/', appRoutes);
app.use('/', projectRoutes);
app.use('/', envRoutes);
app.use('/', streamRoutes);

const dashboardPath = path.join(__dirname, '..', 'dashboard');
app.use('/dashboard', express.static(dashboardPath));
app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(dashboardPath, 'index.html'));
});

app.use((err, req, res, next) => {
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ message: 'Request body too large' });
  }
  console.error('Unhandled error:', err);
  res.status(500).json({ message: 'Internal server error' });
});

module.exports = app;
