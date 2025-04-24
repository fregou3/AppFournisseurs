/**
 * Script pour tester l'importation du fichier Fournisseurs_2024.xlsx
 */

const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

// Chemin du fichier Excel
const excelFilePath = path.join(__dirname, '..', '20042025', 'Fournisseurs_2024.xlsx');

// Vérifier si le fichier existe
if (!fs.existsSync(excelFilePath)) {
  console.error(`Le fichier ${excelFilePath} n'existe pas.`);
  process.exit(1);
}

// Lire le fichier Excel
console.log(`Lecture du fichier Excel: ${excelFilePath}`);
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
    headers.push(`Column_${C}`);
  }
}

console.log('\n=== En-têtes trouvés dans le fichier Excel ===');
console.log(headers);

// Vérifier si la colonne Score existe
const scoreExists = headers.some(header => 
  header === 'Score' || header === 'SCORE' || header === 'score'
);

console.log(`\nColonne Score trouvée: ${scoreExists ? 'Oui' : 'Non'}`);

// Lire toutes les données du fichier Excel avec les en-têtes personnalisés
const data = XLSX.utils.sheet_to_json(worksheet, { 
  raw: true, 
  defval: null,
  blankrows: false,
  header: headers
});

console.log(`\nNombre de lignes lues: ${data.length}`);
console.log(`Nombre de colonnes: ${headers.length}`);

// Afficher les 5 premières lignes pour vérification
console.log('\n=== Aperçu des 5 premières lignes ===');
for (let i = 0; i < Math.min(5, data.length); i++) {
  console.log(`Ligne ${i + 1}:`, data[i]);
}

// Vérifier les valeurs de la colonne Score si elle existe
if (scoreExists) {
  const scoreColumn = headers.find(header => 
    header === 'Score' || header === 'SCORE' || header === 'score'
  );
  
  console.log(`\n=== Valeurs de la colonne ${scoreColumn} ===`);
  const scoreValues = data.map(row => row[scoreColumn]);
  const nonNullValues = scoreValues.filter(value => value !== null && value !== undefined);
  
  console.log(`Total des valeurs: ${scoreValues.length}`);
  console.log(`Valeurs non nulles: ${nonNullValues.length}`);
  
  if (nonNullValues.length > 0) {
    console.log(`Exemples de valeurs: ${nonNullValues.slice(0, 5).join(', ')}`);
  } else {
    console.log('Toutes les valeurs sont nulles ou non définies');
  }
}

console.log('\nTest d\'importation terminé.');
