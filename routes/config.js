const fs = require('fs');
const path = require('path');
const { getUsers: lerUsers, saveUsers: salvarUsers } = require('../lib/user-store');

const pluginRegistry = [];

async function check_key(req, res, next) {
  const { apitoken } = req.query;
  if (!apitoken) return res.status(401).json({ ok: false, msg: 'Token belum diberikan' });

  const users = await lerUsers();
  const i = users.findIndex((u) => u.key === apitoken);
  if (i === -1) return res.status(401).json({ ok: false, msg: 'Token tidak valid' });

  const u = users[i];
  if ((u.totalRequests || 0) < 1) return res.status(403).json({ ok: false, msg: 'Request habis. Silakan upgrade paket.' });

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
  await salvarUsers(users);
  req.usuario = u;
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
        pluginRegistry.push({ file: f, rota: p.rota, method: 'GET' });
        app.get(p.rota, check_key, p.run);
        console.log(`${f} - GET ${p.rota}`);
      } catch (e) {
        console.error(`${f}:`, e.message);
      }
    });

  app.get('/api/plugins/list', (req, res) => {
    res.json({ ok: true, total: pluginRegistry.length, endpoints: pluginRegistry });
  });
}

module.exports = { lerUsers, salvarUsers, check_key, plugins };
