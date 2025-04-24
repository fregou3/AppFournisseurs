/**
 * Script pour intégrer la pagination dans l'interface principale
 */

const fs = require('fs');
const path = require('path');

// Modifier le composant Home.js pour ajouter les contrôles de pagination
const homePath = path.join(__dirname, 'Home.js');
console.log(`Lecture du fichier ${homePath}...`);
let homeContent = fs.readFileSync(homePath, 'utf8');

// Créer une sauvegarde du fichier Home.js
const homeBackupPath = `${homePath}.backup.${Date.now()}`;
fs.writeFileSync(homeBackupPath, homeContent);
console.log(`Sauvegarde créée: ${homeBackupPath}`);

// Modifier le composant DataTable.js pour ajouter la pagination
const dataTablePath = path.join(__dirname, 'DataTable.js');
console.log(`Lecture du fichier ${dataTablePath}...`);
let dataTableContent = fs.readFileSync(dataTablePath, 'utf8');

// Créer une sauvegarde du fichier DataTable.js
const dataTableBackupPath = `${dataTablePath}.backup.${Date.now()}`;
fs.writeFileSync(dataTableBackupPath, dataTableContent);
console.log(`Sauvegarde créée: ${dataTableBackupPath}`);

// 1. Ajouter les états de pagination dans DataTable.js
const dataTableStatePattern = /const \[snackbar, setSnackbar\] = useState\(\{ open: false, message: '', severity: 'success' \}\);/;
const newDataTableState = `const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  
  // États pour la pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalRows, setTotalRows] = useState(0);`;

dataTableContent = dataTableContent.replace(dataTableStatePattern, newDataTableState);
console.log('États de pagination ajoutés à DataTable.js');

// 2. Ajouter les fonctions de gestion de la pagination dans DataTable.js
const dataTableBeforeReturnPattern = /return \(/;
const paginationFunctions = `
  // Fonctions de gestion de la pagination
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Calculer les données à afficher en fonction de la pagination
  const displayedData = useMemo(() => {
    setTotalRows(filteredData.length);
    return filteredData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }, [filteredData, page, rowsPerPage]);

  `;

dataTableContent = dataTableContent.replace(dataTableBeforeReturnPattern, paginationFunctions + 'return (');
console.log('Fonctions de pagination ajoutées à DataTable.js');

// 3. Modifier la boucle de rendu des données dans DataTable.js pour utiliser displayedData au lieu de filteredData
const dataTableMapPattern = /filteredData\.map\(\(row, index\) => \(/g;
dataTableContent = dataTableContent.replace(dataTableMapPattern, 'displayedData.map((row, index) => (');
console.log('Boucle de rendu modifiée pour utiliser displayedData');

// 4. Ajouter le composant TablePagination à la fin du tableau dans DataTable.js
const dataTableAfterTablePattern = /<\/Table>\s*\n\s*<\/TableContainer>/;
const tablePaginationComponent = `</Table>
        <TablePagination
          rowsPerPageOptions={[10, 25, 50, 100, 250, 500]}
          component="div"
          count={totalRows}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Lignes par page:"
          labelDisplayedRows={({ from, to, count }) => \`\${from}-\${to} sur \${count}\`}
        />
      </TableContainer>`;

dataTableContent = dataTableContent.replace(dataTableAfterTablePattern, tablePaginationComponent);
console.log('Composant TablePagination ajouté à DataTable.js');

// 5. Modifier la fonction fetchData dans Home.js pour gérer la pagination côté serveur
const fetchDataPattern = /const fetchData = async \(tableName, page = currentPage, size = pageSize\) => \{[\s\S]+?setLoading\(false\);\s*\}\s*\};/;
const newFetchData = `const fetchData = async (tableName, page = currentPage, size = pageSize) => {
    setLoading(true);
    setError(null);
    try {
      // Si le nom de la table est 'fournisseurs', utiliser la route standard
      // Sinon, utiliser une route spécifique pour la table sélectionnée
      const url = tableName === 'fournisseurs' 
        ? \`\${config.apiUrl}/fournisseurs?page=\${page}&pageSize=\${size}\` 
        : \`\${config.apiUrl}/fournisseurs/table/\${tableName}?page=\${page}&pageSize=\${size}\`;
      
      console.log('Fetching data from:', url);
      const response = await axios.get(url);
      console.log('Response received:', response.data);
      
      // Traiter les données en fonction du format de réponse
      if (response.data && Array.isArray(response.data.data)) {
        // Format avec pagination explicite
        setData(response.data.data);
        
        // Mettre à jour les informations de pagination
        if (response.data.pagination) {
          setTotalRows(response.data.pagination.totalRows || 0);
          setTotalPages(response.data.pagination.totalPages || 0);
          setCurrentPage(response.data.pagination.page || 1);
          setPageSize(response.data.pagination.pageSize || size);
        }
      } else if (Array.isArray(response.data)) {
        // Format tableau simple (ancienne API)
        setData(response.data);
        // Pour la table fournisseurs, nous n'avons pas d'informations de pagination
        // Nous utilisons donc la taille du tableau comme nombre total de lignes
        setTotalRows(response.data.length);
        setTotalPages(Math.ceil(response.data.length / size));
      } else {
        console.error('Format de données non reconnu:', response.data);
        setData([]);
        setTotalRows(0);
        setTotalPages(0);
      }
    } catch (error) {
      console.error(\`Erreur lors du chargement des données de la table \${tableName}:\`, error);
      setError(\`Erreur lors du chargement des données de la table \${tableName}\`);
      // En cas d'erreur, initialiser data avec un tableau vide pour éviter l'erreur "data is not iterable"
      setData([]);
      setTotalRows(0);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  };`;

if (fetchDataPattern.test(homeContent)) {
  homeContent = homeContent.replace(fetchDataPattern, newFetchData);
  console.log('Fonction fetchData modifiée dans Home.js');
} else {
  console.log('Pattern fetchData non trouvé dans Home.js');
}

// 6. Ajouter les contrôles de pagination après le DataTable dans Home.js
const afterDataTablePattern = /<\/DataTable>\s*\n\s*<\/Box>/;
const paginationControls = `</DataTable>
      
      {/* Contrôles de pagination */}
      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="body2">
            Affichage de {data.length > 0 ? (currentPage - 1) * pageSize + 1 : 0} à {Math.min(currentPage * pageSize, totalRows)} sur {totalRows} lignes
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Button 
              onClick={() => handlePageChange(1)} 
              disabled={currentPage === 1}
              sx={{ minWidth: 'auto', px: 1 }}
            >
              {'<<'}
            </Button>
            <Button 
              onClick={() => handlePageChange(currentPage - 1)} 
              disabled={currentPage === 1}
              sx={{ minWidth: 'auto', px: 1 }}
            >
              {'<'}
            </Button>
            <Typography variant="body1" sx={{ mx: 2 }}>
              Page {currentPage} sur {totalPages}
            </Typography>
            <Button 
              onClick={() => handlePageChange(currentPage + 1)} 
              disabled={currentPage === totalPages || totalPages === 0}
              sx={{ minWidth: 'auto', px: 1 }}
            >
              {'>'}
            </Button>
            <Button 
              onClick={() => handlePageChange(totalPages)} 
              disabled={currentPage === totalPages || totalPages === 0}
              sx={{ minWidth: 'auto', px: 1 }}
            >
              {'>>'}
            </Button>
          </Box>
        </Box>
      </Box>
    </Box>`;

if (afterDataTablePattern.test(homeContent)) {
  homeContent = homeContent.replace(afterDataTablePattern, paginationControls);
  console.log('Contrôles de pagination ajoutés à Home.js');
} else {
  console.log('Pattern afterDataTable non trouvé dans Home.js');
}

// Écrire les modifications dans les fichiers
fs.writeFileSync(dataTablePath, dataTableContent);
console.log(`Fichier ${dataTablePath} modifié avec succès!`);

fs.writeFileSync(homePath, homeContent);
console.log(`Fichier ${homePath} modifié avec succès!`);

console.log('Veuillez redémarrer l\'application frontend pour appliquer les modifications.');
