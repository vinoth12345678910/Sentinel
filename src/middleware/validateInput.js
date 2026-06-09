const SAFE_PATTERN = /^[a-zA-Z0-9_-]+$/;

function validateRepoName(repoName) {
  if (!repoName || typeof repoName !== 'string' || !SAFE_PATTERN.test(repoName)) {
    return false;
  }
  return true;
}

function validateDeploymentId(deploymentId) {
  if (!deploymentId || typeof deploymentId !== 'string' || !SAFE_PATTERN.test(deploymentId)) {
    return false;
  }
  return true;
}

module.exports = { validateRepoName, validateDeploymentId };
