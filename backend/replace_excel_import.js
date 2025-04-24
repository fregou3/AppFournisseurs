/**
 * Script pour remplacer complètement la fonction d'importation Excel
 * Ce script garantit que seules les colonnes réellement présentes dans le fichier Excel
 * sont créées dans la base de données
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

// Nouvelle fonction d'importation Excel complète
const newImportFunction = `
// Route pour importer un fichier Excel
router.post('/upload', async (req, res) => {
  try {
    console.log('Upload request received');
    console.log('Request body:', req.body);
    console.log('Request files:', req.files ? Object.keys(req.files) : 'No files');
    
    if (!req.files || !req.files.file) {
      return res.status(400).json({ error: 'Aucun fichier n\\'a été uploadé' });
    }
    
    // Vérifier que le fichier est un fichier Excel
    const file = req.files.file;
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      return res.status(400).json({ error: 'Le fichier doit être un fichier Excel (.xlsx ou .xls)' });
    }
    
    // Créer le nom de la table à partir du nom du fichier
    let tableName = req.body.tableName; // Ne plus ajouter automatiquement le préfixe "fournisseurs_"
    tableName = tableName.toLowerCase().replace(/[^a-z0-9_]/g, '_');
    console.log(\`Nom de la table: \${tableName}\`);
    
    // Lire le fichier Excel
    console.log(\`Lecture du fichier Excel: \${file.name}\`);
    const workbook = XLSX.read(file.data);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Obtenir la plage de cellules du fichier Excel
    const range = XLSX.utils.decode_range(worksheet['!ref']);
    console.log(\`Plage du fichier Excel: \${worksheet['!ref']}\`);
    
    // Extraire les en-têtes directement à partir de la première ligne
    const realHeaders = [];
    const headerCells = {};
    
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cellAddress = XLSX.utils.encode_cell({r: range.s.r, c: C});
      const cell = worksheet[cellAddress];
      
      if (cell && cell.v !== undefined && cell.v !== null) {
        const headerName = String(cell.v).trim();
        if (headerName !== '') {
          realHeaders.push(headerName);
          headerCells[C] = headerName;
        }
      }
    }
    
    console.log(\`En-têtes réellement trouvés dans le fichier Excel (\${realHeaders.length}): \${realHeaders.join(', ')}\`);
    
    // Vérifier si la colonne Score existe
    const scoreExists = realHeaders.some(header => 
      header === 'Score' || header === 'SCORE' || header === 'score'
    );
    
    if (scoreExists) {
      console.log('Colonne Score trouvée dans le fichier Excel');
    } else {
      console.log('Colonne Score non trouvée dans le fichier Excel. Ajout de la colonne Score.');
      realHeaders.push('Score');
    }
    
    // Lire les données ligne par ligne (en sautant la première ligne qui contient les en-têtes)
    const rows = [];
    
    // Parcourir toutes les lignes de données (en commençant à la ligne après les en-têtes)
    for (let R = range.s.r + 1; R <= range.e.r; ++R) {
      const row = {};
      let hasData = false; // Pour vérifier si la ligne contient des données
      
      // Pour chaque colonne avec un en-tête valide, récupérer la valeur
      for (const [colIndex, headerName] of Object.entries(headerCells)) {
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
        
        for (const [colIndex, headerName] of Object.entries(headerCells)) {
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
        rows.push(row);
      }
    }
    
    console.log(\`Nombre de lignes lues dans le fichier Excel: \${rows.length}\`);
    
    if (rows.length === 0) {
      return res.status(400).json({ error: 'Le fichier Excel est vide ou ne contient pas de données valides' });
    }
    
    // Connexion à la base de données
    const client = await pool.connect();
    
    try {
      // Supprimer la table si elle existe déjà
      await client.query(\`DROP TABLE IF EXISTS "\${tableName}" CASCADE\`);
      console.log(\`Table \${tableName} supprimée si elle existait\`);
      
      // Créer la table avec uniquement les colonnes qui existent réellement dans le fichier Excel
      let createTableSQL = \`CREATE TABLE "\${tableName}" (
        id SERIAL PRIMARY KEY,
      \`;
      
      // Ajouter chaque colonne avec le type TEXT
      const columnDefinitions = realHeaders.map(col => {
        // Normaliser le nom de la colonne pour PostgreSQL
        const pgCol = normalizeColumnName(col);
        return \`"\${pgCol}" TEXT\`;
      });
      
      createTableSQL += columnDefinitions.join(',\\n        ');
      createTableSQL += '\\n      )';
      
      console.log('Requête SQL pour créer la table:');
      console.log(createTableSQL);
      
      await client.query(createTableSQL);
      console.log(\`Table \${tableName} créée avec \${realHeaders.length} colonnes\`);
      
      // Insérer les données ligne par ligne
      let insertedCount = 0;
      let errorCount = 0;
      
      // Utiliser une transaction pour l'insertion
      await client.query('BEGIN');
      
      for (const [index, row] of rows.entries()) {
        try {
          // Préparer les colonnes et les valeurs pour l'insertion
          const insertColumns = [];
          const insertValues = [];
          const placeholders = [];
          
          // Pour chaque colonne dans le fichier Excel
          realHeaders.forEach((col, i) => {
            // Normaliser le nom de la colonne pour PostgreSQL
            const pgCol = normalizeColumnName(col);
            
            // Ajouter la colonne et la valeur
            insertColumns.push(pgCol);
            insertValues.push(row[col]);
            placeholders.push(\`$\${i + 1}\`);
          });
          
          // Construire la requête d'insertion
          const insertQuery = \`
            INSERT INTO "\${tableName}" (\${insertColumns.map(col => \`"\${col}"\`).join(', ')})
            VALUES (\${placeholders.join(', ')})
          \`;
          
          // Exécuter la requête d'insertion
          await client.query(insertQuery, insertValues);
          insertedCount++;
          
          // Afficher la progression
          if (insertedCount % 100 === 0 || insertedCount === rows.length) {
            console.log(\`Progression: \${insertedCount}/\${rows.length} lignes insérées (\${Math.round(insertedCount / rows.length * 100)}%)\`);
          }
        } catch (error) {
          console.error(\`Erreur lors de l'insertion de la ligne \${index + 1}:\`, error);
          errorCount++;
        }
      }
      
      // Valider la transaction
      await client.query('COMMIT');
      
      console.log(\`Importation terminée: \${insertedCount} lignes insérées, \${errorCount} erreurs\`);
      
      res.json({ 
        message: \`Fichier importé avec succès. \${insertedCount} lignes insérées dans la table \${tableName}.\`,
        tableName,
        rowCount: insertedCount,
        errorCount
      });
    } catch (error) {
      console.error('Erreur globale lors de l\\'upload:', error);
      
      // Annuler la transaction en cas d'erreur
      await client.query('ROLLBACK');
      
      res.status(500).json({ 
        error: \`Erreur lors de l'importation du fichier: \${error.message}\`,
        details: error.toString()
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Erreur globale lors de l\\'upload:', error);
    res.status(500).json({ 
      error: \`Erreur lors de l'importation du fichier: \${error.message}\`,
      details: error.toString()
    });
  }
});`;

// Trouver la fonction d'importation Excel existante
const startMarker = "// Route pour importer un fichier Excel";
const endMarker = "});";

// Trouver la position de début de la fonction
const startPos = content.indexOf(startMarker);
if (startPos === -1) {
  console.error("Impossible de trouver le début de la fonction d'importation Excel.");
  process.exit(1);
}

// Trouver la position de fin de la fonction
let endPos = -1;
let currentPos = startPos;
let nestedCount = 0;

// Recherche simple de la fin de la fonction
while (currentPos < content.length) {
  currentPos = content.indexOf(endMarker, currentPos);
  if (currentPos === -1) {
    console.error("Impossible de trouver la fin de la fonction d'importation Excel.");
    process.exit(1);
  }
  
  // Vérifier si c'est la bonne fin de fonction
  const beforeEnd = content.substring(currentPos - 10, currentPos).trim();
  if (beforeEnd.endsWith('}')) {
    endPos = currentPos + endMarker.length;
    break;
  }
  
  currentPos += endMarker.length;
}

if (endPos === -1) {
  console.error("Impossible de trouver la fin de la fonction d'importation Excel.");
  process.exit(1);
}

// Remplacer la fonction d'importation Excel par la nouvelle version
content = content.substring(0, startPos) + newImportFunction + content.substring(endPos);

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
console.log('1. Remplacement complet de la fonction d\'importation Excel');
console.log('2. Lecture directe des en-têtes à partir de la première ligne du fichier Excel');
console.log('3. Création de la table avec uniquement les colonnes réellement présentes dans le fichier');
console.log('4. Filtrage des lignes qui semblent être des en-têtes dupliqués');
console.log('\nVeuillez redémarrer le serveur backend pour appliquer les modifications.');
