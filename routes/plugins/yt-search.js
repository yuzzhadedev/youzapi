const yts = require('yt-search');

module.exports = {
  status: 'ready',
  rota: '/api/s/youtube',
  async run(req, res) {
    const { query } = req.query || {};

    if (!query || typeof query !== 'string' || !query.trim()) {
      return res.status(400).json({ success: false, message: "Parameter 'query' is required" });
    }

    if (query.length > 500) {
      return res.status(400).json({ success: false, message: "Parameter 'query' max length is 500 characters" });
    }

    try {
      const results = await yts(query.trim());
      const data = Array.isArray(results?.all) ? results.all : [];

      if (data.length === 0) {
        return res.status(404).json({ success: false, message: 'No results found' });
      }

      return res.json({ success: true, message: 'OK', data: { total: data.length, items: data } });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message || 'Internal server error' });
    }
  }
};
