/**
 * Script de diagnostic pour comprendre pourquoi certaines colonnes sont détectées
 * alors qu'elles ne sont pas dans le fichier Excel
 */

const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

// Chemin du fichier Excel à analyser
const excelFilePath = path.join(__dirname, '..', '20042025', 'Fournisseurs_2024.xlsx');

// Vérifier si le fichier existe
if (!fs.existsSync(excelFilePath)) {
  console.error(`Le fichier ${excelFilePath} n'existe pas.`);
  process.exit(1);
}

console.log(`Analyse du fichier Excel: ${excelFilePath}`);

// Lire le fichier Excel
const workbook = XLSX.readFile(excelFilePath);
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];

// Obtenir la plage de cellules du fichier Excel
const range = XLSX.utils.decode_range(worksheet['!ref']);

console.log(`Plage du fichier Excel: ${worksheet['!ref']}`);
console.log(`Première ligne: ${range.s.r}, Dernière ligne: ${range.e.r}`);
console.log(`Première colonne: ${range.s.c}, Dernière colonne: ${range.e.c}`);

// Analyser en détail la première ligne (en-têtes)
console.log('\n=== Analyse détaillée des en-têtes (première ligne) ===');
const headerDetails = [];

for (let C = range.s.c; C <= range.e.c; ++C) {
  const cellAddress = XLSX.utils.encode_cell({r: range.s.r, c: C});
  const cell = worksheet[cellAddress];
  
  let headerInfo = {
    column: C,
    address: cellAddress,
    value: cell ? cell.v : null,
    type: cell ? cell.t : null,
    raw: cell || null
  };
  
  headerDetails.push(headerInfo);
  
  console.log(`Colonne ${C} (${cellAddress}): ${headerInfo.value !== null ? `"${headerInfo.value}"` : 'vide'} (type: ${headerInfo.type || 'N/A'})`);
}

// Vérifier spécifiquement les colonnes problématiques
console.log('\n=== Recherche des colonnes problématiques ===');
const problematicColumns = ['HUYI MODIFICATION', 'HUYI  MODIFICATION', 'PARTNERS TRADUCTION'];

for (const colName of problematicColumns) {
  const found = headerDetails.find(h => h.value === colName);
  if (found) {
    console.log(`Colonne "${colName}" trouvée à l'adresse ${found.address} (colonne ${found.column})`);
  } else {
    console.log(`Colonne "${colName}" NON trouvée dans les en-têtes`);
  }
}

// Vérifier s'il y a des colonnes avec des noms similaires
console.log('\n=== Recherche de colonnes avec des noms similaires ===');
for (const colName of problematicColumns) {
  const similar = headerDetails.filter(h => 
    h.value && 
    typeof h.value === 'string' && 
    h.value.toLowerCase().includes(colName.toLowerCase().split(' ')[0])
  );
  
  if (similar.length > 0) {
    console.log(`Colonnes similaires à "${colName}":`);
    similar.forEach(s => {
      console.log(`  - "${s.value}" à l'adresse ${s.address} (colonne ${s.column})`);
    });
  } else {
    console.log(`Aucune colonne similaire à "${colName}" trouvée`);
  }
}

// Tester différentes méthodes de lecture du fichier Excel
console.log('\n=== Test de différentes méthodes de lecture ===');

// Méthode 1: sheet_to_json standard
const data1 = XLSX.utils.sheet_to_json(worksheet);
const headers1 = data1.length > 0 ? Object.keys(data1[0]) : [];
console.log('Méthode 1 (sheet_to_json standard):');
console.log(`Nombre d'en-têtes: ${headers1.length}`);
console.log(`En-têtes: ${headers1.join(', ')}`);

// Méthode 2: sheet_to_json avec header: 1 (première ligne comme en-têtes)
const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
const headers2 = rawData.length > 0 ? rawData[0] : [];
console.log('\nMéthode 2 (sheet_to_json avec header: 1):');
console.log(`Nombre d'en-têtes: ${headers2.length}`);
console.log(`En-têtes: ${headers2.join(', ')}`);

// Méthode 3: Lecture directe des cellules
const headers3 = [];
for (let C = range.s.c; C <= range.e.c; ++C) {
  const cellAddress = XLSX.utils.encode_cell({r: range.s.r, c: C});
  const cell = worksheet[cellAddress];
  if (cell && cell.v !== undefined && cell.v !== null) {
    headers3.push(cell.v);
  }
}
console.log('\nMéthode 3 (lecture directe des cellules):');
console.log(`Nombre d'en-têtes: ${headers3.length}`);
console.log(`En-têtes: ${headers3.join(', ')}`);

// Vérifier si les colonnes problématiques sont présentes dans chaque méthode
console.log('\n=== Vérification des colonnes problématiques dans chaque méthode ===');
for (const colName of problematicColumns) {
  console.log(`Colonne "${colName}":`);
  console.log(`  - Méthode 1: ${headers1.includes(colName) ? 'Présente' : 'Absente'}`);
  console.log(`  - Méthode 2: ${headers2.includes(colName) ? 'Présente' : 'Absente'}`);
  console.log(`  - Méthode 3: ${headers3.includes(colName) ? 'Présente' : 'Absente'}`);
}

console.log('\nDiagnostic terminé.');
