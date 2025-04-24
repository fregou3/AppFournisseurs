/**
 * Script pour corriger le composant Home.js et résoudre l'erreur "data is not iterable"
 */

const fs = require('fs');
const path = require('path');

// Chemin du fichier à modifier
const homePath = path.join(__dirname, '..', 'src', 'components', 'Home.js');

// Lire le contenu du fichier
console.log(`Lecture du fichier ${homePath}...`);
let content = fs.readFileSync(homePath, 'utf8');

// Créer une sauvegarde du fichier
const backupPath = `${homePath}.backup.${Date.now()}`;
fs.writeFileSync(backupPath, content);
console.log(`Sauvegarde créée: ${backupPath}`);

// Rechercher la fonction fetchData
const fetchDataPattern = /const fetchData = async \(tableName\) => \{[\s\S]+?setLoading\(false\);\s*\}\s*\};/;

// Nouvelle implémentation de fetchData
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
      
      // Traiter les données en fonction du format de réponse
      if (tableName === 'fournisseurs') {
        // Pour la table fournisseurs, la réponse est directement un tableau
        // Vérifier que les données sont bien un tableau
        if (Array.isArray(response.data)) {
          setData(response.data);
        } else {
          console.error('Les données reçues ne sont pas un tableau:', response.data);
          setData([]);
        }
      } else {
        // Pour les autres tables, la réponse est un objet avec une propriété data
        if (response.data && Array.isArray(response.data.data)) {
          setData(response.data.data);
        } else {
          console.error('Les données reçues ne contiennent pas un tableau data:', response.data);
          setData([]);
        }
      }
    } catch (error) {
      console.error(\`Erreur lors du chargement des données de la table \${tableName}:\`, error);
      setError(\`Erreur lors du chargement des données de la table \${tableName}\`);
      // En cas d'erreur, initialiser data avec un tableau vide pour éviter l'erreur "data is not iterable"
      setData([]);
    } finally {
      setLoading(false);
    }
  };`;

// Remplacer la fonction fetchData
if (content.match(fetchDataPattern)) {
  content = content.replace(fetchDataPattern, newFetchData);
  
  // Écrire le contenu modifié dans le fichier
  fs.writeFileSync(homePath, content, 'utf8');
  
  console.log('Fonction fetchData modifiée avec succès!');
} else {
  console.log('Fonction fetchData non trouvée.');
}

// Vérifier également l'initialisation de l'état data
const dataStatePattern = /const \[data, setData\] = useState\(\[\]\);/;
if (!content.match(dataStatePattern)) {
  console.log('L\'initialisation de l\'état data n\'est pas correcte, correction...');
  
  // Rechercher la ligne d'initialisation de l'état data
  const dataStateRegex = /const \[data, setData\] = useState\(([^)]*)\);/;
  const match = content.match(dataStateRegex);
  
  if (match) {
    // Remplacer l'initialisation de l'état data
    content = content.replace(dataStateRegex, 'const [data, setData] = useState([]);');
    
    // Écrire le contenu modifié dans le fichier
    fs.writeFileSync(homePath, content, 'utf8');
    
    console.log('Initialisation de l\'état data corrigée avec succès!');
  } else {
    console.log('Initialisation de l\'état data non trouvée.');
  }
}

console.log('Veuillez rafraîchir la page pour appliquer les modifications.');
