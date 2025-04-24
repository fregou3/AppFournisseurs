/**
 * Script simplifié pour corriger l'importation des fichiers Excel
 * Ce script garantit que toutes les colonnes du fichier Excel sont créées dans la base de données,
 * même si elles sont vides
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

// Modifier la fonction de lecture des données Excel pour préserver toutes les colonnes
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
    
    // Extraire tous les en-têtes de colonnes (première ligne)
    const allHeaders = [];
    
    // Parcourir toutes les cellules de la première ligne pour trouver les en-têtes
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cellAddress = XLSX.utils.encode_cell({r: range.s.r, c: C});
      const cell = worksheet[cellAddress];
      
      // Stocker l'en-tête, même s'il est vide
      let headerName;
      if (cell && cell.v !== undefined && cell.v !== null) {
        headerName = String(cell.v).trim();
        // Si l'en-tête est vide après le trim, utiliser un nom générique
        if (headerName === '') {
          headerName = \`Column_\${C}\`;
        }
      } else {
        // En-tête vide, utiliser un nom générique
        headerName = \`Column_\${C}\`;
      }
      
      allHeaders.push(headerName);
    }
    
    console.log(\`En-têtes trouvés dans le fichier Excel: \${allHeaders.join(', ')}\`);
    
    // Vérifier si la colonne Score existe
    const scoreExists = allHeaders.some(header => 
      header === 'Score' || header === 'SCORE' || header === 'score'
    );
    
    if (!scoreExists) {
      console.log('Colonne Score non trouvée dans le fichier Excel. Ajout de la colonne Score.');
      allHeaders.push('Score');
    }
    
    // Lire toutes les données du fichier Excel
    const rawData = XLSX.utils.sheet_to_json(worksheet, {
      raw: true,
      defval: null,
      blankrows: false,
      header: allHeaders
    });
    
    // Créer un nouvel ensemble de données avec toutes les colonnes
    const data = rawData.map(row => {
      const newRow = {};
      
      // S'assurer que toutes les colonnes sont présentes
      allHeaders.forEach(header => {
        newRow[header] = row[header] !== undefined ? row[header] : null;
      });
      
      return newRow;
    });
    
    console.log(\`Nombre de lignes lues dans le fichier Excel: \${data.length}\`);`;

// Remplacer le code de lecture Excel par la version améliorée
content = content.replace(excelReadingCode, improvedExcelReadingCode);

// Modifier la partie qui extrait les noms de colonnes
const extractColumnsCode = `    // Extraire les noms de colonnes à partir de la première ligne
    const columns = Object.keys(data[0]);
    console.log(\`Colonnes trouvées dans le fichier Excel: \${columns.join(', ')}\`);`;

const improvedExtractColumnsCode = `    // Utiliser les en-têtes déjà extraits pour les colonnes
    const columns = allHeaders;
    console.log(\`Colonnes utilisées pour la création de la table: \${columns.join(', ')}\`);`;

// Remplacer le code d'extraction des colonnes par la version améliorée
content = content.replace(extractColumnsCode, improvedExtractColumnsCode);

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
content = content.replace(normalizeColumnNameFunction, improvedNormalizeColumnNameFunction);

// Écrire le contenu modifié dans le fichier
fs.writeFileSync(fournisseursPath, content);
console.log(`Le fichier ${fournisseursPath} a été modifié avec succès.`);
console.log('Les modifications suivantes ont été apportées:');
console.log('1. Amélioration de la lecture des fichiers Excel pour préserver toutes les colonnes, même vides');
console.log('2. Extraction directe des en-têtes de colonnes à partir de la première ligne du fichier Excel');
console.log('3. Ajout automatique de la colonne Score si elle n\'existe pas dans le fichier Excel');
console.log('4. Préservation de la casse pour certaines colonnes importantes');
console.log('\nVeuillez redémarrer le serveur backend pour appliquer les modifications.');
