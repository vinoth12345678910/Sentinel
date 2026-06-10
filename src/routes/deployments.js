const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const { isValidState } = require('../models/deployment');
const deploymentService = require('../services/deploymentService');
const deploymentLogService = require('../services/deploymentLogService');
const logger = require('../services/loggerService');
const { apiRateLimiter } = require('../middleware/rateLimiter');
const { validateDeploymentId } = require('../middleware/validateInput');

const router = express.Router();

router.get('/deployments/:deploymentId', authMiddleware, apiRateLimiter, (req, res) => {
  const { deploymentId } = req.params;
  if (!validateDeploymentId(deploymentId)) {
    return res.status(400).json({ message: 'Invalid deployment ID' });
  }
  const deployment = deploymentService.read(deploymentId);
  if (!deployment) {
    return res.status(404).json({ message: 'Deployment not found' });
  }
  res.json(deployment);
});

router.get('/deployments', authMiddleware, apiRateLimiter, (req, res) => {
  const deployments = deploymentService.listAll();
  res.json(deployments);
});

router.patch('/deployments/:deploymentId/state', authMiddleware, apiRateLimiter, (req, res) => {
  const { deploymentId } = req.params;
  const { state, failure_reason } = req.body;

  if (!validateDeploymentId(deploymentId)) {
    return res.status(400).json({ message: 'Invalid deployment ID' });
  }

  if (!state || !isValidState(state)) {
    return res.status(400).json({
      message: 'Invalid state',
    });
  }

  const deployment = deploymentService.updateState(deploymentId, state, failure_reason || null);
  if (!deployment) {
    return res.status(404).json({ message: 'Deployment not found' });
  }

  res.json(deployment);
});

router.get('/deployments/:deploymentId/logs', authMiddleware, apiRateLimiter, (req, res) => {
  const { deploymentId } = req.params;
  if (!validateDeploymentId(deploymentId)) {
    return res.status(400).json({ message: 'Invalid deployment ID' });
  }
  try {
    const logs = deploymentLogService.readLogs(deploymentId);
    res.json({ deployment_id: deploymentId, logs });
  } catch (err) {
    res.status(500).json({ message: 'Failed to read logs' });
  }
});

module.exports = router;
