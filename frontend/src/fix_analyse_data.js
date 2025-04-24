/**
 * Script pour corriger l'erreur "data.filter is not a function" dans le composant Analyse.js
 * 
 * Ce script applique automatiquement les corrections nécessaires pour résoudre le problème
 * de structure de données dans le composant Analyse.js
 */

const fs = require('fs');
const path = require('path');

// Chemin du fichier Analyse.js
const analysePath = path.join(__dirname, 'components', 'Analyse.js');
const backupPath = `${analysePath}.backup.${Date.now()}`;

// Lire le contenu du fichier
console.log(`Lecture du fichier ${analysePath}...`);
const content = fs.readFileSync(analysePath, 'utf8');

// Créer une sauvegarde
fs.writeFileSync(backupPath, content);
console.log(`Sauvegarde créée: ${backupPath}`);

// Fonction pour corriger le problème
function fixDataFilterError(content) {
  console.log('\n=== APPLICATION DES CORRECTIONS ===');
  
  // 1. Corriger la fonction fetchData pour extraire correctement les données
  let modifiedContent = content.replace(
    /(const fetchData = async \(\) => \{[\s\S]*?)setData\(response\.data\);([\s\S]*?)calculateStats\(response\.data\);/,
    '$1// Extraire le tableau de données de la réponse\n    setData(response.data.data || []);\n    $2calculateStats(response.data.data || []);'
  );
  
  if (modifiedContent === content) {
    console.log('⚠️ Aucune modification n\'a été apportée à la fonction fetchData. Tentative avec un autre pattern...');
    
    // Tentative alternative
    modifiedContent = content.replace(
      /(const fetchData = async \(\) => \{[\s\S]*?)(setData\(response\.data\);)([\s\S]*?)(calculateStats\(response\.data\);)/g,
      '$1// Extraire le tableau de données de la réponse\n    setData(response.data.data || []);$3calculateStats(response.data.data || []);'
    );
    
    if (modifiedContent === content) {
      console.log('⚠️ La correction automatique a échoué. Veuillez appliquer manuellement les modifications suivantes:');
      console.log('1. Dans la fonction fetchData, remplacez:');
      console.log('   setData(response.data);');
      console.log('   par:');
      console.log('   setData(response.data.data || []);');
      console.log('2. Remplacez également:');
      console.log('   calculateStats(response.data);');
      console.log('   par:');
      console.log('   calculateStats(response.data.data || []);');
      return content;
    }
  }
  
  console.log('✅ Fonction fetchData corrigée pour extraire correctement les données');
  
  // 2. Ajouter une vérification de sécurité dans getFournisseursRisque
  const originalContent = modifiedContent;
  modifiedContent = modifiedContent.replace(
    /(const getFournisseursRisque = \(\) => \{[\s\S]*?)return data/,
    '$1// Vérifier que data est bien un tableau\n    const dataArray = Array.isArray(data) ? data : [];\n    return dataArray'
  );
  
  if (modifiedContent === originalContent) {
    console.log('⚠️ Aucune modification n\'a été apportée à la fonction getFournisseursRisque. Tentative avec un autre pattern...');
    
    // Tentative alternative
    modifiedContent = originalContent.replace(
      /(const getFournisseursRisque = \(\) => \{)([\s\S]*?)(return data)/g,
      '$1$2// Vérifier que data est bien un tableau\n    const dataArray = Array.isArray(data) ? data : [];\n    return dataArray'
    );
    
    if (modifiedContent === originalContent) {
      console.log('⚠️ La correction automatique de getFournisseursRisque a échoué.');
      console.log('Veuillez ajouter manuellement cette vérification au début de la fonction getFournisseursRisque:');
      console.log('const dataArray = Array.isArray(data) ? data : [];');
      console.log('Et remplacer "return data" par "return dataArray"');
    } else {
      console.log('✅ Fonction getFournisseursRisque corrigée avec une vérification de type');
    }
  } else {
    console.log('✅ Fonction getFournisseursRisque corrigée avec une vérification de type');
  }
  
  return modifiedContent;
}

// Corriger le problème
const correctedContent = fixDataFilterError(content);

// Écrire le contenu corrigé directement dans le fichier
fs.writeFileSync(analysePath, correctedContent);
console.log(`\n✅ Corrections appliquées au fichier ${analysePath}`);

console.log('\n=== INSTRUCTIONS POUR FINALISER ===');
console.log('1. Redémarrez le serveur frontend pour appliquer les modifications');
console.log('2. Si vous rencontrez encore des problèmes, vous pouvez restaurer la sauvegarde avec:');
console.log(`   cp "${backupPath}" "${analysePath}"`);
console.log('3. Vérifiez la console du navigateur pour vous assurer que l\'erreur "data.filter is not a function" a été résolue');
