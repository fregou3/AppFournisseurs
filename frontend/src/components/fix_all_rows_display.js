/**
 * Script pour s'assurer que la totalité des 6688 lignes s'affichent dans les tableaux
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

// 1. Modifier Home.js pour récupérer toutes les lignes en une seule requête
const fetchDataPattern = /const fetchData = async[^{]*{[\s\S]+?setLoading\(false\);[\s\S]+?};/;
const newFetchData = `const fetchData = async (tableName) => {
    setLoading(true);
    setError(null);
    try {
      // Utiliser une grande taille de page pour récupérer toutes les lignes en une seule requête
      const url = tableName === 'fournisseurs' 
        ? \`\${config.apiUrl}/fournisseurs?pageSize=10000\` 
        : \`\${config.apiUrl}/fournisseurs/table/\${tableName}?pageSize=10000\`;
      
      console.log('Fetching all data from:', url);
      const response = await axios.get(url);
      console.log('Response received:', response.data);
      
      // S'assurer que data est toujours un tableau
      let allData = [];
      
      if (response.data && Array.isArray(response.data.data)) {
        // Format avec pagination
        allData = response.data.data;
        console.log(\`Données récupérées (format paginé): \${allData.length} lignes\`);
      } else if (Array.isArray(response.data)) {
        // Format tableau simple
        allData = response.data;
        console.log(\`Données récupérées (format tableau): \${allData.length} lignes\`);
      } else if (response.data && typeof response.data === 'object') {
        // Si c'est un objet mais pas un tableau, essayer de le convertir
        try {
          allData = Object.values(response.data);
          console.log(\`Données récupérées (format objet): \${allData.length} lignes\`);
        } catch (e) {
          console.error('Impossible de convertir les données en tableau:', e);
          allData = [];
        }
      } else {
        console.error('Format de données non reconnu:', response.data);
        allData = [];
      }
      
      console.log(\`Total des données récupérées: \${allData.length} lignes\`);
      setData(Array.isArray(allData) ? allData : []);
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
  console.log('Fonction fetchData modifiée dans Home.js pour récupérer toutes les lignes');
} else {
  console.log('Pattern de fonction fetchData non trouvé dans Home.js');
}

// 2. Modifier DataTable.js pour afficher toutes les lignes
// Augmenter les options de lignes par page pour inclure des valeurs plus élevées
const rowsPerPageOptionsPattern = /rowsPerPageOptions=\{[^}]+\}/;
const newRowsPerPageOptions = 'rowsPerPageOptions={[10, 25, 50, 100, 250, 500, 1000, 5000, 10000]}';

if (dataTableContent.match(rowsPerPageOptionsPattern)) {
  dataTableContent = dataTableContent.replace(rowsPerPageOptionsPattern, newRowsPerPageOptions);
  console.log('Options de lignes par page modifiées dans DataTable.js');
} else {
  console.log('Pattern d\'options de lignes par page non trouvé dans DataTable.js');
}

// Augmenter la valeur par défaut de rowsPerPage
const rowsPerPagePattern = /const \[rowsPerPage, setRowsPerPage\] = useState\(10\);/;
const newRowsPerPage = 'const [rowsPerPage, setRowsPerPage] = useState(100);';

if (dataTableContent.match(rowsPerPagePattern)) {
  dataTableContent = dataTableContent.replace(rowsPerPagePattern, newRowsPerPage);
  console.log('Valeur par défaut de rowsPerPage modifiée dans DataTable.js');
} else {
  console.log('Pattern de rowsPerPage non trouvé dans DataTable.js');
}

// Ajouter un message indiquant le nombre total de lignes
const tablePaginationPattern = /<TablePagination[\s\S]+?\/>/;
const newTablePagination = (match) => {
  if (match.includes('labelDisplayedRows')) {
    return match.replace(
      /labelDisplayedRows=\{[^}]+\}/,
      'labelDisplayedRows={({ from, to, count }) => `Affichage de ${from} à ${to} sur ${count} lignes (total: ${filteredData.length})`}'
    );
  } else {
    return match.replace(
      '/>',
      'labelDisplayedRows={({ from, to, count }) => `Affichage de ${from} à ${to} sur ${count} lignes (total: ${filteredData.length})`} />'
    );
  }
};

if (dataTableContent.match(tablePaginationPattern)) {
  dataTableContent = dataTableContent.replace(tablePaginationPattern, newTablePagination);
  console.log('Message de pagination modifié dans DataTable.js');
} else {
  console.log('Pattern de TablePagination non trouvé dans DataTable.js');
}

// Ajouter un bouton pour afficher toutes les lignes
const tableContainerEndPattern = /<\/TableContainer>/;
const showAllRowsButton = `</TableContainer>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1, mb: 1 }}>
          <Button 
            variant="contained" 
            color="primary" 
            size="small"
            onClick={() => {
              setRowsPerPage(filteredData.length);
              setPage(0);
            }}
          >
            Afficher toutes les lignes
          </Button>
        </Box>`;

if (dataTableContent.match(tableContainerEndPattern)) {
  dataTableContent = dataTableContent.replace(tableContainerEndPattern, showAllRowsButton);
  console.log('Bouton "Afficher toutes les lignes" ajouté dans DataTable.js');
} else {
  console.log('Pattern de fin de TableContainer non trouvé dans DataTable.js');
}

// S'assurer que le bouton est importé
const importButtonPattern = /import {[^}]*} from '@mui\/material';/;
if (dataTableContent.match(importButtonPattern)) {
  if (!dataTableContent.includes('Button,')) {
    dataTableContent = dataTableContent.replace(importButtonPattern, (match) => {
      return match.replace('{', '{ Button,');
    });
    console.log('Import de Button ajouté dans DataTable.js');
  }
}

// Écrire les modifications dans les fichiers
fs.writeFileSync(homePath, homeContent);
fs.writeFileSync(dataTablePath, dataTableContent);
console.log('Fichiers modifiés avec succès!');

console.log('Veuillez redémarrer l\'application frontend pour appliquer les modifications.');
