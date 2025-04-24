const pool = require('./db');

async function listTables() {
  const client = await pool.connect();
  try {
    console.log('Connexion à la base de données établie');
    
    // Requête pour obtenir toutes les tables de la base de données
    const query = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;
    
    const result = await client.query(query);
    
    console.log('\nListe des tables dans la base de données:');
    console.log('=====================================');
    
    if (result.rows.length === 0) {
      console.log('Aucune table trouvée');
    } else {
      result.rows.forEach((row, index) => {
        console.log(`${index + 1}. ${row.table_name}`);
      });
      console.log(`\nTotal: ${result.rows.length} tables`);
    }
    
  } catch (error) {
    console.error('Erreur lors de la récupération des tables:', error);
  } finally {
    client.release();
    pool.end();
  }
}

// Exécuter la fonction
listTables();
