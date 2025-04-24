/**
 * Script pour corriger l'erreur de fonction non définie dans Home.js
 */

const fs = require('fs');
const path = require('path');

// Chemin du fichier Home.js
const homePath = path.join(__dirname, 'Home.js');
console.log(`Lecture du fichier ${homePath}...`);
let content = fs.readFileSync(homePath, 'utf8');

// Créer une sauvegarde du fichier
const backupPath = `${homePath}.backup.${Date.now()}`;
fs.writeFileSync(backupPath, content);
console.log(`Sauvegarde créée: ${backupPath}`);

// 1. Ajouter la fonction handleDataUpdate si elle n'existe pas
if (!content.includes('const handleDataUpdate')) {
  // Trouver un bon endroit pour ajouter la fonction, après handlePageSizeChange
  const handlePageSizeChangePattern = /const handlePageSizeChange = \(event\) => \{[\s\S]+?\};/;
  const handlePageSizeChangeMatch = content.match(handlePageSizeChangePattern);
  
  if (handlePageSizeChangeMatch) {
    const handleDataUpdateFunction = `
  // Fonction pour gérer les mises à jour de données depuis le DataTable
  const handleDataUpdate = (updatedData) => {
    console.log('Données mises à jour reçues du DataTable:', updatedData);
    // Si nécessaire, mettre à jour les données
    // setData(updatedData);
  };`;
    
    content = content.replace(
      handlePageSizeChangeMatch[0],
      `${handlePageSizeChangeMatch[0]}${handleDataUpdateFunction}`
    );
    console.log('Fonction handleDataUpdate ajoutée');
  }
}

// 2. Corriger l'appel au DataTable si handleDataUpdate n'est pas utilisé
const dataTablePattern = /<DataTable[\s\S]+?onDataUpdate={handleDataUpdate}[\s\S]+?\/>/;
if (!content.includes('const handleDataUpdate')) {
  content = content.replace(
    dataTablePattern,
    `<DataTable
            data={data.slice(currentPage * pageSize, (currentPage + 1) * pageSize)}
            tableName={selectedTable}
          />`
  );
  console.log('Référence à handleDataUpdate supprimée du DataTable');
}

// Écrire le contenu modifié dans le fichier
fs.writeFileSync(homePath, content);
console.log(`Fichier ${homePath} modifié avec succès!`);

console.log('Veuillez redémarrer l\'application frontend pour appliquer les modifications.');
