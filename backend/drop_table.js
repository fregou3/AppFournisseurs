const pool = require('./db');

async function dropTable(tableName) {
  const client = await pool.connect();
  try {
    console.log(`Tentative de suppression de la table ${tableName}...`);
    
    // Vérifier si la table existe
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = $1
      )
    `, [tableName]);
    
    if (!tableCheck.rows[0].exists) {
      console.log(`La table ${tableName} n'existe pas.`);
      return;
    }
    
    // Supprimer la table
    await client.query(`DROP TABLE IF EXISTS "${tableName}"`);
    console.log(`La table ${tableName} a été supprimée avec succès.`);
    
  } catch (error) {
    console.error('Erreur lors de la suppression de la table:', error);
  } finally {
    client.release();
    pool.end();
  }
}

// Exécuter la fonction avec le nom de la table en argument
const tableName = process.argv[2];
if (!tableName) {
  console.error('Veuillez spécifier un nom de table à supprimer.');
  process.exit(1);
}

dropTable(tableName);
