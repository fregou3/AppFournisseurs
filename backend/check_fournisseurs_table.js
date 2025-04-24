/**
 * Script pour vérifier la table fournisseurs
 */

const pool = require('./db');

async function checkFournisseursTable() {
  const client = await pool.connect();
  try {
    console.log('Vérification de la table fournisseurs...');

    // Vérifier si la table existe
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'fournisseurs'
      )
    `);

    if (!tableCheck.rows[0].exists) {
      console.log('La table fournisseurs n\'existe pas.');
      return;
    }

    console.log('La table fournisseurs existe.');

    // Compter les lignes
    const countResult = await client.query('SELECT COUNT(*) FROM fournisseurs');
    console.log(`Nombre de lignes dans la table fournisseurs: ${countResult.rows[0].count}`);

    // Récupérer les colonnes
    const columnsResult = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'fournisseurs'
      ORDER BY ordinal_position
    `);

    console.log('Colonnes de la table fournisseurs:');
    columnsResult.rows.forEach(col => {
      console.log(`- ${col.column_name} (${col.data_type})`);
    });

    // Récupérer quelques lignes
    const sampleResult = await client.query('SELECT * FROM fournisseurs LIMIT 1');
    if (sampleResult.rows.length > 0) {
      console.log('Exemple de données:');
      console.log(JSON.stringify(sampleResult.rows[0], null, 2));
    } else {
      console.log('La table est vide.');
    }

  } catch (error) {
    console.error('Erreur lors de la vérification de la table:', error);
  } finally {
    client.release();
    pool.end();
  }
}

checkFournisseursTable();
