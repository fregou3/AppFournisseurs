const { Pool } = require('pg');
const XLSX = require('xlsx');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 5432,
});

async function updateTables() {
  try {
    // Lire le fichier Excel
    const workbook = XLSX.readFile('C:/App/AppGetionFournisseurs/AppGetionFournisseurs_2.2/240222_Procédure Evaluation Tiers_WIP.xlsm');
    const worksheet = workbook.Sheets['III.2. Evaluation de 2e niveau'];

    // Lire les raisons_relation (L79:M84)
    const raisonsData = [];
    for (let i = 79; i <= 84; i++) {
      const description = worksheet[`L${i}`]?.v;
      const poids = worksheet[`M${i}`]?.v;
      if (description && poids) {
        raisonsData.push({ description, poids });
      }
    }

    // Lire les criteres_selection (O79:P88)
    const criteresData = [];
    for (let i = 79; i <= 88; i++) {
      const description = worksheet[`O${i}`]?.v;
      const poids = worksheet[`P${i}`]?.v;
      if (description && poids) {
        criteresData.push({ description, poids });
      }
    }

    // Mettre à jour la table raisons_relation
    await pool.query('TRUNCATE TABLE raisons_relation RESTART IDENTITY');
    for (const data of raisonsData) {
      await pool.query(
        'INSERT INTO raisons_relation (description, poids) VALUES ($1, $2)',
        [data.description, data.poids]
      );
    }
    console.log('Table raisons_relation mise à jour avec succès');

    // Mettre à jour la table criteres_selection
    await pool.query('TRUNCATE TABLE criteres_selection RESTART IDENTITY');
    for (const data of criteresData) {
      await pool.query(
        'INSERT INTO criteres_selection (description, poids) VALUES ($1, $2)',
        [data.description, data.poids]
      );
    }
    console.log('Table criteres_selection mise à jour avec succès');

    // Afficher le nouveau contenu des tables
    const raisonsResult = await pool.query('SELECT * FROM raisons_relation ORDER BY id');
    console.log('\nNouveau contenu de raisons_relation:');
    console.table(raisonsResult.rows);

    const criteresResult = await pool.query('SELECT * FROM criteres_selection ORDER BY id');
    console.log('\nNouveau contenu de criteres_selection:');
    console.table(criteresResult.rows);

  } catch (error) {
    console.error('Erreur lors de la mise à jour des tables:', error);
  } finally {
    await pool.end();
  }
}

updateTables();
