import fs from 'fs';
import os from 'os';

function readEnvInt(name, fallback) {
  const raw = process.env[name];
  if (raw === undefined || raw === '') return fallback;
  const n = Number.parseInt(String(raw), 10);
  return Number.isFinite(n) ? n : fallback;
}

function readEnvFloat(name, fallback) {
  const raw = process.env[name];
  if (raw === undefined || raw === '') return fallback;
  const n = Number.parseFloat(String(raw));
  return Number.isFinite(n) ? n : fallback;
}

export function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes < 0) return '—';
  const units = ['B', 'KB', 'MB', 'GB'];
  let n = bytes;
  let i = 0;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i += 1;
  }
  return `${n.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

function readCgroupMemoryLimitBytes() {
  try {
    const v2 = '/sys/fs/cgroup/memory.max';
    if (fs.existsSync(v2)) {
      const raw = fs.readFileSync(v2, 'utf8').trim();
      if (raw === 'max') return null;
      const n = Number.parseInt(raw, 10);
      return Number.isFinite(n) && n > 0 ? n : null;
    }

    const v1 = '/sys/fs/cgroup/memory/memory.limit_in_bytes';
    if (fs.existsSync(v1)) {
      const n = Number.parseInt(fs.readFileSync(v1, 'utf8').trim(), 10);
      if (!Number.isFinite(n) || n <= 0) return null;
      // Very large value means "no limit" on some hosts
      if (n > 1e15) return null;
      return n;
    }
  } catch {
    /* not in cgroup or unreadable */
  }
  return null;
}

function detectInContainer() {
  if (String(process.env.RUNNING_IN_CONTAINER || '').toLowerCase() === 'true') {
    return true;
  }
  try {
    if (fs.existsSync('/.dockerenv')) return true;
  } catch {
    /* ignore */
  }
  const cgroupLimit = readCgroupMemoryLimitBytes();
  if (cgroupLimit && cgroupLimit < os.totalmem()) return true;
  return false;
}

function statusFromThresholds(value, warnAt, critAt) {
  if (value >= critAt) return 'critical';
  if (value >= warnAt) return 'warning';
  return 'healthy';
}

function getThresholds() {
  return {
    rssWarnPct: readEnvFloat('ADMIN_HEALTH_RSS_WARN_PCT', 80),
    rssCritPct: readEnvFloat('ADMIN_HEALTH_RSS_CRIT_PCT', 92),
    hostLoadWarnPerCpu: readEnvFloat('ADMIN_HEALTH_HOST_LOAD_WARN_PER_CPU', 0.85),
    hostLoadCritPerCpu: readEnvFloat('ADMIN_HEALTH_HOST_LOAD_CRIT_PER_CPU', 1.5),
    uptimeWarnSec: readEnvInt('ADMIN_HEALTH_UPTIME_WARN_SEC', 30),
    includeHostInOverall:
      String(process.env.ADMIN_HEALTH_INCLUDE_HOST_IN_OVERALL || '').toLowerCase() === 'true',
  };
}

/**
 * Production-oriented health snapshot.
 * In containers: memory health uses process RSS vs cgroup limit (not V8 heap %).
 * Host CPU/RAM are informational unless ADMIN_HEALTH_INCLUDE_HOST_IN_OVERALL=true.
 */
export function collectSystemHealth() {
  const inContainer = detectInContainer();
  const thresholds = getThresholds();
  const mem = process.memoryUsage();
  const cgroupLimit = readCgroupMemoryLimitBytes();
  const rssBytes = mem.rss;

  let memoryScope = 'process';
  let memoryLimitBytes = null;
  let memoryUsedBytes = rssBytes;
  let memoryUsedPercent = null;

  if (cgroupLimit) {
    memoryScope = 'cgroup';
    memoryLimitBytes = cgroupLimit;
    memoryUsedPercent = (rssBytes / cgroupLimit) * 100;
  }

  const memoryStatus =
    memoryUsedPercent == null
      ? 'healthy'
      : statusFromThresholds(
          memoryUsedPercent,
          thresholds.rssWarnPct,
          thresholds.rssCritPct
        );

  const heapUsedVsAllocated =
    mem.heapTotal > 0 ? (mem.heapUsed / mem.heapTotal) * 100 : null;

  const load = os.loadavg();
  const cpus = os.cpus().length;
  const hostLoadPerCpu = load[0] / Math.max(cpus, 1);
  const hostLoadStatus = statusFromThresholds(
    hostLoadPerCpu,
    thresholds.hostLoadWarnPerCpu,
    thresholds.hostLoadCritPerCpu
  );

  const uptimeSeconds = Math.floor(process.uptime());
  const uptimeStatus = uptimeSeconds >= thresholds.uptimeWarnSec ? 'healthy' : 'warning';

  const checks = [
    {
      id: 'process_memory',
      label: inContainer ? 'Container memory (process RSS)' : 'Process memory (RSS)',
      scope: memoryScope,
      status: memoryStatus,
      detail:
        memoryUsedPercent == null
          ? `RSS ${formatBytes(rssBytes)} (no cgroup limit detected)`
          : `${memoryUsedPercent.toFixed(1)}% of ${formatBytes(memoryLimitBytes)} limit`,
      usedBytes: memoryUsedBytes,
      limitBytes: memoryLimitBytes,
      usedPercent: memoryUsedPercent,
      includedInOverallHealth: true,
    },
    {
      id: 'v8_heap',
      label: 'V8 heap (informational)',
      scope: 'process',
      status: 'healthy',
      detail:
        heapUsedVsAllocated == null
          ? '—'
          : `${heapUsedVsAllocated.toFixed(1)}% of allocated heap (${formatBytes(mem.heapUsed)} / ${formatBytes(mem.heapTotal)}) — not used for alerts; V8 grows heap before GC`,
      usedBytes: mem.heapUsed,
      limitBytes: mem.heapTotal,
      usedPercent: heapUsedVsAllocated,
      includedInOverallHealth: false,
    },
    {
      id: 'api_uptime',
      label: 'API process uptime',
      scope: 'process',
      status: uptimeStatus,
      detail: `${uptimeSeconds}s`,
      includedInOverallHealth: false,
    },
  ];

  if (!inContainer || thresholds.includeHostInOverall) {
    checks.push({
      id: 'host_load',
      label: inContainer ? 'Host CPU load (shared node)' : 'Host CPU load',
      scope: 'host',
      status: hostLoadStatus,
      detail: `${load[0].toFixed(2)} (1m) · ${cpus} logical CPUs`,
      includedInOverallHealth: !inContainer || thresholds.includeHostInOverall,
    });
    checks.push({
      id: 'host_memory',
      label: inContainer ? 'Host RAM free (shared node)' : 'Host RAM free',
      scope: 'host',
      status: 'healthy',
      detail: `${formatBytes(os.freemem())} free of ${formatBytes(os.totalmem())}`,
      includedInOverallHealth: false,
    });
  }

  const contributing = checks.filter((c) => c.includedInOverallHealth);
  const overall = contributing.some((c) => c.status === 'critical')
    ? 'critical'
    : contributing.some((c) => c.status === 'warning')
      ? 'warning'
      : 'healthy';

  return {
    runtime: {
      inContainer,
      memoryScope,
      cgroupMemoryLimitBytes: cgroupLimit,
      note: inContainer
        ? 'Health is based on this container/process (RSS vs cgroup limit). Host CPU/RAM reflect the underlying node and are not container-isolated unless labeled.'
        : 'Running outside a detected container; process RSS is shown without a cgroup limit percentage.',
    },
    thresholds: {
      rssWarnPct: thresholds.rssWarnPct,
      rssCritPct: thresholds.rssCritPct,
      hostLoadWarnPerCpu: thresholds.hostLoadWarnPerCpu,
      hostLoadCritPerCpu: thresholds.hostLoadCritPerCpu,
      uptimeWarnSec: thresholds.uptimeWarnSec,
      includeHostInOverall: thresholds.includeHostInOverall,
    },
    process: {
      uptimeSeconds,
      nodeVersion: process.version,
      pid: process.pid,
      memory: {
        rss: formatBytes(mem.rss),
        rssBytes: mem.rss,
        heapUsed: formatBytes(mem.heapUsed),
        heapTotal: formatBytes(mem.heapTotal),
        heapAllocatedPercent:
          heapUsedVsAllocated == null ? null : Number(heapUsedVsAllocated.toFixed(1)),
        external: formatBytes(mem.external),
      },
    },
    host:
      !inContainer || thresholds.includeHostInOverall
        ? {
            platform: `${os.platform()} ${os.release()}`,
            hostname: os.hostname(),
            cpuCores: cpus,
            loadAverage: {
              '1m': Number(load[0].toFixed(2)),
              '5m': Number(load[1].toFixed(2)),
              '15m': Number(load[2].toFixed(2)),
            },
            memory: {
              free: formatBytes(os.freemem()),
              total: formatBytes(os.totalmem()),
            },
          }
        : {
            platform: `${os.platform()} ${os.release()}`,
            hostname: os.hostname(),
            note: 'Host load/RAM hidden from overall health in container mode. Set ADMIN_HEALTH_INCLUDE_HOST_IN_OVERALL=true to include host CPU in scoring.',
          },
    checks,
    overall,
  };
}
