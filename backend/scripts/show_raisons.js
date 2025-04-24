const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 5432,
});

async function showRaisons() {
  try {
    // Afficher la structure de la table
    const structureQuery = `
      SELECT column_name, data_type, character_maximum_length
      FROM information_schema.columns
      WHERE table_name = 'raisons_relation'
      ORDER BY ordinal_position;
    `;
    
    const structureResult = await pool.query(structureQuery);
    console.log('\nStructure de la table raisons_relation:');
    console.log('----------------------------------------');
    structureResult.rows.forEach(col => {
      console.log(`${col.column_name}: ${col.data_type}${col.character_maximum_length ? `(${col.character_maximum_length})` : ''}`);
    });

    // Afficher le contenu
    const contentQuery = 'SELECT * FROM raisons_relation ORDER BY id;';
    const contentResult = await pool.query(contentQuery);
    
    console.log('\nContenu de la table raisons_relation:');
    console.log('----------------------------------------');
    console.table(contentResult.rows);
    
    console.log(`\nNombre total d'enregistrements: ${contentResult.rowCount}`);
  } catch (error) {
    console.error('Erreur lors de la récupération des données:', error);
  } finally {
    await pool.end();
  }
}

showRaisons();
