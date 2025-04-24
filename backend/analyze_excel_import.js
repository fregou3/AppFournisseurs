/**
 * Script pour analyser un fichier Excel et comparer le nombre de lignes avec la table importée
 */

const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');
const pool = require('./db');

// Fonction pour compter les lignes dans un fichier Excel
async function countExcelRows(filePath) {
  console.log(`Analyse du fichier Excel: ${filePath}`);
  
  if (!fs.existsSync(filePath)) {
    console.error(`Le fichier ${filePath} n'existe pas!`);
    return null;
  }
  
  try {
    // Lire le fichier Excel avec toutes les options pour garantir que toutes les lignes sont lues
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Utiliser différentes méthodes pour compter les lignes
    
    // Méthode 1: sheet_to_json avec options complètes
    const data1 = XLSX.utils.sheet_to_json(worksheet, { 
      raw: true, 
      defval: null,
      blankrows: true
    });
    console.log(`Méthode 1 (sheet_to_json avec options): ${data1.length} lignes`);
    
    // Méthode 2: Utiliser sheet_to_csv et compter les lignes
    const csv = XLSX.utils.sheet_to_csv(worksheet);
    const lines = csv.split('\n').filter(line => line.trim() !== '');
    console.log(`Méthode 2 (sheet_to_csv): ${lines.length} lignes`);
    
    // Méthode 3: Analyser directement les cellules
    const range = XLSX.utils.decode_range(worksheet['!ref']);
    const rowCount = range.e.r - range.s.r + 1;
    console.log(`Méthode 3 (decode_range): ${rowCount} lignes`);
    
    // Méthode 4: Analyser manuellement chaque ligne
    let manualRowCount = 0;
    for (let r = range.s.r; r <= range.e.r; r++) {
      let hasContent = false;
      for (let c = range.s.c; c <= range.e.c; c++) {
        const cellAddress = XLSX.utils.encode_cell({ r, c });
        if (worksheet[cellAddress]) {
          hasContent = true;
          break;
        }
      }
      if (hasContent) manualRowCount++;
    }
    console.log(`Méthode 4 (analyse manuelle): ${manualRowCount} lignes`);
    
    // Analyser les lignes vides
    let emptyRows = 0;
    data1.forEach((row, index) => {
      const isEmpty = Object.values(row).every(val => val === null || val === undefined || val === '');
      if (isEmpty) {
        emptyRows++;
        console.log(`Ligne ${index + 1} est vide`);
      }
    });
    console.log(`Nombre de lignes vides: ${emptyRows}`);
    
    return {
      method1: data1.length,
      method2: lines.length,
      method3: rowCount,
      method4: manualRowCount,
      emptyRows
    };
  } catch (error) {
    console.error('Erreur lors de l\'analyse du fichier Excel:', error);
    return null;
  }
}

// Fonction pour compter les lignes dans une table PostgreSQL
async function countTableRows(tableName) {
  const client = await pool.connect();
  try {
    console.log(`Comptage des lignes dans la table ${tableName}...`);
    
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
    const result = await client.query(`SELECT COUNT(*) FROM "${tableName}"`);
    const count = parseInt(result.rows[0].count);
    
    console.log(`Nombre de lignes dans la table ${tableName}: ${count}`);
    return count;
  } catch (error) {
    console.error('Erreur lors du comptage des lignes:', error);
    return null;
  } finally {
    client.release();
  }
}

// Fonction pour améliorer l'importation Excel
async function fixExcelImport() {
  // Rechercher tous les fichiers Excel dans le répertoire
  const excelDir = path.join(__dirname, '..');
  const excelFiles = fs.readdirSync(excelDir)
    .filter(file => file.endsWith('.xlsx') || file.endsWith('.xls'))
    .map(file => path.join(excelDir, file));
  
  console.log(`Fichiers Excel trouvés: ${excelFiles.length}`);
  
  // Analyser chaque fichier Excel
  for (const excelFile of excelFiles) {
    console.log(`\nAnalyse de ${path.basename(excelFile)}...`);
    const excelRows = await countExcelRows(excelFile);
    
    if (excelRows) {
      console.log(`\nRésumé pour ${path.basename(excelFile)}:`);
      console.log(`- Nombre de lignes (méthode 1): ${excelRows.method1}`);
      console.log(`- Nombre de lignes (méthode 2): ${excelRows.method2}`);
      console.log(`- Nombre de lignes (méthode 3): ${excelRows.method3}`);
      console.log(`- Nombre de lignes (méthode 4): ${excelRows.method4}`);
      console.log(`- Lignes vides: ${excelRows.emptyRows}`);
    }
  }
  
  // Compter les lignes dans la table
  const tableName = process.argv[2] || 'fournisseurs_2025_04_v10';
  const tableRows = await countTableRows(tableName);
  
  if (tableRows !== null) {
    console.log(`\nComparaison avec la table ${tableName}:`);
    console.log(`- Lignes dans la table: ${tableRows}`);
    
    // Suggérer des améliorations
    console.log('\nRecommandations pour garantir que toutes les lignes sont importées:');
    console.log('1. Utiliser XLSX.utils.sheet_to_json avec les options {raw: true, defval: null, blankrows: true}');
    console.log('2. Vérifier et gérer les erreurs lors de l\'insertion de chaque ligne');
    console.log('3. Ajouter des logs détaillés pour identifier les lignes qui ne sont pas importées');
    console.log('4. Utiliser une transaction pour l\'ensemble de l\'importation');
  }
  
  pool.end();
}

// Exécuter la fonction principale
fixExcelImport();
