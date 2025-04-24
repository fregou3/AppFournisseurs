/**
 * Script pour déboguer les problèmes de pagination dans Home.js
 * Ce script ajoute des logs détaillés pour comprendre ce qui se passe
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

// 1. Ajouter des logs détaillés dans fetchData
const fetchDataPattern = /const fetchData = async \(tableName, page = currentPage, size = pageSize\) => \{[\s\S]+?finally \{/;
const newFetchData = `const fetchData = async (tableName, page = currentPage, size = pageSize) => {
    console.log('=== DÉBUT FETCHDATA ===');
    console.log('Paramètres:', { tableName, page, size, currentPage, pageSize });
    
    setLoading(true);
    setError(null);
    try {
      // Forcer une taille de page très grande pour récupérer toutes les données
      const fetchSize = 10000;
      
      // Si le nom de la table est 'fournisseurs', utiliser la route standard
      // Sinon, utiliser une route spécifique pour la table sélectionnée
      const url = tableName === 'fournisseurs' 
        ? \`\${config.apiUrl}/fournisseurs?page=1&pageSize=\${fetchSize}\` 
        : \`\${config.apiUrl}/fournisseurs/table/\${tableName}?page=1&pageSize=\${fetchSize}\`;
      
      console.log('URL de requête:', url);
      const response = await axios.get(url);
      console.log('Type de réponse:', typeof response.data);
      console.log('Structure de réponse:', Object.keys(response.data));
      
      if (response.data && Array.isArray(response.data.data)) {
        // Format avec pagination explicite
        const allData = response.data.data;
        console.log('Nombre de lignes reçues (format pagination):', allData.length);
        console.log('Première ligne:', allData[0]);
        console.log('Dernière ligne:', allData[allData.length - 1]);
        
        setData(allData);
        
        // Mettre à jour les informations de pagination
        if (response.data.pagination) {
          console.log('Informations de pagination:', response.data.pagination);
          setTotalRows(allData.length);
          setTotalPages(Math.ceil(allData.length / size));
          setCurrentPage(0); // Commencer à la première page
          setPageSize(size);
        } else {
          console.log('Pas d\\'informations de pagination, utilisation de la longueur du tableau');
          setTotalRows(allData.length);
          setTotalPages(Math.ceil(allData.length / size));
          setCurrentPage(0); // Commencer à la première page
        }
        
        console.log(\`Toutes les données récupérées: \${allData.length} lignes\`);
      } else if (Array.isArray(response.data)) {
        // Format tableau simple (ancienne API)
        const allData = response.data;
        console.log('Nombre de lignes reçues (format tableau):', allData.length);
        console.log('Première ligne:', allData[0]);
        console.log('Dernière ligne:', allData[allData.length - 1]);
        
        setData(allData);
        setTotalRows(allData.length);
        setTotalPages(Math.ceil(allData.length / size));
        setCurrentPage(0); // Commencer à la première page
        
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
    } finally {
      console.log('=== FIN FETCHDATA ===');`;

content = content.replace(fetchDataPattern, newFetchData);

// 2. Modifier le rendu du DataTable pour afficher les données correctement
const dataTablePattern = /<DataTable[\s\S]+?data=\{[^}]+\}[\s\S]+?\/>/;
const newDataTable = `<DataTable
            data={data.slice(currentPage * pageSize, (currentPage + 1) * pageSize)}
            tableName={selectedTable}
          />`;

content = content.replace(dataTablePattern, newDataTable);

// 3. Ajouter des logs dans le rendu pour comprendre ce qui est passé au DataTable
const renderPattern = /return \(\s*<div className="home-container">/;
const newRender = `// Logs de débogage avant le rendu
  console.log('=== DONNÉES AVANT RENDU ===');
  console.log('Nombre total de lignes:', totalRows);
  console.log('Page actuelle:', currentPage);
  console.log('Taille de page:', pageSize);
  console.log('Nombre total de pages:', totalPages);
  console.log('Nombre de lignes dans data:', data.length);
  console.log('Lignes à afficher:', data.slice(currentPage * pageSize, (currentPage + 1) * pageSize).length);
  
  return (
    <div className="home-container">`;

content = content.replace(renderPattern, newRender);

// 4. Modifier l'affichage de la pagination pour montrer le nombre total de lignes
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

// 5. Forcer le rechargement des données au changement de table
const handleTableChangePattern = /const handleTableChange = \(event\) => \{[\s\S]+?\};/;
const newHandleTableChange = `const handleTableChange = (event) => {
    const newTable = event.target.value;
    setSelectedTable(newTable);
    // Forcer le rechargement des données avec la nouvelle table
    console.log('Changement de table:', newTable);
    fetchData(newTable, 0, pageSize);
  };`;

content = content.replace(handleTableChangePattern, newHandleTableChange);

// Écrire le contenu modifié dans le fichier
fs.writeFileSync(homePath, content);
console.log(`Fichier ${homePath} modifié avec succès!`);

console.log('Veuillez redémarrer l\'application frontend pour appliquer les modifications.');
