/**
 * Script pour corriger l'erreur de syntaxe dans fournisseurs.js
 */

const fs = require('fs');
const path = require('path');

// Chemin du fichier fournisseurs.js à corriger
const fournisseursPath = path.join(__dirname, 'routes', 'fournisseurs.js');

// Lire le contenu du fichier
console.log(`Lecture du fichier ${fournisseursPath}...`);
let content = fs.readFileSync(fournisseursPath, 'utf8');

// Créer une sauvegarde du fichier
const backupPath = `${fournisseursPath}.backup.${Date.now()}`;
fs.writeFileSync(backupPath, content);
console.log(`Sauvegarde créée: ${backupPath}`);

// Corriger l'erreur de syntaxe
const errorPattern = /\}\);(\s*)\);/;
const fixedContent = content.replace(errorPattern, '});');

// Écrire le contenu corrigé dans le fichier
fs.writeFileSync(fournisseursPath, fixedContent);
console.log(`Erreur de syntaxe corrigée dans ${fournisseursPath}`);

console.log('Veuillez redémarrer le serveur backend pour appliquer les corrections.');
