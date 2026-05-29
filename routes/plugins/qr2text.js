module.exports = {
  status: 'closed',
  rota: '/api/tools/qr2text',

  async run(req, res) {
    const { url } = req.paramsInput || req.query;
    if (!url) {
      return res.status(400).json({ success: false, message: 'Parameter "url" is required' });
    }

    try {
      const target = `https://api.qrserver.com/v1/read-qr-code/?fileurl=${encodeURIComponent(url)}`;
      const r = await fetch(target);
      const data = await r.json();
      const text = data?.[0]?.symbol?.[0]?.data || null;
      if (!text) {
        return res.status(404).json({ success: false, message: 'QR cannot be read or is invalid' });
      }

      return res.json({
        success: true,
        data: { url, text }
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message || 'Failed to process QR' });
    }
  }
};
