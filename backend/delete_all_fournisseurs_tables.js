/**
 * Script pour supprimer toutes les tables fournisseurs de la base de données
 */

const { Pool } = require('pg');
require('dotenv').config();

// Créer une connexion à la base de données
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 5432,
});

async function deleteAllFournisseursTables() {
  const client = await pool.connect();
  
  try {
    // Récupérer toutes les tables qui commencent par "fournisseurs_"
    const tablesResult = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name LIKE 'fournisseurs_%'
    `);
    
    const tables = tablesResult.rows.map(row => row.table_name);
    
    if (tables.length === 0) {
      console.log('Aucune table fournisseurs trouvée.');
      return;
    }
    
    console.log(`${tables.length} tables fournisseurs trouvées :`);
    tables.forEach(table => console.log(`- ${table}`));
    
    // Supprimer chaque table
    console.log('\nSuppression des tables...');
    
    for (const table of tables) {
      try {
        await client.query(`DROP TABLE IF EXISTS "${table}" CASCADE`);
        console.log(`Table "${table}" supprimée avec succès.`);
      } catch (error) {
        console.error(`Erreur lors de la suppression de la table "${table}" :`, error.message);
      }
    }
    
    console.log('\nToutes les tables fournisseurs ont été supprimées.');
    
  } catch (error) {
    console.error('Erreur lors de la suppression des tables :', error.message);
  } finally {
    client.release();
    pool.end();
  }
}

// Exécuter la fonction
deleteAllFournisseursTables();
