const metrics = {
  startedAt: Date.now(),
  totals: { requests: 0, errors: 0 },
  statusCodes: { s2xx: 0, s4xx: 0, s5xx: 0 },
  endpointHits: new Map(),
  recent: []
};

let monitorWss = null;
let monitorWebSocket = null;
let lastBroadcastAt = 0;
let pendingBroadcastTimer = null;

function maskIp(ip = '') {
  if (!ip) return 'unknown';
  if (ip.includes(':')) return ip.split(':').slice(0, 4).join(':') + ':x';
  const parts = ip.split('.');
  if (parts.length === 4) return `${parts[0]}.${parts[1]}.${parts[2]}.x`;
  return ip;
}

function safeSend(ws, payload) {
  if (!monitorWebSocket || ws.readyState !== monitorWebSocket.OPEN) return;
  try { ws.send(payload); } catch {}
}

function broadcastMonitor(reason = 'tick') {
  if (!monitorWss) return;
  const payload = JSON.stringify(buildPayload(monitorWss, reason));
  for (const ws of monitorWss.clients) safeSend(ws, payload);
}

function scheduleBroadcast(reason = 'request') {
  if (!monitorWss) return;
  const now = Date.now();
  const wait = Math.max(0, 250 - (now - lastBroadcastAt));
  clearTimeout(pendingBroadcastTimer);
  pendingBroadcastTimer = setTimeout(() => {
    lastBroadcastAt = Date.now();
    broadcastMonitor(reason);
  }, wait);
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

  scheduleBroadcast('request');
}

function buildPayload(wss, reason = 'tick') {
  const total = metrics.totals.requests || 1;
  const successRate = ((metrics.statusCodes.s2xx / total) * 100).toFixed(1);
  const topEndpoints = [...metrics.endpointHits.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([path, hits]) => ({ path, hits }));

  return {
    type: 'monitor',
    reason,
    ts: new Date().toISOString(),
    uptime: process.uptime(),
    memoryRss: process.memoryUsage().rss,
    pid: process.pid,
    activeConns: wss.clients.size,
    websocket: {
      path: '/ws/monitor',
      heartbeat: true,
      intervalMs: 1000,
      clients: wss.clients.size
    },
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
    return null;
  }

  monitorWebSocket = WebSocket;
  const wss = new WebSocketServer({ server, path: '/ws/monitor' });
  monitorWss = wss;

  wss.on('connection', (ws, req) => {
    ws.isAlive = true;
    ws.connectedAt = Date.now();
    ws.ip = maskIp(req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket.remoteAddress || 'unknown');
    ws.on('pong', () => { ws.isAlive = true; });
    safeSend(ws, JSON.stringify(buildPayload(wss, 'connection')));
    scheduleBroadcast('connection');
  });

  const heartbeat = setInterval(() => {
    for (const ws of wss.clients) {
      if (ws.isAlive === false) {
        ws.terminate();
        continue;
      }
      ws.isAlive = false;
      try { ws.ping(); } catch {}
    }
  }, 30000);

  const tick = setInterval(() => broadcastMonitor('tick'), 1000);

  wss.on('close', () => {
    clearInterval(heartbeat);
    clearInterval(tick);
    clearTimeout(pendingBroadcastTimer);
    monitorWss = null;
  });

  return wss;
}

module.exports = { attachMonitorWebSocket, recordRequest, buildPayload };
