/**
 * Script pour corriger les états dupliqués dans DataTable.js
 */

const fs = require('fs');
const path = require('path');

// Chemin du fichier DataTable.js à corriger
const dataTablePath = path.join(__dirname, 'DataTable.js');
console.log(`Lecture du fichier ${dataTablePath}...`);
let content = fs.readFileSync(dataTablePath, 'utf8');

// Créer une sauvegarde du fichier
const backupPath = `${dataTablePath}.backup.${Date.now()}`;
fs.writeFileSync(backupPath, content);
console.log(`Sauvegarde créée: ${backupPath}`);

// Supprimer les états dupliqués
const duplicateStatesPattern = /\s*\/\/ États pour la pagination\s*\n\s*const \[page, setPage\] = useState\(0\);\s*\n\s*const \[rowsPerPage, setRowsPerPage\] = useState\(10\);\s*\n\s*const \[totalRows, setTotalRows\] = useState\(0\);\s*\n/;
content = content.replace(duplicateStatesPattern, '\n');
console.log('États dupliqués supprimés');

// Ajouter l'initialisation de totalRows s'il n'existe pas
if (!content.includes('const [totalRows, setTotalRows] = useState(0);')) {
  const snackbarPattern = /const \[snackbar, setSnackbar\] = useState\(\{ open: false, message: '', severity: 'success' \}\);/;
  const totalRowsState = `const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [totalRows, setTotalRows] = useState(0);`;
  content = content.replace(snackbarPattern, totalRowsState);
  console.log('État totalRows ajouté');
}

// Écrire le contenu corrigé dans le fichier
fs.writeFileSync(dataTablePath, content);
console.log(`Fichier ${dataTablePath} corrigé avec succès!`);

console.log('Veuillez redémarrer l\'application frontend pour appliquer les corrections.');
