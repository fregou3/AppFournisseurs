const pool = require('./db');

async function countRows(tableName) {
  const client = await pool.connect();
  try {
    console.log(`Comptage des lignes dans la table ${tableName}...`);
    
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
    
    // Compter les lignes
    const result = await client.query(`SELECT COUNT(*) FROM "${tableName}"`);
    const count = parseInt(result.rows[0].count);
    
    console.log(`Nombre de lignes dans la table ${tableName}: ${count}`);
    
  } catch (error) {
    console.error('Erreur lors du comptage des lignes:', error);
  } finally {
    client.release();
    pool.end();
  }
}

// Exécuter la fonction avec le nom de la table en argument
const tableName = process.argv[2] || 'fournisseurs';
countRows(tableName);
