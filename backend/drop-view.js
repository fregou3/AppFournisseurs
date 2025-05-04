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

async function dropView() {
  let client;
  try {
    client = await pool.connect();
    
    // Vérifier si la vue existe
    const checkResult = await client.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.views 
        WHERE table_schema = 'public' AND table_name = 'fournisseurs_view'
      )
    `);
    
    const viewExists = checkResult.rows[0].exists;
    
    if (viewExists) {
      // Supprimer la vue
      await client.query(`DROP VIEW IF EXISTS fournisseurs_view`);
      console.log('La vue fournisseurs_view a été supprimée avec succès.');
    } else {
      console.log('La vue fournisseurs_view n\'existe pas dans la base de données.');
    }
  } catch (err) {
    console.error('Erreur lors de la suppression de la vue:', err);
  } finally {
    if (client) client.release();
    pool.end();
  }
}

dropView();
