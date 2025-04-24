const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: 'admin',
  host: 'localhost',
  database: 'gestion_fournisseurs',
  password: 'admin123',
  port: 5435,
});

const createDetailsTable = async () => {
  try {
    // Créer la table details
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS details (
        id INTEGER PRIMARY KEY,
        name VARCHAR(255),
        details TEXT,
        FOREIGN KEY (id) REFERENCES fournisseurs(id)
      )`;

    await pool.query(createTableQuery);
    console.log('Table details créée avec succès');

  } catch (error) {
    console.error('Erreur lors de la création de la table details:', error);
  } finally {
    await pool.end();
  }
};

createDetailsTable();
