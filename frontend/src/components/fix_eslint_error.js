/**
 * Script pour corriger l'erreur ESLint "column is not defined" dans DataTable.js
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

// Trouver et corriger l'erreur à la ligne 347
const errorLinePattern = /lowerColName === 'score'\) \{/;
const correctedLine = `lowerColName === 'score') {`;

if (content.match(errorLinePattern)) {
  content = content.replace(
    /isScoreColumn\(column\)/g, 
    `isScoreColumn(columnName)`
  );
  console.log('Correction de la référence à "column" remplacée par "columnName"');
} else {
  console.log('Pattern de l\'erreur non trouvé');
}

// Corriger la fonction isScoreColumn
const isScoreColumnPattern = /const isScoreColumn = \(column\) => \{[\s\S]+?return lowerCol === 'score' \|\| column === 'Score' \|\| lowerCol\.includes\('score'\);[\s\S]+?\};/;
const correctedIsScoreColumn = `const isScoreColumn = (columnName) => {
    const lowerCol = columnName.toLowerCase();
    return lowerCol === 'score' || columnName === 'Score' || lowerCol.includes('score');
  };`;

if (content.match(isScoreColumnPattern)) {
  content = content.replace(isScoreColumnPattern, correctedIsScoreColumn);
  console.log('Fonction isScoreColumn corrigée pour utiliser columnName au lieu de column');
} else {
  console.log('Pattern de la fonction isScoreColumn non trouvé');
}

// Écrire le contenu modifié dans le fichier
fs.writeFileSync(dataTablePath, content);
console.log(`Fichier ${dataTablePath} modifié avec succès!`);

console.log('Veuillez redémarrer l\'application frontend pour appliquer les modifications.');
