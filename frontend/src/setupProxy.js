const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  // Proxy pour les requêtes API en développement
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://localhost:5005',
      changeOrigin: true,
      pathRewrite: {
        '^/api': '/' // Retirez le préfixe /api avant de transmettre au backend
      }
    })
  );
};
