/**
 * Script pour corriger les erreurs d'apostrophe dans DataTable.js
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

// Corriger les apostrophes problématiques
content = content.replace(
  /console\.error\('Erreur lors de l'ouverture du PDF:', response\.data\.message\);/g,
  `console.error('Erreur lors de l\\'ouverture du PDF:', response.data.message);`
);

// Vérifier s'il y a d'autres apostrophes problématiques
const problematicPatterns = [
  /l'upload/g,
  /l'API/g,
  /d'upload/g,
  /l'application/g,
  /s'assurer/g,
  /l'erreur/g,
  /l'ouverture/g,
  /n'est/g,
  /qu'il/g
];

problematicPatterns.forEach(pattern => {
  content = content.replace(pattern, match => {
    return match.replace("'", "\\'");
  });
});

// Écrire le contenu corrigé dans le fichier
fs.writeFileSync(dataTablePath, content);
console.log(`Fichier ${dataTablePath} corrigé avec succès!`);

console.log('Veuillez redémarrer l\'application frontend pour appliquer les corrections.');
