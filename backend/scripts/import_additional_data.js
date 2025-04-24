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

async function importData() {
  try {
    // Lire le fichier Excel
    const workbook = XLSX.readFile('C:/App/AppGetionFournisseurs/AppGetionFournisseurs_2.2/240222_Procédure Evaluation Tiers_WIP.xlsm');
    const worksheet = workbook.Sheets['III.2. Evaluation de 2e niveau'];

    // Importer les résultats (BQ79:BU83)
    const resultats = [];
    for (let i = 79; i <= 83; i++) {
      const minScore = worksheet[`BQ${i}`]?.v;
      const maxScore = worksheet[`BR${i}`]?.v;
      const niveauRisque = worksheet[`BS${i}`]?.v;
      const description = worksheet[`BT${i}`]?.v;
      const mesuresSpecifiques = worksheet[`BU${i}`]?.v;
      
      if (minScore !== undefined && maxScore !== undefined) {
        resultats.push({ minScore, maxScore, niveauRisque, description, mesuresSpecifiques });
      }
    }

    // Importer les mesures (BW79:BX90)
    const mesures = [];
    for (let i = 79; i <= 90; i++) {
      const description = worksheet[`BW${i}`]?.v;
      const type = worksheet[`BX${i}`]?.v;
      
      if (description) {
        mesures.push({ description, type });
      }
    }

    // Importer les régions (BZ79:CA85)
    const regions = [];
    for (let i = 79; i <= 85; i++) {
      const description = worksheet[`BZ${i}`]?.v;
      const code = worksheet[`CA${i}`]?.v;
      
      if (description) {
        regions.push({ description, code });
      }
    }

    // Importer données juridiques (CC79:CD85)
    const juridique = [];
    for (let i = 79; i <= 85; i++) {
      const description = worksheet[`CC${i}`]?.v;
      const code = worksheet[`CD${i}`]?.v;
      
      if (description) {
        juridique.push({ description, code });
      }
    }

    // Importer données métier (CF79:CG85)
    const metier = [];
    for (let i = 79; i <= 85; i++) {
      const description = worksheet[`CF${i}`]?.v;
      const code = worksheet[`CG${i}`]?.v;
      
      if (description) {
        metier.push({ description, code });
      }
    }

    // Importer données achat (CI79:CJ85)
    const achat = [];
    for (let i = 79; i <= 85; i++) {
      const description = worksheet[`CI${i}`]?.v;
      const code = worksheet[`CJ${i}`]?.v;
      
      if (description) {
        achat.push({ description, code });
      }
    }

    // Insérer les résultats
    await pool.query('TRUNCATE TABLE evaluation_resultats RESTART IDENTITY');
    for (const item of resultats) {
      await pool.query(
        'INSERT INTO evaluation_resultats (min_score, max_score, niveau_risque, description, mesures_specifiques) VALUES ($1, $2, $3, $4, $5)',
        [item.minScore, item.maxScore, item.niveauRisque, item.description, item.mesuresSpecifiques]
      );
    }

    // Insérer les mesures
    await pool.query('TRUNCATE TABLE evaluation_mesures RESTART IDENTITY');
    for (const item of mesures) {
      await pool.query(
        'INSERT INTO evaluation_mesures (description, type) VALUES ($1, $2)',
        [item.description, item.type]
      );
    }

    // Insérer les régions
    await pool.query('TRUNCATE TABLE evaluation_regions RESTART IDENTITY');
    for (const item of regions) {
      await pool.query(
        'INSERT INTO evaluation_regions (description, code) VALUES ($1, $2)',
        [item.description, item.code]
      );
    }

    // Insérer les données juridiques
    await pool.query('TRUNCATE TABLE evaluation_juridique RESTART IDENTITY');
    for (const item of juridique) {
      await pool.query(
        'INSERT INTO evaluation_juridique (description, code) VALUES ($1, $2)',
        [item.description, item.code]
      );
    }

    // Insérer les données métier
    await pool.query('TRUNCATE TABLE evaluation_metier RESTART IDENTITY');
    for (const item of metier) {
      await pool.query(
        'INSERT INTO evaluation_metier (description, code) VALUES ($1, $2)',
        [item.description, item.code]
      );
    }

    // Insérer les données achat
    await pool.query('TRUNCATE TABLE evaluation_achat RESTART IDENTITY');
    for (const item of achat) {
      await pool.query(
        'INSERT INTO evaluation_achat (description, code) VALUES ($1, $2)',
        [item.description, item.code]
      );
    }

    // Afficher le contenu des tables
    const tables = [
      { name: 'evaluation_resultats', query: 'SELECT * FROM evaluation_resultats ORDER BY id' },
      { name: 'evaluation_mesures', query: 'SELECT * FROM evaluation_mesures ORDER BY id' },
      { name: 'evaluation_regions', query: 'SELECT * FROM evaluation_regions ORDER BY id' },
      { name: 'evaluation_juridique', query: 'SELECT * FROM evaluation_juridique ORDER BY id' },
      { name: 'evaluation_metier', query: 'SELECT * FROM evaluation_metier ORDER BY id' },
      { name: 'evaluation_achat', query: 'SELECT * FROM evaluation_achat ORDER BY id' }
    ];

    for (const table of tables) {
      const result = await pool.query(table.query);
      console.log(`\nContenu de ${table.name}:`);
      console.log(`Nombre d'enregistrements: ${result.rowCount}`);
      console.table(result.rows);
    }

    console.log('Import des données terminé avec succès');
  } catch (error) {
    console.error('Erreur lors de l\'import des données:', error);
  } finally {
    await pool.end();
  }
}

importData();
