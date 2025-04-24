/**
 * Script pour s'assurer que la colonne Score est correctement créée lors de l'importation
 * de fichiers Excel, même si elle est vide dans le fichier
 */

const fs = require('fs');
const path = require('path');

// Chemin du fichier à modifier
const fournisseursPath = path.join(__dirname, 'routes', 'fournisseurs.js');

// Lire le contenu du fichier
console.log(`Lecture du fichier ${fournisseursPath}...`);
let content = fs.readFileSync(fournisseursPath, 'utf8');

// Créer une sauvegarde du fichier original
const backupPath = `${fournisseursPath}.backup.${Date.now()}`;
fs.writeFileSync(backupPath, content);
console.log(`Sauvegarde créée: ${backupPath}`);

// Modifier la fonction de lecture des données Excel pour préserver toutes les colonnes
const excelReadingCode = `    // Lire le fichier Excel
    console.log(\`Lecture du fichier Excel: \${file.name}\`);
    const workbook = XLSX.read(file.data);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Lire toutes les données du fichier Excel
    const data = XLSX.utils.sheet_to_json(worksheet, { 
      raw: true, 
      defval: null,
      blankrows: false
    });`;

const improvedExcelReadingCode = `    // Lire le fichier Excel
    console.log(\`Lecture du fichier Excel: \${file.name}\`);
    const workbook = XLSX.read(file.data);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Obtenir la plage de cellules du fichier Excel
    const range = XLSX.utils.decode_range(worksheet['!ref']);
    
    // Extraire les en-têtes de colonnes (première ligne)
    const headers = [];
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cellAddress = XLSX.utils.encode_cell({r: range.s.r, c: C});
      const cell = worksheet[cellAddress];
      if (cell && cell.v) {
        headers.push(cell.v.toString());
      } else {
        // En-tête vide, utiliser un nom générique
        headers.push(\`Column_\${C}\`);
      }
    }
    
    console.log(\`En-têtes trouvés dans le fichier Excel: \${headers.join(', ')}\`);
    
    // Vérifier si la colonne Score existe
    const scoreExists = headers.some(header => 
      header === 'Score' || header === 'SCORE' || header === 'score'
    );
    
    if (!scoreExists) {
      console.log('Colonne Score non trouvée dans le fichier Excel. Ajout de la colonne Score.');
      headers.push('Score');
    }
    
    // Lire toutes les données du fichier Excel
    const rawData = XLSX.utils.sheet_to_json(worksheet, { 
      raw: true, 
      defval: null,
      blankrows: false
    });
    
    // Créer un nouvel ensemble de données avec toutes les colonnes, y compris Score
    const data = [];
    for (const row of rawData) {
      const newRow = {...row};
      
      // S'assurer que la colonne Score existe
      if (!scoreExists) {
        newRow['Score'] = null;
      }
      
      data.push(newRow);
    }`;

// Remplacer le code de lecture Excel par la version améliorée
content = content.replace(excelReadingCode, improvedExcelReadingCode);

// Modifier la fonction de normalisation des noms de colonnes pour préserver la colonne Score
const normalizeColumnNameFunction = `
// Fonction pour normaliser les noms de colonnes
function normalizeColumnName(columnName) {
  return columnName.toLowerCase().replace(/[^a-z0-9]/g, '_');
}`;

const improvedNormalizeColumnNameFunction = `
// Fonction pour normaliser les noms de colonnes
function normalizeColumnName(columnName) {
  // Cas spécial pour Score - préserver la casse
  if (columnName === 'Score' || columnName.toLowerCase() === 'score') {
    return 'Score';
  }
  return columnName.toLowerCase().replace(/[^a-z0-9]/g, '_');
}`;

// Remplacer la fonction de normalisation par la version améliorée
content = content.replace(normalizeColumnNameFunction, improvedNormalizeColumnNameFunction);

// Écrire le contenu modifié dans le fichier
fs.writeFileSync(fournisseursPath, content);
console.log(`Le fichier ${fournisseursPath} a été modifié avec succès.`);
console.log('Les modifications suivantes ont été apportées:');
console.log('1. Amélioration de la lecture des fichiers Excel pour préserver toutes les colonnes');
console.log('2. Ajout automatique de la colonne Score si elle n\'existe pas dans le fichier Excel');
console.log('3. Préservation de la casse pour la colonne Score');
console.log('\nVeuillez redémarrer le serveur backend pour appliquer les modifications.');
