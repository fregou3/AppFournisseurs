/**
 * Script pour corriger l'erreur de variable paginatedData déjà déclarée dans DataTable.js
 */

const fs = require('fs');
const path = require('path');

// Chemin du fichier DataTable.js
const dataTablePath = path.join(__dirname, 'DataTable.js');
console.log(`Lecture du fichier ${dataTablePath}...`);
let content = fs.readFileSync(dataTablePath, 'utf8');

// Créer une sauvegarde du fichier
const backupPath = `${dataTablePath}.backup.${Date.now()}`;
fs.writeFileSync(backupPath, content);
console.log(`Sauvegarde créée: ${backupPath}`);

// 1. Trouver toutes les déclarations de paginatedData
const paginatedDataDeclarations = content.match(/const paginatedData = useMemo\(\(\) => \{[\s\S]+?\}, \[[^\]]+\]\);/g) || [];

console.log(`Nombre de déclarations de paginatedData trouvées: ${paginatedDataDeclarations.length}`);

if (paginatedDataDeclarations.length > 1) {
  // Garder seulement la première déclaration
  const firstDeclaration = paginatedDataDeclarations[0];
  
  // Supprimer les autres déclarations
  for (let i = 1; i < paginatedDataDeclarations.length; i++) {
    content = content.replace(paginatedDataDeclarations[i], '');
    console.log(`Déclaration ${i+1} de paginatedData supprimée`);
  }
}

// 2. Vérifier s'il y a d'autres variables déclarées en double
const memoDeclarations = content.match(/const [^=]+ = useMemo\(\(\) => \{[\s\S]+?\}, \[[^\]]+\]\);/g) || [];
const memoNames = new Set();
const duplicates = [];

memoDeclarations.forEach(declaration => {
  const match = declaration.match(/const ([^=]+) =/);
  if (match && match[1]) {
    const memoName = match[1].trim();
    if (memoNames.has(memoName)) {
      duplicates.push(memoName);
    } else {
      memoNames.add(memoName);
    }
  }
});

if (duplicates.length > 0) {
  console.log('Autres variables useMemo déclarées en double:', duplicates);
  
  // Supprimer les déclarations en double
  duplicates.forEach(duplicate => {
    const duplicatePattern = new RegExp(`const ${duplicate} = useMemo\\(\\(\\) => \\{[\\s\\S]+?\\}, \\[[^\\]]+\\]\\);`);
    let found = false;
    content = content.replace(duplicatePattern, match => {
      if (found) return '';
      found = true;
      return match;
    });
  });
}

// 3. Restaurer le DataTable.js à un état fonctionnel si nécessaire
// Si nous avons trop de problèmes, mieux vaut repartir de la sauvegarde d'origine
const originalBackupPath = path.join(__dirname, 'DataTable.js.backup.1745480689489');
if (fs.existsSync(originalBackupPath)) {
  console.log('Restauration à partir de la sauvegarde d\'origine...');
  let originalContent = fs.readFileSync(originalBackupPath, 'utf8');
  
  // Ajouter la pagination à la version d'origine
  const tableContainerEndPattern = /<\/TableContainer>/;
  const tablePaginationComponent = `</TableContainer>
        <TablePagination
          rowsPerPageOptions={[10, 25, 50, 100, 250, 500]}
          component="div"
          count={filteredData.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(event, newPage) => setPage(newPage)}
          onRowsPerPageChange={(event) => {
            setRowsPerPage(parseInt(event.target.value, 10));
            setPage(0);
          }}
          labelRowsPerPage="Lignes par page:"
          labelDisplayedRows={({ from, to, count }) => 
            \`Affichage de \${from} à \${to} sur \${count} lignes\`
          }
        />`;
  
  originalContent = originalContent.replace(tableContainerEndPattern, tablePaginationComponent);
  
  // Remplacer filteredData.map par paginatedData.map dans le rendu
  const paginatedDataFunction = `
  // Calculer les données à afficher en fonction de la pagination
  const paginatedData = useMemo(() => {
    const start = page * rowsPerPage;
    return filteredData.slice(start, start + rowsPerPage);
  }, [filteredData, page, rowsPerPage]);`;
  
  // Ajouter la fonction paginatedData après filteredData
  const afterFilteredDataPattern = /const filteredData = useMemo\(\(\) => \{[\s\S]+?\}, \[[^\]]+\]\);/;
  originalContent = originalContent.replace(
    afterFilteredDataPattern,
    `$&${paginatedDataFunction}`
  );
  
  // Remplacer filteredData.map par paginatedData.map dans le rendu
  originalContent = originalContent.replace(
    /filteredData\.map\(\(row, index\) =>/g,
    'paginatedData.map((row, index) =>'
  );
  
  // Écrire le contenu restauré dans le fichier
  fs.writeFileSync(dataTablePath, originalContent);
  console.log('Fichier restauré et pagination ajoutée');
} else {
  // Écrire le contenu modifié dans le fichier
  fs.writeFileSync(dataTablePath, content);
  console.log(`Fichier ${dataTablePath} corrigé avec succès!`);
}

console.log('Veuillez redémarrer l\'application frontend pour appliquer les corrections.');
