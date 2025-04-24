/**
 * Script pour corriger l'importation des fichiers Excel
 * Ce script modifie le code pour éviter d'importer la première ligne (titres des colonnes)
 * comme une ligne de données
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

// Modifier la partie qui lit les données du fichier Excel
// Le problème est que la première ligne (titres des colonnes) est également importée comme une ligne de données
const excelDataReadingCode = `    // Lire toutes les données du fichier Excel
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
    });`;

const improvedExcelDataReadingCode = `    // Lire toutes les données du fichier Excel en commençant à la deuxième ligne
    // pour éviter d'importer les titres des colonnes comme une ligne de données
    const rawData = [];
    
    // Parcourir toutes les lignes de données (en commençant à la ligne après les en-têtes)
    for (let R = range.s.r + 1; R <= range.e.r; ++R) {
      const row = {};
      let hasData = false; // Pour vérifier si la ligne contient des données
      
      // Pour chaque colonne, récupérer la valeur ou null
      for (let C = range.s.c; C <= range.e.c; ++C) {
        if (C >= allHeaders.length) continue; // Ignorer les colonnes sans en-tête
        
        const headerName = allHeaders[C];
        if (!headerName) continue; // Ignorer les colonnes sans en-tête
        
        const cellAddress = XLSX.utils.encode_cell({r: R, c: C});
        const cell = worksheet[cellAddress];
        
        // Stocker la valeur de la cellule ou null si elle est vide
        if (cell && cell.v !== undefined && cell.v !== null) {
          row[headerName] = cell.v;
          hasData = true;
          
          // Vérifier si cette ligne est probablement une ligne d'en-tête dupliquée
          // en comparant la valeur avec le nom de la colonne
          if (String(cell.v).toLowerCase() === headerName.toLowerCase()) {
            // Compter combien de colonnes ont des valeurs qui correspondent aux en-têtes
            let matchCount = 0;
            for (let checkC = range.s.c; checkC <= range.e.c && checkC < allHeaders.length; checkC++) {
              const checkHeader = allHeaders[checkC];
              const checkCellAddress = XLSX.utils.encode_cell({r: R, c: checkC});
              const checkCell = worksheet[checkCellAddress];
              
              if (checkCell && checkCell.v !== undefined && checkCell.v !== null) {
                if (String(checkCell.v).toLowerCase() === checkHeader.toLowerCase()) {
                  matchCount++;
                }
              }
            }
            
            // Si plus de 50% des colonnes correspondent aux en-têtes, c'est probablement une ligne d'en-tête
            if (matchCount > allHeaders.length * 0.5) {
              console.log(\`Ligne \${R + 1} ignorée car elle semble être une ligne d'en-tête\`);
              hasData = false;
              break;
            }
          }
        } else {
          row[headerName] = null;
        }
      }
      
      // Ajouter la colonne Score si elle n'existe pas
      if (!scoreExists) {
        row['Score'] = null;
      }
      
      // N'ajouter la ligne que si elle contient des données et n'est pas une ligne d'en-tête
      if (hasData) {
        rawData.push(row);
      }
    }
    
    // Utiliser les données brutes comme données finales
    const data = rawData;`;

// Remplacer le code de lecture des données Excel par la version améliorée
content = content.replace(excelDataReadingCode, improvedExcelDataReadingCode);

// Écrire le contenu modifié dans le fichier
fs.writeFileSync(fournisseursPath, content);
console.log(`Le fichier ${fournisseursPath} a été modifié avec succès.`);
console.log('Les modifications suivantes ont été apportées:');
console.log('1. Amélioration de la lecture des données Excel pour éviter d\'importer la première ligne (titres des colonnes) comme une ligne de données');
console.log('2. Ajout d\'une vérification pour détecter et ignorer les lignes qui semblent être des en-têtes dupliqués');
console.log('\nVeuillez redémarrer le serveur backend pour appliquer les modifications.');
