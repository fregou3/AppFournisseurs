/**
 * Script pour s'assurer que la colonne Score est correctement importée depuis les fichiers Excel
 * Ce script modifie le code d'importation pour garantir que la colonne Score est préservée
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

// Modifier la fonction de lecture des données Excel pour préserver la colonne Score
const excelReadingCode = `
    // Lire le fichier Excel
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

const improvedExcelReadingCode = `
    // Lire le fichier Excel
    console.log(\`Lecture du fichier Excel: \${file.name}\`);
    const workbook = XLSX.read(file.data);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Vérifier si la colonne Score existe dans le fichier Excel
    const range = XLSX.utils.decode_range(worksheet['!ref']);
    let scoreColumnExists = false;
    let scoreColumnIndex = -1;
    
    // Parcourir la première ligne pour trouver la colonne Score
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cellAddress = XLSX.utils.encode_cell({r: range.s.r, c: C});
      const cell = worksheet[cellAddress];
      if (cell && cell.v && (cell.v === 'Score' || cell.v === 'SCORE' || cell.v === 'score')) {
        scoreColumnExists = true;
        scoreColumnIndex = C;
        console.log(\`Colonne Score trouvée à l'index \${C}\`);
        break;
      }
    }
    
    // Lire toutes les données du fichier Excel
    const data = XLSX.utils.sheet_to_json(worksheet, { 
      raw: true, 
      defval: null,
      blankrows: false,
      header: 'A'  // Utiliser les lettres de colonnes comme en-têtes pour préserver toutes les colonnes
    });
    
    // Si des données ont été lues, convertir les en-têtes de colonnes de lettres en noms réels
    if (data.length > 0) {
      // Créer un mapping des lettres de colonnes vers les noms de colonnes
      const headerRow = {};
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cellAddress = XLSX.utils.encode_cell({r: range.s.r, c: C});
        const cell = worksheet[cellAddress];
        if (cell && cell.v) {
          const colLetter = XLSX.utils.encode_col(C);
          headerRow[colLetter] = cell.v;
        }
      }
      
      // Remplacer les lettres par les noms de colonnes dans chaque ligne
      const processedData = [];
      for (const row of data) {
        const newRow = {};
        for (const [letter, value] of Object.entries(row)) {
          if (headerRow[letter]) {
            newRow[headerRow[letter]] = value;
          }
        }
        processedData.push(newRow);
      }
      
      // Remplacer les données d'origine par les données traitées
      data.splice(0, data.length, ...processedData);
    }
    
    // Si la colonne Score n'existe pas, l'ajouter avec des valeurs nulles
    if (!scoreColumnExists && data.length > 0) {
      console.log('Colonne Score non trouvée dans le fichier Excel. Ajout de la colonne Score avec des valeurs nulles.');
      data.forEach(row => {
        row['Score'] = null;
      });
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
console.log('1. Amélioration de la lecture des fichiers Excel pour préserver la colonne Score');
console.log('2. Modification de la fonction de normalisation des noms de colonnes pour préserver la casse de "Score"');
console.log('\nVeuillez redémarrer le serveur backend pour appliquer les modifications.');
