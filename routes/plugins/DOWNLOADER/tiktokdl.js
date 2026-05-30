const crypto = require('node:crypto');
const vm = require('node:vm');
const cheerio = require('cheerio');

const BASE = 'https://snaptik.app';
const PAGE = `${BASE}/en2`;
const API = `${BASE}/abc2.php`;
const LANG = 'en2';
const UA = 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Mobile Safari/537.36';

const cookieJar = new Map();

function autoToken() {
  const unix = Math.floor(Date.now() / 1000).toString();
  return `ey${Buffer.from(unix).toString('base64')}c`;
}

function saveCookies(headers) {
  const setCookie = headers.getSetCookie?.() || headers.get('set-cookie')?.split(/,(?=\s*[^;=]+=[^;]+)/) || [];
  for (const rawCookie of setCookie) {
    const cookie = String(rawCookie || '').split(';')[0];
    const eq = cookie.indexOf('=');
    if (eq <= 0) continue;
    cookieJar.set(cookie.slice(0, eq), cookie.slice(eq + 1));
  }
}

function getCookieHeader() {
  return [...cookieJar.entries()].map(([key, value]) => `${key}=${value}`).join('; ');
}

function commonHeaders(extra = {}) {
  return {
    'user-agent': UA,
    'accept-language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
    'sec-ch-ua': '"Google Chrome";v="147", "Not.A/Brand";v="8", "Chromium";v="147"',
    'sec-ch-ua-mobile': '?1',
    'sec-ch-ua-platform': '"Android"',
    'x-request-id': crypto.randomUUID(),
    ...extra
  };
}

function extractToken(html) {
  const $ = cheerio.load(html);
  return $('input[name="token"]').attr('value') || null;
}

async function fetchText(url, options) {
  const res = await fetch(url, options);
  saveCookies(res.headers);
  return {
    status: res.status,
    headers: res.headers,
    body: await res.text()
  };
}

async function fetchJson(url, options) {
  const res = await fetch(url, options);
  saveCookies(res.headers);
  const text = await res.text();
  let data = null;
  try { data = JSON.parse(text); } catch { data = text; }
  return { status: res.status, data };
}

async function openHome() {
  const res = await fetchText(PAGE, {
    method: 'GET',
    signal: AbortSignal.timeout(30000),
    headers: commonHeaders({
      accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
      'upgrade-insecure-requests': '1',
      'sec-fetch-site': 'none',
      'sec-fetch-mode': 'navigate',
      'sec-fetch-user': '?1',
      'sec-fetch-dest': 'document'
    })
  });

  const token = extractToken(res.body) || autoToken();

  return {
    status: res.status,
    token,
    html: res.body
  };
}

async function submitVideo(url, token) {
  const form = new URLSearchParams();
  form.append('url', url);
  form.append('lang', LANG);
  form.append('token', token);

  const res = await fetchText(API, {
    method: 'POST',
    signal: AbortSignal.timeout(60000),
    body: form,
    headers: commonHeaders({
      accept: '*/*',
      origin: BASE,
      referer: PAGE,
      'content-type': 'application/x-www-form-urlencoded;charset=UTF-8',
      'sec-fetch-site': 'same-origin',
      'sec-fetch-mode': 'cors',
      'sec-fetch-dest': 'empty',
      priority: 'u=1, i',
      cookie: getCookieHeader()
    })
  });

  return {
    status: res.status,
    body: res.body
  };
}

function decodeObfuscatedResponse(body) {
  let decoded = '';

  const context = {
    console,
    Math,
    Date,
    RegExp,
    String,
    decodeURIComponent,
    escape,
    window: {
      location: {
        hostname: 'snaptik.app'
      }
    },
    eval(code) {
      decoded = String(code || '');
      return decoded;
    }
  };

  try {
    vm.createContext(context);
    vm.runInContext(body, context, { timeout: 3000 });
  } catch {}

  return decoded || body;
}

function absoluteUrl(url) {
  if (!url) return url;
  try {
    return new URL(url, BASE).toString();
  } catch {
    return url;
  }
}

async function extractResult(decodedJs) {
  const dom = new Map();

  const fakeDollar = (selector) => {
    if (!dom.has(selector)) {
      dom.set(selector, {
        innerHTML: '',
        style: {},
        remove() {},
        addClass() {},
        removeClass() {},
        show() {},
        hide() {},
        html(value) {
          if (value !== undefined) this.innerHTML = String(value);
          return this.innerHTML;
        }
      });
    }

    return dom.get(selector);
  };

  const context = {
    console,
    Math,
    Date,
    RegExp,
    String,
    setTimeout,
    clearTimeout,
    document: {
      getElementById() {
        return { src: '', style: {} };
      },
      querySelector() {
        return { innerHTML: '', style: {} };
      }
    },
    window: {
      location: {
        hostname: 'snaptik.app'
      }
    },
    gtag() {},
    fetch: async () => ({
      json: async () => ({})
    }),
    $: fakeDollar
  };

  try {
    vm.createContext(context);
    vm.runInContext(decodedJs, context, { timeout: 3000 });
  } catch {}

  const html = dom.get('#download')?.innerHTML || decodedJs;
  const $ = cheerio.load(html);
  const links = [];

  $('a[href]').each((_, el) => {
    const text = $(el).text().trim().replace(/\s+/g, ' ');
    const href = $(el).attr('href');

    if (!href) return;

    const lowerText = text.toLowerCase();

    if (lowerText.includes('download with app')) return;
    if (lowerText.includes('download other video')) return;
    if (href === '/') return;
    if (href.includes('play.google.com')) return;

    links.push({
      text: text || 'Download',
      url: absoluteUrl(href)
    });
  });

  return {
    title: $('.video-title').first().text().trim() || null,
    author: $('.info span').first().text().trim() || null,
    thumbnail: absoluteUrl(
      $('#thumbnail').attr('src') ||
      $('.avatar').attr('src') ||
      $('img').first().attr('src') ||
      null
    ),
    render_token: $('.btn-render').attr('data-token') || null,
    links
  };
}

async function renderVideo(renderToken) {
  if (!renderToken) return null;

  const renderUrl = new URL(`${BASE}/render.php`);
  renderUrl.searchParams.set('token', renderToken);

  const renderRes = await fetchJson(renderUrl, {
    method: 'GET',
    signal: AbortSignal.timeout(30000),
    headers: commonHeaders({
      accept: '*/*',
      referer: PAGE,
      cookie: getCookieHeader()
    })
  });

  const taskId = renderRes.data?.task_id;

  if (!taskId) return renderRes.data;

  for (let i = 0; i < 30; i += 1) {
    const pollUrl = new URL(`${BASE}/task.php`);
    pollUrl.searchParams.set('token', taskId);

    const poll = await fetchJson(pollUrl, {
      method: 'GET',
      signal: AbortSignal.timeout(30000),
      headers: commonHeaders({
        accept: '*/*',
        referer: PAGE,
        cookie: getCookieHeader()
      })
    });

    const data = poll.data;

    if (data?.download_url) return data;
    if (data?.status !== 0) return data;

    await new Promise((resolve) => setTimeout(resolve, 3000));
  }

  return null;
}

async function ask(url) {
  const home = await openHome();
  const post = await submitVideo(url, home.token);
  const decoded = decodeObfuscatedResponse(post.body);
  const result = await extractResult(decoded);

  let render = null;

  if (result.render_token) {
    render = await renderVideo(result.render_token);
  }

  const output = {
    Status: post.status === 200,
    Code: post.status,
    Label: 'SnapTik',
    Input: url,
    Token: home.token,
    Result: {
      title: result.title,
      author: result.author,
      thumbnail: result.thumbnail,
      links: result.links
    }
  };

  if (render) output.Result.render = render;

  return output;
}

function isValidTikTokUrl(url) {
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol) && /(^|\.)tiktok\.com$/i.test(parsed.hostname);
  } catch {
    return false;
  }
}

module.exports = {
  status: 'ready',
  rota: '/api/downloader/tiktok',
  methods: ['GET', 'POST'],

  async run(req, res) {
    const { url } = req.paramsInput || req.query;

    if (!url) {
      return res.status(400).json({ success: false, message: 'Isi parameter "url" terlebih dahulu.' });
    }

    if (!isValidTikTokUrl(url)) {
      return res.status(400).json({ success: false, message: 'Masukkan link TikTok yang valid.' });
    }

    try {
      const result = await ask(url);
      return res.status(result.Code || 200).json({
        success: Boolean(result.Status),
        message: result.Status ? 'OK' : 'SnapTik belum mengirim hasil.',
        data: result
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message || 'Link TikTok belum bisa diproses.',
        data: {
          Status: false,
          Code: 500,
          Label: 'SnapTik',
          Input: url,
          error: error.message || 'Link TikTok belum bisa diproses.'
        }
      });
    }
  }
};
