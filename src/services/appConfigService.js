const fs = require('fs');
const path = require('path');
const config = require('../config');
const { createAppConfig } = require('../models/appConfig');

function getFilePath(repoName) {
  return path.join(config.DATA_PATH, 'apps', `${repoName}.json`);
}

function getAppConfig(repoName) {
  const filePath = getFilePath(repoName);
  if (!fs.existsSync(filePath)) return null;
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch (e) {
    throw new Error(`Failed to parse app config for ${repoName}: ${e.message}`);
  }
}

function createAppConfigRecord(repoName, repoUrl) {
  const filePath = getFilePath(repoName);
  if (fs.existsSync(filePath)) {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  }
  const dir = path.dirname(filePath);
  fs.mkdirSync(dir, { recursive: true });
  const appConfig = createAppConfig(repoName, repoUrl);
  appConfig.registered_at = new Date().toISOString();
  fs.writeFileSync(filePath, JSON.stringify(appConfig, null, 2));
  return appConfig;
}

function updateAppConfig(repoName, updates) {
  const existing = getAppConfig(repoName);
  if (!existing) {
    throw new Error(`App config not found for repo: ${repoName}`);
  }
  const updated = { ...existing, ...updates, updated_at: new Date().toISOString() };
  const filePath = getFilePath(repoName);
  fs.writeFileSync(filePath, JSON.stringify(updated, null, 2));
  return updated;
}

function getAllAppConfigs() {
  const appsDir = path.join(config.DATA_PATH, 'apps');
  if (!fs.existsSync(appsDir)) return [];
  try {
    const files = fs.readdirSync(appsDir).filter(f => f.endsWith('.json'));
    return files.map(f => {
      try {
        return JSON.parse(fs.readFileSync(path.join(appsDir, f), 'utf-8'));
      } catch {
        return null;
      }
    }).filter(Boolean);
  } catch (e) {
    throw new Error(`Failed to list app configs: ${e.message}`);
  }
}

function deleteAppConfigFile(repoName) {
  const filePath = getFilePath(repoName);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    return true;
  }
  return false;
}

module.exports = { getAppConfig, createAppConfig: createAppConfigRecord, updateAppConfig, getAllAppConfigs, deleteAppConfigFile };
