const { Pool } = require('pg');
const config = require('./db').config;

const pool = new Pool(config);

async function getTableColumns(tableName) {
  const client = await pool.connect();
  try {
    console.log(`Récupération des colonnes de la table ${tableName}...`);
    
    const query = `
      SELECT column_name, data_type, character_maximum_length
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = $1
      ORDER BY ordinal_position;
    `;
    
    const result = await client.query(query, [tableName]);
    
    if (result.rows.length === 0) {
      console.log(`La table ${tableName} n'existe pas ou n'a pas de colonnes.`);
      return;
    }
    
    console.log(`\nColonnes de la table ${tableName}:`);
    console.log('------------------------------------');
    result.rows.forEach(column => {
      let type = column.data_type;
      if (column.character_maximum_length) {
        type += `(${column.character_maximum_length})`;
      }
      console.log(`${column.column_name} - ${type}`);
    });
    
  } catch (error) {
    console.error('Erreur lors de la récupération des colonnes:', error);
  } finally {
    client.release();
    // Fermer la connexion à la base de données
    pool.end();
  }
}

// Exécuter la fonction avec le nom de la table en argument
getTableColumns('fournisseurs');
