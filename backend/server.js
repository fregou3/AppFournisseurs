const express = require('express');
const cors = require('cors');
const fileUpload = require('express-fileupload');
const path = require('path');
require('dotenv').config();

// Configuration de l'environnement
const isProduction = process.env.NODE_ENV === 'production';
const port = process.env.PORT || 5005;

// Détecter si nous sommes sur Windows (environnement local) ou Linux (serveur)
const isWindows = process.platform === 'win32';
const host = isWindows ? 'localhost' : '0.0.0.0'; // localhost pour Windows, 0.0.0.0 pour Linux

const app = express();

// Configuration CORS en fonction de l'environnement
const corsOptions = {
  credentials: true
};

// En production, accepter les requêtes du serveur Nginx et de l'environnement de développement
if (isProduction) {
  corsOptions.origin = [
    'http://localhost:3005',  // Développement local
    'http://localhost:80',    // Nginx local
    process.env.PRODUCTION_DOMAIN || '*' // Domaine de production
  ];
} else {
  // En développement, accepter uniquement les requêtes du frontend local
  corsOptions.origin = 'http://localhost:3005';
}

app.use(cors(corsOptions));

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
  // Générer un ID unique pour chaque requête
  req.requestId = Date.now() + '-' + Math.random().toString(36).substring(2, 15);
  
  console.log(`=== Request Details [${req.requestId}] ===`);
  console.log(`Time: ${new Date().toISOString()}`);
  console.log(`Method: ${req.method}`);
  console.log(`URL: ${req.url}`);
  console.log(`Original URL: ${req.originalUrl}`);
  console.log(`Base URL: ${req.baseUrl}`);
  console.log(`Path: ${req.path}`);
  console.log(`IP: ${req.ip}`);
  console.log(`User Agent: ${req.headers['user-agent']}`);
  
  // Logger les en-têtes importantes
  const importantHeaders = ['content-type', 'content-length', 'origin', 'referer'];
  console.log('Important Headers:', importantHeaders.reduce((acc, header) => {
    if (req.headers[header]) acc[header] = req.headers[header];
    return acc;
  }, {}));
  
  // Logger les détails spécifiques pour les uploads
  if (req.path.includes('/upload')) {
    console.log('=== UPLOAD REQUEST DETECTED ===');
    console.log('Body keys:', Object.keys(req.body));
    if (req.files) {
      console.log('Files:', Object.keys(req.files).map(key => ({
        name: req.files[key].name,
        size: req.files[key].size,
        mimetype: req.files[key].mimetype,
        md5: req.files[key].md5
      })));
    } else {
      console.log('No files in request');
    }
  }
  
  console.log(`=== End Request Details [${req.requestId}] ===`);
  
  // Logger également la fin de la requête
  res.on('finish', () => {
    console.log(`=== Response Completed [${req.requestId}] ===`);
    console.log(`Status: ${res.statusCode}`);
    console.log(`Time: ${new Date().toISOString()}`);
    console.log(`=== End Response [${req.requestId}] ===`);
  });
  
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
const settingsRoutes = require('./routes/settings');

// Routes sans préfixe /api en mode développement local
app.use('/fournisseurs', fournisseursRoutes);
app.use('/evaluation2', evaluation2Routes);
app.use('/groups', groupsRoutes);
app.use('/settings', settingsRoutes);

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

// Démarrer le serveur
app.listen(port, host, () => {
  console.log(`Serveur démarré sur http://${host}:${port}`);
});
