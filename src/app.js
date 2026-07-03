const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const timeoutMiddleware = require('./middleware/timeout');
const hostValidation = require('./middleware/hostValidation');
const webhookRoutes = require('./routes/webhook');
const authRoutes = require('./routes/auth');
const githubRoutes = require('./routes/github');
const deploymentRoutes = require('./routes/deployments');
const healthRoutes = require('./routes/health');
const appRoutes = require('./routes/apps');
const projectRoutes = require('./routes/projects');
const { router: envRoutes } = require('./routes/env');
const streamRoutes = require('./routes/deploymentStream');
const domainRoutes = require('./routes/domains');
const monitoringRoutes = require('./routes/monitoring');
const teamRoutes = require('./routes/teams');
const auditLogRoutes = require('./routes/auditLog');
const userRoutes = require('./routes/users');
const apiDocsRoutes = require('./routes/apiDocs');

const app = express();
app.set('trust proxy', 1);

app.use(cors({
  origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : ['http://localhost:3001', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key'],
}));
app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
app.use(cookieParser());
app.use(hostValidation);
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
app.use('/', domainRoutes);
app.use('/', monitoringRoutes);
app.use('/', teamRoutes);
app.use('/', auditLogRoutes);
app.use('/', userRoutes);
app.use('/', apiDocsRoutes);

const frontendOut = path.join(__dirname, '..', 'frontend', 'out');

// Serve Next.js static assets
app.use('/_next', express.static(path.join(frontendOut, '_next')));
app.use('/styles', express.static(path.join(frontendOut, 'styles')));

// Dashboard pages
app.get('/dashboard', (req, res) => res.sendFile(path.join(frontendOut, 'dashboard.html')));
app.get('/dashboard/activity', (req, res) => res.sendFile(path.join(frontendOut, 'dashboard/activity.html')));
app.get('/dashboard/projects', (req, res) => res.sendFile(path.join(frontendOut, 'dashboard/projects.html')));
app.get('/dashboard/projects/:id', (req, res) => res.sendFile(path.join(frontendOut, 'dashboard/projects/[id].html')));
app.get('/dashboard/apps', (req, res) => res.sendFile(path.join(frontendOut, 'dashboard/apps.html')));
app.get('/dashboard/apps/:name', (req, res) => res.sendFile(path.join(frontendOut, 'dashboard/apps/[name].html')));
app.get('/dashboard/apps/:name/deployments/:id', (req, res) => res.sendFile(path.join(frontendOut, 'dashboard/apps/[name]/deployments/[id].html')));
app.get('/dashboard/create', (req, res) => res.sendFile(path.join(frontendOut, 'dashboard/create.html')));
app.get('/dashboard/settings', (req, res) => res.sendFile(path.join(frontendOut, 'dashboard/settings.html')));
app.get('/dashboard/teams', (req, res) => res.sendFile(path.join(frontendOut, 'dashboard/teams.html')));
app.get('/dashboard/monitoring', (req, res) => res.sendFile(path.join(frontendOut, 'dashboard/monitoring.html')));

// Admin pages
app.get('/admin', (req, res) => res.sendFile(path.join(frontendOut, 'admin.html')));
app.get('/admin/users', (req, res) => res.sendFile(path.join(frontendOut, 'admin/users.html')));
app.get('/admin/security', (req, res) => res.sendFile(path.join(frontendOut, 'admin/security.html')));
app.get('/admin/audit', (req, res) => res.sendFile(path.join(frontendOut, 'admin/audit.html')));

// Auth pages
app.get('/login', (req, res) => res.sendFile(path.join(frontendOut, 'login.html')));

// Landing page
app.get('/', (req, res) => res.sendFile(path.join(frontendOut, 'index.html')));

app.use((err, req, res, next) => {
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ message: 'Request body too large' });
  }
  console.error('Unhandled error:', err);
  res.status(500).json({ message: 'Internal server error' });
});

module.exports = app;
