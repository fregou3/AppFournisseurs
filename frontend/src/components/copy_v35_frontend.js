/**
 * Script pour copier les fichiers frontend de la version 3.5 vers la version 3.6
 */

const fs = require('fs');
const path = require('path');

// Chemins des répertoires
const v35Path = 'C:\\App\\AppGetionFournisseurs\\AppGetionFournisseurs_3.5_EN\\frontend\\src\\components';
const v36Path = 'C:\\App\\AppGetionFournisseurs\\AppGetionFournisseurs_3.6_EN\\frontend\\src\\components';

// Fichiers à copier
const filesToCopy = [
  'Home.js',
  'DataTable.js'
];

console.log('Début de la copie des fichiers de la version 3.5 vers la version 3.6...');

// Créer des sauvegardes des fichiers existants dans la version 3.6
filesToCopy.forEach(file => {
  const sourcePath = path.join(v36Path, file);
  if (fs.existsSync(sourcePath)) {
    const backupPath = `${sourcePath}.backup.${Date.now()}`;
    fs.copyFileSync(sourcePath, backupPath);
    console.log(`Sauvegarde créée: ${backupPath}`);
  }
});

// Copier les fichiers de la version 3.5 vers la version 3.6
filesToCopy.forEach(file => {
  const sourcePath = path.join(v35Path, file);
  const destPath = path.join(v36Path, file);
  
  if (fs.existsSync(sourcePath)) {
    // Lire le contenu du fichier source
    let content = fs.readFileSync(sourcePath, 'utf8');
    
    // Écrire le contenu dans le fichier de destination
    fs.writeFileSync(destPath, content);
    console.log(`Fichier copié: ${file}`);
  } else {
    console.log(`Fichier source non trouvé: ${sourcePath}`);
  }
});

console.log('Copie terminée!');
console.log('Veuillez redémarrer l\'application frontend pour appliquer les modifications.');
