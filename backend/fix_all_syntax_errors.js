/**
 * Script pour corriger toutes les erreurs de syntaxe dans fournisseurs.js
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

// Corriger l'erreur de syntaxe spécifique
console.log('Recherche d\'erreurs de syntaxe...');

// 1. Corriger le problème de parenthèses supplémentaires
let fixedContent = content.replace(/\}\);(\s*)\);/g, '});');
console.log('Correction des parenthèses supplémentaires effectuée');

// 2. Vérifier l'équilibre des accolades et parenthèses
function checkBraceBalance(text) {
  const stack = [];
  const pairs = {
    '{': '}',
    '[': ']',
    '(': ')'
  };
  
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    
    if (char === '{' || char === '[' || char === '(') {
      stack.push(char);
    } else if (char === '}' || char === ']' || char === ')') {
      const last = stack.pop();
      if (pairs[last] !== char) {
        console.log(`Déséquilibre détecté à la position ${i}: attendu ${pairs[last]}, trouvé ${char}`);
        return false;
      }
    }
  }
  
  if (stack.length > 0) {
    console.log(`Déséquilibre détecté: ${stack.length} ouvertures sans fermeture`);
    return false;
  }
  
  return true;
}

// Vérifier l'équilibre des accolades et parenthèses
const isBalanced = checkBraceBalance(fixedContent);
console.log(`Équilibre des accolades et parenthèses: ${isBalanced ? 'OK' : 'NON OK'}`);

// 3. Vérifier les points-virgules manquants après les accolades fermantes
fixedContent = fixedContent.replace(/\}\s*\n\s*router\./g, '};\n\nrouter.');
console.log('Correction des points-virgules manquants effectuée');

// 4. Vérifier les routes dupliquées
const routeMatches = fixedContent.match(/router\.get\('\/', async/g);
if (routeMatches && routeMatches.length > 1) {
  console.log(`ATTENTION: ${routeMatches.length} routes racines détectées`);
}

// 5. Corriger les erreurs spécifiques connues
// Erreur à la ligne 282: }););
fixedContent = fixedContent.replace(/\}\);(\s*)\);(\s*)\n(\s*)\/\/ Route pour importer/g, '});\n\n// Route pour importer');
console.log('Correction de l\'erreur spécifique à la ligne 282 effectuée');

// Écrire le contenu corrigé dans le fichier
fs.writeFileSync(fournisseursPath, fixedContent);
console.log(`Fichier ${fournisseursPath} corrigé avec succès!`);

// Vérifier si le fichier est syntaxiquement valide
try {
  require(fournisseursPath);
  console.log('Le fichier est syntaxiquement valide!');
} catch (error) {
  console.error('Le fichier contient toujours des erreurs de syntaxe:', error.message);
  
  // En cas d'erreur, restaurer la version de sauvegarde
  fs.copyFileSync(backupPath, fournisseursPath);
  console.log(`Le fichier a été restauré à partir de la sauvegarde ${backupPath}`);
  
  // Approche alternative: réécrire complètement le fichier
  console.log('Tentative de correction manuelle...');
  
  // Extraire le contenu jusqu'à la ligne problématique
  const lines = content.split('\n');
  const problematicLineIndex = lines.findIndex(line => line.includes('}););'));
  
  if (problematicLineIndex !== -1) {
    lines[problematicLineIndex] = '});';
    const fixedContent = lines.join('\n');
    
    // Écrire le contenu corrigé dans un nouveau fichier
    const manualFixPath = path.join(__dirname, 'routes', 'fournisseurs.fixed.js');
    fs.writeFileSync(manualFixPath, fixedContent);
    console.log(`Correction manuelle écrite dans ${manualFixPath}`);
    console.log('Veuillez vérifier ce fichier et le renommer en fournisseurs.js si la correction est satisfaisante');
  }
}

console.log('Veuillez redémarrer le serveur backend pour appliquer les corrections.');
