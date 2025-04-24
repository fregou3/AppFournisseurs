/**
 * Script pour corriger la pagination dans Home.js
 * Ce script modifie le composant Home.js pour récupérer toutes les données
 * et les afficher correctement avec pagination
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

// 1. Modifier la fonction fetchData pour récupérer toutes les données
// Nous allons utiliser pageSize=7000 pour s'assurer d'obtenir toutes les 6688 lignes
const fetchDataPattern = /const fetchData = async \(tableName, page = currentPage, size = pageSize\) => \{[\s\S]+?finally \{/;
const newFetchData = `const fetchData = async (tableName, page = currentPage, size = pageSize) => {
    setLoading(true);
    setError(null);
    try {
      // Utiliser une taille de page très grande pour récupérer toutes les données en une seule requête
      const fetchSize = 7000;
      
      // Si le nom de la table est 'fournisseurs', utiliser la route standard
      // Sinon, utiliser une route spécifique pour la table sélectionnée
      const url = tableName === 'fournisseurs' 
        ? \`\${config.apiUrl}/fournisseurs?page=1&pageSize=\${fetchSize}\` 
        : \`\${config.apiUrl}/fournisseurs/table/\${tableName}?page=1&pageSize=\${fetchSize}\`;
      
      console.log('Fetching all data from:', url);
      const response = await axios.get(url);
      console.log('Response received:', response.data);
      
      // Traiter les données en fonction du format de réponse
      if (response.data && Array.isArray(response.data.data)) {
        // Format avec pagination explicite
        const allData = response.data.data;
        setData(allData);
        
        // Mettre à jour les informations de pagination
        // Nous utilisons la pagination côté client maintenant
        setTotalRows(allData.length);
        setTotalPages(Math.ceil(allData.length / size));
        setCurrentPage(page);
        setPageSize(size);
        
        console.log(\`Toutes les données récupérées: \${allData.length} lignes\`);
      } else if (Array.isArray(response.data)) {
        // Format tableau simple (ancienne API)
        const allData = response.data;
        setData(allData);
        setTotalRows(allData.length);
        setTotalPages(Math.ceil(allData.length / size));
        setCurrentPage(page);
        
        console.log(\`Toutes les données récupérées: \${allData.length} lignes\`);
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
    } finally {`;

content = content.replace(fetchDataPattern, newFetchData);

// 2. Modifier la fonction handlePageChange pour utiliser la pagination côté client
const handlePageChangePattern = /const handlePageChange = \(event, newPage\) => \{[\s\S]+?\};/;
const newHandlePageChange = `const handlePageChange = (event, newPage) => {
    setCurrentPage(newPage);
    // Pas besoin de recharger les données car nous avons déjà toutes les données
    // Nous mettons simplement à jour la page actuelle
  };`;

content = content.replace(handlePageChangePattern, newHandlePageChange);

// 3. Modifier la fonction handlePageSizeChange pour utiliser la pagination côté client
const handlePageSizeChangePattern = /const handlePageSizeChange = \(event\) => \{[\s\S]+?\};/;
const newHandlePageSizeChange = `const handlePageSizeChange = (event) => {
    const newSize = parseInt(event.target.value, 10);
    setPageSize(newSize);
    setCurrentPage(0); // Retour à la première page
    // Recalculer le nombre total de pages
    setTotalPages(Math.ceil(totalRows / newSize));
  };`;

content = content.replace(handlePageSizeChangePattern, newHandlePageSizeChange);

// 4. Modifier le rendu du DataTable pour afficher uniquement les données de la page actuelle
const dataTablePattern = /<DataTable[\s\S]+?data={data}[\s\S]+?\/>/;
const newDataTable = `<DataTable
            data={data.slice(currentPage * pageSize, (currentPage + 1) * pageSize)}
            tableName={selectedTable}
            onDataUpdate={handleDataUpdate}
          />`;

content = content.replace(dataTablePattern, newDataTable);

// 5. Modifier l'affichage de la pagination pour montrer le nombre total de lignes
const paginationPattern = /<TablePagination[\s\S]+?\/>/;
const newPagination = `<TablePagination
              component="div"
              count={totalRows}
              page={currentPage}
              onPageChange={handlePageChange}
              rowsPerPage={pageSize}
              onRowsPerPageChange={handlePageSizeChange}
              rowsPerPageOptions={[10, 25, 50, 100, 250, 500]}
              labelRowsPerPage="Lignes par page:"
              labelDisplayedRows={({ from, to, count }) => 
                \`Affichage de \${from} à \${to} sur \${count} lignes\`
              }
            />`;

content = content.replace(paginationPattern, newPagination);

// Écrire le contenu modifié dans le fichier
fs.writeFileSync(homePath, content);
console.log(`Fichier ${homePath} modifié avec succès!`);

console.log('Veuillez redémarrer l\'application frontend pour appliquer les modifications.');
