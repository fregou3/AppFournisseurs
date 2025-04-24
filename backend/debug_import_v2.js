/**
 * Script pour déboguer et corriger les problèmes d'importation Excel
 * Problème: Aucune ligne n'est importée dans la table fournisseurs_v12
 */

const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const pool = require('./db');

// Fonction pour analyser un fichier Excel
async function analyzeExcelFile(filePath) {
  console.log(`Analyse du fichier Excel: ${filePath}`);
  
  if (!fs.existsSync(filePath)) {
    console.error(`Le fichier ${filePath} n'existe pas!`);
    return null;
  }
  
  try {
    // Lire le fichier Excel
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Déterminer le nombre réel de lignes dans le fichier Excel
    const range = XLSX.utils.decode_range(worksheet['!ref']);
    const totalExcelRows = range.e.r - range.s.r + 1; // +1 car les indices commencent à 0
    console.log(`Nombre total de lignes dans le fichier Excel (selon la plage): ${totalExcelRows}`);
    
    // Lire les données avec différentes options
    console.log("Lecture avec différentes options:");
    
    // Option 1: Standard
    const data1 = XLSX.utils.sheet_to_json(worksheet);
    console.log(`Option 1 (standard): ${data1.length} lignes`);
    
    // Option 2: Avec raw et defval
    const data2 = XLSX.utils.sheet_to_json(worksheet, { raw: true, defval: null });
    console.log(`Option 2 (raw, defval): ${data2.length} lignes`);
    
    // Option 3: Avec raw, defval et blankrows
    const data3 = XLSX.utils.sheet_to_json(worksheet, { raw: true, defval: null, blankrows: true });
    console.log(`Option 3 (raw, defval, blankrows): ${data3.length} lignes`);
    
    // Option 4: Avec header et range
    const data4 = XLSX.utils.sheet_to_json(worksheet, { 
      raw: true, 
      defval: null, 
      blankrows: true,
      header: 1,
      range: range
    });
    console.log(`Option 4 (header, range): ${data4.length} lignes`);
    
    // Vérifier les en-têtes
    if (data4.length > 0) {
      console.log(`En-têtes (première ligne): ${JSON.stringify(data4[0])}`);
      
      // Compter les colonnes non vides dans la première ligne
      const nonEmptyHeaders = data4[0].filter(header => header !== null && header !== undefined && header !== '');
      console.log(`Nombre de colonnes avec en-têtes non vides: ${nonEmptyHeaders.length}`);
    }
    
    return {
      totalRows: totalExcelRows,
      data1Length: data1.length,
      data2Length: data2.length,
      data3Length: data3.length,
      data4Length: data4.length
    };
  } catch (error) {
    console.error('Erreur lors de l\'analyse du fichier Excel:', error);
    return null;
  }
}

// Fonction pour vérifier la table dans la base de données
async function checkTable(tableName) {
  const client = await pool.connect();
  try {
    console.log(`Vérification de la table ${tableName}...`);
    
    // Vérifier si la table existe
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = $1
      )
    `, [tableName]);
    
    if (!tableCheck.rows[0].exists) {
      console.log(`La table ${tableName} n'existe pas.`);
      return null;
    }
    
    // Compter les lignes
    const countResult = await client.query(`SELECT COUNT(*) FROM "${tableName}"`);
    const rowCount = parseInt(countResult.rows[0].count);
    console.log(`Nombre de lignes dans la table ${tableName}: ${rowCount}`);
    
    // Vérifier les colonnes
    const columnsResult = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = $1
      ORDER BY ordinal_position
    `, [tableName]);
    
    console.log(`Nombre de colonnes dans la table ${tableName}: ${columnsResult.rows.length}`);
    
    // Vérifier les contraintes
    const constraintsResult = await client.query(`
      SELECT conname, contype, pg_get_constraintdef(oid) 
      FROM pg_constraint 
      WHERE conrelid = $1::regclass
    `, [tableName]);
    
    console.log(`Nombre de contraintes sur la table ${tableName}: ${constraintsResult.rows.length}`);
    
    // Vérifier les verrous
    const lockTableName = `${tableName}_lock`;
    const lockTableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = $1
      )
    `, [lockTableName]);
    
    if (lockTableCheck.rows[0].exists) {
      const lockResult = await client.query(`SELECT * FROM "${lockTableName}" ORDER BY start_time DESC LIMIT 1`);
      if (lockResult.rows.length > 0) {
        console.log(`Dernier verrou sur la table ${tableName}:`, lockResult.rows[0]);
      } else {
        console.log(`Aucun verrou trouvé pour la table ${tableName}`);
      }
    } else {
      console.log(`La table de verrou ${lockTableName} n'existe pas.`);
    }
    
    return {
      rowCount,
      columnCount: columnsResult.rows.length
    };
  } catch (error) {
    console.error(`Erreur lors de la vérification de la table ${tableName}:`, error);
    return null;
  } finally {
    client.release();
  }
}

// Fonction pour corriger le problème d'importation
async function fixImportIssue() {
  console.log('Correction du problème d\'importation...');
  
  // Chemin du fichier à modifier
  const fournisseursPath = path.join(__dirname, 'routes', 'fournisseurs.js');
  
  // Lire le contenu du fichier
  console.log(`Lecture du fichier ${fournisseursPath}...`);
  let content = fs.readFileSync(fournisseursPath, 'utf8');
  
  // Correction 1: Problème avec la variable data redéfinie
  console.log('Correction du problème de redéfinition de la variable data...');
  const dataRedefinitionPattern = /const formattedData = \[\];\s+const headers = data\[0\];[\s\S]+?const data = formattedData;/g;
  const dataRedefinitionReplacement = `const formattedData = [];
    const headers = data[0];    // Première ligne = en-têtes
    
    // Parcourir toutes les lignes de données (à partir de la deuxième ligne)
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const formattedRow = {};
      
      // Créer un objet avec les en-têtes comme clés
      for (let j = 0; j < headers.length; j++) {
        if (headers[j]) {  // Ignorer les colonnes sans en-tête
          formattedRow[headers[j]] = row[j];
        }
      }
      
      // Vérifier si la ligne n'est pas complètement vide
      const hasValues = Object.values(formattedRow).some(val => 
        val !== null && val !== undefined && val !== ''
      );
      
      if (hasValues || req.body.includeEmptyRows === 'true') {
        formattedData.push(formattedRow);
      }
    }
    
    console.log(\`Nombre de lignes lues après formatage: \${formattedData.length}\`);
    
    // Remplacer data par formattedData
    data = formattedData;`;
  
  content = content.replace(dataRedefinitionPattern, dataRedefinitionReplacement);
  
  // Correction 2: Problème avec les compteurs de succès/erreur
  console.log('Correction du problème des compteurs...');
  const successCountPattern = /let successCount = 0;\s+let errorCount = 0;\s+let skipCount = 0;/g;
  const successCountReplacement = `let successCount = 0;
    let errorCount = 0;
    let skipCount = 0;
    let insertedCount = 0; // Pour compatibilité avec le code existant`;
  
  content = content.replace(successCountPattern, successCountReplacement);
  
  // Correction 3: Problème avec l'insertion des données
  console.log('Correction du problème d\'insertion des données...');
  const insertPattern = /try {\s+const result = await insertClient\.query\(insertQuery, values\);\s+console\.log\(`Ligne \${index \+ 1}: Insertion réussie avec l'ID \${result\.rows\[0\]\.id}`\);\s+insertedCount\+\+;/g;
  const insertReplacement = `try {
          console.log(\`Exécution de la requête d'insertion pour la ligne \${index + 1}:\`);
          console.log(\`Colonnes: \${columns.join(', ')}\`);
          console.log(\`Valeurs: \${values.map(v => typeof v === 'object' ? JSON.stringify(v) : v).join(', ')}\`);
          
          const result = await insertClient.query(insertQuery, values);
          console.log(\`Ligne \${index + 1}: Insertion réussie avec l'ID \${result.rows[0].id}\`);
          insertedCount++;
          successCount++;`;
  
  content = content.replace(insertPattern, insertReplacement);
  
  // Écrire le contenu modifié dans le fichier
  console.log('Écriture des modifications dans le fichier...');
  fs.writeFileSync(fournisseursPath, content, 'utf8');
  
  console.log('Modifications terminées avec succès!');
}

// Fonction principale
async function main() {
  try {
    // Rechercher les fichiers Excel dans le répertoire
    const excelDir = path.join(__dirname, '..');
    const excelFiles = fs.readdirSync(excelDir)
      .filter(file => file.endsWith('.xlsx') || file.endsWith('.xls'))
      .map(file => path.join(excelDir, file));
    
    console.log(`Fichiers Excel trouvés: ${excelFiles.length}`);
    
    // Analyser le premier fichier Excel trouvé
    if (excelFiles.length > 0) {
      await analyzeExcelFile(excelFiles[0]);
    }
    
    // Vérifier la table fournisseurs_v12
    await checkTable('fournisseurs_v12');
    
    // Corriger le problème d'importation
    await fixImportIssue();
    
    console.log('\nDébogage terminé. Veuillez redémarrer le serveur et réessayer l\'importation.');
  } catch (error) {
    console.error('Erreur lors du débogage:', error);
  } finally {
    pool.end();
  }
}

// Exécuter la fonction principale
main();
