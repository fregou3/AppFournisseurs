/**
 * Script pour corriger l'erreur "data is not iterable"
 * en s'assurant que toutes les opérations sur data vérifient d'abord si c'est un tableau
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

// 1. Modifier Home.js pour initialiser data comme un tableau vide
// et s'assurer que fetchData retourne toujours un tableau
const dataStatePattern = /const \[data, setData\] = useState\([^)]*\);/;
const newDataState = `const [data, setData] = useState([]);`;

if (homeContent.match(dataStatePattern)) {
  homeContent = homeContent.replace(dataStatePattern, newDataState);
  console.log('État data initialisé comme tableau vide dans Home.js');
} else {
  console.log('Pattern d\'état data non trouvé dans Home.js');
}

// Modifier la fonction fetchData pour s'assurer qu'elle retourne toujours un tableau
const fetchDataPattern = /const fetchData = async[^{]*{[\s\S]+?setLoading\(false\);[\s\S]+?};/;
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
      
      // S'assurer que data est toujours un tableau
      let allData = [];
      
      if (response.data && Array.isArray(response.data.data)) {
        // Format avec pagination
        allData = response.data.data;
      } else if (Array.isArray(response.data)) {
        // Format tableau simple
        allData = response.data;
      } else if (response.data && typeof response.data === 'object') {
        // Si c'est un objet mais pas un tableau, essayer de le convertir
        try {
          allData = Object.values(response.data);
        } catch (e) {
          console.error('Impossible de convertir les données en tableau:', e);
          allData = [];
        }
      } else {
        console.error('Format de données non reconnu:', response.data);
        allData = [];
      }
      
      console.log(\`Données récupérées: \${allData.length} lignes\`);
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
  console.log('Fonction fetchData modifiée dans Home.js');
} else {
  console.log('Pattern de fonction fetchData non trouvé dans Home.js');
}

// 2. Modifier DataTable.js pour s'assurer que toutes les opérations sur data vérifient d'abord si c'est un tableau
// Modifier la déclaration des props pour s'assurer que data est un tableau par défaut
const propsPattern = /const DataTable = \(\{[^}]*\}\) => \{/;
const newProps = `const DataTable = ({ 
  data = [], 
  isGroupView = false,
  externalFilters,
  setExternalFilters,
  externalVisibleColumns,
  setExternalVisibleColumns,
  onDataUpdate,
  tableName: propTableName
}) => {`;

if (dataTableContent.match(propsPattern)) {
  dataTableContent = dataTableContent.replace(propsPattern, newProps);
  console.log('Déclaration des props modifiée dans DataTable.js');
} else {
  console.log('Pattern de déclaration des props non trouvé dans DataTable.js');
}

// Modifier toutes les occurrences de data.map pour vérifier si data est itérable
let dataMapCount = 0;
dataTableContent = dataTableContent.replace(/data\.map/g, (match) => {
  dataMapCount++;
  return '(Array.isArray(data) ? data : []).map';
});
console.log(`${dataMapCount} occurrences de data.map remplacées dans DataTable.js`);

// Modifier toutes les occurrences de data.length pour vérifier si data est un tableau
let dataLengthCount = 0;
dataTableContent = dataTableContent.replace(/data\.length/g, (match) => {
  dataLengthCount++;
  return '(Array.isArray(data) ? data : []).length';
});
console.log(`${dataLengthCount} occurrences de data.length remplacées dans DataTable.js`);

// Modifier toutes les occurrences de Object.keys(data[0]) pour vérifier si data[0] existe
let dataKeysCount = 0;
dataTableContent = dataTableContent.replace(/Object\.keys\(data\[0\]\)/g, (match) => {
  dataKeysCount++;
  return 'Object.keys(data && data[0] ? data[0] : {})';
});
console.log(`${dataKeysCount} occurrences de Object.keys(data[0]) remplacées dans DataTable.js`);

// Modifier le calcul des données filtrées pour s'assurer que data est un tableau
const filteredDataPattern = /const filteredData = useMemo\(\(\) => \{[\s\S]+?\}, \[[^\]]+\]\);/;
const newFilteredData = `const filteredData = useMemo(() => {
    // S'assurer que data est un tableau
    let result = Array.isArray(data) ? [...data] : [];

    // Appliquer la recherche textuelle
    if (searchText && result.length > 0) {
      const searchLower = searchText.toLowerCase();
      result = result.filter(row => 
        Object.values(row).some(value => 
          value != null && value.toString().toLowerCase().includes(searchLower)
        )
      );
    }

    // Appliquer les filtres
    if (filters && Object.keys(filters).length > 0 && result.length > 0) {
      Object.entries(filters).forEach(([column, selectedValues]) => {
        if (selectedValues && selectedValues.length > 0) {
          result = result.filter(row => 
            selectedValues.includes(row[column]?.toString() || '')
          );
        }
      });
    }

    return result;
  }, [data, searchText, filters]);`;

if (dataTableContent.match(filteredDataPattern)) {
  dataTableContent = dataTableContent.replace(filteredDataPattern, newFilteredData);
  console.log('Calcul des données filtrées modifié dans DataTable.js');
} else {
  console.log('Pattern de calcul des données filtrées non trouvé dans DataTable.js');
}

// Modifier le calcul des valeurs uniques pour chaque colonne
const columnValuesPattern = /const columnValues = useMemo\(\(\) => \{[\s\S]+?\}, \[data\]\);/;
const newColumnValues = `const columnValues = useMemo(() => {
    const values = {};
    // S'assurer que data est un tableau et qu'il contient au moins un élément
    if (Array.isArray(data) && data.length > 0) {
      Object.keys(data[0]).forEach(column => {
        const uniqueValues = new Set();
        data.forEach(row => {
          if (row[column] != null) {
            uniqueValues.add(row[column].toString());
          }
        });
        values[column] = Array.from(uniqueValues).sort();
      });
    }
    return values;
  }, [data]);`;

if (dataTableContent.match(columnValuesPattern)) {
  dataTableContent = dataTableContent.replace(columnValuesPattern, newColumnValues);
  console.log('Calcul des valeurs uniques modifié dans DataTable.js');
} else {
  console.log('Pattern de calcul des valeurs uniques non trouvé dans DataTable.js');
}

// Écrire les modifications dans les fichiers
fs.writeFileSync(homePath, homeContent);
fs.writeFileSync(dataTablePath, dataTableContent);
console.log('Fichiers modifiés avec succès!');

console.log('Veuillez redémarrer l\'application frontend pour appliquer les modifications.');
