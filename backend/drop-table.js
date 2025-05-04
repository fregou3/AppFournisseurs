const { Pool } = require('pg');
const dotenv = require('dotenv');
dotenv.config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT
});

async function dropTable(tableName) {
  let client;
  try {
    client = await pool.connect();
    
    // Vérifier si la table existe
    const checkResult = await client.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = $1
      )
    `, [tableName]);
    
    const tableExists = checkResult.rows[0].exists;
    
    if (tableExists) {
      // Supprimer la table
      await client.query(`DROP TABLE IF EXISTS "${tableName}" CASCADE`);
      console.log(`La table ${tableName} a été supprimée avec succès.`);
    } else {
      console.log(`La table ${tableName} n'existe pas dans la base de données.`);
    }
  } catch (err) {
    console.error('Erreur lors de la suppression de la table:', err);
  } finally {
    if (client) client.release();
    pool.end();
  }
}

// Appeler la fonction avec le nom de la table à supprimer
dropTable('fournisseurs');
