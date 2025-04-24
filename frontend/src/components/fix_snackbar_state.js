/**
 * Script pour corriger l'erreur de syntaxe dans la déclaration de l'état snackbar
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
const problematicLine = `const [snackbar, setSnackbar] = useState({ open: false, message: '", severity: 'success" });`;
const fixedLine = `const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });`;

if (content.includes(problematicLine)) {
  content = content.replace(problematicLine, fixedLine);
  console.log('État snackbar corrigé');
} else {
  // Si la ligne exacte n'est pas trouvée, essayer une approche plus générale
  const snackbarPattern = /const \[snackbar, setSnackbar\] = useState\(\{[^}]+\}\);/;
  const snackbarMatch = content.match(snackbarPattern);
  
  if (snackbarMatch) {
    content = content.replace(snackbarMatch[0], fixedLine);
    console.log('État snackbar corrigé (approche générale)');
  } else {
    console.log('Impossible de trouver la déclaration de snackbar');
  }
}

// Écrire le contenu corrigé dans le fichier
fs.writeFileSync(dataTablePath, content);
console.log(`Fichier ${dataTablePath} corrigé avec succès!`);

console.log('Veuillez redémarrer l\'application frontend pour appliquer les corrections.');
