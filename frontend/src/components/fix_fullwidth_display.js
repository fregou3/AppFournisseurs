/**
 * Script pour modifier l'affichage des données sur toute la largeur de l'écran
 * comme dans la version 3.5
 */

const fs = require('fs');
const path = require('path');

// Chemin du fichier App.js
const appPath = path.join(__dirname, '..', 'App.js');
console.log(`Lecture du fichier ${appPath}...`);
let content = fs.readFileSync(appPath, 'utf8');

// Créer une sauvegarde du fichier
const backupPath = `${appPath}.backup.${Date.now()}`;
fs.writeFileSync(backupPath, content);
console.log(`Sauvegarde créée: ${backupPath}`);

// Modifier le composant PrivateLayout pour utiliser toute la largeur de l'écran
const privateLayoutPattern = /const PrivateLayout = \(\{ children \}\) => \{[\s\S]+?<\/Box>\n  \);[\s\S]+?\};/;
const newPrivateLayout = `const PrivateLayout = ({ children }) => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header />
      <Box component="main" sx={{ flexGrow: 1, py: 3 }}>
        <Container maxWidth={false} sx={{ padding: 2 }}>
          {children}
        </Container>
      </Box>
    </Box>
  );
};`;

if (content.match(privateLayoutPattern)) {
  content = content.replace(privateLayoutPattern, newPrivateLayout);
  console.log('Composant PrivateLayout modifié');
} else {
  console.log('Pattern du composant PrivateLayout non trouvé');
}

// Modifier toutes les occurrences de Container sans maxWidth
const containerPattern = /<Container>[\s\S]+?<\/Container>/g;
content = content.replace(containerPattern, (match) => {
  return match.replace('<Container>', '<Container maxWidth={false} sx={{ padding: 2 }}>');
});
console.log('Containers modifiés pour utiliser toute la largeur');

// Écrire le contenu modifié dans le fichier
fs.writeFileSync(appPath, content);
console.log(`Fichier ${appPath} modifié avec succès!`);

// Modifier également le style du DataTable pour utiliser toute la largeur disponible
const dataTablePath = path.join(__dirname, 'DataTable.js');
if (fs.existsSync(dataTablePath)) {
  console.log(`Lecture du fichier ${dataTablePath}...`);
  let dataTableContent = fs.readFileSync(dataTablePath, 'utf8');
  
  // Créer une sauvegarde du fichier
  const dataTableBackupPath = `${dataTablePath}.backup.${Date.now()}`;
  fs.writeFileSync(dataTableBackupPath, dataTableContent);
  console.log(`Sauvegarde créée: ${dataTableBackupPath}`);
  
  // Modifier le style de la TableContainer pour utiliser toute la largeur disponible
  const tableContainerPattern = /<TableContainer[^>]*>/g;
  dataTableContent = dataTableContent.replace(tableContainerPattern, (match) => {
    if (match.includes('sx=')) {
      return match.replace('sx={', 'sx={{ width: "100%", overflowX: "auto", ');
    } else {
      return match.replace('>', ' sx={{ width: "100%", overflowX: "auto" }}>');
    }
  });
  console.log('Style de TableContainer modifié');
  
  // Écrire le contenu modifié dans le fichier
  fs.writeFileSync(dataTablePath, dataTableContent);
  console.log(`Fichier ${dataTablePath} modifié avec succès!`);
}

console.log('Veuillez redémarrer l\'application frontend pour appliquer les modifications.');
