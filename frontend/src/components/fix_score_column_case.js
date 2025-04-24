/**
 * Script pour modifier le DataTable.js afin d'utiliser la colonne "Score" (avec S majuscule)
 * au lieu de "score" pour le color coding
 */

const fs = require('fs');
const path = require('path');

// Chemin du fichier DataTable.js
const dataTablePath = path.join(__dirname, 'DataTable.js');
console.log(`Lecture du fichier ${dataTablePath}...`);
let content = fs.readFileSync(dataTablePath, 'utf8');

// Créer une sauvegarde du fichier
const backupPath = `${dataTablePath}.backup.${Date.now()}`;
fs.writeFileSync(backupPath, content);
console.log(`Sauvegarde créée: ${backupPath}`);

// 1. Modifier les références à la colonne 'score' pour utiliser 'Score'
// Remplacer les références dans les conditions d'alignement
content = content.replace(/column === 'score'/g, `column === 'Score' || column === 'score'`);

// 2. Modifier les références dans le rendu des cellules
content = content.replace(
  /column === 'score' \? renderScoreCell\(row\[column\]\)/g, 
  `(column === 'Score' || column === 'score') ? renderScoreCell(row[column])`
);

// 3. Modifier la fonction renderScoreCell pour gérer les scores sous forme de texte
const renderScoreCellPattern = /const renderScoreCell = \(score\) => \{[\s\S]+?if \(score === null\) return '';[\s\S]+?const scoreNum = parseInt\(score\);/;
const newRenderScoreCell = `const renderScoreCell = (score) => {
    if (score === null || score === undefined) return '';
    
    // Convertir en nombre si c'est une chaîne
    let scoreNum;
    if (typeof score === 'string') {
      scoreNum = parseInt(score);
      if (isNaN(scoreNum)) return score; // Si la conversion échoue, afficher le texte tel quel
    } else if (typeof score === 'number') {
      scoreNum = score;
    } else {
      return score.toString(); // Pour tout autre type, convertir en chaîne
    }`;

if (content.match(renderScoreCellPattern)) {
  content = content.replace(renderScoreCellPattern, newRenderScoreCell);
  console.log('Fonction renderScoreCell modifiée pour gérer les scores sous forme de texte');
} else {
  console.log('Pattern de la fonction renderScoreCell non trouvé');
}

// 4. Ajouter une fonction utilitaire pour vérifier si une colonne est liée au score
const beforeGetScoreStyle = /\/\/ Style des cellules avec score/;
const isScoreColumnFunction = `  // Fonction pour vérifier si une colonne est liée au score
  const isScoreColumn = (column) => {
    const lowerCol = column.toLowerCase();
    return lowerCol === 'score' || column === 'Score' || lowerCol.includes('score');
  };

  // Style des cellules avec score`;

if (content.match(beforeGetScoreStyle)) {
  content = content.replace(beforeGetScoreStyle, isScoreColumnFunction);
  console.log('Fonction isScoreColumn ajoutée');
} else {
  console.log('Pattern pour ajouter la fonction isScoreColumn non trouvé');
}

// 5. Utiliser la fonction isScoreColumn dans le code
content = content.replace(
  /lowerColName === 'score'/g, 
  `isScoreColumn(column)`
);

// Écrire le contenu modifié dans le fichier
fs.writeFileSync(dataTablePath, content);
console.log(`Fichier ${dataTablePath} modifié avec succès!`);

console.log('Veuillez redémarrer l\'application frontend pour appliquer les modifications.');
