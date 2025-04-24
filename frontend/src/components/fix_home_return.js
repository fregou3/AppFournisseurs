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

// Trouver le début du composant Home
const homeComponentStart = content.indexOf('const Home = () => {');
if (homeComponentStart === -1) {
  console.error('Impossible de trouver le début du composant Home');
  process.exit(1);
}

// Trouver la fin du composant Home
const homeComponentEnd = content.indexOf('export default Home;');
if (homeComponentEnd === -1) {
  console.error('Impossible de trouver la fin du composant Home');
  process.exit(1);
}

// Extraire le contenu du composant Home
const homeComponent = content.substring(homeComponentStart, homeComponentEnd);

// Vérifier si le composant se termine correctement
if (!homeComponent.endsWith('};')) {
  console.log('Le composant Home ne se termine pas correctement');
  
  // Trouver les accolades ouvrantes et fermantes pour équilibrer
  const openBraces = (homeComponent.match(/\{/g) || []).length;
  const closeBraces = (homeComponent.match(/\}/g) || []).length;
  
  console.log(`Accolades ouvrantes: ${openBraces}, Accolades fermantes: ${closeBraces}`);
  
  // Reconstruire le composant Home
  // Nous allons extraire le contenu jusqu'au dernier return et le placer correctement
  const lastReturnIndex = homeComponent.lastIndexOf('return (');
  
  if (lastReturnIndex !== -1) {
    // Contenu avant le dernier return
    const beforeReturn = homeComponent.substring(0, lastReturnIndex);
    
    // Contenu du return jusqu'à la fin
    const returnContent = content.substring(homeComponentStart + lastReturnIndex, homeComponentEnd);
    
    // Reconstruire le composant Home avec le return correctement placé
    const newHomeComponent = `const Home = () => {${beforeReturn}
  
  // Rendu conditionnel
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
      </Alert>
    );
  }
  
  ${returnContent}`;
    
    // Remplacer l'ancien composant par le nouveau
    const newContent = content.substring(0, homeComponentStart) + newHomeComponent + content.substring(homeComponentEnd);
    
    // Écrire le contenu corrigé dans le fichier
    fs.writeFileSync(homePath, newContent);
    console.log(`Fichier ${homePath} corrigé avec succès!`);
  } else {
    console.error('Impossible de trouver le dernier return dans le composant Home');
  }
} else {
  console.log('Le composant Home semble correctement structuré');
}

console.log('Veuillez redémarrer l\'application frontend pour appliquer les corrections.');
