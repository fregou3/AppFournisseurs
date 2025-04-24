/**
 * Script pour rechercher les colonnes codées en dur dans le code source
 * Ce script recherche spécifiquement les chaînes "HUYI MODIFICATION" et "PARTNERS TRADUCTION"
 */

const fs = require('fs');
const path = require('path');

// Colonnes problématiques à rechercher
const problematicColumns = [
  'HUYI MODIFICATION',
  'HUYI_MODIFICATION',
  'PARTNERS TRADUCTION',
  'PARTNERS_TRADUCTION'
];

// Fonction pour rechercher une chaîne dans un fichier
function searchInFile(filePath, searchStrings) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const results = [];
    
    searchStrings.forEach(searchString => {
      let index = content.indexOf(searchString);
      while (index !== -1) {
        // Extraire le contexte (50 caractères avant et après)
        const start = Math.max(0, index - 50);
        const end = Math.min(content.length, index + searchString.length + 50);
        const context = content.substring(start, end);
        
        // Trouver le numéro de ligne
        const contentBeforeMatch = content.substring(0, index);
        const lineNumber = contentBeforeMatch.split('\n').length;
        
        results.push({
          searchString,
          lineNumber,
          context: context.replace(/\n/g, ' ')
        });
        
        index = content.indexOf(searchString, index + 1);
      }
    });
    
    return results;
  } catch (error) {
    console.error(`Erreur lors de la lecture du fichier ${filePath}:`, error.message);
    return [];
  }
}

// Fonction pour parcourir récursivement un répertoire
function searchInDirectory(dir, searchStrings, fileExtensions = ['.js', '.json']) {
  const results = {};
  
  try {
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        // Ignorer les répertoires node_modules et .git
        if (file !== 'node_modules' && file !== '.git') {
          const subResults = searchInDirectory(filePath, searchStrings, fileExtensions);
          Object.assign(results, subResults);
        }
      } else if (stat.isFile()) {
        // Vérifier l'extension du fichier
        const ext = path.extname(file).toLowerCase();
        if (fileExtensions.includes(ext)) {
          const fileResults = searchInFile(filePath, searchStrings);
          
          if (fileResults.length > 0) {
            results[filePath] = fileResults;
          }
        }
      }
    }
  } catch (error) {
    console.error(`Erreur lors de la lecture du répertoire ${dir}:`, error.message);
  }
  
  return results;
}

// Point d'entrée principal
const rootDir = process.argv[2] || path.join(__dirname, '..');
console.log(`Recherche des colonnes codées en dur dans ${rootDir}...`);

const results = searchInDirectory(rootDir, problematicColumns);

// Afficher les résultats
console.log('\n=== RÉSULTATS DE LA RECHERCHE ===');

if (Object.keys(results).length === 0) {
  console.log('Aucune occurrence trouvée.');
} else {
  console.log(`Trouvé dans ${Object.keys(results).length} fichiers :`);
  
  for (const [filePath, fileResults] of Object.entries(results)) {
    const relativePath = path.relative(rootDir, filePath);
    console.log(`\nFichier: ${relativePath} (${fileResults.length} occurrences)`);
    
    fileResults.forEach((result, index) => {
      console.log(`  ${index + 1}. Ligne ${result.lineNumber}: "${result.searchString}"`);
      console.log(`     Contexte: ...${result.context}...`);
    });
  }
}

// Rechercher également dans les fichiers de configuration et les scripts SQL
console.log('\n=== RECHERCHE DANS LES FICHIERS DE CONFIGURATION ET SQL ===');
const configResults = searchInDirectory(rootDir, problematicColumns, ['.json', '.sql', '.config', '.env']);

if (Object.keys(configResults).length === 0) {
  console.log('Aucune occurrence trouvée dans les fichiers de configuration et SQL.');
} else {
  console.log(`Trouvé dans ${Object.keys(configResults).length} fichiers de configuration/SQL :`);
  
  for (const [filePath, fileResults] of Object.entries(configResults)) {
    if (results[filePath]) continue; // Éviter les doublons
    
    const relativePath = path.relative(rootDir, filePath);
    console.log(`\nFichier: ${relativePath} (${fileResults.length} occurrences)`);
    
    fileResults.forEach((result, index) => {
      console.log(`  ${index + 1}. Ligne ${result.lineNumber}: "${result.searchString}"`);
      console.log(`     Contexte: ...${result.context}...`);
    });
  }
}
