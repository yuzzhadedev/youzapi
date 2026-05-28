const express = require('express');
const path = require('path');
const session = require('express-session');
const flash = require('connect-flash');
const helmet = require('helmet');
const bcrypt = require('bcryptjs');
const sanitizeHtml = require('sanitize-html');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');

dotenv.config();

const http = require('http');

const app = express();
const PORT = process.env.PORT || 3000;
const FOTO_PADRAO = 'https://raw.githubusercontent.com/uploader762/dat3/main/uploads/3fae03-1776528467067.jpg';
const DB_TYPE = (process.env.DB_TYPE || '').toLowerCase();

const { plugins } = require('./routes/config');
const { getUsers: loadUsers, saveUsers, connectMongo } = require('./lib/user-store');
plugins(app);

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

let sessionStore;
if (DB_TYPE === 'mongodb' || process.env.MONGODB_URI) {
  try {
    if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI belum di-set');
    const MongoStore = require('connect-mongo');
    sessionStore = MongoStore.create({
      mongoUrl: process.env.MONGODB_URI,
      dbName: process.env.MONGODB_DB || 'youzapi',
      collectionName: 'sessions'
    });
  } catch (err) {
    if (DB_TYPE === 'mongodb') throw err;
    console.warn('[DB] Session MongoDB tidak aktif:', err.message);
  }
}

app.use(session({
secret: process.env.SESSION_SECRET || 'youz-api-change-this-secret',// bota algo mais seguro
resave: false,
saveUninitialized: false,
store: sessionStore,
cookie: {
secure: process.env.NODE_ENV === 'production',
httpOnly: true,
maxAge: 1000 * 60 * 60 * 24
}
}));

app.use(flash());
app.use((req, res, next) => {
res.locals.user = req.session.user || null;
next();
});

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
app.use('/api/', limiter);


function gerarKey(len = 32) {
const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
return Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}



function ensureApiKey(user, users) {
  if (user.key && String(user.key).trim()) return user.key;
  let key;
  do { key = gerarKey(); } while (users.some((u) => u !== user && u.key === key));
  user.key = key;
  return key;
}

function safeUser(u) {
return {
id: u.id,
username: u.username,
foto: u.foto,
capa: u.capa,
level: u.level || 1,
xp: u.xp || 0,
totalRequests: u.totalRequests || 100,
adm: u.adm || false,
premium: u.premium || false,
key: u.key,
};
}

function auth(req, res, next) {
if (!req.session.user) return res.redirect('/login');
next();
}

app.get('/', (req, res) => res.render('home', { title: 'Home · YOUZ API', user: req.session.user || null }));
app.get('/login', (req, res) => req.session.user ? res.redirect('/perfil') : res.render('login', { title: 'Login · YOUZ API' }));
app.get('/registro', (req, res) => req.session.user ? res.redirect('/perfil') : res.render('registro', { title: 'Criar conta · Youz API' }));

app.get('/dash', (req, res) => res.redirect('/'));

app.get('/playground', (req, res) => res.render('playground', { title: 'Playground · YOUZ API', user: req.session.user || null }));
app.get('/Playground', (req, res) => res.redirect('/playground'));
app.get('/monitor', (req, res) => res.render('monitor', { title: 'Monitor · YOUZ API', user: req.session.user || null }));

app.get('/perfil', auth, async (req, res) => {
const user = (await loadUsers()).find(u => u.username === req.session.user.username);
if (!user) return res.redirect('/login');
res.render('perfil', {
title: 'Profil · YOUZ API',
user: safeUser(user),
success_msg: req.flash('success'),
error_msg: req.flash('error')
});
});

app.get('/perfil/editar', auth, async (req, res) => {
const user = (await loadUsers()).find(u => u.username === req.session.user.username);
if (!user) return res.redirect('/login');
res.render('editar-perfil', {
title: 'Edit Profil · YOUZ API',
user: safeUser(user),
success_msg: req.flash('success'),
error_msg: req.flash('error')
});
});

app.get('/logout', (req, res) => req.session.destroy(() => res.redirect('/login')));

app.get('/api/account/me', auth, async (req, res) => {
  const users = await loadUsers();
  const idx = users.findIndex(u => u.username === req.session.user.username);
  if (idx === -1) return res.status(404).json({ success: false, message: 'User not found' });

  const user = users[idx];
  const hadKey = Boolean(user.key && String(user.key).trim());
  ensureApiKey(user, users);
  if (!hadKey) await saveUsers(users);

  req.session.user = safeUser(user);
  return res.json({ success: true, data: { username: user.username, key: user.key, adm: !!user.adm, premium: !!user.premium } });
});

app.post('/api/login', async (req, res) => {
const { username, password } = req.body;
if (!username || !password) return res.json({ success: false, message: 'Preencha todos os campos' });

const users = await loadUsers();
const user = users.find(u => u.username === username);
if (!user || !(await bcrypt.compare(password, user.password))) {
return res.json({ success: false, message: 'Credenciais inválidas' });
}
ensureApiKey(user, users);
await saveUsers(users);
req.session.user = safeUser(user);
res.json({ success: true });
});

app.post('/api/registro', async (req, res) => {
let { username, email, password } = req.body;
if (!username || !email || !password) return res.json({ success: false, message: 'Preencha todos os campos' });

username = sanitizeHtml(username, { allowedTags: [], allowedAttributes: {} }).trim();
email = sanitizeHtml(email, { allowedTags: [], allowedAttributes: {} }).trim().toLowerCase();
if (!username) return res.json({ success: false, message: 'Usuário inválido' });
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.json({ success: false, message: 'E-mail tidak valid' });
if (password.length < 6) return res.json({ success: false, message: 'Senha muito curta (mín. 6)' });

const users = await loadUsers();
if (users.some(u => u.username === username)) return res.json({ success: false, message: 'Usuário já existe' });
if (users.some(u => (u.email || '').toLowerCase() === email)) return res.json({ success: false, message: 'E-mail já cadastrado' });

const newUser = {
id: (users.length ? Math.max(...users.map(u => u.id || 0)) : 0) + 1,
username, email,
password: await bcrypt.hash(password, 10),
key: null,
level: 1, xp: 0, totalRequests: 100,
foto: FOTO_PADRAO, 
capa: 'https://raw.githubusercontent.com/uploader762/dat3/main/uploads/3fae03-1776528467067.jpg',
adm: false, premium: false,
createdAt: new Date().toISOString()
};

let key;
do { key = gerarKey(); } while (users.some(u => u.key === key));
newUser.key = key;

users.push(newUser);
await saveUsers(users);
req.session.user = safeUser(newUser);
res.json({ success: true });
});

app.post('/api/perfil/editar', auth, async (req, res) => {
const { username, foto, capa, key } = req.body;
const users = await loadUsers();
const idx = users.findIndex(u => u.username === req.session.user.username);
  if (idx === -1) return res.json({ success: false, message: 'Usuário não encontrado' });

const user = users[idx];

if (username && username !== user.username) {
if (username.length < 3 || username.length > 20) return res.json({ success: false, message: 'Usuário deve ter entre 3 e 20 caracteres' });
if (users.some(u => u.username === username && u.id !== user.id)) return res.json({ success: false, message: 'Usuário já em uso' });
user.username = username.trim();
}
if (foto && foto.startsWith('https://')) user.foto = foto.trim();
if (capa && capa.startsWith('https://')) user.capa = capa.trim();
if (key && (user.premium || user.adm)) user.key = key.trim();

await saveUsers(users);
req.session.user = safeUser(user);
req.flash('success', 'Perfil atualizado!');
res.json({ success: true });
});

app.use((req, res) => res.status(404).render('404', { title: '404 · Youz API' }));
app.use((err, req, res, next) => {
console.error(err.stack);
res.status(500).render('500', { title: '500 · Youz API' });
});

connectMongo().catch((err) => {
  if (DB_TYPE === 'mongodb') {
    console.error('[DB] MongoDB wajib aktif:', err.message);
    process.exit(1);
  }
  console.warn('[DB] MongoDB tidak aktif:', err.message);
});

const server = http.createServer(app);
const { attachMonitorWebSocket } = require('./routes/monitor-ws');
attachMonitorWebSocket(server);

server.listen(PORT, '0.0.0.0', () => console.log(`🚀 http://localhost:${PORT}`));
