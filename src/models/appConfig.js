function createAppConfig(repoName, repoUrl) {
  return {
    repo_name: repoName,
    repo_url: repoUrl,
    health_path: '/health',
    container_port: 3000,
    host_port: null,
    registered_at: null,
    updated_at: null,
  };
}

module.exports = { createAppConfig };
