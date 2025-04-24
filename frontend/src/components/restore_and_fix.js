/**
 * Script pour restaurer une version fonctionnelle et assurer l'affichage de toutes les lignes
 */

const fs = require('fs');
const path = require('path');

// Chemins des fichiers
const homePath = path.join(__dirname, 'Home.js');
const dataTablePath = path.join(__dirname, 'DataTable.js');

console.log('Recherche des sauvegardes les plus récentes...');

// Trouver les sauvegardes les plus anciennes (avant nos modifications)
const homeBackups = fs.readdirSync(__dirname)
  .filter(file => file.startsWith('Home.js.backup.'))
  .sort();

const dataTableBackups = fs.readdirSync(__dirname)
  .filter(file => file.startsWith('DataTable.js.backup.'))
  .sort();

// Utiliser les sauvegardes les plus anciennes
const oldestHomeBackup = homeBackups[0];
const oldestDataTableBackup = dataTableBackups[0];

if (!oldestHomeBackup || !oldestDataTableBackup) {
  console.error('Sauvegardes non trouvées!');
  process.exit(1);
}

console.log(`Utilisation des sauvegardes: ${oldestHomeBackup} et ${oldestDataTableBackup}`);

// Lire les contenus des sauvegardes
let homeContent = fs.readFileSync(path.join(__dirname, oldestHomeBackup), 'utf8');
let dataTableContent = fs.readFileSync(path.join(__dirname, oldestDataTableBackup), 'utf8');

// Créer de nouvelles sauvegardes des fichiers actuels
const newHomeBackupPath = `${homePath}.backup.${Date.now()}`;
const newDataTableBackupPath = `${dataTablePath}.backup.${Date.now()}`;
fs.writeFileSync(newHomeBackupPath, fs.readFileSync(homePath, 'utf8'));
fs.writeFileSync(newDataTableBackupPath, fs.readFileSync(dataTablePath, 'utf8'));
console.log('Nouvelles sauvegardes créées');

// Modifier le contenu de Home.js pour récupérer toutes les lignes
// 1. Modifier la fonction fetchData pour utiliser pageSize=10000
const fetchDataPattern = /const fetchData = async \(tableName, page = \d+, size = \d+\) => \{[\s\S]+?finally \{[\s\S]+?\}/;
const newFetchData = `const fetchData = async (tableName, page = 0, size = 10) => {
    setLoading(true);
    setError(null);
    try {
      // Utiliser une taille de page très grande pour récupérer toutes les données
      const url = tableName === 'fournisseurs' 
        ? \`\${config.apiUrl}/fournisseurs?page=1&pageSize=10000\` 
        : \`\${config.apiUrl}/fournisseurs/table/\${tableName}?page=1&pageSize=10000\`;
      
      console.log('Fetching data from:', url);
      const response = await axios.get(url);
      console.log('Response received:', response.data);
      
      if (response.data && Array.isArray(response.data.data)) {
        // Format avec pagination
        setData(response.data.data);
        
        if (response.data.pagination) {
          setTotalRows(response.data.pagination.totalRows || response.data.data.length);
          setTotalPages(response.data.pagination.totalPages || Math.ceil(response.data.data.length / size));
          setCurrentPage(page);
          setPageSize(size);
        }
      } else if (Array.isArray(response.data)) {
        // Format tableau simple
        setData(response.data);
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
      setData([]);
      setTotalRows(0);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  };`;

if (homeContent.match(fetchDataPattern)) {
  homeContent = homeContent.replace(fetchDataPattern, newFetchData);
  console.log('Fonction fetchData modifiée dans Home.js');
}

// 2. Modifier DataTable.js pour ajouter la pagination
// Ajouter le composant TablePagination à la fin du tableau
const tableContainerEndPattern = /<\/TableContainer>/;
const tablePaginationComponent = `</TableContainer>
        <TablePagination
          rowsPerPageOptions={[10, 25, 50, 100, 250, 500]}
          component="div"
          count={data.length}
          rowsPerPage={10}
          page={0}
          onPageChange={(event, newPage) => {}}
          onRowsPerPageChange={(event) => {}}
          labelRowsPerPage="Lignes par page:"
          labelDisplayedRows={({ from, to, count }) => 
            \`Affichage de \${from} à \${to} sur \${count} lignes\`
          }
        />`;

dataTableContent = dataTableContent.replace(tableContainerEndPattern, tablePaginationComponent);
console.log('Composant TablePagination ajouté à DataTable.js');

// Écrire les contenus modifiés dans les fichiers
fs.writeFileSync(homePath, homeContent);
fs.writeFileSync(dataTablePath, dataTableContent);
console.log('Fichiers restaurés et modifiés avec succès!');

console.log('Veuillez redémarrer l\'application frontend pour appliquer les modifications.');
