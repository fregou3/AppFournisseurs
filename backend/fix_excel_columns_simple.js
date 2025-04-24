/**
 * Script simplifié pour corriger le problème des colonnes qui ne sont pas dans le fichier Excel
 * mais qui apparaissent quand même dans la base de données
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

// Remplacer la méthode de lecture des en-têtes par une méthode plus directe
// qui ne lit que les en-têtes réellement présents dans le fichier Excel
const headerExtractionCode = `    // Obtenir la plage de cellules du fichier Excel
    const range = XLSX.utils.decode_range(worksheet['!ref']);
    let scoreColumnExists = false;
    let scoreColumnIndex = -1;
    
    // Parcourir la première ligne pour trouver la colonne Score
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cellAddress = XLSX.utils.encode_cell({r: range.s.r, c: C});
      const cell = worksheet[cellAddress];
      if (cell && cell.v && (cell.v === 'Score' || cell.v === 'SCORE' || cell.v === 'score')) {
        scoreColumnExists = true;
        scoreColumnIndex = C;
        console.log(\`Colonne Score trouvée à l'index \${C}\`);
        break;
      }
    }`;

const improvedHeaderExtractionCode = `    // Obtenir la plage de cellules du fichier Excel
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
    const scoreColumnExists = realHeaders.some(header => 
      header === 'Score' || header === 'SCORE' || header === 'score'
    );
    
    if (scoreColumnExists) {
      console.log('Colonne Score trouvée dans le fichier Excel');
    } else {
      console.log('Colonne Score non trouvée dans le fichier Excel');
    }`;

// Remplacer le code d'extraction des en-têtes par la version améliorée
content = content.replace(headerExtractionCode, improvedHeaderExtractionCode);

// Modifier la partie qui lit les données du fichier Excel
const dataExtractionCode = `    // Lire toutes les données du fichier Excel
    const data = XLSX.utils.sheet_to_json(worksheet, { 
      raw: true, 
      defval: null,
      blankrows: false
    });`;

const improvedDataExtractionCode = `    // Lire les données du fichier Excel en utilisant uniquement les en-têtes réels
    const data = XLSX.utils.sheet_to_json(worksheet, { 
      raw: true, 
      defval: null,
      blankrows: false
    });
    
    // Filtrer les lignes qui semblent être des en-têtes dupliqués
    const filteredData = data.filter(row => {
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
        console.log('Ligne ignorée car elle semble être une ligne d\'en-tête');
        return false;
      }
      
      return true;
    });
    
    // Utiliser les données filtrées
    const data = filteredData;`;

// Remplacer le code de lecture des données par la version améliorée
content = content.replace(dataExtractionCode, improvedDataExtractionCode);

// Modifier la partie qui extrait les noms de colonnes
const columnsExtractionCode = `    // Extraire les noms de colonnes à partir de la première ligne
    const columns = Object.keys(data[0]);
    console.log(\`Colonnes trouvées dans le fichier Excel: \${columns.join(', ')}\`);`;

const improvedColumnsExtractionCode = `    // Utiliser uniquement les en-têtes réels comme colonnes
    const columns = realHeaders;
    
    // Ajouter la colonne Score si elle n'existe pas
    if (!scoreColumnExists) {
      columns.push('Score');
    }
    
    console.log(\`Colonnes utilisées pour la création de la table: \${columns.join(', ')}\`);`;

// Remplacer le code d'extraction des colonnes par la version améliorée
content = content.replace(columnsExtractionCode, improvedColumnsExtractionCode);

// Écrire le contenu modifié dans le fichier
fs.writeFileSync(fournisseursPath, content);
console.log(`Le fichier ${fournisseursPath} a été modifié avec succès.`);
console.log('Les modifications suivantes ont été apportées:');
console.log('1. Extraction directe des en-têtes réellement présents dans le fichier Excel');
console.log('2. Filtrage des lignes qui semblent être des en-têtes dupliqués');
console.log('3. Utilisation uniquement des en-têtes réels pour créer les colonnes de la table');
console.log('\nVeuillez redémarrer le serveur backend pour appliquer les modifications.');
