/**
 * Script pour ajouter les contrôles de pagination à l'interface utilisateur
 */

const fs = require('fs');
const path = require('path');

// Chemin du fichier Home.js à modifier
const homePath = path.join(__dirname, 'Home.js');

// Lire le contenu du fichier
console.log(`Lecture du fichier ${homePath}...`);
let content = fs.readFileSync(homePath, 'utf8');

// Créer une sauvegarde du fichier
const backupPath = `${homePath}.backup.${Date.now()}`;
fs.writeFileSync(backupPath, content);
console.log(`Sauvegarde créée: ${backupPath}`);

// Ajouter les états pour la pagination
const statePattern = /const \[visibleColumns, setVisibleColumns\] = useState\(new Set\(\)\);/;
const newState = `const [visibleColumns, setVisibleColumns] = useState(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [totalRows, setTotalRows] = useState(0);
  const [totalPages, setTotalPages] = useState(0);`;

content = content.replace(statePattern, newState);
console.log('États de pagination ajoutés');

// Modifier la fonction fetchData pour gérer la pagination
const fetchDataPattern = /const fetchData = async \(tableName\) => \{[\s\S]+?setLoading\(false\);\s*\}\s*\};/;
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
      if (tableName === 'fournisseurs') {
        // Pour la table fournisseurs, la réponse est directement un tableau
        // Vérifier que les données sont bien un tableau
        if (Array.isArray(response.data)) {
          setData(response.data);
          // Pour la table fournisseurs, nous n'avons pas d'informations de pagination
          // Nous utilisons donc la taille du tableau comme nombre total de lignes
          setTotalRows(response.data.length);
          setTotalPages(Math.ceil(response.data.length / size));
        } else {
          console.error('Les données reçues ne sont pas un tableau:', response.data);
          setData([]);
          setTotalRows(0);
          setTotalPages(0);
        }
      } else {
        // Pour les autres tables, la réponse est un objet avec une propriété data et pagination
        if (response.data && Array.isArray(response.data.data)) {
          setData(response.data.data);
          
          // Mettre à jour les informations de pagination
          if (response.data.pagination) {
            setTotalRows(response.data.pagination.totalRows || 0);
            setTotalPages(response.data.pagination.totalPages || 0);
            setCurrentPage(response.data.pagination.page || 1);
          }
        } else {
          console.error('Les données reçues ne contiennent pas un tableau data:', response.data);
          setData([]);
          setTotalRows(0);
          setTotalPages(0);
        }
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

content = content.replace(fetchDataPattern, newFetchData);
console.log('Fonction fetchData modifiée pour gérer la pagination');

// Ajouter la fonction pour changer de page
const beforeReturnPattern = /return \(/;
const paginationFunctions = `
  // Fonction pour changer de page
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      fetchData(selectedTable, newPage, pageSize);
    }
  };

  // Fonction pour changer la taille de page
  const handlePageSizeChange = (newSize) => {
    setPageSize(newSize);
    setCurrentPage(1); // Revenir à la première page
    fetchData(selectedTable, 1, newSize);
  };

  `;

content = content.replace(beforeReturnPattern, paginationFunctions + 'return (');
console.log('Fonctions de gestion de pagination ajoutées');

// Ajouter les contrôles de pagination à l'interface
const afterDataTablePattern = /<\/DataTable>/;
const paginationControls = `</DataTable>
      
      {/* Contrôles de pagination */}
      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="body2">
            Affichage de {data.length > 0 ? (currentPage - 1) * pageSize + 1 : 0} à {Math.min(currentPage * pageSize, totalRows)} sur {totalRows} lignes
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <FormControl sx={{ minWidth: 120, mr: 2 }}>
            <InputLabel id="page-size-select-label">Lignes par page</InputLabel>
            <Select
              labelId="page-size-select-label"
              id="page-size-select"
              value={pageSize}
              label="Lignes par page"
              onChange={(e) => handlePageSizeChange(e.target.value)}
            >
              <MenuItem value={10}>10</MenuItem>
              <MenuItem value={25}>25</MenuItem>
              <MenuItem value={50}>50</MenuItem>
              <MenuItem value={100}>100</MenuItem>
              <MenuItem value={250}>250</MenuItem>
              <MenuItem value={500}>500</MenuItem>
            </Select>
          </FormControl>
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
              disabled={currentPage === totalPages}
              sx={{ minWidth: 'auto', px: 1 }}
            >
              {'>'}
            </Button>
            <Button 
              onClick={() => handlePageChange(totalPages)} 
              disabled={currentPage === totalPages}
              sx={{ minWidth: 'auto', px: 1 }}
            >
              {'>>'}
            </Button>
          </Box>
        </Box>
      </Box>`;

content = content.replace(afterDataTablePattern, paginationControls);
console.log('Contrôles de pagination ajoutés à l\'interface');

// Modifier l'effet pour mettre à jour les données lorsque la table sélectionnée change
const useEffectPattern = /useEffect\(\(\) => \{\s*if \(selectedTable\) \{\s*fetchData\(selectedTable\);[\s\S]+?\}\s*\}, \[selectedTable, savedFilterSettings\]\);/;
const newUseEffect = `useEffect(() => {
    if (selectedTable) {
      // Réinitialiser la pagination lors du changement de table
      setCurrentPage(1);
      fetchData(selectedTable, 1, pageSize);
      
      // Charger les filtres et colonnes sauvegardés pour cette table
      if (savedFilterSettings[selectedTable]) {
        setFilters(savedFilterSettings[selectedTable].filters || {});
        setVisibleColumns(savedFilterSettings[selectedTable].visibleColumns || {});
      } else {
        // Si aucun paramètre n'est sauvegardé, réinitialiser
        setFilters({});
        setVisibleColumns({});
      }
    }
  }, [selectedTable, savedFilterSettings, pageSize]);`;

content = content.replace(useEffectPattern, newUseEffect);
console.log('Effet de mise à jour des données modifié');

// Écrire le contenu modifié dans le fichier
fs.writeFileSync(homePath, content);
console.log(`Fichier ${homePath} modifié avec succès!`);

console.log('Veuillez redémarrer l\'application pour appliquer les modifications.');
