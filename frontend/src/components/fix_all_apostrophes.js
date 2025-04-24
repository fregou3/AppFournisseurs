/**
 * Script pour corriger toutes les erreurs d'apostrophe dans DataTable.js
 * en utilisant une approche plus directe
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

// Remplacer toutes les chaînes de caractères contenant des apostrophes par des chaînes avec guillemets doubles
// Cela évite les problèmes d'échappement des apostrophes
const problematicLines = [
  `console.error('Erreur lors de l'ouverture du PDF:', response.data.message);`,
  `console.error('Erreur lors de l'appel à l\\'API:', error);`,
  `message: 'Erreur lors de l\\'ouverture du PDF',`,
  `console.error('Erreur lors de l\\'upload:', error);`,
  `setUploadError(\`Erreur lors de l\\'upload: \${error.response?.data?.message || error.message}\`);`,
  `setGroupError('Le nom du groupe ne peut pas être vide');`,
  `console.error('Erreur lors de la création du groupe:', error);`,
  `setGroupError(\`Erreur: \${error.response?.data?.message || error.message}\`);`
];

const fixedLines = [
  `console.error("Erreur lors de l'ouverture du PDF:", response.data.message);`,
  `console.error("Erreur lors de l'appel à l'API:", error);`,
  `message: "Erreur lors de l'ouverture du PDF",`,
  `console.error("Erreur lors de l'upload:", error);`,
  `setUploadError(\`Erreur lors de l'upload: \${error.response?.data?.message || error.message}\`);`,
  `setGroupError("Le nom du groupe ne peut pas être vide");`,
  `console.error("Erreur lors de la création du groupe:", error);`,
  `setGroupError(\`Erreur: \${error.response?.data?.message || error.message}\`);`
];

// Remplacer chaque ligne problématique par sa version corrigée
for (let i = 0; i < problematicLines.length; i++) {
  if (content.includes(problematicLines[i])) {
    content = content.replace(problematicLines[i], fixedLines[i]);
    console.log(`Ligne corrigée: ${problematicLines[i]}`);
  }
}

// Approche plus générale : remplacer toutes les apostrophes dans les chaînes délimitées par des apostrophes
// Cette approche est risquée car elle pourrait affecter des chaînes valides, mais nous l'utilisons en dernier recours
const lines = content.split('\n');
const correctedLines = lines.map(line => {
  // Si la ligne contient une apostrophe simple et est délimitée par des apostrophes simples
  if (line.includes("'") && line.match(/'.+?'.+?'/)) {
    // Remplacer les délimiteurs par des guillemets doubles
    return line.replace(/'([^']*?[^\\]'[^']*?)'/g, '"$1"');
  }
  return line;
});

content = correctedLines.join('\n');

// Écrire le contenu corrigé dans le fichier
fs.writeFileSync(dataTablePath, content);
console.log(`Fichier ${dataTablePath} corrigé avec succès!`);

console.log('Veuillez redémarrer l\'application frontend pour appliquer les corrections.');
