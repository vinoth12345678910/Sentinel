const validStates = [
  'PENDING',
  'STARTED',
  'CLONED',
  'BUILT',
  'DEPLOYED',
  'VERIFYING',
  'HEALTHY',
  'SUCCESS',
  'FAILED',
  'FAILED_AT_CLONE',
  'FAILED_AT_BUILD',
  'FAILED_AT_DEPLOY',
  'FAILED_AT_VERIFY',
  'ROLLBACK_STARTED',
  'ROLLING_BACK',
  'ROLLED_BACK',
];

function createDeployment({ repo_name, branch, commit_hash, pusher, timestamp }) {
  const deployment_id = `deploy-${repo_name}-${timestamp}`;
  return {
    deployment_id,
    repo_name,
    branch,
    commit_hash,
    pusher,
    state: 'PENDING',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    failure_reason: null,
  };
}

function isValidState(state) {
  return validStates.includes(state);
}

module.exports = { createDeployment, isValidState, validStates };
