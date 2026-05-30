const mql = require('@microlink/mql');

function getBearerToken(req) {
  const auth = req.headers.authorization || '';
  if (auth.toLowerCase().startsWith('bearer ')) return auth.slice(7).trim();
  return '';
}

function toBoolean(value) {
  return value === true || String(value).toLowerCase() === 'true';
}

module.exports = {
  ismaintenance: false,
  isready: true,
  isclosed: false,
  rota: '/api/tools/ssweb',
  metode: ['GET', 'POST'],

  async run(req, res) {
    const input = req.paramsInput || {};
    const apitoken = input.apitoken || getBearerToken(req);
    if (!apitoken) return res.status(401).json({ status: false, error: 'API token required' });

    const url = input.url;
    if (!url) return res.status(400).json({ status: false, error: 'URL required' });

    const width = parseInt(input.width || 1920, 10);
    const height = parseInt(input.height || 1080, 10);
    const waitFor = parseInt(input.waitFor || 3000, 10);
    const fullPage = toBoolean(input.fullPage);
    const element = input.element || null;

    try {
      const options = {
        screenshot: {
          optimizeForSpeed: true,
          fullPage
        },
        viewport: { width, height },
        waitFor,
        meta: false
      };

      if (element) options.screenshot.element = element;

      const result = await mql(url, options);
      const screenshotUrl = result.data?.screenshot?.url;

      if (!screenshotUrl) {
        return res.json({
          status: false,
          code: result.statusCode || 500,
          input: url,
          result_url: null,
          error: 'Screenshot failed'
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
