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

    // Fonction utilitaire pour lire les données
    const readRange = (startCol1, startCol2, startRow, endRow) => {
      const data = [];
      for (let i = startRow; i <= endRow; i++) {
        const description = worksheet[`${startCol1}${i}`]?.v;
        const poids = worksheet[`${startCol2}${i}`]?.v;
        if (description && poids !== undefined) {
          data.push({ description, poids });
        }
      }
      return data;
    };

    // Lire les données de chaque plage
    const table1Data = readRange('R', 'S', 79, 258);  // Table 1
    const table2Data = readRange('U', 'V', 79, 84);   // Table 2
    const table3Data = readRange('X', 'Y', 79, 266);  // Table 3
    const table4Data = readRange('AA', 'AB', 79, 81); // Table 4

    // Fonction pour insérer les données dans une table
    async function insertData(tableName, data) {
      await pool.query(`TRUNCATE TABLE ${tableName} RESTART IDENTITY`);
      for (const item of data) {
        await pool.query(
          `INSERT INTO ${tableName} (description, poids) VALUES ($1, $2)`,
          [item.description, item.poids]
        );
      }
      const result = await pool.query(`SELECT * FROM ${tableName} ORDER BY id`);
      console.log(`\nContenu de ${tableName}:`);
      console.log(`Nombre d'enregistrements: ${result.rowCount}`);
      console.table(result.rows);
    }

    // Insérer les données dans chaque table
    await insertData('evaluation_table_1', table1Data);
    await insertData('evaluation_table_2', table2Data);
    await insertData('evaluation_table_3', table3Data);
    await insertData('evaluation_table_4', table4Data);

    console.log('Import des données terminé avec succès');
  } catch (error) {
    console.error('Erreur lors de l\'import des données:', error);
  } finally {
    await pool.end();
  }
}

importData();
