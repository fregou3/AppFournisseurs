/**
 * Script pour s'assurer que toutes les colonnes du fichier Excel sont créées dans la table
 * même si elles sont vides
 */

const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

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
const excelReadingCode = `
    // Lire le fichier Excel
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

const improvedExcelReadingCode = `
    // Lire le fichier Excel
    console.log(\`Lecture du fichier Excel: \${file.name}\`);
    const workbook = XLSX.read(file.data);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Obtenir la plage de cellules du fichier Excel
    const range = XLSX.utils.decode_range(worksheet['!ref']);
    
    // Extraire les en-têtes de colonnes (première ligne)
    const headers = [];
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cellAddress = XLSX.utils.encode_cell({r: range.s.r, c: C});
      const cell = worksheet[cellAddress];
      if (cell && cell.v) {
        headers.push(cell.v.toString());
      } else {
        // En-tête vide, utiliser un nom générique
        headers.push(\`Column_\${C}\`);
      }
    }
    
    console.log(\`En-têtes trouvés dans le fichier Excel: \${headers.join(', ')}\`);
    
    // Lire toutes les données du fichier Excel avec les en-têtes personnalisés
    const rawData = XLSX.utils.sheet_to_json(worksheet, { 
      raw: true, 
      defval: null,
      blankrows: false,
      header: headers
    });
    
    // Créer un nouvel ensemble de données avec toutes les colonnes, même vides
    const data = [];
    for (const row of rawData) {
      const newRow = {};
      // S'assurer que toutes les colonnes sont présentes, même vides
      for (const header of headers) {
        newRow[header] = row[header] !== undefined ? row[header] : null;
      }
      data.push(newRow);
    }
    
    // Vérifier spécifiquement que la colonne Score existe
    if (!headers.includes('Score') && !headers.includes('SCORE') && !headers.includes('score')) {
      console.log('Colonne Score non trouvée dans le fichier Excel. Ajout de la colonne Score.');
      headers.push('Score');
      data.forEach(row => {
        row['Score'] = null;
      });
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
console.log('2. Modification de la fonction de normalisation des noms de colonnes pour préserver la casse de certaines colonnes importantes');
console.log('3. Ajout automatique de la colonne Score si elle n\'existe pas dans le fichier Excel');
console.log('\nVeuillez redémarrer le serveur backend pour appliquer les modifications.');

// Créer un script pour tester l'importation du fichier Excel spécifique
const testImportScriptPath = path.join(__dirname, 'test_import_fournisseurs_2024.js');
const testImportScript = `/**
 * Script pour tester l'importation du fichier Fournisseurs_2024.xlsx
 */

const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

// Chemin du fichier Excel
const excelFilePath = path.join(__dirname, '..', '20042025', 'Fournisseurs_2024.xlsx');

// Vérifier si le fichier existe
if (!fs.existsSync(excelFilePath)) {
  console.error(\`Le fichier \${excelFilePath} n'existe pas.\`);
  process.exit(1);
}

// Lire le fichier Excel
console.log(\`Lecture du fichier Excel: \${excelFilePath}\`);
const workbook = XLSX.readFile(excelFilePath);
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];

// Obtenir la plage de cellules du fichier Excel
const range = XLSX.utils.decode_range(worksheet['!ref']);

// Extraire les en-têtes de colonnes (première ligne)
const headers = [];
for (let C = range.s.c; C <= range.e.c; ++C) {
  const cellAddress = XLSX.utils.encode_cell({r: range.s.r, c: C});
  const cell = worksheet[cellAddress];
  if (cell && cell.v) {
    headers.push(cell.v.toString());
  } else {
    // En-tête vide, utiliser un nom générique
    headers.push(\`Column_\${C}\`);
  }
}

console.log('\\n=== En-têtes trouvés dans le fichier Excel ===');
console.log(headers);

// Vérifier si la colonne Score existe
const scoreExists = headers.some(header => 
  header === 'Score' || header === 'SCORE' || header === 'score'
);

console.log(\`\\nColonne Score trouvée: \${scoreExists ? 'Oui' : 'Non'}\`);

// Lire toutes les données du fichier Excel avec les en-têtes personnalisés
const data = XLSX.utils.sheet_to_json(worksheet, { 
  raw: true, 
  defval: null,
  blankrows: false,
  header: headers
});

console.log(\`\\nNombre de lignes lues: \${data.length}\`);
console.log(\`Nombre de colonnes: \${headers.length}\`);

// Afficher les 5 premières lignes pour vérification
console.log('\\n=== Aperçu des 5 premières lignes ===');
for (let i = 0; i < Math.min(5, data.length); i++) {
  console.log(\`Ligne \${i + 1}:\`, data[i]);
}

// Vérifier les valeurs de la colonne Score si elle existe
if (scoreExists) {
  const scoreColumn = headers.find(header => 
    header === 'Score' || header === 'SCORE' || header === 'score'
  );
  
  console.log(\`\\n=== Valeurs de la colonne \${scoreColumn} ===\`);
  const scoreValues = data.map(row => row[scoreColumn]);
  const nonNullValues = scoreValues.filter(value => value !== null && value !== undefined);
  
  console.log(\`Total des valeurs: \${scoreValues.length}\`);
  console.log(\`Valeurs non nulles: \${nonNullValues.length}\`);
  
  if (nonNullValues.length > 0) {
    console.log(\`Exemples de valeurs: \${nonNullValues.slice(0, 5).join(', ')}\`);
  } else {
    console.log('Toutes les valeurs sont nulles ou non définies');
  }
}

console.log('\\nTest d\\'importation terminé.');
`;

// Écrire le script de test
fs.writeFileSync(testImportScriptPath, testImportScript);
console.log(`\nScript de test créé: ${testImportScriptPath}`);
console.log('Pour tester l\'importation du fichier Excel, exécutez:');
console.log('node test_import_fournisseurs_2024.js');
