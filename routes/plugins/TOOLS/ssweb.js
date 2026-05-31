function getMql() {
  return require('@microlink/mql');
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

    const url = input.url;
    if (!url) return res.status(400).json({ status: false, error: 'URL required' });

    const width = parseInt(input.width || 1920, 10);
    const height = parseInt(input.height || 1080, 10);
    const waitFor = parseInt(input.waitFor || 3000, 10);
    if (!Number.isFinite(width) || width <= 0 || !Number.isFinite(height) || height <= 0) {
      return res.status(400).json({ status: false, error: 'Invalid viewport size' });
    }
    if (!Number.isFinite(waitFor) || waitFor < 0) {
      return res.status(400).json({ status: false, error: 'Invalid waitFor value' });
    }

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

      const result = await getMql()(url, options);
      const screenshotUrl = result.data?.screenshot?.url;

      if (!screenshotUrl) {
        const statusCode = Number(result?.statusCode) || 502;
        return res.status(statusCode).json({
          status: false,
          code: statusCode,
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
