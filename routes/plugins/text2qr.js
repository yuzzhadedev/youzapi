module.exports = {
  status: 'ready',
  rota: '/api/tools/text2qr',

  async run(req, res) {
    const { text } = req.paramsInput || req.query;
    if (!text) {
      return res.status(400).json({
        success: false,
        message: 'Parameter "text" is required'
      });
    }

    const encoded = encodeURIComponent(text);
    return res.json({
      success: true,
      message: 'OK',
      data: {
        text,
        qr_image: `https://api.qrserver.com/v1/create-qr-code/?size=512x512&data=${encoded}`
      }
    });
  }
};
