/**
 * Script pour tester la connexion à la base de données et la requête SQL
 */

const pool = require('./db');

async function testDatabaseConnection() {
  console.log('Test de la connexion à la base de données...');
  
  const client = await pool.connect();
  try {
    console.log('Connexion établie avec succès!');
    
    // Vérifier si la table existe
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'fournisseurs_fournisseurs_v18'
      )
    `);
    
    if (!tableCheck.rows[0].exists) {
      console.log('La table fournisseurs_fournisseurs_v18 n\'existe pas');
      return;
    }
    
    console.log('La table fournisseurs_fournisseurs_v18 existe');
    
    // Compter le nombre total de lignes
    const countResult = await client.query('SELECT COUNT(*) FROM fournisseurs_fournisseurs_v18');
    const totalRows = parseInt(countResult.rows[0].count);
    
    console.log(`Nombre total de lignes dans la table: ${totalRows}`);
    
    // Tester la requête de pagination
    const page = 1;
    const pageSize = 50;
    const offset = (parseInt(page) - 1) * parseInt(pageSize);
    const limit = parseInt(pageSize);
    
    const query = `SELECT * FROM "fournisseurs_fournisseurs_v18" ORDER BY id LIMIT ${limit} OFFSET ${offset}`;
    console.log('Requête SQL:', query);
    
    const result = await client.query(query);
    console.log(`Nombre de lignes récupérées: ${result.rows.length}`);
    
    // Afficher les premières lignes pour vérifier la structure
    if (result.rows.length > 0) {
      console.log('Structure de la première ligne:');
      console.log(JSON.stringify(result.rows[0], null, 2));
    }
    
    console.log('Test terminé avec succès!');
  } catch (error) {
    console.error('Erreur lors du test de la connexion à la base de données:', error);
  } finally {
    client.release();
    pool.end();
  }
}

testDatabaseConnection();
