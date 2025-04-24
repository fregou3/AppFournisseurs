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
    // Créer les tables 5 à 17
    for (let i = 5; i <= 17; i++) {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS evaluation_table_${i} (
          id SERIAL PRIMARY KEY,
          description TEXT,
          poids INTEGER
        );
      `);
    }
    console.log('Tables créées avec succès');
  } catch (error) {
    console.error('Erreur lors de la création des tables:', error);
  } finally {
    await pool.end();
  }
}

createTables();
