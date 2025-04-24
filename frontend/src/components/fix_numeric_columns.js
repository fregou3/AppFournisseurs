/**
 * Script pour corriger l'erreur de syntaxe dans la déclaration du tableau numericColumns
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
const problematicLine = `const numericColumns = ["score', "Score", 'Scoring", "Santé financière', "Calcul méthode ADEME'];`;
const fixedLine = `const numericColumns = ['score', 'Score', 'Scoring', 'Santé financière', 'Calcul méthode ADEME'];`;

if (content.includes(problematicLine)) {
  content = content.replace(problematicLine, fixedLine);
  console.log('Tableau numericColumns corrigé');
} else {
  // Si la ligne exacte n'est pas trouvée, essayer une approche plus générale
  const pattern = /const numericColumns = \[[^\]]+\];/;
  const match = content.match(pattern);
  
  if (match) {
    content = content.replace(match[0], fixedLine);
    console.log('Tableau numericColumns corrigé (approche générale)');
  } else {
    console.log('Impossible de trouver la déclaration de numericColumns');
  }
}

// Écrire le contenu corrigé dans le fichier
fs.writeFileSync(dataTablePath, content);
console.log(`Fichier ${dataTablePath} corrigé avec succès!`);

console.log('Veuillez redémarrer l\'application frontend pour appliquer les corrections.');
