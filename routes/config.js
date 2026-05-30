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
  return (req.query.apitoken || req.body?.apitoken || '').trim();
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
      return apiResponse(res, 429, false, 'Kuota gratis harian sudah habis. Gunakan API key aktif untuk akses lebih stabil.');
    }
    req.user = { role: 'free', ip, remainingDailyRequests: quota.remaining };
    return next();
  }

  const users = await getUsers();
  const user = users.find((u) => u.key === apiToken);
  if (!user) return apiResponse(res, 401, false, 'API token belum sesuai.');
  if (!(user.premium || user.adm)) {
    return apiResponse(res, 403, false, 'API key aktif diperlukan untuk akses ini.');
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

function normalizePluginMethods(plugin) {
  const methodConfig = plugin.methods || plugin.metode || plugin.method || plugin.metodo;
  const rawMethods = Array.isArray(methodConfig) ? methodConfig : (methodConfig ? [methodConfig] : ['GET', 'POST']);
  const methods = rawMethods
    .map((method) => String(method).toUpperCase())
    .filter((method) => ['GET', 'POST'].includes(method));
  return [...new Set(methods.length ? methods : ['GET'])];
}

function normalizePluginStatus(plugin) {
  const flags = {
    ismaintenance: plugin.ismaintenance === true,
    isready: plugin.isready !== false,
    isclosed: plugin.isclosed === true
  };

  if (flags.isclosed) return { status: 'closed', flags: { ismaintenance: false, isready: false, isclosed: true } };
  if (flags.ismaintenance) return { status: 'maintenance', flags: { ismaintenance: true, isready: false, isclosed: false } };
  if (plugin.isready === false) return { status: 'closed', flags: { ismaintenance: false, isready: false, isclosed: true } };

  const legacyStatus = String(plugin.status || 'ready').toLowerCase();
  if (legacyStatus === 'closed') return { status: 'closed', flags: { ismaintenance: false, isready: false, isclosed: true } };
  if (legacyStatus === 'maintenance') return { status: 'maintenance', flags: { ismaintenance: true, isready: false, isclosed: false } };

  return { status: 'ready', flags: { ismaintenance: false, isready: true, isclosed: false } };
}

function attachUnifiedParams(req, res, next) {
  req.paramsInput = { ...(req.query || {}), ...(req.body || {}) };
  return next();
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
        const { status, flags } = normalizePluginStatus(p);
        const methods = normalizePluginMethods(p);
        pluginRegistry.push({ file: f, rota: p.rota, method: methods.join('|'), methods, status, ...flags, catalog: toCatalogName(p.rota) });
        methods.forEach((method) => {
          app[method.toLowerCase()](p.rota, checkApiKey, attachUnifiedParams, (req, res, next) => {
            if (status === 'maintenance') return apiResponse(res, 503, false, 'Layanan sedang dirapikan. Coba lagi nanti.');
            if (status === 'closed') return apiResponse(res, 403, false, 'Layanan ini sedang ditutup sementara.');
            return p.run(req, res, next);
          });
        });
      } catch (e) {
        console.error(`${f}:`, e.message);
      }
    });

  app.get('/api/plugins/list', (req, res) => {
    res.json({ success: true, message: 'Daftar layanan tersedia', data: { total: pluginRegistry.length, endpoints: pluginRegistry } });
  });
}

module.exports = { getUsers, checkApiKey, plugins, apiResponse };
