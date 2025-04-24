/**
 * Script pour corriger directement le composant Home.js
 * afin d'afficher les 6688 lignes
 */

const fs = require('fs');
const path = require('path');

// Chemin du fichier Home.js
const homePath = path.join(__dirname, 'Home.js');
console.log(`Lecture du fichier ${homePath}...`);
let content = fs.readFileSync(homePath, 'utf8');

// Créer une sauvegarde du fichier
const backupPath = `${homePath}.backup.${Date.now()}`;
fs.writeFileSync(backupPath, content);
console.log(`Sauvegarde créée: ${backupPath}`);

// Modifier la fonction fetchData pour récupérer toutes les lignes
// et s'assurer que data est correctement initialisé
const fetchDataPattern = /const fetchData = async \([^)]*\) => \{[\s\S]+?finally \{[\s\S]+?\}/;
const newFetchData = `const fetchData = async (tableName, page = 0, size = 10) => {
    setLoading(true);
    setError(null);
    try {
      // Utiliser une grande taille de page pour récupérer toutes les lignes
      const url = tableName === 'fournisseurs' 
        ? \`\${config.apiUrl}/fournisseurs?page=1&pageSize=10000\` 
        : \`\${config.apiUrl}/fournisseurs/table/\${tableName}?page=1&pageSize=10000\`;
      
      console.log('Fetching data from:', url);
      const response = await axios.get(url);
      console.log('Response received:', response.data);
      
      let allData = [];
      let totalCount = 0;
      
      if (response.data && Array.isArray(response.data.data)) {
        // Format avec pagination
        allData = response.data.data;
        totalCount = allData.length;
        
        if (response.data.pagination) {
          totalCount = response.data.pagination.totalRows || allData.length;
        }
      } else if (Array.isArray(response.data)) {
        // Format tableau simple
        allData = response.data;
        totalCount = allData.length;
      } else {
        console.error('Format de données non reconnu:', response.data);
        allData = [];
        totalCount = 0;
      }
      
      console.log(\`Données récupérées: \${allData.length} lignes sur \${totalCount} total\`);
      
      // Mettre à jour les états
      setData(allData);
      setTotalRows(totalCount);
      setTotalPages(Math.ceil(totalCount / size));
      setCurrentPage(0);
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

if (content.match(fetchDataPattern)) {
  content = content.replace(fetchDataPattern, newFetchData);
  console.log('Fonction fetchData modifiée');
} else {
  console.log('Impossible de trouver la fonction fetchData');
}

// Modifier le rendu du DataTable pour utiliser une pagination côté client
const dataTablePattern = /<DataTable[\s\S]+?\/>/;
const newDataTable = `<DataTable
            data={data.slice(currentPage * pageSize, (currentPage + 1) * pageSize)}
            tableName={selectedTable}
          />`;

if (content.match(dataTablePattern)) {
  content = content.replace(dataTablePattern, newDataTable);
  console.log('Rendu du DataTable modifié');
} else {
  console.log('Impossible de trouver le rendu du DataTable');
}

// Modifier les gestionnaires de pagination pour ne pas recharger les données
const handlePageChangePattern = /const handlePageChange = \([^)]*\) => \{[\s\S]+?\};/;
const newHandlePageChange = `const handlePageChange = (event, newPage) => {
    console.log(\`Changement de page: \${newPage + 1}\`);
    setCurrentPage(newPage);
    // Pas besoin de recharger les données car nous avons déjà toutes les données
  };`;

if (content.match(handlePageChangePattern)) {
  content = content.replace(handlePageChangePattern, newHandlePageChange);
  console.log('Fonction handlePageChange modifiée');
} else {
  console.log('Impossible de trouver la fonction handlePageChange');
}

const handlePageSizeChangePattern = /const handlePageSizeChange = \([^)]*\) => \{[\s\S]+?\};/;
const newHandlePageSizeChange = `const handlePageSizeChange = (event) => {
    const newSize = parseInt(event.target.value, 10);
    setPageSize(newSize);
    setCurrentPage(0); // Revenir à la première page
    // Pas besoin de recharger les données car nous avons déjà toutes les données
  };`;

if (content.match(handlePageSizeChangePattern)) {
  content = content.replace(handlePageSizeChangePattern, newHandlePageSizeChange);
  console.log('Fonction handlePageSizeChange modifiée');
} else {
  console.log('Impossible de trouver la fonction handlePageSizeChange');
}

// Écrire le contenu modifié dans le fichier
fs.writeFileSync(homePath, content);
console.log(`Fichier ${homePath} modifié avec succès!`);

console.log('Veuillez redémarrer l\'application frontend pour appliquer les modifications.');
