/**
 * Script de diagnostic approfondi pour examiner les en-têtes du fichier Excel
 * Ce script affiche des informations détaillées sur chaque cellule de la première ligne
 */

const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

// Chemin du fichier Excel à analyser - à ajuster selon votre fichier
const excelFilePath = process.argv[2] || path.join(__dirname, 'Fournisseurs_2024.xlsx');

console.log(`Analyse approfondie du fichier Excel: ${excelFilePath}`);

try {
  // Vérifier si le fichier existe
  if (!fs.existsSync(excelFilePath)) {
    console.error(`Le fichier ${excelFilePath} n'existe pas.`);
    console.log('Usage: node diagnose_excel_headers_deep.js [chemin_du_fichier_excel]');
    process.exit(1);
  }

  // Lire le fichier Excel
  const fileBuffer = fs.readFileSync(excelFilePath);
  const workbook = XLSX.read(fileBuffer);
  
  // Afficher des informations sur le workbook
  console.log('\n=== INFORMATIONS SUR LE WORKBOOK ===');
  console.log(`Nombre de feuilles: ${workbook.SheetNames.length}`);
  console.log(`Noms des feuilles: ${workbook.SheetNames.join(', ')}`);
  
  // Utiliser la première feuille
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  
  console.log(`\n=== ANALYSE DE LA FEUILLE: ${sheetName} ===`);
  
  // Obtenir la plage de cellules
  if (!worksheet['!ref']) {
    console.error('La feuille est vide ou ne contient pas de données.');
    process.exit(1);
  }
  
  const range = XLSX.utils.decode_range(worksheet['!ref']);
  console.log(`Plage de la feuille: ${worksheet['!ref']}`);
  console.log(`Première cellule: R${range.s.r}C${range.s.c}`);
  console.log(`Dernière cellule: R${range.e.r}C${range.e.c}`);
  console.log(`Nombre de lignes: ${range.e.r - range.s.r + 1}`);
  console.log(`Nombre de colonnes: ${range.e.c - range.s.c + 1}`);
  
  // Analyser la première ligne (en-têtes)
  console.log('\n=== ANALYSE DÉTAILLÉE DES EN-TÊTES (PREMIÈRE LIGNE) ===');
  console.log('Index | Adresse | Type | Valeur | Format | Formule');
  console.log('-----|---------|------|--------|--------|--------');
  
  const headers = [];
  const headerDetails = [];
  
  for (let C = range.s.c; C <= range.e.c; ++C) {
    const cellAddress = XLSX.utils.encode_cell({r: range.s.r, c: C});
    const cell = worksheet[cellAddress];
    
    let cellType = 'vide';
    let cellValue = '';
    let cellFormat = '';
    let cellFormula = '';
    
    if (cell) {
      cellType = cell.t || 'inconnu';
      cellValue = cell.v !== undefined ? String(cell.v) : '';
      cellFormat = cell.z || '';
      cellFormula = cell.f || '';
      
      if (cellValue.trim() !== '') {
        headers.push(cellValue);
        
        headerDetails.push({
          index: C,
          address: cellAddress,
          type: cellType,
          value: cellValue,
          format: cellFormat,
          formula: cellFormula
        });
      }
    }
    
    console.log(`${C} | ${cellAddress} | ${cellType} | ${cellValue} | ${cellFormat} | ${cellFormula}`);
  }
  
  console.log(`\n=== RÉSUMÉ DES EN-TÊTES TROUVÉS (${headers.length}) ===`);
  console.log(headers.join(', '));
  
  // Analyser les cellules fusionnées
  console.log('\n=== ANALYSE DES CELLULES FUSIONNÉES ===');
  if (worksheet['!merges'] && worksheet['!merges'].length > 0) {
    console.log(`Nombre de zones fusionnées: ${worksheet['!merges'].length}`);
    
    worksheet['!merges'].forEach((merge, index) => {
      console.log(`Fusion #${index + 1}: de ${XLSX.utils.encode_cell({r: merge.s.r, c: merge.s.c})} à ${XLSX.utils.encode_cell({r: merge.e.r, c: merge.e.c})}`);
      
      // Vérifier si cette fusion affecte la première ligne (en-têtes)
      if (merge.s.r <= range.s.r && merge.e.r >= range.s.r) {
        console.log(`  ATTENTION: Cette fusion affecte la ligne d'en-têtes!`);
        
        // Afficher le contenu de la cellule fusionnée
        const cellAddress = XLSX.utils.encode_cell({r: merge.s.r, c: merge.s.c});
        const cell = worksheet[cellAddress];
        
        if (cell) {
          console.log(`  Contenu de la cellule fusionnée: ${cell.v}`);
        } else {
          console.log(`  La cellule fusionnée est vide`);
        }
      }
    });
  } else {
    console.log('Aucune cellule fusionnée trouvée.');
  }
  
  // Analyser les lignes suivantes pour détecter les en-têtes dupliqués
  console.log('\n=== RECHERCHE D\'EN-TÊTES DUPLIQUÉS DANS LES LIGNES SUIVANTES ===');
  const maxRowsToCheck = Math.min(5, range.e.r - range.s.r); // Vérifier jusqu'à 5 lignes après les en-têtes
  
  for (let R = range.s.r + 1; R <= range.s.r + maxRowsToCheck; ++R) {
    let rowValues = [];
    let matchCount = 0;
    
    for (const header of headerDetails) {
      const C = header.index;
      const cellAddress = XLSX.utils.encode_cell({r: R, c: C});
      const cell = worksheet[cellAddress];
      
      if (cell && cell.v !== undefined) {
        rowValues.push(String(cell.v));
        
        if (String(cell.v).toLowerCase() === header.value.toLowerCase()) {
          matchCount++;
        }
      } else {
        rowValues.push('');
      }
    }
    
    const matchPercentage = (matchCount / headerDetails.length) * 100;
    
    console.log(`Ligne ${R + 1}: ${matchCount}/${headerDetails.length} correspondances (${matchPercentage.toFixed(2)}%)`);
    if (matchPercentage > 30) {
      console.log(`  ATTENTION: Cette ligne pourrait être un en-tête dupliqué!`);
      console.log(`  Valeurs: ${rowValues.join(', ')}`);
    }
  }
  
  // Analyser les propriétés cachées
  console.log('\n=== ANALYSE DES PROPRIÉTÉS CACHÉES ===');
  const hiddenProps = [];
  
  for (const prop in worksheet) {
    if (prop.startsWith('!') && prop !== '!ref' && prop !== '!merges') {
      hiddenProps.push({ prop, value: JSON.stringify(worksheet[prop]) });
    }
  }
  
  if (hiddenProps.length > 0) {
    console.log(`Nombre de propriétés cachées: ${hiddenProps.length}`);
    hiddenProps.forEach(({ prop, value }) => {
      console.log(`${prop}: ${value}`);
    });
  } else {
    console.log('Aucune propriété cachée trouvée.');
  }
  
  // Recherche spécifique des colonnes problématiques
  console.log('\n=== RECHERCHE SPÉCIFIQUE DES COLONNES PROBLÉMATIQUES ===');
  const problematicColumns = ['HUYI MODIFICATION', 'PARTNERS TRADUCTION'];
  
  for (const colName of problematicColumns) {
    const matchingHeaders = headerDetails.filter(h => h.value.includes(colName));
    
    if (matchingHeaders.length > 0) {
      console.log(`Colonne problématique "${colName}" trouvée:`);
      matchingHeaders.forEach(h => {
        console.log(`  Cellule ${h.address}: "${h.value}" (type: ${h.type})`);
      });
    } else {
      console.log(`Colonne problématique "${colName}" NON trouvée dans les en-têtes.`);
      
      // Rechercher dans toutes les cellules de la première ligne
      let found = false;
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cellAddress = XLSX.utils.encode_cell({r: range.s.r, c: C});
        const cell = worksheet[cellAddress];
        
        if (cell && cell.v !== undefined && String(cell.v).includes(colName)) {
          console.log(`  Trouvée partiellement dans la cellule ${cellAddress}: "${cell.v}" (type: ${cell.t})`);
          found = true;
        }
      }
      
      if (!found) {
        console.log(`  Aucune correspondance partielle trouvée dans la première ligne.`);
      }
    }
  }
  
  // Générer des recommandations
  console.log('\n=== RECOMMANDATIONS ===');
  
  if (worksheet['!merges'] && worksheet['!merges'].length > 0) {
    const headerMerges = worksheet['!merges'].filter(merge => 
      merge.s.r <= range.s.r && merge.e.r >= range.s.r
    );
    
    if (headerMerges.length > 0) {
      console.log('1. Le fichier contient des cellules fusionnées dans la ligne d\'en-têtes.');
      console.log('   Cela peut causer des problèmes lors de l\'importation. Envisagez de défusionner ces cellules.');
    }
  }
  
  const duplicateHeaders = headers.filter((h, i) => headers.indexOf(h) !== i);
  if (duplicateHeaders.length > 0) {
    console.log(`2. Le fichier contient des en-têtes dupliqués: ${duplicateHeaders.join(', ')}`);
    console.log('   Cela peut causer des problèmes lors de l\'importation. Renommez ces colonnes pour qu\'elles soient uniques.');
  }
  
  console.log('3. Pour résoudre les problèmes d\'importation:');
  console.log('   - Assurez-vous que la première ligne contient uniquement les en-têtes de colonnes');
  console.log('   - Évitez les cellules fusionnées dans la ligne d\'en-têtes');
  console.log('   - Assurez-vous que chaque en-tête est unique');
  console.log('   - Supprimez les espaces en début et fin des noms de colonnes');

} catch (error) {
  console.error('Erreur lors de l\'analyse du fichier Excel:', error);
}
