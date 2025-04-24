const express = require('express');
const cors = require('cors');
const fileUpload = require('express-fileupload');
const path = require('path');

const app = express();
const port = process.env.PORT || 5005;

// Configuration CORS pour le développement local
app.use(cors({
  origin: 'http://localhost:3005', // URL du frontend React en développement
  credentials: true
}));

// Middleware
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));
app.use(fileUpload({
  createParentPath: true,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB max file size
  abortOnLimit: true
}));

// Middleware pour logger les requêtes
app.use((req, res, next) => {
  console.log('=== Request Details ===');
  console.log(`Time: ${new Date().toISOString()}`);
  console.log(`Method: ${req.method}`);
  console.log(`URL: ${req.url}`);
  console.log(`Original URL: ${req.originalUrl}`);
  console.log(`Base URL: ${req.baseUrl}`);
  console.log(`Path: ${req.path}`);
  console.log(`Headers:`, req.headers);
  if (req.files) {
    console.log('Files:', Object.keys(req.files).map(key => ({
      name: req.files[key].name,
      size: req.files[key].size,
      mimetype: req.files[key].mimetype
    })));
  }
  console.log('=== End Request Details ===');
  next();
});

// Augmenter le timeout de la requête
app.use((req, res, next) => {
  res.setTimeout(600000); // 10 minutes
  next();
});

// Route de test
app.get('/test', (req, res) => {
  res.json({ message: 'API is working!' });
});

// Routes
const fournisseursRoutes = require('./routes/fournisseurs');
const evaluation2Routes = require('./routes/evaluation2');
const groupsRoutes = require('./routes/groups');

// Routes sans préfixe /api en mode développement local
app.use('/fournisseurs', fournisseursRoutes);
app.use('/evaluation2', evaluation2Routes);
app.use('/groups', groupsRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    details: err.message
  });
});

// 404 handler
app.use((req, res) => {
  console.log('=== 404 Not Found ===');
  console.log(`Method: ${req.method}`);
  console.log(`URL: ${req.url}`);
  console.log(`Original URL: ${req.originalUrl}`);
  console.log('=== End 404 Not Found ===');
  res.status(404).json({ error: 'Route not found' });
});

// Démarrage du serveur
app.listen(port, '0.0.0.0', () => {
  console.log(`Serveur démarré sur http://0.0.0.0:${port}`);
});
