/**
 * Script pour corriger l'erreur de syntaxe dans Home.js
 * (accolades supplémentaires)
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

// Corriger l'erreur de syntaxe (accolades supplémentaires)
// Remplacer les accolades supplémentaires par une seule accolade fermante
const syntaxErrorPattern = /\};[\s\n]*\};[\s\n]*\};/;
const fixedSyntax = '  };';

if (content.match(syntaxErrorPattern)) {
  content = content.replace(syntaxErrorPattern, fixedSyntax);
  console.log('Erreur de syntaxe corrigée (accolades supplémentaires)');
} else {
  console.log('Pattern d\'erreur de syntaxe non trouvé, tentative de correction alternative');
  
  // Approche alternative: reconstruire la fonction fetchData complètement
  const fetchDataStart = content.indexOf('const fetchData = async');
  if (fetchDataStart !== -1) {
    // Trouver la position après la définition de fetchData
    const afterFetchData = content.indexOf('// Gestionnaire de changement de table', fetchDataStart);
    if (afterFetchData !== -1) {
      // Reconstruire la fonction fetchData correctement
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
      
      let allData = [];
      
      if (response.data && Array.isArray(response.data.data)) {
        // Format avec pagination
        allData = response.data.data;
      } else if (Array.isArray(response.data)) {
        // Format tableau simple
        allData = response.data;
      } else {
        console.error('Format de données non reconnu:', response.data);
        allData = [];
      }
      
      console.log(\`Données récupérées: \${allData.length} lignes\`);
      setData(allData);
    } catch (error) {
      console.error(\`Erreur lors du chargement des données de la table \${tableName}:\`, error);
      setError(\`Erreur lors du chargement des données de la table \${tableName}\`);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

`;
      
      // Remplacer la section problématique
      content = content.substring(0, fetchDataStart) + newFetchData + content.substring(afterFetchData);
      console.log('Fonction fetchData reconstruite');
    } else {
      console.log('Impossible de trouver la fin de la fonction fetchData');
    }
  } else {
    console.log('Impossible de trouver le début de la fonction fetchData');
  }
}

// Écrire le contenu modifié dans le fichier
fs.writeFileSync(homePath, content);
console.log(`Fichier ${homePath} modifié avec succès!`);

console.log('Veuillez redémarrer l\'application frontend pour appliquer les modifications.');
