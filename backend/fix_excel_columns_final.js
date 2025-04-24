/**
 * Script de correction finale pour l'importation Excel
 * Ce script garantit que seules les colonnes réellement présentes dans le fichier Excel
 * sont utilisées pour créer la table dans la base de données
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

// Remplacer complètement la partie qui extrait les en-têtes du fichier Excel
const excelReadingCodePattern = /\/\/ Lire le fichier Excel[\s\S]*?const data = XLSX\.utils\.sheet_to_json\([^)]*\);/;

const improvedExcelReadingCode = `    // Lire le fichier Excel
    console.log(\`Lecture du fichier Excel: \${file.name}\`);
    const workbook = XLSX.read(file.data);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Obtenir la plage de cellules du fichier Excel
    const range = XLSX.utils.decode_range(worksheet['!ref']);
    console.log(\`Plage du fichier Excel: \${worksheet['!ref']}\`);
    
    // Extraire les en-têtes directement à partir de la première ligne
    const realHeaders = [];
    
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
    
    console.log(\`En-têtes réellement trouvés dans le fichier Excel (\${realHeaders.length}): \${realHeaders.join(', ')}\`);
    
    // Vérifier si la colonne Score existe
    const scoreExists = realHeaders.some(header => 
      header.toLowerCase() === 'score'
    );
    
    if (!scoreExists) {
      console.log('Colonne Score non trouvée dans le fichier Excel. Ajout de la colonne Score.');
      realHeaders.push('Score');
    }
    
    // Lire les données ligne par ligne (en sautant la première ligne qui contient les en-têtes)
    const data = [];
    
    // Créer un mappage entre les indices de colonnes et les en-têtes
    const headerMap = {};
    realHeaders.forEach((header, index) => {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cellAddress = XLSX.utils.encode_cell({r: range.s.r, c: C});
        const cell = worksheet[cellAddress];
        
        if (cell && cell.v !== undefined && String(cell.v).trim() === header) {
          headerMap[C] = header;
          break;
        }
      }
    });
    
    // Parcourir toutes les lignes de données (en commençant à la ligne après les en-têtes)
    for (let R = range.s.r + 1; R <= range.e.r; ++R) {
      const row = {};
      let hasData = false; // Pour vérifier si la ligne contient des données
      
      // Pour chaque colonne avec un en-tête valide, récupérer la valeur
      for (const [colIndex, headerName] of Object.entries(headerMap)) {
        const C = parseInt(colIndex);
        const cellAddress = XLSX.utils.encode_cell({r: R, c: C});
        const cell = worksheet[cellAddress];
        
        // Stocker la valeur de la cellule ou null si elle est vide
        if (cell && cell.v !== undefined && cell.v !== null) {
          row[headerName] = cell.v;
          hasData = true;
        } else {
          row[headerName] = null;
        }
      }
      
      // Ajouter la colonne Score si elle n'existe pas dans le fichier mais est nécessaire
      if (!scoreExists) {
        row['Score'] = null;
      }
      
      // Vérifier si cette ligne est probablement un en-tête dupliqué
      let isHeaderRow = false;
      if (hasData) {
        let matchCount = 0;
        let totalChecked = 0;
        
        for (const [colIndex, headerName] of Object.entries(headerMap)) {
          const C = parseInt(colIndex);
          const cellAddress = XLSX.utils.encode_cell({r: R, c: C});
          const cell = worksheet[cellAddress];
          
          if (cell && cell.v !== undefined && cell.v !== null) {
            totalChecked++;
            if (String(cell.v).toLowerCase() === headerName.toLowerCase()) {
              matchCount++;
            }
          }
        }
        
        // Si plus de 50% des colonnes correspondent aux en-têtes, c'est probablement une ligne d'en-tête
        if (totalChecked > 0 && matchCount / totalChecked > 0.5) {
          console.log(\`Ligne \${R + 1} ignorée car elle semble être une ligne d'en-tête\`);
          isHeaderRow = true;
        }
      }
      
      // N'ajouter la ligne que si elle contient des données et n'est pas une ligne d'en-tête
      if (hasData && !isHeaderRow) {
        data.push(row);
      }
    }`;

// Remplacer le code de lecture des données Excel par la version améliorée
const match = content.match(excelReadingCodePattern);

if (match) {
  content = content.replace(match[0], improvedExcelReadingCode);
  console.log("Code de lecture des données Excel remplacé avec succès.");
} else {
  console.error("Impossible de trouver le code de lecture des données Excel. Aucune modification n'a été effectuée.");
  process.exit(1);
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
  const normalizeMatch = content.match(normalizeColumnNamePattern);
  
  if (normalizeMatch) {
    content = content.replace(normalizeMatch[0], improvedNormalizeColumnNameFunction);
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
console.log('1. Réécriture complète de la méthode d\'extraction des en-têtes du fichier Excel');
console.log('2. Lecture directe des cellules de la première ligne pour identifier les en-têtes réels');
console.log('3. Lecture ligne par ligne des données pour éviter les problèmes de fusion de colonnes');
console.log('4. Filtrage des lignes qui semblent être des en-têtes dupliqués');
console.log('5. Amélioration de la fonction de normalisation des noms de colonnes');
console.log('\nVeuillez redémarrer le serveur backend pour appliquer les modifications.');
