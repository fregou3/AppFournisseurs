/**
 * Script pour corriger les couleurs des niveaux de risque
 * selon les nouvelles règles :
 * 0 à 1 : Niveau de risque très faible (vert)
 * 2 à 4 : Niveau de risque faible (jaune)
 * 5 à 7 : Niveau de risque modéré (orange)
 * 8 et plus : Niveau de risque élevé (rouge)
 */

const fs = require('fs');
const path = require('path');

// Chemin du fichier DataTable.js à corriger
const dataTablePath = path.join(__dirname, 'DataTable.js');
console.log(`Lecture du fichier ${dataTablePath}...`);
let content = fs.readFileSync(dataTablePath, 'utf8');

// Créer une sauvegarde du fichier
const backupPath = `${dataTablePath}.backup.${Date.now()}`;
fs.writeFileSync(backupPath, content);
console.log(`Sauvegarde créée: ${backupPath}`);

// Recherche de la fonction getScoreStyle
const getScoreStyleRegex = /const getScoreStyle = \(score\) => \{\s*if \(score === null\) return \{\};\s*\s*const scoreNum = parseInt\(score\);[\s\S]*?return styles\[scoreNum\] \|\| \{\};[\s\S]*?\};/g;

// Nouvelle implémentation de getScoreStyle
const newGetScoreStyle = `const getScoreStyle = (score) => {
  if (score === null) return {};

  const scoreNum = parseInt(score);
  
  // Nouvelles règles de couleurs :
  // 0 à 1 : Niveau de risque très faible (vert)
  // 2 à 4 : Niveau de risque faible (jaune)
  // 5 à 7 : Niveau de risque modéré (orange)
  // 8 et plus : Niveau de risque élevé (rouge)
  
  if (scoreNum >= 0 && scoreNum <= 1) {
    return {
      backgroundColor: '#90EE90', // Vert clair
      label: 'Niveau de risque très faible',
      color: '#1b5e20' // Vert foncé
    };
  } else if (scoreNum >= 2 && scoreNum <= 4) {
    return {
      backgroundColor: '#FFFF00', // Jaune
      label: 'Niveau de risque faible',
      color: '#8b8000' // Jaune foncé
    };
  } else if (scoreNum >= 5 && scoreNum <= 7) {
    return {
      backgroundColor: '#FFA500', // Orange
      label: 'Niveau de risque modéré',
      color: '#804000' // Orange foncé
    };
  } else if (scoreNum >= 8) {
    return {
      backgroundColor: '#FF0000', // Rouge
      label: 'Niveau de risque élevé',
      color: 'white'
    };
  }
  
  // Valeur par défaut
  return {};
};`;

// Remplacer la fonction getScoreStyle dans le contenu
const updatedContent = content.replace(getScoreStyleRegex, newGetScoreStyle);

// Vérifier si la fonction a été remplacée
if (content === updatedContent) {
  console.error('❌ La fonction getScoreStyle n\'a pas été trouvée ou n\'a pas pu être remplacée.');
  console.log('Essai avec un autre pattern...');
  
  // Essayer un autre pattern plus simple
  const simpleRegex = /const getScoreStyle[\s\S]*?return styles\[scoreNum\] \|\| \{\};[\s\S]*?\};/g;
  const updatedContent2 = content.replace(simpleRegex, newGetScoreStyle);
  
  if (content === updatedContent2) {
    console.error('❌ Échec du remplacement avec le pattern simplifié.');
    process.exit(1);
  } else {
    console.log('✅ Fonction getScoreStyle remplacée avec succès (pattern simplifié).');
    fs.writeFileSync(dataTablePath, updatedContent2);
  }
} else {
  console.log('✅ Fonction getScoreStyle remplacée avec succès.');
  fs.writeFileSync(dataTablePath, updatedContent);
}

console.log('✅ Mise à jour des couleurs des niveaux de risque terminée.');
