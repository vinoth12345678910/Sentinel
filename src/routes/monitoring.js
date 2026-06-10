const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const monitoringService = require('../services/monitoringService');

const router = express.Router();

router.get('/metrics', (req, res) => {
  const metrics = monitoringService.generatePrometheusMetrics();
  res.set('Content-Type', 'text/plain; charset=utf-8');
  res.send(metrics);
});

router.get('/monitoring/health', authMiddleware, (req, res) => {
  const system = monitoringService.getSystemMetrics();
  const containers = monitoringService.getContainerMetrics();
  const deployments = monitoringService.getDeploymentMetrics();
  const apps = monitoringService.getAppMetrics();
  const disk = monitoringService.getDiskMetrics();

  res.json({
    system: {
      cpu: {
        total: system.cpu_total,
        idle: system.cpu_idle,
        usage_percent: system.cpu_total > 0
          ? parseFloat(((1 - system.cpu_idle / system.cpu_total) * 100).toFixed(1))
          : 0,
      },
      memory: {
        total: system.memory_total,
        free: system.memory_free,
        used: system.memory_total - system.memory_free,
        usage_percent: parseFloat((((system.memory_total - system.memory_free) / system.memory_total) * 100).toFixed(1)),
      },
      uptime: system.uptime,
      load: system.loadavg,
    },
    disk,
    containers,
    deployments,
    apps,
  });
});

router.get('/monitoring/containers', authMiddleware, (req, res) => {
  const containers = monitoringService.getContainerMetrics();
  res.json(containers);
});

module.exports = router;
