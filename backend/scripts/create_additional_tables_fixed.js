const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 5432,
});

async function createTables() {
  try {
    // Table Résultats
    await pool.query(`
      CREATE TABLE IF NOT EXISTS evaluation_resultats (
        id SERIAL PRIMARY KEY,
        min_score TEXT,
        max_score TEXT,
        niveau_risque TEXT,
        description TEXT,
        mesures_specifiques TEXT
      );
    `);

    // Table Mesure
    await pool.query(`
      CREATE TABLE IF NOT EXISTS evaluation_mesures (
        id SERIAL PRIMARY KEY,
        description TEXT,
        type TEXT
      );
    `);

    // Table Région
    await pool.query(`
      CREATE TABLE IF NOT EXISTS evaluation_regions (
        id SERIAL PRIMARY KEY,
        description TEXT,
        code TEXT
      );
    `);

    // Table J (Juridique)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS evaluation_juridique (
        id SERIAL PRIMARY KEY,
        description TEXT,
        code TEXT
      );
    `);

    // Table M (Métier)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS evaluation_metier (
        id SERIAL PRIMARY KEY,
        description TEXT,
        code TEXT
      );
    `);

    // Table A (Achat)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS evaluation_achat (
        id SERIAL PRIMARY KEY,
        description TEXT,
        code TEXT
      );
    `);

    console.log('Tables créées avec succès');
  } catch (error) {
    console.error('Erreur lors de la création des tables:', error);
  } finally {
    await pool.end();
  }
}

createTables();
