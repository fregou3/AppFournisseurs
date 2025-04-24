/**
 * Script pour corriger l'erreur de return en dehors d'une fonction
 */

const fs = require('fs');
const path = require('path');

// Chemin du fichier DataTable.js à corriger
const dataTablePath = path.join(__dirname, 'DataTable.js');
console.log(`Lecture du fichier ${dataTablePath}...`);
let content = fs.readFileSync(dataTablePath, 'utf8');

// Créer une sauvegarde du fichier
const backupPath = `${dataTablePath}.backup.${Date.now()}`;
fs.writeFileSync(backupPath, content);
console.log(`Sauvegarde créée: ${backupPath}`);

// Restaurer la structure correcte du composant DataTable
// Nous allons réécrire la fin du composant pour s'assurer que le return est bien à l'intérieur de la fonction DataTable

// Trouver le début de la fonction DataTable
const dataTableStart = content.indexOf('const DataTable = (');
if (dataTableStart === -1) {
  console.error('Impossible de trouver le début de la fonction DataTable');
  process.exit(1);
}

// Trouver la dernière fonction avant le return problématique
const resetAllFiltersPattern = /const resetAllFilters = \(\) => \{[\s\S]+?setPage\(0\);\s*\};/;
const resetAllFiltersMatch = content.match(resetAllFiltersPattern);

if (!resetAllFiltersMatch) {
  console.error('Impossible de trouver la fonction resetAllFilters');
  process.exit(1);
}

// Position après la fonction resetAllFilters
const afterResetAllFilters = content.indexOf(resetAllFiltersMatch[0]) + resetAllFiltersMatch[0].length;

// Trouver le return problématique
const returnPattern = /\s*return \(\s*<Box sx=\{\{ width: '100%' \}\}>/;
const returnMatch = content.match(returnPattern);

if (!returnMatch) {
  console.error('Impossible de trouver le return problématique');
  process.exit(1);
}

// Position du return problématique
const returnPos = content.indexOf(returnMatch[0], afterResetAllFilters);

// Trouver la fin du composant DataTable (export default DataTable)
const exportPattern = /export default DataTable;/;
const exportMatch = content.match(exportPattern);

if (!exportMatch) {
  console.error('Impossible de trouver export default DataTable');
  process.exit(1);
}

// Position de l'export
const exportPos = content.indexOf(exportMatch[0]);

// Extraire le contenu du return jusqu'à la fin du composant
const returnContent = content.substring(returnPos, exportPos).trim();

// Reconstruire le composant DataTable
const beforeReturn = content.substring(0, afterResetAllFilters);
const afterExport = content.substring(exportPos);

// Nouveau contenu avec le return correctement placé à l'intérieur de la fonction DataTable
const newContent = `${beforeReturn}

  // Calculer les données à afficher en fonction de la pagination
  const displayedData = useMemo(() => {
    setTotalRows(filteredData.length);
    return filteredData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }, [filteredData, page, rowsPerPage]);

  ${returnContent}
};

${afterExport}`;

// Écrire le contenu corrigé dans le fichier
fs.writeFileSync(dataTablePath, newContent);
console.log(`Fichier ${dataTablePath} corrigé avec succès!`);

console.log('Veuillez redémarrer l\'application frontend pour appliquer les corrections.');
