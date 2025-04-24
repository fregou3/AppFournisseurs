const { Pool } = require('pg');
require('dotenv').config();

// Configuration de la base de données avec des valeurs par défaut explicites
const config = {
  user: process.env.DB_USER || 'admin',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'gestion_fournisseurs',
  password: process.env.DB_PASSWORD || 'admin123',
  port: parseInt(process.env.DB_PORT || '5435'),
};

console.log('Configuration de la base de données:', {
  ...config,
  password: '***' // Masquer le mot de passe dans les logs
});

const pool = new Pool(config);

// Test de la connexion au démarrage
pool.connect((err, client, done) => {
  if (err) {
    console.error('Erreur de connexion à la base de données:', err);
  } else {
    console.log('Connexion à la base de données établie avec succès');
    done();
  }
});

module.exports = pool;
