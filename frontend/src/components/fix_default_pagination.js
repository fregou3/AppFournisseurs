/**
 * Script pour remettre la pagination par défaut à 10 lignes
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

// Modifier la valeur par défaut de rowsPerPage à 10
const rowsPerPagePattern = /const \[rowsPerPage, setRowsPerPage\] = useState\([0-9]+\);/;
const newRowsPerPage = 'const [rowsPerPage, setRowsPerPage] = useState(10);';

if (content.match(rowsPerPagePattern)) {
  content = content.replace(rowsPerPagePattern, newRowsPerPage);
  console.log('Valeur par défaut de rowsPerPage modifiée à 10');
} else {
  console.log('Pattern de rowsPerPage non trouvé');
}

// Écrire le contenu modifié dans le fichier
fs.writeFileSync(dataTablePath, content);
console.log(`Fichier ${dataTablePath} modifié avec succès!`);

console.log('Veuillez redémarrer l\'application frontend pour appliquer les modifications.');
