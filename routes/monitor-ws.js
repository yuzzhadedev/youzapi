function buildPayload(){
  return {
    type: 'monitor',
    ts: new Date().toISOString(),
    uptime: process.uptime(),
    memoryRss: process.memoryUsage().rss,
    pid: process.pid
  };
}

function attachMonitorWebSocket(server){
  let WebSocketServer;
  let WebSocket;
  try {
    ({ WebSocketServer, WebSocket } = require('ws'));
  } catch {
    console.warn('[WS] package "ws" not installed, realtime monitor disabled.');
    return;
  }
  const wss = new WebSocketServer({ server, path: '/ws/monitor' });
  wss.on('connection', (ws)=>{
    ws.send(JSON.stringify(buildPayload()));
    const timer=setInterval(()=>{
      if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(buildPayload()));
    },2000);
    ws.on('close',()=>clearInterval(timer));
  });
}

module.exports = { attachMonitorWebSocket };
