/**
 * Script pour modifier la limite de fournisseurs de 10000 à 15000
 */

const fs = require('fs');
const path = require('path');

// Fichiers à modifier
const filesToModify = [
  'frontend/src/components/SimpleDataView.js',
  'frontend/src/components/Home.js',
  'frontend/src/components/DataTable.js'
];

// Chemin de base de l'application
const basePath = __dirname;

// Fonction pour remplacer 10000 par 15000 dans un fichier
function updateFile(filePath) {
  console.log(`Traitement du fichier: ${filePath}`);
  
  try {
    // Lire le contenu du fichier
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Créer une sauvegarde du fichier original
    const backupPath = `${filePath}.backup.${Date.now()}`;
    fs.writeFileSync(backupPath, content);
    console.log(`Sauvegarde créée: ${backupPath}`);
    
    // Remplacer 10000 par 15000 dans les URLs d'API et les options de pagination
    let updatedContent = content.replace(/pageSize=10000/g, 'pageSize=15000');
    updatedContent = updatedContent.replace(/fetchSize = 10000/g, 'fetchSize = 15000');
    updatedContent = updatedContent.replace(/\[10, 25, 50, 100, 250, 500, 1000, 5000, 10000\]/g, '[10, 25, 50, 100, 250, 500, 1000, 5000, 15000]');
    
    // Écrire le contenu modifié dans le fichier
    fs.writeFileSync(filePath, updatedContent);
    
    // Vérifier si des modifications ont été effectuées
    if (content !== updatedContent) {
      console.log(`✅ Fichier modifié avec succès: ${filePath}`);
      return true;
    } else {
      console.log(`⚠️ Aucune modification nécessaire dans: ${filePath}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Erreur lors de la modification du fichier ${filePath}:`, error);
    return false;
  }
}

// Exécuter les modifications
console.log('Début de la mise à jour de la limite de fournisseurs de 10000 à 15000...');

let modifiedCount = 0;
for (const file of filesToModify) {
  const fullPath = path.join(basePath, file);
  if (fs.existsSync(fullPath)) {
    const modified = updateFile(fullPath);
    if (modified) modifiedCount++;
  } else {
    console.warn(`⚠️ Fichier non trouvé: ${fullPath}`);
  }
}

console.log(`\nRésumé: ${modifiedCount} fichier(s) modifié(s) sur ${filesToModify.length}`);
console.log('Veuillez redémarrer l\'application pour appliquer les modifications.');
