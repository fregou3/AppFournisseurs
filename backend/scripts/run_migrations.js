const { Pool } = require('pg');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 5432,
});

async function runMigrations() {
  try {
    // Lire et exécuter le script de création des tables
    const createTablesSQL = await fs.readFile(
      path.join(__dirname, '../migrations/20240107_create_evaluation2_tables.sql'),
      'utf8'
    );
    await pool.query(createTablesSQL);
    console.log('Tables créées avec succès');

    // Lire et exécuter le script d'insertion des données
    const insertDataSQL = await fs.readFile(
      path.join(__dirname, '../migrations/20240107_insert_evaluation2_data.sql'),
      'utf8'
    );
    await pool.query(insertDataSQL);
    console.log('Données insérées avec succès');

    console.log('Migration terminée avec succès');
  } catch (error) {
    console.error('Erreur lors de la migration:', error);
  } finally {
    await pool.end();
  }
}

runMigrations();
