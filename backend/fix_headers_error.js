/**
 * Script pour corriger l'erreur "headers is not defined"
 * qui est apparue après les modifications précédentes
 */

const fs = require('fs');
const path = require('path');

// Chemin du fichier à modifier
const fournisseursPath = path.join(__dirname, 'routes', 'fournisseurs.js');

// Lire le contenu du fichier
console.log(`Lecture du fichier ${fournisseursPath}...`);
let content = fs.readFileSync(fournisseursPath, 'utf8');

// Créer une sauvegarde du fichier original
const backupPath = `${fournisseursPath}.backup.${Date.now()}`;
fs.writeFileSync(backupPath, content);
console.log(`Sauvegarde créée: ${backupPath}`);

// Corriger l'erreur "headers is not defined"
// Le problème est que nous avons remplacé le code qui extrait les colonnes,
// mais nous n'avons pas correctement défini la variable headers dans tout le fichier

// Trouver la ligne où l'erreur se produit
const errorLine = `    // Utiliser les en-têtes déjà extraits
    const columns = headers;
    console.log(\`Colonnes utilisées pour la création de la table: \${columns.join(', ')}\`);`;

// Remplacer par une version corrigée qui utilise les colonnes extraites des données
const fixedCode = `    // Extraire les noms de colonnes à partir de la première ligne
    const columns = data.length > 0 ? Object.keys(data[0]) : [];
    console.log(\`Colonnes trouvées dans le fichier Excel: \${columns.join(', ')}\`);`;

// Appliquer la correction
content = content.replace(errorLine, fixedCode);

// Écrire le contenu modifié dans le fichier
fs.writeFileSync(fournisseursPath, content);
console.log(`Le fichier ${fournisseursPath} a été modifié avec succès.`);
console.log('La correction suivante a été apportée:');
console.log('- Correction de l\'erreur "headers is not defined" en utilisant les colonnes extraites des données');
console.log('\nVeuillez redémarrer le serveur backend pour appliquer les modifications.');
