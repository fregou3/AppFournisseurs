const pool = require('./db');

async function analyzeTable() {
  const client = await pool.connect();
  try {
    console.log('Analyse de la table fournisseurs_2025_04_25...');
    
    // Vérifier le nombre total de lignes
    const countResult = await client.query('SELECT COUNT(*) as total FROM fournisseurs_2025_04_25');
    console.log(`Nombre total de lignes: ${countResult.rows[0].total}`);
    
    // Vérifier la plage des IDs
    const idRangeResult = await client.query('SELECT MIN(id) as min_id, MAX(id) as max_id FROM fournisseurs_2025_04_25');
    console.log(`Plage d'IDs: de ${idRangeResult.rows[0].min_id} à ${idRangeResult.rows[0].max_id}`);
    
    // Vérifier s'il y a eu plusieurs importations (en regardant les sauts dans les IDs)
    const idGapsResult = await client.query(`
      WITH id_series AS (
        SELECT id, id - ROW_NUMBER() OVER (ORDER BY id) as gap_group
        FROM fournisseurs_2025_04_25
      )
      SELECT MIN(id) as start_id, MAX(id) as end_id, COUNT(*) as group_size
      FROM id_series
      GROUP BY gap_group
      ORDER BY start_id
      LIMIT 10
    `);
    
    console.log('\nGroupes d\'IDs consécutifs (indiquant potentiellement des importations séparées):');
    idGapsResult.rows.forEach(row => {
      console.log(`De ${row.start_id} à ${row.end_id} (${row.group_size} lignes)`);
    });
    
    // Vérifier les doublons potentiels basés sur certaines colonnes clés
    const duplicateCheckResult = await client.query(`
      SELECT supplier_id, procurement_orga, COUNT(*) as count
      FROM fournisseurs_2025_04_25
      WHERE supplier_id IS NOT NULL
      GROUP BY supplier_id, procurement_orga
      HAVING COUNT(*) > 1
      ORDER BY COUNT(*) DESC
      LIMIT 10
    `);
    
    console.log('\nExemples de combinaisons supplier_id/procurement_orga apparaissant plusieurs fois:');
    if (duplicateCheckResult.rows.length > 0) {
      duplicateCheckResult.rows.forEach(row => {
        console.log(`supplier_id: ${row.supplier_id}, procurement_orga: ${row.procurement_orga} - ${row.count} occurrences`);
      });
      
      // Examiner un exemple de lignes potentiellement dupliquées
      const exampleSupplier = duplicateCheckResult.rows[0].supplier_id;
      const exampleOrga = duplicateCheckResult.rows[0].procurement_orga;
      
      const exampleRows = await client.query(`
        SELECT id, supplier_id, procurement_orga, partners, organization_1, organization_2
        FROM fournisseurs_2025_04_25
        WHERE supplier_id = $1 AND procurement_orga = $2
        LIMIT 5
      `, [exampleSupplier, exampleOrga]);
      
      console.log(`\nExemple de lignes avec supplier_id = ${exampleSupplier} et procurement_orga = ${exampleOrga}:`);
      exampleRows.rows.forEach(row => {
        console.log(row);
      });
    } else {
      console.log('Aucune combinaison supplier_id/procurement_orga n\'apparaît plusieurs fois.');
    }
    
    // Vérifier les valeurs NULL dans les colonnes clés
    const nullCheckResult = await client.query(`
      SELECT 
        COUNT(*) FILTER (WHERE supplier_id IS NULL) as null_supplier_id,
        COUNT(*) FILTER (WHERE procurement_orga IS NULL) as null_procurement_orga,
        COUNT(*) FILTER (WHERE partners IS NULL) as null_partners,
        COUNT(*) FILTER (WHERE organization_1 IS NULL) as null_organization_1
      FROM fournisseurs_2025_04_25
    `);
    
    console.log('\nNombre de valeurs NULL dans les colonnes clés:');
    console.log(`supplier_id: ${nullCheckResult.rows[0].null_supplier_id}`);
    console.log(`procurement_orga: ${nullCheckResult.rows[0].null_procurement_orga}`);
    console.log(`partners: ${nullCheckResult.rows[0].null_partners}`);
    console.log(`organization_1: ${nullCheckResult.rows[0].null_organization_1}`);
    
    // Vérifier les dernières lignes importées
    const lastRowsResult = await client.query(`
      SELECT id, supplier_id, procurement_orga, partners
      FROM fournisseurs_2025_04_25
      ORDER BY id DESC
      LIMIT 5
    `);
    
    console.log('\nDernières lignes importées:');
    lastRowsResult.rows.forEach(row => {
      console.log(row);
    });
    
  } catch (error) {
    console.error('Erreur lors de l\'analyse de la table:', error);
  } finally {
    client.release();
    pool.end();
  }
}

analyzeTable();
