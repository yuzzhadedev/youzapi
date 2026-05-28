const metrics = {
  startedAt: Date.now(),
  totals: { requests: 0, errors: 0 },
  statusCodes: { s2xx: 0, s4xx: 0, s5xx: 0 },
  endpointHits: new Map(),
  recent: []
};

function maskIp(ip = '') {
  if (!ip) return 'unknown';
  if (ip.includes(':')) return ip.split(':').slice(0, 4).join(':') + ':x';
  const parts = ip.split('.');
  if (parts.length === 4) return `${parts[0]}.${parts[1]}.${parts[2]}.x`;
  return ip;
}

function recordRequest({ method, path, statusCode, durationMs, ip, ua }) {
  metrics.totals.requests += 1;
  if (statusCode >= 500) metrics.statusCodes.s5xx += 1;
  else if (statusCode >= 400) metrics.statusCodes.s4xx += 1;
  else metrics.statusCodes.s2xx += 1;
  if (statusCode >= 400) metrics.totals.errors += 1;

  const key = `${method} ${path}`;
  metrics.endpointHits.set(key, (metrics.endpointHits.get(key) || 0) + 1);

  metrics.recent.unshift({
    ts: Date.now(), method, path, status: statusCode,
    ip: maskIp(ip), latency: `${Math.round(durationMs)}ms`, ua: (ua || 'unknown').slice(0, 40)
  });
  if (metrics.recent.length > 25) metrics.recent.length = 25;
}

function buildPayload(wss) {
  const total = metrics.totals.requests || 1;
  const successRate = ((metrics.statusCodes.s2xx / total) * 100).toFixed(1);
  const topEndpoints = [...metrics.endpointHits.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([path, hits]) => ({ path, hits }));

  return {
    type: 'monitor',
    ts: new Date().toISOString(),
    uptime: process.uptime(),
    memoryRss: process.memoryUsage().rss,
    pid: process.pid,
    activeConns: wss.clients.size,
    stats: {
      totalRequests: metrics.totals.requests,
      totalErrors: metrics.totals.errors,
      successRate,
      statusCodes: metrics.statusCodes,
      topEndpoints,
      recent: metrics.recent
    }
  };
}

function attachMonitorWebSocket(server) {
  let WebSocketServer;
  let WebSocket;
  try {
    ({ WebSocketServer, WebSocket } = require('ws'));
  } catch {
    console.warn('[WS] package "ws" not installed, realtime monitor disabled.');
    return;
  }

  const wss = new WebSocketServer({ server, path: '/ws/monitor' });
  const broadcast = () => {
    const payload = JSON.stringify(buildPayload(wss));
    for (const ws of wss.clients) {
      if (ws.readyState === WebSocket.OPEN) ws.send(payload);
    }
  };

  wss.on('connection', (ws) => {
    ws.send(JSON.stringify(buildPayload(wss)));
  });

  setInterval(broadcast, 1000);
}

module.exports = { attachMonitorWebSocket, recordRequest };
