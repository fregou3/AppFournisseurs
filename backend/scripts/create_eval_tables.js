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
    // Créer la table "evaluation_table_1" (R79:S258)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS evaluation_table_1 (
        id SERIAL PRIMARY KEY,
        description TEXT,
        poids INTEGER
      );
    `);

    // Créer la table "evaluation_table_2" (U79:V84)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS evaluation_table_2 (
        id SERIAL PRIMARY KEY,
        description TEXT,
        poids INTEGER
      );
    `);

    // Créer la table "evaluation_table_3" (X79:Y266)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS evaluation_table_3 (
        id SERIAL PRIMARY KEY,
        description TEXT,
        poids INTEGER
      );
    `);

    // Créer la table "evaluation_table_4" (AA79:AB81)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS evaluation_table_4 (
        id SERIAL PRIMARY KEY,
        description TEXT,
        poids INTEGER
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
