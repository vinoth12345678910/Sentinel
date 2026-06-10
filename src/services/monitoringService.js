const { execSync } = require('child_process');
const os = require('os');
const config = require('../config');

const METRICS_PREFIX = 'sentinel_';

function getSystemMetrics() {
  const cpus = os.cpus();
  const totalCpu = cpus.reduce((acc, cpu) => {
    const times = cpu.times;
    return acc + times.user + times.nice + times.sys + times.idle + times.irq;
  }, 0);
  const idleCpu = cpus.reduce((acc, cpu) => acc + cpu.times.idle, 0);

  return {
    cpu_total: totalCpu,
    cpu_idle: idleCpu,
    memory_total: os.totalmem(),
    memory_free: os.freemem(),
    uptime: os.uptime(),
    loadavg: os.loadavg(),
  };
}

function getContainerMetrics() {
  try {
    const output = execSync('docker stats --no-stream --format "{{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}\t{{.NetIO}}\t{{.BlockIO}}" 2>/dev/null || true').toString().trim();
    if (!output) return [];
    return output.split('\n').map(line => {
      const parts = line.split('\t');
      if (parts.length < 4) return null;
      return {
        name: parts[0],
        cpu_percent: parseFloat(parts[1]) || 0,
        mem_usage: parts[2] || '0B / 0B',
        mem_percent: parseFloat(parts[3]) || 0,
        net_io: parts[4] || '',
        block_io: parts[5] || '',
      };
    }).filter(Boolean);
  } catch {
    return [];
  }
}

function getDeploymentMetrics() {
  const db = require('../db').getDb();
  const total = db.prepare('SELECT COUNT(*) as count FROM deployments').get()?.count || 0;
  const success = db.prepare("SELECT COUNT(*) as count FROM deployments WHERE state = 'SUCCESS'").get()?.count || 0;
  const failed = db.prepare("SELECT COUNT(*) as count FROM deployments WHERE state LIKE 'FAILED%'").get()?.count || 0;
  const running = db.prepare("SELECT COUNT(*) as count FROM deployments WHERE state NOT IN ('SUCCESS','FAILED','FAILED_AT_CLONE','FAILED_AT_BUILD','FAILED_AT_DEPLOY','FAILED_AT_VERIFY','ROLLED_BACK')").get()?.count || 0;
  return { total, success, failed, running };
}

function getAppMetrics() {
  const db = require('../db').getDb();
  const total = db.prepare('SELECT COUNT(*) as count FROM app_configs').get()?.count || 0;
  return { total };
}

function getDiskMetrics() {
  try {
    const output = execSync('df -k / 2>/dev/null | tail -1').toString().trim();
    const parts = output.split(/\s+/);
    if (parts.length >= 4) {
      return {
        total_kb: parseInt(parts[1]) || 0,
        used_kb: parseInt(parts[2]) || 0,
        available_kb: parseInt(parts[3]) || 0,
        use_percent: parseFloat(parts[4]) || 0,
      };
    }
  } catch {}
  return { total_kb: 0, used_kb: 0, available_kb: 0, use_percent: 0 };
}

function generatePrometheusMetrics() {
  const sys = getSystemMetrics();
  const containers = getContainerMetrics();
  const deployments = getDeploymentMetrics();
  const apps = getAppMetrics();
  const disk = getDiskMetrics();

  const lines = [];

  function gauge(name, help, value, labels) {
    const labelStr = labels ? `{${Object.entries(labels).map(([k, v]) => `${k}="${v}"`).join(',')}}` : '';
    lines.push(`# HELP ${METRICS_PREFIX}${name} ${help}`);
    lines.push(`# TYPE ${METRICS_PREFIX}${name} gauge`);
    lines.push(`${METRICS_PREFIX}${name}${labelStr} ${value}`);
  }

  gauge('system_cpu_total', 'Total CPU time', sys.cpu_total);
  gauge('system_cpu_idle', 'Idle CPU time', sys.cpu_idle);
  gauge('system_memory_bytes', 'Total memory in bytes', sys.memory_total, { type: 'total' });
  gauge('system_memory_bytes', 'Free memory in bytes', sys.memory_free, { type: 'free' });
  gauge('system_uptime_seconds', 'System uptime in seconds', sys.uptime);
  gauge('system_load_1m', 'Load average 1m', sys.loadavg[0]);
  gauge('system_load_5m', 'Load average 5m', sys.loadavg[1]);
  gauge('system_load_15m', 'Load average 15m', sys.loadavg[2]);

  gauge('disk_total_kb', 'Total disk space in KB', disk.total_kb);
  gauge('disk_used_kb', 'Used disk space in KB', disk.used_kb);
  gauge('disk_available_kb', 'Available disk space in KB', disk.available_kb);
  gauge('disk_use_percent', 'Disk usage percentage', disk.use_percent);

  gauge('deployments_total', 'Total deployments', deployments.total);
  gauge('deployments_success', 'Successful deployments', deployments.success);
  gauge('deployments_failed', 'Failed deployments', deployments.failed);
  gauge('deployments_running', 'Running deployments', deployments.running);

  gauge('apps_total', 'Total registered apps', apps.total);

  for (const c of containers) {
    gauge('container_cpu_percent', 'Container CPU usage', c.cpu_percent, { name: c.name });
    gauge('container_mem_percent', 'Container memory usage', c.mem_percent, { name: c.name });
  }

  return lines.join('\n') + '\n';
}

module.exports = {
  getSystemMetrics,
  getContainerMetrics,
  getDeploymentMetrics,
  getAppMetrics,
  getDiskMetrics,
  generatePrometheusMetrics,
};
