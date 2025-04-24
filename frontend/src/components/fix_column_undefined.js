/**
 * Script pour corriger l'erreur ESLint "column is not defined" à la ligne 347 dans DataTable.js
 */

const fs = require('fs');
const path = require('path');

// Chemin du fichier DataTable.js
const dataTablePath = path.join(__dirname, 'DataTable.js');
console.log(`Lecture du fichier ${dataTablePath}...`);
let content = fs.readFileSync(dataTablePath, 'utf8');

// Créer une sauvegarde du fichier
const backupPath = `${dataTablePath}.backup.${Date.now()}`;
fs.writeFileSync(backupPath, content);
console.log(`Sauvegarde créée: ${backupPath}`);

// Trouver et corriger l'erreur spécifique à la ligne 346
const errorLinePattern = /isScoreColumn\(column\)\)/;
const correctedLine = `isScoreColumn(columnName))`;

if (content.match(errorLinePattern)) {
  content = content.replace(errorLinePattern, correctedLine);
  console.log('Correction de la référence à "column" remplacée par "columnName" à la ligne 346');
} else {
  console.log('Pattern de l\'erreur non trouvé');
}

// Écrire le contenu modifié dans le fichier
fs.writeFileSync(dataTablePath, content);
console.log(`Fichier ${dataTablePath} modifié avec succès!`);

console.log('Veuillez redémarrer l\'application frontend pour appliquer les modifications.');
