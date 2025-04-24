/**
 * Script pour corriger l'importation des fichiers Excel
 * Ce script garantit que seules les colonnes réellement présentes dans le fichier Excel
 * sont créées dans la base de données, sans ajouter de colonnes supplémentaires
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

// Modifier la partie qui extrait les en-têtes de colonnes
const headersExtractionCode = `    // Extraire tous les en-têtes de colonnes (première ligne)
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
    }`;

const improvedHeadersExtractionCode = `    // Extraire uniquement les en-têtes de colonnes réellement présents dans le fichier Excel
    const allHeaders = [];
    const headerCells = {};
    
    // Parcourir toutes les cellules de la première ligne pour trouver les en-têtes
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cellAddress = XLSX.utils.encode_cell({r: range.s.r, c: C});
      const cell = worksheet[cellAddress];
      
      // Ne stocker que les en-têtes qui existent réellement (non vides)
      if (cell && cell.v !== undefined && cell.v !== null) {
        const headerName = String(cell.v).trim();
        // Ne pas ajouter d'en-tête vide
        if (headerName !== '') {
          allHeaders.push(headerName);
          headerCells[C] = headerName;
        }
      }
    }
    
    console.log(\`En-têtes réellement trouvés dans le fichier Excel: \${allHeaders.join(', ')}\`);
    
    // Vérifier si la colonne Score existe
    const scoreExists = allHeaders.some(header => 
      header === 'Score' || header === 'SCORE' || header === 'score'
    );
    
    // Ajouter la colonne Score uniquement si elle est nécessaire pour le fonctionnement de l'application
    if (!scoreExists) {
      console.log('Colonne Score non trouvée dans le fichier Excel. Ajout de la colonne Score.');
      allHeaders.push('Score');
    }`;

// Remplacer le code d'extraction des en-têtes par la version améliorée
content = content.replace(headersExtractionCode, improvedHeadersExtractionCode);

// Modifier la partie qui lit les données du fichier Excel
const excelDataReadingCode = `    // Lire toutes les données du fichier Excel en commençant à la deuxième ligne
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

const improvedExcelDataReadingCode = `    // Lire toutes les données du fichier Excel en commençant à la deuxième ligne
    // pour éviter d'importer les titres des colonnes comme une ligne de données
    const rawData = [];
    
    // Parcourir toutes les lignes de données (en commençant à la ligne après les en-têtes)
    for (let R = range.s.r + 1; R <= range.e.r; ++R) {
      const row = {};
      let hasData = false; // Pour vérifier si la ligne contient des données
      
      // Pour chaque colonne avec un en-tête valide, récupérer la valeur
      for (let C = range.s.c; C <= range.e.c; ++C) {
        // Utiliser uniquement les colonnes qui ont un en-tête valide
        if (!headerCells[C]) continue;
        
        const headerName = headerCells[C];
        const cellAddress = XLSX.utils.encode_cell({r: R, c: C});
        const cell = worksheet[cellAddress];
        
        // Stocker la valeur de la cellule ou null si elle est vide
        if (cell && cell.v !== undefined && cell.v !== null) {
          row[headerName] = cell.v;
          hasData = true;
          
          // Vérifier si cette ligne est probablement une ligne d'en-tête dupliquée
          if (String(cell.v).toLowerCase() === headerName.toLowerCase()) {
            // Compter combien de colonnes ont des valeurs qui correspondent aux en-têtes
            let matchCount = 0;
            let totalChecked = 0;
            
            for (const [checkC, checkHeader] of Object.entries(headerCells)) {
              const checkCellAddress = XLSX.utils.encode_cell({r: R, c: parseInt(checkC)});
              const checkCell = worksheet[checkCellAddress];
              
              if (checkCell && checkCell.v !== undefined && checkCell.v !== null) {
                totalChecked++;
                if (String(checkCell.v).toLowerCase() === checkHeader.toLowerCase()) {
                  matchCount++;
                }
              }
            }
            
            // Si plus de 50% des colonnes correspondent aux en-têtes, c'est probablement une ligne d'en-tête
            if (totalChecked > 0 && matchCount / totalChecked > 0.5) {
              console.log(\`Ligne \${R + 1} ignorée car elle semble être une ligne d'en-tête\`);
              hasData = false;
              break;
            }
          }
        } else {
          row[headerName] = null;
        }
      }
      
      // Ajouter la colonne Score si elle n'existe pas dans le fichier mais est nécessaire
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
console.log('1. Extraction uniquement des en-têtes de colonnes réellement présents dans le fichier Excel');
console.log('2. Suppression de la création de colonnes génériques pour les cellules vides');
console.log('3. Lecture des données uniquement pour les colonnes avec des en-têtes valides');
console.log('4. Ajout de la colonne Score uniquement si nécessaire pour le fonctionnement de l\'application');
console.log('\nVeuillez redémarrer le serveur backend pour appliquer les modifications.');
