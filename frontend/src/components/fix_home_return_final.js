/**
 * Script pour corriger l'erreur de 'return' en dehors d'une fonction dans Home.js
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

// Restaurer le fichier Home.js à partir d'une sauvegarde fonctionnelle
// Trouver toutes les sauvegardes
const backups = fs.readdirSync(__dirname)
  .filter(file => file.startsWith('Home.js.backup.'))
  .sort();

// Utiliser la première sauvegarde (la plus ancienne)
const oldestBackup = backups[0];
if (oldestBackup) {
  console.log(`Restauration à partir de la sauvegarde: ${oldestBackup}`);
  const backupContent = fs.readFileSync(path.join(__dirname, oldestBackup), 'utf8');
  
  // Modifier la fonction fetchData dans le contenu de la sauvegarde
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
  
  // Appliquer la modification si le pattern est trouvé
  if (backupContent.match(fetchDataPattern)) {
    content = backupContent.replace(fetchDataPattern, newFetchData);
    console.log('Fonction fetchData modifiée dans le contenu de la sauvegarde');
    
    // Modifier le rendu du DataTable pour utiliser une pagination côté client
    const dataTablePattern = /<DataTable[\s\S]+?\/>/;
    const newDataTable = `<DataTable
              data={data.slice(currentPage * pageSize, (currentPage + 1) * pageSize)}
              tableName={selectedTable}
            />`;
    
    if (content.match(dataTablePattern)) {
      content = content.replace(dataTablePattern, newDataTable);
      console.log('Rendu du DataTable modifié');
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
    }
  } else {
    console.log('Impossible de trouver la fonction fetchData dans la sauvegarde, utilisation du contenu original');
    content = backupContent;
  }
} else {
  console.log('Aucune sauvegarde trouvée');
}

// Écrire le contenu modifié dans le fichier
fs.writeFileSync(homePath, content);
console.log(`Fichier ${homePath} modifié avec succès!`);

console.log('Veuillez redémarrer l\'application frontend pour appliquer les modifications.');
