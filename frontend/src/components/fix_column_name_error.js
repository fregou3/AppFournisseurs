/**
 * Script pour corriger l'erreur ESLint "column is not defined" dans DataTable.js
 * en utilisant le bon nom de variable dans le contexte
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

// 1. Corriger l'appel à isScoreColumn dans getColumnColor
const errorLinePattern = /isScoreColumn\(columnName\)\)/;
const correctedLine = `isScoreColumn(colName))`;

if (content.match(errorLinePattern)) {
  content = content.replace(errorLinePattern, correctedLine);
  console.log('Correction de la référence à "columnName" remplacée par "colName" dans getColumnColor');
} else {
  console.log('Pattern de l\'erreur non trouvé');
}

// Écrire le contenu modifié dans le fichier
fs.writeFileSync(dataTablePath, content);
console.log(`Fichier ${dataTablePath} modifié avec succès!`);

console.log('Veuillez redémarrer l\'application frontend pour appliquer les modifications.');
