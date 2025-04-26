const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

// Configuration de la connexion à la base de données
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function checkTableStructure() {
  const client = await pool.connect();
  try {
    console.log('Vérification de la structure de la table fournisseurs...');
    
    // Récupérer la liste des colonnes de la table fournisseurs
    const columnsQuery = `
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'fournisseurs'
      ORDER BY ordinal_position;
    `;
    
    const result = await client.query(columnsQuery);
    
    console.log('Colonnes de la table fournisseurs :');
    console.log('-----------------------------------');
    result.rows.forEach(row => {
      console.log(`${row.column_name} (${row.data_type})`);
    });
    
    // Vérifier spécifiquement la colonne problématique
    console.log('\nRecherche de colonnes similaires à "evaluated___not_evaluated"...');
    const similarColumnsQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'fournisseurs' 
      AND column_name LIKE 'evaluated%';
    `;
    
    const similarResult = await client.query(similarColumnsQuery);
    
    if (similarResult.rows.length > 0) {
      console.log('Colonnes similaires trouvées :');
      similarResult.rows.forEach(row => {
        console.log(`- ${row.column_name}`);
      });
    } else {
      console.log('Aucune colonne similaire trouvée.');
    }
    
  } catch (err) {
    console.error('Erreur lors de la vérification de la structure de la table :', err);
  } finally {
    client.release();
    await pool.end();
  }
}

checkTableStructure();
