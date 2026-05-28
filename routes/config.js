const fs = require('fs');
const path = require('path');
const { getUsers, saveUsers } = require('../lib/user-store');

const pluginRegistry = [];

function apiResponse(res, status, success, message, data = null) {
  const payload = { success, message };
  if (data !== null) payload.data = data;
  return res.status(status).json(payload);
}

function extractApiToken(req) {
  const auth = req.headers.authorization || "";
  if (auth.toLowerCase().startsWith("bearer ")) return auth.slice(7).trim();
  return (req.query.apitoken || "").trim();
}

async function checkApiKey(req, res, next) {
  const apiToken = extractApiToken(req);
  if (!apiToken) return apiResponse(res, 401, false, 'API token is required. Send Authorization: Bearer <token>.');

  const users = await getUsers();
  const i = users.findIndex((u) => u.key === apiToken);
  if (i === -1) return apiResponse(res, 401, false, "Invalid API token.");

  const u = users[i];
  if ((u.totalRequests || 0) < 1) return apiResponse(res, 403, false, 'Request quota exhausted. Please upgrade your plan.');

  u.totalRequests--;
  const xp = (u.xp || 0) + 10;
  const lvl = u.level || 1;
  const threshold = lvl * 50;
  if (xp >= threshold) {
    u.level = lvl + 1;
    u.xp = xp % threshold;
  } else {
    u.xp = xp;
  }

  users[i] = u;
  await saveUsers(users);
  req.user = u;
  next();
}

function plugins(app) {
  const dir = path.join(__dirname, 'plugins');
  if (!fs.existsSync(dir)) return console.warn('Folder plugins tidak ada');

  fs.readdirSync(dir)
    .filter((f) => f.endsWith('.js'))
    .forEach((f) => {
      try {
        const p = require(path.join(dir, f));
        if (!p.rota || !p.run) return console.warn(`${f}: kurang 'rota' atau 'run'`);
        const status = (p.status || 'ready').toLowerCase();
        pluginRegistry.push({ file: f, rota: p.rota, method: 'GET', status });
        app.get(p.rota, checkApiKey, (req, res, next) => {
          if (status === 'maintenance') return apiResponse(res, 503, false, 'Endpoint is under maintenance.');
          if (status === 'closed') return apiResponse(res, 403, false, 'Endpoint is closed.');
          return p.run(req, res, next);
        });
        console.log(`${f} - GET ${p.rota}`);
      } catch (e) {
        console.error(`${f}:`, e.message);
      }
    });

  app.get('/api/plugins/list', (req, res) => {
    res.json({ success: true, message: 'Plugin list fetched', data: { total: pluginRegistry.length, endpoints: pluginRegistry } });
  });
}

module.exports = { getUsers, saveUsers, checkApiKey, plugins, apiResponse };
