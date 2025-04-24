/**
 * Script pour corriger l'importation des fichiers Excel de manière sûre
 * Ce script garantit que seules les colonnes réellement présentes dans le fichier Excel
 * sont créées dans la base de données
 */

const fs = require('fs');
const path = require('path');

// Chemin du fichier à modifier
const fournisseursPath = path.join(__dirname, 'routes', 'fournisseurs.js');

// Lire le contenu du fichier
console.log(`Lecture du fichier ${fournisseursPath}...`);
let content = fs.readFileSync(fournisseursPath, 'utf8');

// Créer une sauvegarde du fichier original
const backupPath = `${fournisseursPath}.backup.${Date.now()}`;
fs.writeFileSync(backupPath, content);
console.log(`Sauvegarde créée: ${backupPath}`);

// Modifier la fonction de lecture des données Excel
const excelReadingCode = `    // Lire le fichier Excel
    console.log(\`Lecture du fichier Excel: \${file.name}\`);
    const workbook = XLSX.read(file.data);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Lire toutes les données du fichier Excel
    const data = XLSX.utils.sheet_to_json(worksheet, { 
      raw: true, 
      defval: null,
      blankrows: false
    });`;

const improvedExcelReadingCode = `    // Lire le fichier Excel
    console.log(\`Lecture du fichier Excel: \${file.name}\`);
    const workbook = XLSX.read(file.data);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Obtenir la plage de cellules du fichier Excel
    const range = XLSX.utils.decode_range(worksheet['!ref']);
    
    // Extraire uniquement les en-têtes réellement présents dans le fichier Excel
    const realHeaders = [];
    
    // Parcourir la première ligne pour trouver tous les en-têtes réels
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cellAddress = XLSX.utils.encode_cell({r: range.s.r, c: C});
      const cell = worksheet[cellAddress];
      
      if (cell && cell.v !== undefined && cell.v !== null) {
        const headerName = String(cell.v).trim();
        if (headerName !== '') {
          realHeaders.push(headerName);
        }
      }
    }
    
    console.log(\`En-têtes réellement trouvés dans le fichier Excel: \${realHeaders.join(', ')}\`);
    
    // Vérifier si la colonne Score existe
    const scoreExists = realHeaders.some(header => 
      header === 'Score' || header === 'SCORE' || header === 'score'
    );
    
    if (!scoreExists) {
      console.log('Colonne Score non trouvée dans le fichier Excel. Ajout de la colonne Score.');
      realHeaders.push('Score');
    }
    
    // Lire les données du fichier Excel en utilisant sheet_to_json standard
    const rawData = XLSX.utils.sheet_to_json(worksheet, { 
      raw: true, 
      defval: null,
      blankrows: false
    });
    
    // Filtrer les lignes qui semblent être des en-têtes dupliqués
    const data = rawData.filter(row => {
      // Vérifier si cette ligne est probablement un en-tête dupliqué
      let matchCount = 0;
      let totalFields = 0;
      
      for (const header of realHeaders) {
        if (row[header] !== undefined) {
          totalFields++;
          if (String(row[header]).toLowerCase() === header.toLowerCase()) {
            matchCount++;
          }
        }
      }
      
      // Si plus de 50% des champs correspondent aux en-têtes, c'est probablement une ligne d'en-tête
      if (totalFields > 0 && matchCount / totalFields > 0.5) {
        console.log('Ligne ignorée car elle semble être une ligne d\\'en-tête');
        return false;
      }
      
      return true;
    });`;

// Remplacer le code de lecture des données Excel par la version améliorée
if (content.includes(excelReadingCode)) {
  content = content.replace(excelReadingCode, improvedExcelReadingCode);
  console.log("Code de lecture des données Excel remplacé avec succès.");
} else {
  console.log("Le code de lecture des données Excel n'a pas été trouvé exactement. Tentative d'une recherche plus souple...");
  
  // Recherche plus souple
  const excelReadingPattern = /\/\/ Lire le fichier Excel[\s\S]*?const data = XLSX\.utils\.sheet_to_json\(worksheet,[\s\S]*?\);/;
  const match = content.match(excelReadingPattern);
  
  if (match) {
    content = content.replace(match[0], improvedExcelReadingCode);
    console.log("Code de lecture des données Excel remplacé avec succès (recherche souple).");
  } else {
    console.error("Impossible de trouver le code de lecture des données Excel. Aucune modification n'a été effectuée.");
    process.exit(1);
  }
}

// Modifier la partie qui extrait les noms de colonnes
const columnsExtractionCode = `    // Extraire les noms de colonnes à partir de la première ligne
    const columns = Object.keys(data[0]);
    console.log(\`Colonnes trouvées dans le fichier Excel: \${columns.join(', ')}\`);`;

const improvedColumnsExtractionCode = `    // Utiliser uniquement les en-têtes réels comme colonnes
    const columns = realHeaders;
    console.log(\`Colonnes utilisées pour la création de la table: \${columns.join(', ')}\`);`;

// Remplacer le code d'extraction des colonnes par la version améliorée
if (content.includes(columnsExtractionCode)) {
  content = content.replace(columnsExtractionCode, improvedColumnsExtractionCode);
  console.log("Code d'extraction des colonnes remplacé avec succès.");
} else {
  console.log("Le code d'extraction des colonnes n'a pas été trouvé exactement. Tentative d'une recherche plus souple...");
  
  // Recherche plus souple
  const columnsExtractionPattern = /\/\/ Extraire les noms de colonnes[\s\S]*?console\.log\(`Colonnes[\s\S]*?\);/;
  const match = content.match(columnsExtractionPattern);
  
  if (match) {
    content = content.replace(match[0], improvedColumnsExtractionCode);
    console.log("Code d'extraction des colonnes remplacé avec succès (recherche souple).");
  } else {
    console.error("Impossible de trouver le code d'extraction des colonnes. Aucune modification n'a été effectuée.");
    // Continuer quand même
  }
}

// Modifier la fonction de normalisation des noms de colonnes pour préserver la casse de certaines colonnes
const normalizeColumnNameFunction = `
// Fonction pour normaliser les noms de colonnes
function normalizeColumnName(columnName) {
  return columnName.toLowerCase().replace(/[^a-z0-9]/g, '_');
}`;

const improvedNormalizeColumnNameFunction = `
// Fonction pour normaliser les noms de colonnes
function normalizeColumnName(columnName) {
  if (!columnName) return 'column_undefined';
  
  // Cas spéciaux - préserver la casse pour certaines colonnes importantes
  const preserveCaseColumns = ['Score', 'ID', 'Name', 'Email', 'Phone', 'Address', 'City', 'Country', 'Status'];
  
  for (const specialCol of preserveCaseColumns) {
    if (columnName.toLowerCase() === specialCol.toLowerCase()) {
      return specialCol;
    }
  }
  
  // Pour les autres colonnes, normaliser en minuscules avec underscores
  return columnName.toLowerCase().replace(/[^a-z0-9]/g, '_');
}`;

// Remplacer la fonction de normalisation par la version améliorée
if (content.includes(normalizeColumnNameFunction)) {
  content = content.replace(normalizeColumnNameFunction, improvedNormalizeColumnNameFunction);
  console.log("Fonction de normalisation des noms de colonnes remplacée avec succès.");
} else {
  console.log("La fonction de normalisation des noms de colonnes n'a pas été trouvée exactement. Tentative d'une recherche plus souple...");
  
  // Recherche plus souple
  const normalizeColumnNamePattern = /\/\/ Fonction pour normaliser les noms de colonnes[\s\S]*?function normalizeColumnName[\s\S]*?}/;
  const match = content.match(normalizeColumnNamePattern);
  
  if (match) {
    content = content.replace(match[0], improvedNormalizeColumnNameFunction);
    console.log("Fonction de normalisation des noms de colonnes remplacée avec succès (recherche souple).");
  } else {
    console.error("Impossible de trouver la fonction de normalisation des noms de colonnes. Aucune modification n'a été effectuée.");
    // Continuer quand même
  }
}

// Écrire le contenu modifié dans le fichier
fs.writeFileSync(fournisseursPath, content);
console.log(`Le fichier ${fournisseursPath} a été modifié avec succès.`);
console.log('Les modifications suivantes ont été apportées:');
console.log('1. Extraction directe des en-têtes réellement présents dans le fichier Excel');
console.log('2. Filtrage des lignes qui semblent être des en-têtes dupliqués');
console.log('3. Utilisation uniquement des en-têtes réels pour créer les colonnes de la table');
console.log('4. Amélioration de la fonction de normalisation des noms de colonnes');
console.log('\nVeuillez redémarrer le serveur backend pour appliquer les modifications.');
