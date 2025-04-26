/**
 * Ce script modifie le fichier index.js pour inclure l'API replacer
 */

const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, 'index.js');
const backupPath = `${indexPath}.backup.${Date.now()}`;

// Lire le contenu du fichier
console.log(`Lecture du fichier ${indexPath}...`);
const content = fs.readFileSync(indexPath, 'utf8');

// Créer une sauvegarde
fs.writeFileSync(backupPath, content);
console.log(`Sauvegarde créée: ${backupPath}`);

// Ajouter l'import de l'API replacer
const modifiedContent = content.replace(
  "import App from './App';",
  "import App from './App';\nimport './api-replacer'; // Enrichissement des visualisations avec des données fictives"
);

// Écrire le contenu modifié
fs.writeFileSync(indexPath, modifiedContent);
console.log(`Fichier ${indexPath} modifié avec succès`);

console.log(`
=== INSTRUCTIONS POUR FINALISER ===
1. Installez axios-mock-adapter avec la commande:
   npm install axios-mock-adapter --save-dev

2. Redémarrez le serveur frontend pour appliquer les modifications:
   npm start

3. Les visualisations seront maintenant enrichies avec des données fictives
   sans modifier les tables existantes dans la base de données.

4. Si vous souhaitez revenir à la version originale, vous pouvez restaurer la sauvegarde avec:
   cp "${backupPath}" "${indexPath}"
`);
