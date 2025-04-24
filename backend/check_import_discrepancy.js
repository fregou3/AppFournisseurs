const XLSX = require('xlsx');
const pool = require('./db');
const path = require('path');

async function analyzeImportDiscrepancy() {
  console.log('Analyse de la différence entre le fichier Excel et la table importée...');
  
  try {
    // Lire le fichier Excel
    const excelPath = path.join(__dirname, '../20042025/Base_communify_version_ID_FG_Nat_tiers_IA.xlsx');
    const workbook = XLSX.readFile(excelPath);
    const sheetName = workbook.SheetNames[0];
    const excelData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: null, raw: true });
    
    console.log(`Nombre de lignes dans le fichier Excel: ${excelData.length}`);
    
    // Vérifier si le fichier Excel contient des lignes complètement vides
    let emptyRowsInExcel = 0;
    excelData.forEach((row, index) => {
      const allValuesNull = Object.values(row).every(val => val === null || val === undefined || val === '');
      if (allValuesNull) {
        emptyRowsInExcel++;
        console.log(`Ligne ${index + 2} dans Excel est complètement vide`);
      }
    });
    
    console.log(`Lignes complètement vides dans Excel: ${emptyRowsInExcel}`);
    
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
      console.log(`Différence: ${excelData.length - countResult.rows[0].total} lignes`);
      
      // Vérifier les erreurs potentielles lors de l'importation
      console.log('\nVérification des erreurs potentielles lors de l\'importation:');
      
      // Vérifier les contraintes de la table qui pourraient empêcher l'insertion
      const constraintsResult = await client.query(`
        SELECT conname, contype, pg_get_constraintdef(oid) as def
        FROM pg_constraint
        WHERE conrelid = 'fournisseurs_base_communify_version_id_fg_nat_tiers_ia'::regclass
      `);
      
      if (constraintsResult.rows.length > 0) {
        console.log('Contraintes trouvées sur la table:');
        constraintsResult.rows.forEach(row => {
          console.log(`- ${row.conname} (${row.contype}): ${row.def}`);
        });
      } else {
        console.log('Aucune contrainte trouvée sur la table.');
      }
      
      // Vérifier si des lignes ont été rejetées à cause de valeurs NULL dans des colonnes NOT NULL
      const notNullColumnsResult = await client.query(`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'fournisseurs_base_communify_version_id_fg_nat_tiers_ia'
        AND is_nullable = 'NO'
        AND column_default IS NULL
      `);
      
      if (notNullColumnsResult.rows.length > 0) {
        console.log('\nColonnes NOT NULL sans valeur par défaut:');
        notNullColumnsResult.rows.forEach(row => {
          console.log(`- ${row.column_name}`);
        });
      } else {
        console.log('\nAucune colonne NOT NULL sans valeur par défaut trouvée.');
      }
      
      // Vérifier les types de données des colonnes
      const columnsResult = await client.query(`
        SELECT column_name, data_type, character_maximum_length
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'fournisseurs_base_communify_version_id_fg_nat_tiers_ia'
      `);
      
      console.log('\nTypes de données des colonnes:');
      const columnTypes = {};
      columnsResult.rows.forEach(row => {
        columnTypes[row.column_name] = {
          type: row.data_type,
          maxLength: row.character_maximum_length
        };
      });
      
      // Vérifier si certaines valeurs dans Excel pourraient dépasser les limites de taille
      let oversizedValues = 0;
      excelData.forEach((row, rowIndex) => {
        Object.entries(row).forEach(([key, value]) => {
          const dbColumn = key.toLowerCase().replace(/[^a-z0-9]+/g, '_');
          if (columnTypes[dbColumn] && columnTypes[dbColumn].type === 'character varying' && 
              typeof value === 'string' && value.length > columnTypes[dbColumn].maxLength) {
            oversizedValues++;
            console.log(`Ligne ${rowIndex + 2}, colonne ${key}: Valeur trop longue (${value.length} > ${columnTypes[dbColumn].maxLength})`);
          }
        });
      });
      
      if (oversizedValues > 0) {
        console.log(`\n${oversizedValues} valeurs dépassent la taille maximale autorisée.`);
      } else {
        console.log('\nAucune valeur ne dépasse la taille maximale autorisée.');
      }
      
      // Vérifier les erreurs dans les logs du serveur
      console.log('\nConseil: Vérifiez les logs du serveur pour voir les erreurs spécifiques lors de l\'importation.');
      
      // Vérifier si l'ID est auto-incrémenté et s'il y a des trous dans la séquence
      const idSequenceResult = await client.query(`
        SELECT MIN(id) as min_id, MAX(id) as max_id, COUNT(*) as count
        FROM fournisseurs_base_communify_version_id_fg_nat_tiers_ia
      `);
      
      if (idSequenceResult.rows.length > 0) {
        const { min_id, max_id, count } = idSequenceResult.rows[0];
        const expectedCount = max_id - min_id + 1;
        
        console.log('\nAnalyse de la séquence d\'IDs:');
        console.log(`- ID minimum: ${min_id}`);
        console.log(`- ID maximum: ${max_id}`);
        console.log(`- Nombre de lignes: ${count}`);
        console.log(`- Nombre attendu si séquentiel: ${expectedCount}`);
        
        if (expectedCount > count) {
          console.log(`- Il y a ${expectedCount - count} trous dans la séquence d'IDs.`);
          
          // Échantillonner quelques IDs manquants
          const missingIdsResult = await client.query(`
            WITH numbers AS (
              SELECT generate_series(${min_id}, ${max_id}) AS id
            )
            SELECT n.id
            FROM numbers n
            LEFT JOIN fournisseurs_base_communify_version_id_fg_nat_tiers_ia t ON n.id = t.id
            WHERE t.id IS NULL
            LIMIT 5
          `);
          
          if (missingIdsResult.rows.length > 0) {
            console.log('- Exemples d\'IDs manquants:');
            missingIdsResult.rows.forEach(row => {
              console.log(`  * ${row.id}`);
            });
          }
        } else {
          console.log('- La séquence d\'IDs est complète, sans trous.');
        }
      }
      
      // Vérifier si des erreurs se sont produites pendant l'importation
      console.log('\nPour résoudre ce problème, vous pourriez:');
      console.log('1. Vérifier les logs du serveur pour voir les erreurs spécifiques');
      console.log('2. Examiner le code d\'importation pour voir s\'il y a des filtres implicites');
      console.log('3. Vérifier si certaines lignes sont rejetées à cause de contraintes de validation');
      
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('Erreur lors de l\'analyse:', error);
  } finally {
    pool.end();
  }
}

analyzeImportDiscrepancy();
