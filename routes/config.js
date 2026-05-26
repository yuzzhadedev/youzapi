const fs = require('fs');
const path = require('path');

const db = path.join(__dirname, '../database/users.json');

function lerUsers() {
try {
const d = JSON.parse(fs.readFileSync(db, 'utf8'));
return Array.isArray(d) ? d : [];
} catch { return []; }
}

function salvarUsers(lista) {
try {
fs.writeFileSync(db, JSON.stringify(lista, null, 2));
return true;
} catch { return false; }
}

async function check_key(req, res, next) {
const { apitoken } = req.query;
if (!apitoken) return res.status(401).json({ ok: false, msg: 'Token belum diberikan' });

const users = lerUsers();
const i = users.findIndex(u => u.key === apitoken);
if (i === -1) return res.status(401).json({ ok: false, msg: 'Token tidak valid' });

const u = users[i];
if ((u.totalRequests || 0) < 1)
return res.status(403).json({ ok: false, msg: 'Request habis. Silakan upgrade paket.' });

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
if (!salvarUsers(users)) return res.status(500).json({ ok: false, msg: 'Gagal menyimpan data' });

req.usuario = u;
next();
}

function plugins(app) {
const dir = path.join(__dirname, 'plugins');
if (!fs.existsSync(dir)) return console.warn('Folder plugins tidak ada');

fs.readdirSync(dir)
.filter(f => f.endsWith('.js'))
.forEach(f => {
try {
const p = require(path.join(dir, f));
if (!p.rota || !p.run) return console.warn(`${f}: kurang 'rota' atau 'run'`);
app.get(p.rota, check_key, p.run);
console.log(`${f} - GET ${p.rota}`);
} catch (e) {
console.error(`${f}:`, e.message);
}
});
}

module.exports = { lerUsers, salvarUsers, check_key, plugins };
