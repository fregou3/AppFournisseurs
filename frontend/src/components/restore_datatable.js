/**
 * Script pour restaurer DataTable.js à partir de la sauvegarde et ajouter la pagination
 */

const fs = require('fs');
const path = require('path');

// Chemin du fichier DataTable.js et de sa sauvegarde
const dataTablePath = path.join(__dirname, 'DataTable.js');
const backupPath = path.join(__dirname, 'DataTable.js.backup.1745480689489');

// Vérifier si la sauvegarde existe
if (!fs.existsSync(backupPath)) {
  console.error(`Le fichier de sauvegarde ${backupPath} n'existe pas.`);
  process.exit(1);
}

// Lire le contenu de la sauvegarde
console.log(`Lecture du fichier de sauvegarde ${backupPath}...`);
let content = fs.readFileSync(backupPath, 'utf8');

// Créer une nouvelle sauvegarde du fichier actuel
const newBackupPath = `${dataTablePath}.backup.${Date.now()}`;
if (fs.existsSync(dataTablePath)) {
  fs.writeFileSync(newBackupPath, fs.readFileSync(dataTablePath, 'utf8'));
  console.log(`Nouvelle sauvegarde créée: ${newBackupPath}`);
}

// Modifier le contenu pour ajouter la pagination
console.log('Ajout de la pagination...');

// 1. Ajouter la déclaration de totalRows si elle n'existe pas déjà
if (!content.includes('const [totalRows, setTotalRows] = useState(0);')) {
  const rowsPerPagePattern = /const \[rowsPerPage, setRowsPerPage\] = useState\(10\);/;
  if (content.match(rowsPerPagePattern)) {
    content = content.replace(
      rowsPerPagePattern,
      'const [rowsPerPage, setRowsPerPage] = useState(10);\n  const [totalRows, setTotalRows] = useState(0);'
    );
    console.log('État totalRows ajouté');
  }
}

// 2. Ajouter ou modifier la fonction de pagination
const paginatedDataPattern = /const paginatedData = useMemo\(\(\) => \{[\s\S]+?\}, \[filteredData, page, rowsPerPage\]\);/;
const newPaginatedData = `const paginatedData = useMemo(() => {
    // Mettre à jour le nombre total de lignes
    setTotalRows(filteredData.length);
    const start = page * rowsPerPage;
    return filteredData.slice(start, start + rowsPerPage);
  }, [filteredData, page, rowsPerPage]);`;

if (content.match(paginatedDataPattern)) {
  content = content.replace(paginatedDataPattern, newPaginatedData);
  console.log('Fonction paginatedData modifiée');
} else {
  // Ajouter après la déclaration des états
  const afterStatesPattern = /const \[snackbar, setSnackbar\] = useState\(\{ open: false, message: '', severity: 'success' \}\);/;
  content = content.replace(
    afterStatesPattern,
    `const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });\n\n  ${newPaginatedData}`
  );
  console.log('Fonction paginatedData ajoutée');
}

// 3. Ajouter le composant TablePagination s'il n'existe pas déjà
if (!content.includes('TablePagination')) {
  const endOfTablePattern = /<\/Table>\s*\n\s*<\/TableContainer>/;
  const tablePaginationComponent = `</Table>
        <TablePagination
          rowsPerPageOptions={[10, 25, 50, 100, 250, 500]}
          component="div"
          count={totalRows}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(event, newPage) => setPage(newPage)}
          onRowsPerPageChange={(event) => {
            setRowsPerPage(parseInt(event.target.value, 10));
            setPage(0);
          }}
          labelRowsPerPage="Lignes par page:"
          labelDisplayedRows={({ from, to, count }) => \`\${from}-\${to} sur \${count}\`}
        />
      </TableContainer>`;

  content = content.replace(endOfTablePattern, tablePaginationComponent);
  console.log('Composant TablePagination ajouté');
}

// 4. S'assurer que paginatedData est utilisé au lieu de filteredData dans le rendu
const filteredDataMapPattern = /filteredData\.map\(\(row, index\) => \(/g;
if (content.includes('paginatedData')) {
  content = content.replace(filteredDataMapPattern, 'paginatedData.map((row, index) => (');
  console.log('Boucle de rendu modifiée pour utiliser paginatedData');
}

// Écrire le contenu modifié dans le fichier
fs.writeFileSync(dataTablePath, content);
console.log(`Fichier ${dataTablePath} restauré et modifié avec succès!`);

console.log('Veuillez redémarrer l\'application frontend pour appliquer les modifications.');
