const XLSX = require('xlsx');
const pool = require('./db');
const path = require('path');

async function analyzeExcelImport() {
  console.log('Analyse de l\'importation du fichier Excel...');
  
  try {
    // Lire le fichier Excel
    const excelPath = path.join(__dirname, '../20042025/Base_communify_version_ID_FG_Nat_tiers_IA.xlsx');
    const workbook = XLSX.readFile(excelPath);
    const sheetName = workbook.SheetNames[0];
    const excelData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
    
    console.log(`Nombre de lignes dans le fichier Excel: ${excelData.length}`);
    
    // Vérifier les lignes vides ou problématiques dans Excel
    let emptyRows = 0;
    let rowsWithoutSupplierID = 0;
    
    excelData.forEach((row, index) => {
      // Vérifier si la ligne est vide (aucune propriété)
      if (Object.keys(row).length === 0) {
        emptyRows++;
        console.log(`Ligne ${index + 2} est vide`); // +2 car Excel commence à 1 et il y a l'en-tête
      }
      
      // Vérifier si la ligne n'a pas de Supplier_ID
      const supplierIdKey = Object.keys(row).find(key => 
        key.toLowerCase() === 'supplier_id' || 
        key.toLowerCase() === 'supplier id' ||
        key.toLowerCase() === 'id'
      );
      
      if (!supplierIdKey || !row[supplierIdKey]) {
        rowsWithoutSupplierID++;
        console.log(`Ligne ${index + 2} n'a pas de Supplier_ID valide`);
      }
    });
    
    console.log(`Lignes vides dans Excel: ${emptyRows}`);
    console.log(`Lignes sans Supplier_ID dans Excel: ${rowsWithoutSupplierID}`);
    
    // Vérifier les données dans la base
    const client = await pool.connect();
    
    try {
      // Vérifier si la table existe
      const tableCheck = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'fournisseurs_base_communify_version_id_fg_nat_tiers_ia'
        )
      `);
      
      if (!tableCheck.rows[0].exists) {
        console.log('La table fournisseurs_base_communify_version_id_fg_nat_tiers_ia n\'existe pas');
        return;
      }
      
      // Compter le nombre de lignes dans la table
      const countResult = await client.query(`
        SELECT COUNT(*) as total 
        FROM fournisseurs_base_communify_version_id_fg_nat_tiers_ia
      `);
      
      console.log(`Nombre de lignes dans la table: ${countResult.rows[0].total}`);
      
      // Vérifier les doublons potentiels basés sur supplier_id
      const duplicateCheck = await client.query(`
        SELECT supplier_id, COUNT(*) as count
        FROM fournisseurs_base_communify_version_id_fg_nat_tiers_ia
        WHERE supplier_id IS NOT NULL
        GROUP BY supplier_id
        HAVING COUNT(*) > 1
        ORDER BY COUNT(*) DESC
        LIMIT 10
      `);
      
      if (duplicateCheck.rows.length > 0) {
        console.log('\nSupplier_IDs apparaissant plusieurs fois dans la base:');
        duplicateCheck.rows.forEach(row => {
          console.log(`supplier_id ${row.supplier_id}: ${row.count} occurrences`);
        });
      } else {
        console.log('\nAucun doublon de supplier_id trouvé dans la base');
      }
      
      // Vérifier les lignes sans supplier_id dans la base
      const nullSupplierIdCheck = await client.query(`
        SELECT COUNT(*) as count
        FROM fournisseurs_base_communify_version_id_fg_nat_tiers_ia
        WHERE supplier_id IS NULL
      `);
      
      console.log(`\nLignes sans supplier_id dans la base: ${nullSupplierIdCheck.rows[0].count}`);
      
      // Vérifier si la déduplication a été activée lors de l'importation
      console.log('\nVérification de la déduplication:');
      console.log('Différence entre Excel et base de données:', excelData.length - countResult.rows[0].total);
      
      // Vérifier les supplier_ids qui sont dans Excel mais pas dans la base
      // Échantillonner quelques supplier_ids du fichier Excel
      const sampleSupplierIds = [];
      for (let i = 0; i < Math.min(10, excelData.length); i++) {
        const row = excelData[i];
        const supplierIdKey = Object.keys(row).find(key => 
          key.toLowerCase() === 'supplier_id' || 
          key.toLowerCase() === 'supplier id' ||
          key.toLowerCase() === 'id'
        );
        
        if (supplierIdKey && row[supplierIdKey]) {
          sampleSupplierIds.push(row[supplierIdKey].toString());
        }
      }
      
      if (sampleSupplierIds.length > 0) {
        console.log('\nVérification d\'un échantillon de supplier_ids:');
        for (const supplierId of sampleSupplierIds) {
          const checkResult = await client.query(`
            SELECT COUNT(*) as count
            FROM fournisseurs_base_communify_version_id_fg_nat_tiers_ia
            WHERE supplier_id = $1
          `, [supplierId]);
          
          console.log(`supplier_id ${supplierId}: ${checkResult.rows[0].count > 0 ? 'présent' : 'absent'} dans la base`);
        }
      }
      
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('Erreur lors de l\'analyse:', error);
  } finally {
    pool.end();
  }
}

analyzeExcelImport();
