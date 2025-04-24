/**
 * Script pour corriger l'erreur de syntaxe dans la condition if
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

// Corriger la ligne problématique
const problematicLine = `if (column === "score' || column === "Score" || column === 'Scoring") {`;
const fixedLine = `if (column === 'score' || column === 'Score' || column === 'Scoring') {`;

if (content.includes(problematicLine)) {
  content = content.replace(problematicLine, fixedLine);
  console.log('Condition if corrigée');
} else {
  // Si la ligne exacte n'est pas trouvée, essayer une approche plus générale
  const pattern = /if \(column === [^{]+\) \{/;
  const match = content.match(pattern);
  
  if (match) {
    content = content.replace(match[0], fixedLine);
    console.log('Condition if corrigée (approche générale)');
  } else {
    console.log('Impossible de trouver la condition if');
  }
}

// Vérifier et corriger toutes les autres conditions similaires
const scorePattern = /if \(column === ['"]score['"] \|\| column === ['"]Score['"] \|\| column === ['"]Scoring['"].*?\) \{/g;
content = content.replace(scorePattern, `if (column === 'score' || column === 'Score' || column === 'Scoring') {`);

// Écrire le contenu corrigé dans le fichier
fs.writeFileSync(dataTablePath, content);
console.log(`Fichier ${dataTablePath} corrigé avec succès!`);

console.log('Veuillez redémarrer l\'application frontend pour appliquer les corrections.');
