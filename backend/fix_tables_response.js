/**
 * Script pour corriger la réponse de la route /fournisseurs/tables
 */

const fs = require('fs');
const path = require('path');

// Chemin du fichier à modifier
const fournisseursPath = path.join(__dirname, 'routes', 'fournisseurs.js');

// Lire le contenu du fichier
console.log(`Lecture du fichier ${fournisseursPath}...`);
let content = fs.readFileSync(fournisseursPath, 'utf8');

// Trouver et corriger la route /tables
console.log('Correction de la route /fournisseurs/tables...');

// Rechercher la ligne qui renvoie la réponse dans la route /tables
const searchPattern = /res\.json\(result\.rows\.map\(row => row\.table_name\)\);/;
const replacement = 'res.json({ tables: result.rows.map(row => row.table_name) });';

// Remplacer la ligne
if (content.match(searchPattern)) {
  content = content.replace(searchPattern, replacement);
  
  // Écrire le contenu modifié dans le fichier
  fs.writeFileSync(fournisseursPath, content, 'utf8');
  
  console.log('Route /fournisseurs/tables corrigée avec succès!');
} else {
  console.log('Impossible de trouver la ligne à corriger.');
}

console.log('Veuillez redémarrer le serveur pour appliquer les modifications.');
