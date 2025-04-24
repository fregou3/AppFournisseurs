/**
 * Script pour lister toutes les tables de la base de données
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

async function listAllTables() {
  const client = await pool.connect();
  
  try {
    // Récupérer toutes les tables du schéma public
    const tablesResult = await client.query(`
      SELECT table_name, 
             (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) AS column_count,
             (SELECT pg_size_pretty(pg_total_relation_size(quote_ident(t.table_name)))) AS size
      FROM information_schema.tables t
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    const tables = tablesResult.rows;
    
    if (tables.length === 0) {
      console.log('Aucune table trouvée dans la base de données.');
      return;
    }
    
    console.log(`${tables.length} tables trouvées dans la base de données :`);
    console.log('----------------------------------------------------------');
    console.log('| Nom de la table                      | Colonnes | Taille |');
    console.log('----------------------------------------------------------');
    
    tables.forEach(table => {
      const tableName = table.table_name.padEnd(35);
      const columnCount = String(table.column_count).padEnd(8);
      const size = table.size.padEnd(7);
      console.log(`| ${tableName} | ${columnCount} | ${size} |`);
    });
    
    console.log('----------------------------------------------------------');
    
    // Récupérer les tables fournisseurs spécifiquement
    const fournisseursTablesResult = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name LIKE 'fournisseurs%'
      ORDER BY table_name
    `);
    
    const fournisseursTables = fournisseursTablesResult.rows.map(row => row.table_name);
    
    if (fournisseursTables.length > 0) {
      console.log(`\n${fournisseursTables.length} tables fournisseurs trouvées :`);
      fournisseursTables.forEach(table => console.log(`- ${table}`));
    } else {
      console.log('\nAucune table fournisseurs trouvée.');
    }
    
  } catch (error) {
    console.error('Erreur lors de la récupération des tables :', error.message);
  } finally {
    client.release();
    pool.end();
  }
}

// Exécuter la fonction
listAllTables();
