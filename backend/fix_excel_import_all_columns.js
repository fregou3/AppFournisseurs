/**
 * Script pour s'assurer que toutes les colonnes présentes dans le fichier Excel
 * sont créées dans la base de données, même si elles sont vides
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
    const headers = [];
    const headerCells = {};
    
    // Parcourir toutes les cellules de la première ligne pour trouver les en-têtes
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cellAddress = XLSX.utils.encode_cell({r: range.s.r, c: C});
      const cell = worksheet[cellAddress];
      
      // Stocker l'en-tête, même s'il est vide
      let headerName;
      if (cell && cell.v) {
        headerName = cell.v.toString();
      } else {
        // En-tête vide, utiliser un nom générique
        headerName = \`Column_\${C}\`;
      }
      
      headers.push(headerName);
      headerCells[C] = headerName;
    }
    
    console.log(\`En-têtes trouvés dans le fichier Excel: \${headers.join(', ')}\`);
    
    // Créer un ensemble de données complet avec toutes les colonnes
    const data = [];
    
    // Parcourir toutes les lignes de données (en sautant la ligne d'en-tête)
    for (let R = range.s.r + 1; R <= range.e.r; ++R) {
      const row = {};
      
      // Pour chaque colonne, récupérer la valeur ou null
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const headerName = headerCells[C];
        const cellAddress = XLSX.utils.encode_cell({r: R, c: C});
        const cell = worksheet[cellAddress];
        
        // Stocker la valeur de la cellule ou null si elle est vide
        if (cell && cell.v !== undefined) {
          row[headerName] = cell.v;
        } else {
          row[headerName] = null;
        }
      }
      
      // Ajouter la ligne aux données
      data.push(row);
    }
    
    console.log(\`Nombre de lignes lues dans le fichier Excel: \${data.length}\`);
    console.log(\`Nombre de colonnes lues dans le fichier Excel: \${headers.length}\`);`;

// Remplacer le code de lecture Excel par la version améliorée
content = content.replace(excelReadingCode, improvedExcelReadingCode);

// Modifier la partie qui extrait les noms de colonnes
const extractColumnsCode = `    // Extraire les noms de colonnes à partir de la première ligne
    const columns = Object.keys(data[0]);
    console.log(\`Colonnes trouvées dans le fichier Excel: \${columns.join(', ')}\`);`;

const improvedExtractColumnsCode = `    // Utiliser les en-têtes déjà extraits
    const columns = headers;
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
console.log('3. Création d\'un ensemble de données complet avec toutes les colonnes pour chaque ligne');
console.log('4. Préservation de la casse pour certaines colonnes importantes');
console.log('\nVeuillez redémarrer le serveur backend pour appliquer les modifications.');
