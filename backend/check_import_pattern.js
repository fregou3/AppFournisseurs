const pool = require('./db');

async function checkImportPattern() {
  const client = await pool.connect();
  try {
    console.log('Vérification des modèles d\'importation...');
    
    // Vérifier si la table existe
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'fournisseurs_2025_04_25'
      )
    `);
    
    if (!tableCheck.rows[0].exists) {
      console.log('La table fournisseurs_2025_04_25 n\'existe pas.');
      return;
    }
    
    // Vérifier si le fichier a été importé plusieurs fois en regardant les timestamps
    // (si la table a une colonne de timestamp)
    try {
      const timestampCheck = await client.query(`
        SELECT 
          to_char(date_trunc('hour', created_at), 'YYYY-MM-DD HH24:MI') as import_hour,
          COUNT(*) as count
        FROM 
          fournisseurs_2025_04_25
        GROUP BY 
          import_hour
        ORDER BY 
          import_hour
      `);
      
      if (timestampCheck.rows.length > 0) {
        console.log('Distribution des importations par heure:');
        timestampCheck.rows.forEach(row => {
          console.log(`${row.import_hour}: ${row.count} lignes`);
        });
      }
    } catch (error) {
      console.log('La table ne contient pas de colonne created_at.');
    }
    
    // Vérifier la distribution des IDs pour voir s'il y a des sauts qui pourraient indiquer plusieurs importations
    const idDistribution = await client.query(`
      SELECT 
        MIN(id) as min_id,
        MAX(id) as max_id,
        MAX(id) - MIN(id) + 1 as expected_count,
        COUNT(*) as actual_count
      FROM 
        fournisseurs_2025_04_25
    `);
    
    console.log('\nDistribution des IDs:');
    console.log(`ID minimum: ${idDistribution.rows[0].min_id}`);
    console.log(`ID maximum: ${idDistribution.rows[0].max_id}`);
    console.log(`Nombre attendu si séquentiel: ${idDistribution.rows[0].expected_count}`);
    console.log(`Nombre réel: ${idDistribution.rows[0].actual_count}`);
    
    // Vérifier s'il y a des trous dans la séquence des IDs
    if (idDistribution.rows[0].expected_count > idDistribution.rows[0].actual_count) {
      console.log('\nIl y a des trous dans la séquence des IDs, ce qui pourrait indiquer des suppressions.');
      
      // Échantillonner quelques trous
      const gapCheck = await client.query(`
        WITH numbers AS (
          SELECT generate_series(${idDistribution.rows[0].min_id}, ${idDistribution.rows[0].max_id}) AS id
        )
        SELECT n.id
        FROM numbers n
        LEFT JOIN fournisseurs_2025_04_25 f ON n.id = f.id
        WHERE f.id IS NULL
        ORDER BY n.id
        LIMIT 10
      `);
      
      if (gapCheck.rows.length > 0) {
        console.log('Exemples d\'IDs manquants:');
        gapCheck.rows.forEach(row => {
          console.log(row.id);
        });
      }
    }
    
    // Vérifier si les données semblent être des doublons avec des IDs différents
    const sampleCheck = await client.query(`
      SELECT 
        supplier_id, 
        COUNT(*) as count
      FROM 
        fournisseurs_2025_04_25
      WHERE 
        supplier_id IS NOT NULL
      GROUP BY 
        supplier_id
      HAVING 
        COUNT(*) > 1
      ORDER BY 
        COUNT(*) DESC
      LIMIT 10
    `);
    
    if (sampleCheck.rows.length > 0) {
      console.log('\nExemples de supplier_id apparaissant plusieurs fois:');
      sampleCheck.rows.forEach(row => {
        console.log(`supplier_id ${row.supplier_id}: ${row.count} occurrences`);
      });
      
      // Examiner un exemple de lignes avec le même supplier_id
      if (sampleCheck.rows.length > 0) {
        const exampleSupplier = sampleCheck.rows[0].supplier_id;
        const exampleRows = await client.query(`
          SELECT id, supplier_id, procurement_orga, partners
          FROM fournisseurs_2025_04_25
          WHERE supplier_id = $1
          LIMIT 5
        `, [exampleSupplier]);
        
        console.log(`\nExemple de lignes avec supplier_id = ${exampleSupplier}:`);
        exampleRows.rows.forEach(row => {
          console.log(row);
        });
      }
    } else {
      console.log('\nAucun supplier_id n\'apparaît plusieurs fois.');
    }
    
    // Vérifier le nombre de lignes dans le fichier Excel original
    console.log('\nPour comparer, vérifiez le nombre de lignes dans le fichier Excel:');
    console.log('node -e "const XLSX = require(\'xlsx\'); const workbook = XLSX.readFile(\'C:\\\\App\\\\AppGetionFournisseurs\\\\AppGetionFournisseurs_3.5_EN\\\\20042025\\\\Fournisseurs_2024.xlsx\'); const sheet = workbook.Sheets[workbook.SheetNames[0]]; const data = XLSX.utils.sheet_to_json(sheet); console.log(\'Nombre de lignes dans le fichier Excel:\', data.length);"');
    
  } catch (error) {
    console.error('Erreur lors de la vérification des modèles d\'importation:', error);
  } finally {
    client.release();
    pool.end();
  }
}

checkImportPattern();
