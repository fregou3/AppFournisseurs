/**
 * Script pour corriger la gestion de la pagination dans le composant Home.js
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

// Modifier la fonction fetchData pour gérer correctement la pagination
const fetchDataPattern = /const fetchData = async \(tableName, page = currentPage, size = pageSize\) => \{[\s\S]+?setLoading\(false\);\s*\}\s*\};/;
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
      if (response.data && Array.isArray(response.data.data)) {
        // Format avec pagination explicite
        setData(response.data.data);
        
        // Mettre à jour les informations de pagination
        if (response.data.pagination) {
          setTotalRows(response.data.pagination.totalRows || 0);
          setTotalPages(response.data.pagination.totalPages || 0);
          setCurrentPage(response.data.pagination.page || 1);
          setPageSize(response.data.pagination.pageSize || size);
        }
      } else if (Array.isArray(response.data)) {
        // Format tableau simple (ancienne API)
        setData(response.data);
        // Pour la table fournisseurs, nous n'avons pas d'informations de pagination
        // Nous utilisons donc la taille du tableau comme nombre total de lignes
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
      // En cas d'erreur, initialiser data avec un tableau vide pour éviter l'erreur "data is not iterable"
      setData([]);
      setTotalRows(0);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  };`;

// Vérifier si le pattern existe dans le contenu
if (fetchDataPattern.test(content)) {
  content = content.replace(fetchDataPattern, newFetchData);
  console.log('Fonction fetchData modifiée pour gérer correctement la pagination');
} else {
  console.log('Pattern de la fonction fetchData non trouvé, recherche d\'un pattern alternatif...');
  
  // Pattern alternatif pour la fonction fetchData
  const altFetchDataPattern = /const fetchData = async \([^)]+\) => \{[\s\S]+?setLoading\(false\);\s*\}\s*\};/;
  
  if (altFetchDataPattern.test(content)) {
    content = content.replace(altFetchDataPattern, newFetchData);
    console.log('Fonction fetchData (pattern alternatif) modifiée');
  } else {
    console.log('Aucun pattern de la fonction fetchData trouvé, modification manuelle nécessaire');
  }
}

// Écrire le contenu modifié dans le fichier
fs.writeFileSync(homePath, content);
console.log(`Fichier ${homePath} modifié avec succès!`);

console.log('Veuillez redémarrer l\'application frontend pour appliquer les modifications.');
