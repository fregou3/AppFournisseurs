/**
 * Script pour corriger directement la pagination dans Home.js et DataTable.js
 * Cette approche plus directe modifie les deux composants pour s'assurer que la pagination fonctionne
 */

const fs = require('fs');
const path = require('path');

// Chemin des fichiers
const homePath = path.join(__dirname, 'Home.js');
const dataTablePath = path.join(__dirname, 'DataTable.js');

console.log(`Lecture des fichiers...`);
let homeContent = fs.readFileSync(homePath, 'utf8');
let dataTableContent = fs.readFileSync(dataTablePath, 'utf8');

// Créer des sauvegardes
const homeBackupPath = `${homePath}.backup.${Date.now()}`;
const dataTableBackupPath = `${dataTablePath}.backup.${Date.now()}`;
fs.writeFileSync(homeBackupPath, homeContent);
fs.writeFileSync(dataTableBackupPath, dataTableContent);
console.log(`Sauvegardes créées`);

// ========== MODIFICATION DE HOME.JS ==========

// 1. Simplifier complètement la fonction fetchData
const fetchDataPattern = /const fetchData = async \(tableName, page = currentPage, size = pageSize\) => \{[\s\S]+?finally \{[\s\S]+?\}/;
const newFetchData = `const fetchData = async (tableName, page = 0, size = 10) => {
    console.log('=== DÉBUT FETCHDATA ===');
    setLoading(true);
    setError(null);
    try {
      // Forcer une taille de page très grande pour récupérer toutes les données
      const fetchSize = 10000;
      
      // Construire l'URL avec une grande taille de page
      const url = tableName === 'fournisseurs' 
        ? \`\${config.apiUrl}/fournisseurs?page=1&pageSize=\${fetchSize}\` 
        : \`\${config.apiUrl}/fournisseurs/table/\${tableName}?page=1&pageSize=\${fetchSize}\`;
      
      console.log('URL de requête:', url);
      const response = await axios.get(url);
      
      let allData = [];
      if (response.data && Array.isArray(response.data.data)) {
        // Format avec pagination explicite
        allData = response.data.data;
      } else if (Array.isArray(response.data)) {
        // Format tableau simple
        allData = response.data;
      } else {
        console.error('Format de données non reconnu');
        allData = [];
      }
      
      console.log(\`Données récupérées: \${allData.length} lignes\`);
      
      // Mettre à jour les états
      setData(allData);
      setTotalRows(allData.length);
      setTotalPages(Math.ceil(allData.length / size));
      setCurrentPage(0);
      setPageSize(size);
    } catch (error) {
      console.error(\`Erreur lors du chargement des données:\`, error);
      setError(\`Erreur lors du chargement des données\`);
      setData([]);
      setTotalRows(0);
      setTotalPages(0);
    } finally {
      setLoading(false);
      console.log('=== FIN FETCHDATA ===');
    }
  };`;

homeContent = homeContent.replace(fetchDataPattern, newFetchData);

// 2. Simplifier le rendu du DataTable
const dataTablePattern = /<DataTable[\s\S]+?\/>/;
const newDataTable = `<DataTable
            data={data}
            tableName={selectedTable}
            page={currentPage}
            rowsPerPage={pageSize}
            totalRows={totalRows}
            onPageChange={handlePageChange}
            onRowsPerPageChange={handlePageSizeChange}
          />`;

homeContent = homeContent.replace(dataTablePattern, newDataTable);

// 3. Supprimer la pagination de Home.js pour la laisser entièrement à DataTable
const paginationPattern = /<TablePagination[\s\S]+?\/>/;
if (homeContent.match(paginationPattern)) {
  homeContent = homeContent.replace(paginationPattern, '');
  console.log('Pagination supprimée de Home.js');
}

// ========== MODIFICATION DE DATATABLE.JS ==========

// 1. S'assurer que les props de pagination sont correctement reçues
const dataTablePropsPattern = /const DataTable = \(\{[\s\S]+?\}\) => \{/;
const newDataTableProps = `const DataTable = ({ 
  data = [], 
  isGroupView = false,
  externalFilters,
  setExternalFilters,
  externalVisibleColumns,
  setExternalVisibleColumns,
  onDataUpdate,
  tableName: propTableName,
  page: externalPage,
  rowsPerPage: externalRowsPerPage,
  totalRows: externalTotalRows,
  onPageChange: externalOnPageChange,
  onRowsPerPageChange: externalOnRowsPerPageChange
}) => {`;

dataTableContent = dataTableContent.replace(dataTablePropsPattern, newDataTableProps);

// 2. Modifier la déclaration des états de pagination pour utiliser les props externes si disponibles
const paginationStatesPattern = /const \[page, setPage\] = useState\(0\);\s*const \[rowsPerPage, setRowsPerPage\] = useState\(10\);/;
const newPaginationStates = `const [page, setPage] = useState(externalPage !== undefined ? externalPage : 0);
  const [rowsPerPage, setRowsPerPage] = useState(externalRowsPerPage !== undefined ? externalRowsPerPage : 10);
  const [internalTotalRows, setInternalTotalRows] = useState(0);
  
  // Utiliser les props externes si disponibles, sinon utiliser les états internes
  const totalRows = externalTotalRows !== undefined ? externalTotalRows : internalTotalRows;`;

if (dataTableContent.match(paginationStatesPattern)) {
  dataTableContent = dataTableContent.replace(paginationStatesPattern, newPaginationStates);
  console.log('États de pagination modifiés dans DataTable.js');
}

// 3. Modifier les gestionnaires de pagination pour utiliser les callbacks externes si disponibles
const handleChangePagePattern = /const handleChangePage = \(event, newPage\) => \{[\s\S]+?\};/;
const newHandleChangePage = `const handleChangePage = (event, newPage) => {
    if (externalOnPageChange) {
      externalOnPageChange(event, newPage);
    } else {
      setPage(newPage);
    }
  };`;

if (dataTableContent.match(handleChangePagePattern)) {
  dataTableContent = dataTableContent.replace(handleChangePagePattern, newHandleChangePage);
  console.log('handleChangePage modifié dans DataTable.js');
}

const handleChangeRowsPerPagePattern = /const handleChangeRowsPerPage = \(event\) => \{[\s\S]+?\};/;
const newHandleChangeRowsPerPage = `const handleChangeRowsPerPage = (event) => {
    const newSize = parseInt(event.target.value, 10);
    if (externalOnRowsPerPageChange) {
      externalOnRowsPerPageChange(event);
    } else {
      setRowsPerPage(newSize);
      setPage(0);
    }
  };`;

if (dataTableContent.match(handleChangeRowsPerPagePattern)) {
  dataTableContent = dataTableContent.replace(handleChangeRowsPerPagePattern, newHandleChangeRowsPerPage);
  console.log('handleChangeRowsPerPage modifié dans DataTable.js');
}

// 4. Ajouter une fonction pour paginer les données côté client
const afterFilteredDataPattern = /const filteredData = useMemo\(\(\) => \{[\s\S]+?\}, \[[^\]]+\]\);/;
const paginatedDataFunction = `
  // Paginer les données côté client
  const paginatedData = useMemo(() => {
    // Mettre à jour le nombre total de lignes
    if (!externalTotalRows) {
      setInternalTotalRows(filteredData.length);
    }
    
    // Calculer les indices de début et de fin pour la pagination
    const startIndex = page * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    
    // Découper les données pour n'afficher que la page actuelle
    return filteredData.slice(startIndex, endIndex);
  }, [filteredData, page, rowsPerPage, externalTotalRows]);
  
  // Log pour le débogage
  useEffect(() => {
    console.log('DataTable - Pagination:', {
      totalRows: totalRows,
      filteredDataLength: filteredData.length,
      paginatedDataLength: paginatedData.length,
      page: page,
      rowsPerPage: rowsPerPage
    });
  }, [totalRows, filteredData, paginatedData, page, rowsPerPage]);`;

if (dataTableContent.match(afterFilteredDataPattern)) {
  dataTableContent = dataTableContent.replace(
    afterFilteredDataPattern,
    `${afterFilteredDataPattern}${paginatedDataFunction}`
  );
  console.log('Fonction paginatedData ajoutée dans DataTable.js');
}

// 5. Modifier le rendu pour utiliser paginatedData au lieu de filteredData
const tableBodyPattern = /<TableBody>[\s\S]+?<\/TableBody>/;
const newTableBody = `<TableBody>
              {paginatedData.map((row, index) => (
                <TableRow
                  key={row.id || index}
                  sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                >
                  {Array.from(visibleColumns).map((column) => (
                    <TableCell 
                      key={column} 
                      align={getColumnAlignment(column)}
                      sx={getCellStyle(row, column)}
                    >
                      {renderCell(row, column)}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
              {paginatedData.length === 0 && (
                <TableRow>
                  <TableCell colSpan={visibleColumns.size} align="center">
                    Aucune donnée disponible
                  </TableCell>
                </TableRow>
              )}
            </TableBody>`;

dataTableContent = dataTableContent.replace(tableBodyPattern, newTableBody);

// 6. Ajouter la pagination au bas du tableau
const tableContainerEndPattern = /<\/TableContainer>/;
const tablePaginationComponent = `</TableContainer>
        <TablePagination
          rowsPerPageOptions={[10, 25, 50, 100, 250, 500]}
          component="div"
          count={totalRows}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Lignes par page:"
          labelDisplayedRows={({ from, to, count }) => 
            \`Affichage de \${from} à \${to} sur \${count} lignes\`
          }
        />`;

dataTableContent = dataTableContent.replace(tableContainerEndPattern, tablePaginationComponent);

// Écrire les contenus modifiés dans les fichiers
fs.writeFileSync(homePath, homeContent);
fs.writeFileSync(dataTablePath, dataTableContent);
console.log(`Fichiers modifiés avec succès!`);

console.log('Veuillez redémarrer l\'application frontend pour appliquer les modifications.');
