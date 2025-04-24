const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: 'admin',
  host: 'localhost',
  database: 'gestion_fournisseurs',
  password: 'admin123',
  port: 5435,
});

const createRisqueTable = async () => {
  try {
    // Créer la table risque
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS risque (
        id INTEGER PRIMARY KEY,
        name VARCHAR(255),
        detail_risque TEXT,
        note_risque_financier INTEGER,
        note_de_conformite INTEGER,
        FOREIGN KEY (id) REFERENCES fournisseurs(id)
      )`;

    await pool.query(createTableQuery);
    console.log('Table risque créée avec succès');

  } catch (error) {
    console.error('Erreur lors de la création de la table risque:', error);
  } finally {
    await pool.end();
  }
};

createRisqueTable();
