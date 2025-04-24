/**
 * Script pour corriger l'erreur "data is not iterable"
 */

const fs = require('fs');
const path = require('path');

// Chemins des fichiers
const homePath = path.join(__dirname, 'Home.js');
const dataTablePath = path.join(__dirname, 'DataTable.js');

console.log('Lecture des fichiers...');
let homeContent = fs.readFileSync(homePath, 'utf8');
let dataTableContent = fs.readFileSync(dataTablePath, 'utf8');

// Créer de nouvelles sauvegardes
const homeBackupPath = `${homePath}.backup.${Date.now()}`;
const dataTableBackupPath = `${dataTablePath}.backup.${Date.now()}`;
fs.writeFileSync(homeBackupPath, homeContent);
fs.writeFileSync(dataTableBackupPath, dataTableContent);
console.log('Sauvegardes créées');

// 1. Modifier DataTable.js pour s'assurer que data est toujours un tableau
// Trouver l'endroit où data est utilisé comme itérable
const dataIterablePattern = /data\.map\(/g;
const newDataIterable = `(Array.isArray(data) ? data : []).map(`;

// Remplacer toutes les occurrences
let count = 0;
dataTableContent = dataTableContent.replace(dataIterablePattern, () => {
  count++;
  return newDataIterable;
});
console.log(`${count} occurrences de data.map remplacées dans DataTable.js`);

// 2. Modifier la déclaration des props pour initialiser data comme un tableau vide
const propsPattern = /const DataTable = \(\{\s*data = \[\],/;
if (dataTableContent.match(propsPattern)) {
  console.log('Déclaration des props déjà correcte');
} else {
  // Si la déclaration n'est pas trouvée ou n'initialise pas data comme un tableau
  const dataTablePropsPattern = /const DataTable = \(\{([^}]+)\}\) =>/;
  const match = dataTableContent.match(dataTablePropsPattern);
  
  if (match) {
    const props = match[1];
    if (props.includes('data')) {
      // data est déjà dans les props, mais sans initialisation
      const newProps = props.replace(/data,/, 'data = [],');
      dataTableContent = dataTableContent.replace(props, newProps);
      console.log('Initialisation de data ajoutée aux props');
    }
  }
}

// 3. Ajouter une vérification pour data.length
const dataLengthPattern = /data\.length/g;
const newDataLength = `(Array.isArray(data) ? data : []).length`;

// Remplacer toutes les occurrences
count = 0;
dataTableContent = dataTableContent.replace(dataLengthPattern, () => {
  count++;
  return newDataLength;
});
console.log(`${count} occurrences de data.length remplacées dans DataTable.js`);

// 4. Modifier Home.js pour s'assurer que data est initialisé comme un tableau
const homeDataInitPattern = /const \[data, setData\] = useState\([^)]*\);/;
const newHomeDataInit = `const [data, setData] = useState([]);`;

if (homeContent.match(homeDataInitPattern)) {
  homeContent = homeContent.replace(homeDataInitPattern, newHomeDataInit);
  console.log('Initialisation de data dans Home.js corrigée');
}

// 5. Modifier la fonction fetchData pour s'assurer que data est toujours un tableau
const setDataPattern = /setData\(response\.data(?:\.data)?\);/g;
const newSetData = `setData(Array.isArray(response.data.data) ? response.data.data : 
                  Array.isArray(response.data) ? response.data : []);`;

// Remplacer toutes les occurrences
count = 0;
homeContent = homeContent.replace(setDataPattern, () => {
  count++;
  return newSetData;
});
console.log(`${count} occurrences de setData remplacées dans Home.js`);

// Écrire les contenus modifiés dans les fichiers
fs.writeFileSync(homePath, homeContent);
fs.writeFileSync(dataTablePath, dataTableContent);
console.log('Fichiers modifiés avec succès!');

console.log('Veuillez redémarrer l\'application frontend pour appliquer les modifications.');
