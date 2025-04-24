/**
 * Script pour corriger l'erreur "tables.map is not a function" dans Home.js
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

// 1. Modifier l'initialisation de tables pour s'assurer que c'est un tableau
const tablesInitPattern = /const \[tables, setTables\] = useState\(\[\]\);/;
const newTablesInit = `const [tables, setTables] = useState(['fournisseurs', 'fournisseurs_fournisseurs_v18']);`;

if (content.match(tablesInitPattern)) {
  content = content.replace(tablesInitPattern, newTablesInit);
  console.log('Initialisation de tables modifiée');
}

// 2. Ajouter une vérification pour s'assurer que tables est un tableau avant d'utiliser .map
const tablesMapPattern = /\{tables\.map\(table => \(/;
const newTablesMap = `{Array.isArray(tables) ? tables.map(table => (`;
const tablesMapEndPattern = /\)\)\}/;
const newTablesMapEnd = `)) : null}`;

if (content.match(tablesMapPattern)) {
  content = content.replace(tablesMapPattern, newTablesMap);
  content = content.replace(tablesMapEndPattern, newTablesMapEnd);
  console.log('Vérification Array.isArray ajoutée');
}

// 3. Modifier la fonction fetchTables pour s'assurer qu'elle définit correctement tables comme un tableau
const fetchTablesPattern = /const fetchTables = useCallback\(async \(\) => \{[\s\S]+?setTables\(response\.data\);[\s\S]+?\}, \[\]\);/;
const newFetchTables = `const fetchTables = useCallback(async () => {
    setLoadingTables(true);
    try {
      const response = await axios.get(\`\${config.apiUrl}/fournisseurs/tables\`);
      // S'assurer que response.data est un tableau
      if (Array.isArray(response.data)) {
        setTables(response.data);
      } else if (response.data && typeof response.data === 'object') {
        // Si c'est un objet, essayer de le convertir en tableau
        const tablesArray = Object.keys(response.data);
        setTables(tablesArray);
      } else {
        // Fallback à un tableau par défaut
        setTables(['fournisseurs', 'fournisseurs_fournisseurs_v18']);
        console.error('Format de données inattendu pour les tables:', response.data);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des tables:', error);
      // En cas d'erreur, définir un tableau par défaut
      setTables(['fournisseurs', 'fournisseurs_fournisseurs_v18']);
    } finally {
      setLoadingTables(false);
    }
  }, []);`;

if (content.match(fetchTablesPattern)) {
  content = content.replace(fetchTablesPattern, newFetchTables);
  console.log('Fonction fetchTables modifiée');
}

// Écrire le contenu corrigé dans le fichier
fs.writeFileSync(homePath, content);
console.log(`Fichier ${homePath} corrigé avec succès!`);

console.log('Veuillez redémarrer l\'application frontend pour appliquer les corrections.');
