const pool = require('./db');
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

async function debugImport() {
  console.log('=== DIAGNOSTIC DE L\'IMPORTATION EXCEL ===');
  
  try {
    // 1. Vérifier les tables existantes
    const client = await pool.connect();
    console.log('Connexion à la base de données établie');
    
    // Lister toutes les tables commençant par "fournisseurs_"
    const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE 'fournisseurs_%'
      ORDER BY table_name
    `;
    
    const tablesResult = await client.query(tablesQuery);
    console.log(`\n${tablesResult.rows.length} tables trouvées commençant par "fournisseurs_":`);
    
    // Récupérer le nombre de lignes pour chaque table
    for (const tableRow of tablesResult.rows) {
      const tableName = tableRow.table_name;
      const countQuery = `SELECT COUNT(*) FROM "${tableName}"`;
      const countResult = await client.query(countQuery);
      const rowCount = parseInt(countResult.rows[0].count);
      
      console.log(`- ${tableName}: ${rowCount} lignes`);
      
      // Si c'est la table problématique, analyser sa structure
      if (tableName === 'fournisseurs_base_communify_version_id_fg_nat_tiers_ia') {
        console.log(`\nAnalyse détaillée de la table ${tableName}:`);
        
        // Vérifier la structure de la table
        const structureQuery = `
          SELECT column_name, data_type, is_nullable
          FROM information_schema.columns
          WHERE table_schema = 'public'
          AND table_name = $1
          ORDER BY ordinal_position
        `;
        
        const structureResult = await client.query(structureQuery, [tableName]);
        console.log('Structure de la table:');
        structureResult.rows.forEach(col => {
          console.log(`  - ${col.column_name} (${col.data_type}, ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'})`);
        });
        
        // Vérifier les contraintes
        const constraintsQuery = `
          SELECT conname, contype, pg_get_constraintdef(oid) as def
          FROM pg_constraint
          WHERE conrelid = $1::regclass
        `;
        
        const constraintsResult = await client.query(constraintsQuery, [tableName]);
        console.log('\nContraintes:');
        if (constraintsResult.rows.length > 0) {
          constraintsResult.rows.forEach(con => {
            console.log(`  - ${con.conname} (${con.contype}): ${con.def}`);
          });
        } else {
          console.log('  Aucune contrainte trouvée');
        }
        
        // Vérifier les doublons potentiels
        console.log('\nRecherche de doublons potentiels:');
        
        // Vérifier les doublons basés sur supplier_id
        const duplicatesQuery = `
          SELECT supplier_id, COUNT(*) as count
          FROM "${tableName}"
          WHERE supplier_id IS NOT NULL
          GROUP BY supplier_id
          HAVING COUNT(*) > 1
          ORDER BY COUNT(*) DESC
          LIMIT 10
        `;
        
        const duplicatesResult = await client.query(duplicatesQuery);
        if (duplicatesResult.rows.length > 0) {
          console.log('Doublons basés sur supplier_id:');
          duplicatesResult.rows.forEach(dup => {
            console.log(`  - supplier_id "${dup.supplier_id}": ${dup.count} occurrences`);
          });
          
          // Examiner un exemple de doublon
          if (duplicatesResult.rows.length > 0) {
            const exampleId = duplicatesResult.rows[0].supplier_id;
            const exampleQuery = `
              SELECT id, supplier_id, procurement_orga, partners
              FROM "${tableName}"
              WHERE supplier_id = $1
              LIMIT 5
            `;
            
            const exampleResult = await client.query(exampleQuery, [exampleId]);
            console.log(`\nExemple de doublons pour supplier_id "${exampleId}":`);
            exampleResult.rows.forEach(row => {
              console.log(`  - ID ${row.id}: ${row.supplier_id}, ${row.procurement_orga || 'N/A'}, ${row.partners || 'N/A'}`);
            });
          }
        } else {
          console.log('  Aucun doublon basé sur supplier_id trouvé');
        }
        
        // Vérifier les lignes avec supplier_id temporaire (TEMP_)
        const tempQuery = `
          SELECT COUNT(*) as count
          FROM "${tableName}"
          WHERE supplier_id LIKE 'TEMP_%'
        `;
        
        const tempResult = await client.query(tempQuery);
        console.log(`\nLignes avec supplier_id temporaire: ${tempResult.rows[0].count}`);
        
        // Vérifier les lignes vides
        const emptyQuery = `
          SELECT COUNT(*) as count
          FROM "${tableName}"
          WHERE (
            SELECT COUNT(*) 
            FROM (
              SELECT column_name 
              FROM information_schema.columns 
              WHERE table_name = $1 
              AND table_schema = 'public'
            ) AS cols 
            WHERE (
              SELECT (CASE 
                WHEN data_type = 'character varying' THEN COALESCE(NULLIF("${tableName}"."column_name", ''), NULL) 
                ELSE "${tableName}"."column_name" 
              END) IS NOT NULL 
              FROM "${tableName}" 
              LIMIT 1
            )
          ) = 0
        `;
        
        try {
          const emptyResult = await client.query(emptyQuery, [tableName]);
          console.log(`Lignes complètement vides: ${emptyResult.rows[0].count}`);
        } catch (error) {
          console.log('Erreur lors de la recherche de lignes vides:', error.message);
        }
      }
    }
    
    // 2. Analyser le fichier Excel
    console.log('\n=== ANALYSE DU FICHIER EXCEL ===');
    const excelPath = path.join(__dirname, '../20042025/Base_communify_version_ID_FG_Nat_tiers_IA.xlsx');
    
    if (fs.existsSync(excelPath)) {
      console.log(`Fichier Excel trouvé: ${excelPath}`);
      const workbook = XLSX.readFile(excelPath);
      const sheetName = workbook.SheetNames[0];
      const excelData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: null, raw: true });
      
      console.log(`Nombre de lignes dans le fichier Excel: ${excelData.length}`);
      
      // Vérifier les lignes vides
      const emptyRows = excelData.filter(row => {
        return Object.values(row).every(val => val === null || val === undefined || val === '');
      });
      
      console.log(`Lignes vides dans Excel: ${emptyRows.length}`);
      
      // Vérifier les lignes sans supplier_id
      const noIdRows = excelData.filter(row => {
        const supplierId = row['Supplier_ID'] || row['supplier_id'];
        return !supplierId || supplierId === '';
      });
      
      console.log(`Lignes sans supplier_id dans Excel: ${noIdRows.length}`);
      
      // Vérifier les doublons dans Excel
      const supplierIds = excelData
        .map(row => row['Supplier_ID'] || row['supplier_id'])
        .filter(id => id && id !== '');
      
      const uniqueIds = new Set(supplierIds);
      console.log(`Nombre de supplier_id uniques dans Excel: ${uniqueIds.size}`);
      console.log(`Nombre de doublons potentiels dans Excel: ${supplierIds.length - uniqueIds.size}`);
      
      // Trouver les supplier_id qui apparaissent plusieurs fois
      const idCounts = {};
      supplierIds.forEach(id => {
        idCounts[id] = (idCounts[id] || 0) + 1;
      });
      
      const duplicateIds = Object.entries(idCounts)
        .filter(([id, count]) => count > 1)
        .sort((a, b) => b[1] - a[1]);
      
      if (duplicateIds.length > 0) {
        console.log('\nTop 10 supplier_id avec le plus d\'occurrences dans Excel:');
        duplicateIds.slice(0, 10).forEach(([id, count]) => {
          console.log(`  - "${id}": ${count} occurrences`);
        });
      }
    } else {
      console.log(`Fichier Excel non trouvé: ${excelPath}`);
    }
    
    // 3. Vérifier les processus d'importation
    console.log('\n=== RECOMMANDATIONS ===');
    console.log('1. Assurez-vous que la table est correctement vidée avant chaque importation');
    console.log('2. Vérifiez que le fichier n\'est pas importé plusieurs fois');
    console.log('3. Vérifiez les logs du serveur pour voir si des erreurs se produisent pendant l\'importation');
    console.log('4. Essayez de réimporter le fichier après avoir manuellement vidé la table');
    
    client.release();
  } catch (error) {
    console.error('Erreur lors du diagnostic:', error);
  } finally {
    await pool.end();
  }
}

debugImport();
