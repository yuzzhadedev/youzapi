module.exports = {
  ismaintenance: false,
  isready: true,
  isclosed: false,
  rota: '/api/tools/text2qr',

  async run(req, res) {
    const { text } = req.paramsInput || req.query;
    if (!text) {
      return res.status(400).json({
        success: false,
        message: 'Isi parameter "text" terlebih dahulu.'
      });
    }

    const encoded = encodeURIComponent(text);
    return res.json({
      success: true,
      message: 'Berhasil',
      data: {
        text,
        qr_image: `https://api.qrserver.com/v1/create-qr-code/?size=512x512&data=${encoded}`
      }
    });
  }
};
