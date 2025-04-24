/**
 * Script pour modifier le comportement d'ajout automatique du préfixe "fournisseurs_" aux noms de tables
 */

const fs = require('fs');
const path = require('path');

// Chemin du fichier fournisseurs.js
const fournisseursPath = path.join(__dirname, 'routes', 'fournisseurs.js');
console.log(`Lecture du fichier ${fournisseursPath}...`);
let content = fs.readFileSync(fournisseursPath, 'utf8');

// Créer une sauvegarde du fichier
const backupPath = `${fournisseursPath}.backup.${Date.now()}`;
fs.writeFileSync(backupPath, content);
console.log(`Sauvegarde créée: ${backupPath}`);

// Trouver et modifier la ligne qui ajoute automatiquement le préfixe "fournisseurs_"
const prefixPattern = /let tableName = 'fournisseurs_' \+ req\.body\.tableName;/;
const newLine = `let tableName = req.body.tableName; // Ne plus ajouter automatiquement le préfixe "fournisseurs_"`;

if (content.match(prefixPattern)) {
  content = content.replace(prefixPattern, newLine);
  console.log('Modification effectuée : le préfixe "fournisseurs_" ne sera plus ajouté automatiquement');
} else {
  console.log('Pattern non trouvé dans le fichier');
}

// Écrire le contenu modifié dans le fichier
fs.writeFileSync(fournisseursPath, content);
console.log(`Fichier ${fournisseursPath} modifié avec succès!`);

console.log('Veuillez redémarrer le serveur backend pour appliquer les modifications.');
