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
      },
      // Configuration avancée pour éviter les timeouts
      timeout: 60000, // 60 secondes de timeout
      proxyTimeout: 60000,
      // Gestion des erreurs de proxy
      onError: (err, req, res) => {
        console.error('Erreur de proxy:', err);
        res.writeHead(502, {
          'Content-Type': 'application/json'
        });
        res.end(JSON.stringify({
          error: 'Erreur de connexion au serveur backend',
          details: err.message
        }));
      }
    })
  );
};
