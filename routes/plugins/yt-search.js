const yts = require('yt-search');

module.exports = {
  rota: '/api/s/youtube',
  async run(req, res) {
    const { query } = req.query || {};

    if (!query || typeof query !== 'string' || !query.trim()) {
      return res.status(400).json({ ok: false, msg: "Parameter 'query' wajib diisi" });
    }

    if (query.length > 500) {
      return res.status(400).json({ ok: false, msg: "Parameter 'query' maksimal 500 karakter" });
    }

    try {
      const results = await yts(query.trim());
      const data = Array.isArray(results?.all) ? results.all : [];

      if (data.length === 0) {
        return res.status(404).json({ ok: false, msg: 'Hasil tidak ditemukan' });
      }

      return res.json({ ok: true, data, total: data.length });
    } catch (error) {
      return res.status(500).json({ ok: false, msg: error.message || 'Terjadi kesalahan server' });
    }
  }
};
