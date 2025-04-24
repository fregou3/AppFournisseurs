/**
 * Script pour restaurer l'approche de la version 3.5 qui fonctionnait correctement
 * pour afficher les tableaux avec toutes les lignes
 */

const fs = require('fs');
const path = require('path');

// Chemins des fichiers
const homePath = path.join(__dirname, 'Home.js');
const dataTablePath = path.join(__dirname, 'DataTable.js');

console.log('Lecture des fichiers...');
let homeContent = fs.readFileSync(homePath, 'utf8');
let dataTableContent = fs.readFileSync(dataTablePath, 'utf8');

// Créer des sauvegardes
const homeBackupPath = `${homePath}.backup.${Date.now()}`;
const dataTableBackupPath = `${dataTablePath}.backup.${Date.now()}`;
fs.writeFileSync(homeBackupPath, homeContent);
fs.writeFileSync(dataTableBackupPath, dataTableContent);
console.log('Sauvegardes créées');

// Modifier Home.js pour utiliser l'approche de la version 3.5
// 1. Simplifier la fonction fetchData pour qu'elle récupère toutes les données en une seule requête
const fetchDataPattern = /const fetchData = async \([^)]*\) => \{[\s\S]+?finally \{[\s\S]+?\}/;
const newFetchData = `const fetchData = async (tableName) => {
    setLoading(true);
    setError(null);
    try {
      // Si le nom de la table est 'fournisseurs', utiliser la route standard
      // Sinon, utiliser une route spécifique pour la table sélectionnée
      const url = tableName === 'fournisseurs' 
        ? \`\${config.apiUrl}/fournisseurs\` 
        : \`\${config.apiUrl}/fournisseurs/table/\${tableName}\`;
      
      console.log('Fetching data from:', url);
      const response = await axios.get(url);
      console.log('Response received:', response.data);
      
      let allData = [];
      
      if (response.data && Array.isArray(response.data.data)) {
        // Format avec pagination
        allData = response.data.data;
      } else if (Array.isArray(response.data)) {
        // Format tableau simple
        allData = response.data;
      } else {
        console.error('Format de données non reconnu:', response.data);
        allData = [];
      }
      
      console.log(\`Données récupérées: \${allData.length} lignes\`);
      setData(allData);
    } catch (error) {
      console.error(\`Erreur lors du chargement des données de la table \${tableName}:\`, error);
      setError(\`Erreur lors du chargement des données de la table \${tableName}\`);
      setData([]);
    } finally {
      setLoading(false);
    }
  };`;

if (homeContent.match(fetchDataPattern)) {
  homeContent = homeContent.replace(fetchDataPattern, newFetchData);
  console.log('Fonction fetchData modifiée dans Home.js');
} else {
  console.log('Impossible de trouver la fonction fetchData dans Home.js');
}

// 2. Simplifier le rendu du DataTable pour utiliser l'approche de la version 3.5
const dataTableRenderPattern = /<DataTable[\s\S]+?\/>/;
const newDataTableRender = `<DataTable 
        data={data} 
        externalFilters={filters}
        setExternalFilters={setFilters}
        externalVisibleColumns={visibleColumns}
        setExternalVisibleColumns={setVisibleColumns}
        onDataUpdate={(updatedData) => setData(updatedData)}
        tableName={selectedTable}
      />`;

if (homeContent.match(dataTableRenderPattern)) {
  homeContent = homeContent.replace(dataTableRenderPattern, newDataTableRender);
  console.log('Rendu du DataTable modifié dans Home.js');
} else {
  console.log('Impossible de trouver le rendu du DataTable dans Home.js');
}

// Modifier DataTable.js pour s'assurer que la pagination fonctionne correctement
// 1. S'assurer que les états de pagination sont correctement définis
const paginationStatesPattern = /const \[page, setPage\] = useState\(0\);[\s\S]+?const \[rowsPerPage, setRowsPerPage\] = useState\(10\);/;
const newPaginationStates = `const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);`;

if (dataTableContent.match(paginationStatesPattern)) {
  dataTableContent = dataTableContent.replace(paginationStatesPattern, newPaginationStates);
  console.log('États de pagination modifiés dans DataTable.js');
} else {
  console.log('États de pagination déjà corrects dans DataTable.js');
}

// 2. S'assurer que les données paginées sont correctement calculées
const paginatedDataPattern = /const paginatedData = useMemo\(\(\) => \{[\s\S]+?\}, \[[^\]]+\]\);/;
const newPaginatedData = `const paginatedData = useMemo(() => {
    const start = page * rowsPerPage;
    return filteredData.slice(start, start + rowsPerPage);
  }, [filteredData, page, rowsPerPage]);`;

if (dataTableContent.match(paginatedDataPattern)) {
  dataTableContent = dataTableContent.replace(paginatedDataPattern, newPaginatedData);
  console.log('Calcul des données paginées modifié dans DataTable.js');
} else {
  console.log('Calcul des données paginées déjà correct dans DataTable.js');
}

// 3. S'assurer que la TablePagination est correctement rendue
const tablePaginationPattern = /<TablePagination[\s\S]+?\/>/;
const newTablePagination = `<TablePagination
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

if (dataTableContent.match(tablePaginationPattern)) {
  dataTableContent = dataTableContent.replace(tablePaginationPattern, newTablePagination);
  console.log('TablePagination modifiée dans DataTable.js');
} else {
  // Si le pattern n'est pas trouvé, ajouter la TablePagination à la fin du composant
  const tableContainerEndPattern = /<\/TableContainer>/;
  if (dataTableContent.match(tableContainerEndPattern)) {
    dataTableContent = dataTableContent.replace(
      tableContainerEndPattern,
      `</TableContainer>\n        ${newTablePagination}`
    );
    console.log('TablePagination ajoutée à DataTable.js');
  } else {
    console.log('Impossible de trouver l\'endroit pour ajouter la TablePagination dans DataTable.js');
  }
}

// Écrire les modifications dans les fichiers
fs.writeFileSync(homePath, homeContent);
fs.writeFileSync(dataTablePath, dataTableContent);
console.log('Fichiers modifiés avec succès!');

console.log('Veuillez redémarrer l\'application frontend pour appliquer les modifications.');
