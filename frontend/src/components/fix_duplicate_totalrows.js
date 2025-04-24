/**
 * Script pour corriger l'erreur de variable totalRows déjà déclarée dans DataTable.js
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

// 1. Trouver et supprimer la déclaration en double de totalRows
const duplicateTotalRowsPattern = /const \[totalRows, setTotalRows\] = useState\(0\);/;
if (content.match(duplicateTotalRowsPattern)) {
  content = content.replace(duplicateTotalRowsPattern, '');
  console.log('Déclaration en double de totalRows supprimée');
}

// 2. Vérifier si d'autres variables sont déclarées en double
const stateDeclarations = content.match(/const \[[^,]+, set[^\]]+\] = useState\([^)]*\);/g) || [];
const stateNames = new Set();
const duplicates = [];

stateDeclarations.forEach(declaration => {
  const match = declaration.match(/const \[([^,]+), /);
  if (match && match[1]) {
    const stateName = match[1];
    if (stateNames.has(stateName)) {
      duplicates.push(stateName);
    } else {
      stateNames.add(stateName);
    }
  }
});

if (duplicates.length > 0) {
  console.log('Autres états déclarés en double:', duplicates);
  
  // Supprimer les déclarations en double
  duplicates.forEach(duplicate => {
    const duplicatePattern = new RegExp(`const \\[${duplicate}, set[^\\]]+\\] = useState\\([^)]*\\);`);
    // Supprimer seulement la première occurrence
    let found = false;
    content = content.replace(duplicatePattern, match => {
      if (found) return match;
      found = true;
      return '';
    });
  });
}

// 3. Corriger les références à setTotalRows
// Remplacer setTotalRows par setInternalTotalRows dans tout le fichier
content = content.replace(/setTotalRows\(/g, 'setInternalTotalRows(');

// Écrire le contenu modifié dans le fichier
fs.writeFileSync(dataTablePath, content);
console.log(`Fichier ${dataTablePath} corrigé avec succès!`);

console.log('Veuillez redémarrer l\'application frontend pour appliquer les corrections.');
