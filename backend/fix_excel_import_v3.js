/**
 * Script pour corriger l'erreur de double déclaration de variable
 * SyntaxError: Identifier 'excelToDbMappingDynamic' has already been declared
 */

const fs = require('fs');
const path = require('path');

// Chemin du fichier à modifier
const fournisseursPath = path.join(__dirname, 'routes', 'fournisseurs.js');

// Lire le contenu du fichier
console.log(`Lecture du fichier ${fournisseursPath}...`);
let content = fs.readFileSync(fournisseursPath, 'utf8');

// Vérifier si la variable est déclarée plusieurs fois
const occurrences = content.match(/let excelToDbMappingDynamic = \{\}/g);
if (occurrences && occurrences.length > 1) {
  console.log(`Trouvé ${occurrences.length} déclarations de excelToDbMappingDynamic`);
  
  // Supprimer toutes les déclarations
  content = content.replace(/let excelToDbMappingDynamic = \{\};/g, '');
  
  // Ajouter une seule déclaration au début du fichier, juste après les imports
  const importSection = content.match(/const [^;]+;/g);
  const lastImport = importSection[importSection.length - 1];
  const position = content.indexOf(lastImport) + lastImport.length;
  
  content = content.slice(0, position) + 
    '\n\n// Variable pour stocker le mapping dynamique des colonnes Excel\nlet excelToDbMappingDynamic = {};\n' + 
    content.slice(position);
  
  // Écrire le contenu corrigé dans le fichier
  console.log('Écriture des modifications dans le fichier...');
  fs.writeFileSync(fournisseursPath, content, 'utf8');
  
  console.log('Correction terminée avec succès!');
} else {
  console.log('Aucune déclaration multiple trouvée. Vérification du code...');
  
  // Rechercher toutes les occurrences de la variable
  const allMatches = content.match(/excelToDbMappingDynamic/g);
  if (allMatches) {
    console.log(`Trouvé ${allMatches.length} références à excelToDbMappingDynamic`);
    
    // Vérifier si la variable est déjà déclarée
    if (content.includes('let excelToDbMappingDynamic = {};')) {
      console.log('La variable est déjà déclarée une fois.');
    } else {
      console.log('La variable est utilisée mais n\'est pas déclarée. Ajout de la déclaration...');
      
      // Ajouter la déclaration au début du fichier
      const importSection = content.match(/const [^;]+;/g);
      const lastImport = importSection[importSection.length - 1];
      const position = content.indexOf(lastImport) + lastImport.length;
      
      content = content.slice(0, position) + 
        '\n\n// Variable pour stocker le mapping dynamique des colonnes Excel\nlet excelToDbMappingDynamic = {};\n' + 
        content.slice(position);
      
      // Écrire le contenu corrigé dans le fichier
      console.log('Écriture des modifications dans le fichier...');
      fs.writeFileSync(fournisseursPath, content, 'utf8');
      
      console.log('Ajout de la déclaration terminé avec succès!');
    }
  } else {
    console.log('La variable excelToDbMappingDynamic n\'est pas utilisée dans le fichier.');
  }
}

// Vérifier si le mapping dynamique est ajouté au début du fichier
if (content.includes('// Variable pour stocker le mapping dynamique des colonnes Excel') &&
    content.includes('let excelToDbMappingDynamic = {};')) {
  console.log('La déclaration de la variable est correctement placée.');
} else {
  console.log('ATTENTION: La déclaration de la variable pourrait ne pas être correctement placée.');
}

console.log('Script terminé.');
