module.exports = {
  rota: '/api/tools/text2qr',

  async run(req, res) {
    const { text } = req.query;
    if (!text) {
      return res.status(400).json({
        success: false,
        message: 'Parameter "text" wajib diisi'
      });
    }

    const encoded = encodeURIComponent(text);
    return res.json({
      success: true,
      creator: 'Youz API',
      data: {
        text,
        qr_image: `https://api.qrserver.com/v1/create-qr-code/?size=512x512&data=${encoded}`
      }
    });
  }
};
