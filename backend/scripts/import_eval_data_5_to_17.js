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

const tableRanges = {
  5: { start: { col: 'AD', row: 79 }, end: { col: 'AE', row: 80 } },
  6: { start: { col: 'AG', row: 79 }, end: { col: 'AH', row: 113 } },
  7: { start: { col: 'AJ', row: 79 }, end: { col: 'AK', row: 81 } },
  8: { start: { col: 'AM', row: 79 }, end: { col: 'AN', row: 81 } },
  9: { start: { col: 'AP', row: 79 }, end: { col: 'AQ', row: 81 } },
  10: { start: { col: 'AS', row: 79 }, end: { col: 'AT', row: 81 } },
  11: { start: { col: 'AV', row: 79 }, end: { col: 'AW', row: 81 } },
  12: { start: { col: 'AY', row: 79 }, end: { col: 'AZ', row: 81 } },
  13: { start: { col: 'BB', row: 79 }, end: { col: 'BC', row: 81 } },
  14: { start: { col: 'BE', row: 79 }, end: { col: 'BF', row: 81 } },
  15: { start: { col: 'BH', row: 79 }, end: { col: 'BI', row: 81 } },
  16: { start: { col: 'BK', row: 79 }, end: { col: 'BL', row: 81 } },
  17: { start: { col: 'BN', row: 79 }, end: { col: 'BO', row: 81 } }
};

async function importData() {
  try {
    // Lire le fichier Excel
    const workbook = XLSX.readFile('C:/App/AppGetionFournisseurs/AppGetionFournisseurs_2.2/240222_Procédure Evaluation Tiers_WIP.xlsm');
    const worksheet = workbook.Sheets['III.2. Evaluation de 2e niveau'];

    // Fonction utilitaire pour lire les données d'une plage
    const readRange = (startCol, endCol, startRow, endRow) => {
      const data = [];
      for (let i = startRow; i <= endRow; i++) {
        const description = worksheet[`${startCol}${i}`]?.v;
        const poids = worksheet[`${endCol}${i}`]?.v;
        if (description && poids !== undefined) {
          data.push({ description, poids });
        }
      }
      return data;
    };

    // Pour chaque table
    for (let tableNum = 5; tableNum <= 17; tableNum++) {
      const range = tableRanges[tableNum];
      const data = readRange(
        range.start.col,
        range.end.col,
        range.start.row,
        range.end.row
      );

      // Vider la table existante
      await pool.query(`TRUNCATE TABLE evaluation_table_${tableNum} RESTART IDENTITY`);

      // Insérer les nouvelles données
      for (const item of data) {
        await pool.query(
          `INSERT INTO evaluation_table_${tableNum} (description, poids) VALUES ($1, $2)`,
          [item.description, item.poids]
        );
      }

      // Afficher le contenu de la table
      const result = await pool.query(`SELECT * FROM evaluation_table_${tableNum} ORDER BY id`);
      console.log(`\nContenu de evaluation_table_${tableNum}:`);
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
