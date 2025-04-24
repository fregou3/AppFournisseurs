/**
 * Script pour compter le nombre de lignes dans la table fournisseurs_fournisseurs_v18
 */

const pool = require('./db');

async function countRows() {
  const client = await pool.connect();
  try {
    console.log('Connexion à la base de données établie');
    
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
    
    // Compter le nombre de lignes
    const countResult = await client.query('SELECT COUNT(*) FROM fournisseurs_fournisseurs_v18');
    const rowCount = parseInt(countResult.rows[0].count);
    
    console.log(`Nombre de lignes dans la table fournisseurs_fournisseurs_v18: ${rowCount}`);
    
    // Récupérer les informations sur les colonnes
    const columnsResult = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'fournisseurs_fournisseurs_v18'
      ORDER BY ordinal_position
    `);
    
    console.log(`Nombre de colonnes dans la table: ${columnsResult.rowCount}`);
    console.log('Liste des colonnes:');
    columnsResult.rows.forEach(col => {
      console.log(`- ${col.column_name} (${col.data_type})`);
    });
    
  } catch (error) {
    console.error('Erreur lors du comptage des lignes:', error);
  } finally {
    client.release();
    pool.end();
  }
}

countRows();
