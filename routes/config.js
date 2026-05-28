const fs = require('fs');
const path = require('path');
const { getUsers } = require('../lib/user-store');

const pluginRegistry = [];
const freeIpUsage = new Map();
const FREE_LIMIT_PER_DAY = 100;

function apiResponse(res, status, success, message, data = null) {
  const payload = { success, message };
  if (data !== null) payload.data = data;
  return res.status(status).json(payload);
}

function extractApiToken(req) {
  const auth = req.headers.authorization || '';
  if (auth.toLowerCase().startsWith('bearer ')) return auth.slice(7).trim();
  return (req.query.apitoken || '').trim();
}

function consumeFreeIpQuota(ipAddress) {
  const today = new Date().toISOString().slice(0, 10);
  const existing = freeIpUsage.get(ipAddress);
  if (!existing || existing.date !== today) {
    freeIpUsage.set(ipAddress, { date: today, count: 1 });
    return { allowed: true, remaining: FREE_LIMIT_PER_DAY - 1 };
  }
  if (existing.count >= FREE_LIMIT_PER_DAY) {
    return { allowed: false, remaining: 0 };
  }
  existing.count += 1;
  return { allowed: true, remaining: FREE_LIMIT_PER_DAY - existing.count };
}

async function checkApiKey(req, res, next) {
  const apiToken = extractApiToken(req);

  if (!apiToken) {
    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip || 'unknown';
    const quota = consumeFreeIpQuota(ip);
    if (!quota.allowed) {
      return apiResponse(res, 429, false, 'Free plan limit reached: 100 requests per IP per day. Upgrade to premium/admin for API key access.');
    }
    req.user = { role: 'free', ip, remainingDailyRequests: quota.remaining };
    return next();
  }

  const users = await getUsers();
  const user = users.find((u) => u.key === apiToken);
  if (!user) return apiResponse(res, 401, false, 'Invalid API token.');
  if (!(user.premium || user.adm)) {
    return apiResponse(res, 403, false, 'API key is only available for premium/admin accounts.');
  }

  req.user = user;
  return next();
}

function toCatalogName(routePath) {
  return routePath
    .replace(/^\//, '')
    .replace(/\//g, ' / ')
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
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
        pluginRegistry.push({ file: f, rota: p.rota, method: 'GET', status, catalog: toCatalogName(p.rota) });
        app.get(p.rota, checkApiKey, (req, res, next) => {
          if (status === 'maintenance') return apiResponse(res, 503, false, 'Endpoint is under maintenance.');
          if (status === 'closed') return apiResponse(res, 403, false, 'Endpoint is closed.');
          return p.run(req, res, next);
        });
      } catch (e) {
        console.error(`${f}:`, e.message);
      }
    });

  app.get('/api/plugins/list', (req, res) => {
    res.json({ success: true, message: 'Plugin list fetched', data: { total: pluginRegistry.length, endpoints: pluginRegistry } });
  });
}

module.exports = { getUsers, checkApiKey, plugins, apiResponse };
