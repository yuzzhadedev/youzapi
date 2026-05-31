module.exports = {
  rota: '/api/server/status',

  async run(req, res) {
    return res.json({
      success: true,
      message: 'OK',
      data: {
        status: 'online',
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
      }
    });
  }
};
