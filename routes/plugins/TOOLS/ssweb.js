function toBoolean(value, fallback = false) {
  if (value === undefined || value === null || value === '') return fallback;
  return value === true || String(value).toLowerCase() === 'true';
}

function buildMicrolinkUrl(targetUrl, fullPage) {
  const microlinkUrl = new URL('https://api.microlink.io/');
  microlinkUrl.searchParams.set('url', targetUrl);
  microlinkUrl.searchParams.set('screenshot', 'true');
  microlinkUrl.searchParams.set('screenshot.fullPage', String(fullPage));
  microlinkUrl.searchParams.set('screenshot.optimizeForSpeed', 'true');
  microlinkUrl.searchParams.set('meta', 'false');
  return microlinkUrl;
}

module.exports = {
  ismaintenance: false,
  isready: true,
  isclosed: false,
  rota: '/api/tools/ssweb',
  metode: ['GET', 'POST'],

  async run(req, res) {
    const input = req.paramsInput || {};

    const url = input.url;
    if (!url) return res.status(400).json({ status: false, error: 'URL required' });

    const fullPage = toBoolean(input.fullPage, true);

    try {
      const microlinkUrl = buildMicrolinkUrl(url, fullPage);
      const response = await fetch(microlinkUrl);
      const result = await response.json();
      const screenshotUrl = result.data?.screenshot?.url;

      if (!screenshotUrl) {
        const statusCode = Number(result?.statusCode) || response.status || 502;
        return res.status(statusCode).json({
          status: false,
          code: statusCode,
          input: url,
          result_url: null,
          error: result?.message || result?.error?.message || 'Screenshot failed'
        });
      }

      return res.json({
        status: true,
        code: 200,
        input: url,
        result_url: screenshotUrl,
        error: null
      });
    } catch (error) {
      return res.status(500).json({
        status: false,
        code: 500,
        input: url,
        result_url: null,
        error: error.message
      });
    }
  }
};
