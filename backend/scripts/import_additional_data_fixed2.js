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

function getCellValue(worksheet, cell) {
  const cellValue = worksheet[cell];
  return cellValue ? cellValue.v : null;
}

async function importData() {
  try {
    // Lire le fichier Excel
    const workbook = XLSX.readFile('C:/App/AppGetionFournisseurs/AppGetionFournisseurs_2.2/240222_Procédure Evaluation Tiers_WIP.xlsm');
    const worksheet = workbook.Sheets['III.2. Evaluation de 2e niveau'];

    // Fonction pour lire une plage de cellules
    const readRange = (startCol1, startCol2, startRow, endRow) => {
      const data = [];
      for (let i = startRow; i <= endRow; i++) {
        const description = getCellValue(worksheet, `${startCol1}${i}`);
        const code = getCellValue(worksheet, `${startCol2}${i}`);
        if (description !== null) {
          data.push({ description, code });
        }
      }
      return data;
    };

    // Lire les données
    const resultats = readRange('BQ', 'BU', 79, 83);
    const mesures = readRange('BW', 'BX', 79, 90);
    const regions = readRange('BZ', 'CA', 79, 85);
    const juridique = readRange('CC', 'CD', 79, 85);
    const metier = readRange('CF', 'CG', 79, 85);
    const achat = readRange('CI', 'CJ', 79, 85);

    // Fonction pour insérer les données dans une table
    async function insertData(tableName, data, columns) {
      await pool.query(`TRUNCATE TABLE ${tableName} RESTART IDENTITY`);
      for (const item of data) {
        if (item.description) {
          const values = columns.map(col => item[col]);
          const placeholders = values.map((_, idx) => `$${idx + 1}`).join(', ');
          const query = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders})`;
          await pool.query(query, values);
        }
      }
    }

    // Insérer les données dans chaque table
    await insertData('evaluation_resultats', resultats.map(r => ({
      description: r.description,
      niveau_risque: r.code
    })), ['description', 'niveau_risque']);

    await insertData('evaluation_mesures', mesures.map(m => ({
      description: m.description,
      type: m.code
    })), ['description', 'type']);

    await insertData('evaluation_regions', regions, ['description', 'code']);
    await insertData('evaluation_juridique', juridique, ['description', 'code']);
    await insertData('evaluation_metier', metier, ['description', 'code']);
    await insertData('evaluation_achat', achat, ['description', 'code']);

    // Afficher le contenu des tables
    const tables = [
      'evaluation_resultats',
      'evaluation_mesures',
      'evaluation_regions',
      'evaluation_juridique',
      'evaluation_metier',
      'evaluation_achat'
    ];

    for (const tableName of tables) {
      const result = await pool.query(`SELECT * FROM ${tableName} ORDER BY id`);
      console.log(`\nContenu de ${tableName}:`);
      console.log(`Nombre d'enregistrements: ${result.rowCount}`);
      console.table(result.rows);
    }

    console.log('Import des données terminé avec succès');
  } catch (error) {
    console.error('Erreur lors de l\'import des données:', error);
    if (error.stack) console.error(error.stack);
  } finally {
    await pool.end();
  }
}

importData();
