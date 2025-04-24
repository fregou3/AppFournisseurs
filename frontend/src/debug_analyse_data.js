/**
 * Script de diagnostic pour comprendre et résoudre l'erreur "data.filter is not a function"
 * dans le composant Analyse.js
 * 
 * Ce script crée une version corrigée du composant Analyse.js qui gère correctement
 * la structure de données renvoyée par l'API.
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

// Fonction pour diagnostiquer le problème
function diagnoseDataFilterError(content) {
  console.log('\n=== DIAGNOSTIC DU PROBLÈME ===');
  
  // Vérifier comment les données sont récupérées
  const fetchDataMatch = content.match(/const fetchData = async \(\) => \{[\s\S]*?setData\((.*?)\);/);
  if (fetchDataMatch) {
    console.log(`Données définies avec: setData(${fetchDataMatch[1]})`);
    
    if (fetchDataMatch[1].includes('response.data') && !fetchDataMatch[1].includes('response.data.data')) {
      console.log('PROBLÈME DÉTECTÉ: Les données sont définies avec response.data au lieu de response.data.data');
      console.log('La réponse API a probablement cette structure: { data: [...], total: 123, page: 1, ... }');
    }
  } else {
    console.log('Impossible de trouver la fonction fetchData');
  }
  
  // Vérifier l'utilisation de data.filter
  const filterMatch = content.match(/data\s*\.\s*filter\s*\(/g);
  if (filterMatch) {
    console.log(`\nTrouvé ${filterMatch.length} utilisations de data.filter`);
  }
}

// Fonction pour corriger le problème
function fixDataFilterError(content) {
  console.log('\n=== CORRECTION DU PROBLÈME ===');
  
  // 1. Corriger la fonction fetchData pour extraire correctement les données
  let modifiedContent = content.replace(
    /(const fetchData = async \(\) => \{[\s\S]*?)setData\(response\.data\);([\s\S]*?)calculateStats\(response\.data\);/,
    '$1// Extraire le tableau de données de la réponse\n    setData(response.data.data || []);\n    $2calculateStats(response.data.data || []);'
  );
  
  // 2. Ajouter une vérification de sécurité dans getFournisseursRisque
  modifiedContent = modifiedContent.replace(
    /(const getFournisseursRisque = \(\) => \{[\s\S]*?)return data/,
    '$1// Vérifier que data est bien un tableau\n    const dataArray = Array.isArray(data) ? data : [];\n    return dataArray'
  );
  
  // 3. Ajouter des logs de débogage temporaires
  modifiedContent = modifiedContent.replace(
    /(const fetchData = async \(\) => \{[\s\S]*?try \{)/,
    '$1\n      console.log("Débogage Analyse.js - Début fetchData");'
  );
  
  modifiedContent = modifiedContent.replace(
    /(const response = await axios\.get.*?;)/,
    '$1\n      console.log("Débogage Analyse.js - Structure de la réponse:", response.data);\n      console.log("Débogage Analyse.js - Type de response.data:", typeof response.data);\n      console.log("Débogage Analyse.js - Est-ce un tableau?", Array.isArray(response.data));'
  );
  
  return modifiedContent;
}

// Diagnostiquer le problème
diagnoseDataFilterError(content);

// Corriger le problème
const correctedContent = fixDataFilterError(content);

// Écrire le contenu corrigé dans un nouveau fichier
const correctedPath = path.join(__dirname, 'components', 'Analyse.fixed.js');
fs.writeFileSync(correctedPath, correctedContent);
console.log(`\nFichier corrigé créé: ${correctedPath}`);

console.log('\n=== INSTRUCTIONS POUR APPLIQUER LA CORRECTION ===');
console.log('1. Vérifiez le fichier Analyse.fixed.js pour vous assurer que les modifications sont correctes');
console.log('2. Si tout semble correct, remplacez le fichier Analyse.js par Analyse.fixed.js avec la commande:');
console.log(`   cp "${correctedPath}" "${analysePath}"`);
console.log('3. Redémarrez le serveur frontend pour appliquer les modifications');
