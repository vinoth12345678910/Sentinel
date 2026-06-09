const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

dotenv.config();

if (!process.env.GITHUB_WEBHOOK_SECRET) {
  console.error('FATAL: GITHUB_WEBHOOK_SECRET environment variable is required');
  process.exit(1);
}

const reposBasePath = process.env.REPOS_BASE_PATH || path.resolve(__dirname, '..', 'repos');
const scriptsPath = process.env.SCRIPTS_PATH || path.resolve(__dirname, '..', 'scripts');

if (!fs.existsSync(reposBasePath)) {
  console.error(`FATAL: REPOS_BASE_PATH directory does not exist: ${reposBasePath}`);
  process.exit(1);
}

if (!fs.existsSync(scriptsPath)) {
  console.error(`FATAL: SCRIPTS_PATH directory does not exist: ${scriptsPath}`);
  process.exit(1);
}

if (!process.env.SENTINEL_API_KEY) {
  console.error('FATAL: SENTINEL_API_KEY environment variable is required');
  process.exit(1);
}

const config = {
  PORT: parseInt(process.env.PORT, 10) || 3000,
  GITHUB_WEBHOOK_SECRET: process.env.GITHUB_WEBHOOK_SECRET,
  SENTINEL_API_KEY: process.env.SENTINEL_API_KEY,
  REPOS_BASE_PATH: reposBasePath,
  SCRIPTS_PATH: scriptsPath,
  DATA_PATH: process.env.DATA_PATH || path.join(__dirname, '../data'),
  BACKEND_URL: process.env.BACKEND_URL || 'http://localhost:3000',
};

module.exports = config;
