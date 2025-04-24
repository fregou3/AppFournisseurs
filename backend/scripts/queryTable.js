const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: 'admin',
  host: 'localhost',
  database: 'gestion_fournisseurs',
  password: 'admin123',
  port: 5435,
});

const queryTable = async () => {
  try {
    const result = await pool.query('SELECT * FROM fournisseurs LIMIT 10');
    console.log('Contenu des 10 premières lignes :');
    result.rows.forEach((row, index) => {
      console.log(`\nLigne ${index + 1}:`);
      Object.entries(row).forEach(([key, value]) => {
        if (value) { // N'affiche que les valeurs non nulles
          console.log(`${key}: ${value}`);
        }
      });
    });
  } catch (error) {
    console.error('Erreur lors de la requête:', error);
  } finally {
    await pool.end();
  }
};

queryTable();
