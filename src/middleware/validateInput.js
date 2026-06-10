const SAFE_PATTERN = /^[a-zA-Z0-9_-]+$/;
const MAX_REPO_NAME_LENGTH = 100;

function validateRepoName(repoName) {
  if (!repoName || typeof repoName !== 'string' || !SAFE_PATTERN.test(repoName) || repoName.length > MAX_REPO_NAME_LENGTH) {
    return false;
  }
  return true;
}

function validateDeploymentId(deploymentId) {
  if (!deploymentId || typeof deploymentId !== 'string' || !SAFE_PATTERN.test(deploymentId) || deploymentId.length > 200) {
    return false;
  }
  return true;
}

module.exports = { validateRepoName, validateDeploymentId };
