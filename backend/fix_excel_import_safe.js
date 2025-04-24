/**
 * Script de correction sécurisée pour l'importation Excel
 * Ce script vérifie la syntaxe avant d'appliquer les modifications
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Chemin du fichier à modifier
const fournisseursPath = path.join(__dirname, 'routes', 'fournisseurs.js');

// Lire le contenu du fichier
console.log(`Lecture du fichier ${fournisseursPath}...`);
let originalContent = fs.readFileSync(fournisseursPath, 'utf8');

// Créer une sauvegarde du fichier original
const backupPath = `${fournisseursPath}.backup.${Date.now()}`;
fs.writeFileSync(backupPath, originalContent);
console.log(`Sauvegarde créée: ${backupPath}`);

// Fonction pour vérifier la syntaxe JavaScript
function checkSyntax(code) {
  const tempFile = path.join(__dirname, '_temp_syntax_check.js');
  fs.writeFileSync(tempFile, code);
  
  try {
    // Utiliser Node.js pour vérifier la syntaxe
    execSync(`node --check ${tempFile}`, { stdio: 'pipe' });
    fs.unlinkSync(tempFile);
    return { valid: true };
  } catch (error) {
    const errorMessage = error.stderr ? error.stderr.toString() : error.toString();
    fs.unlinkSync(tempFile);
    return { 
      valid: false, 
      error: errorMessage 
    };
  }
}

// Nouvelle fonction d'importation Excel
const newExcelImportCode = `
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
    let tableName = req.body.tableName;
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
    realHeaders.forEach((header) => {
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
    }
    
    console.log(\`Nombre de lignes lues dans le fichier Excel: \${data.length}\`);
    
    if (data.length === 0) {
      return res.status(400).json({ error: 'Le fichier Excel est vide ou ne contient pas de données valides' });
    }
    
    // Utiliser uniquement les en-têtes réels comme colonnes
    const columns = realHeaders;
    console.log(\`Colonnes utilisées pour la création de la table: \${columns.join(', ')}\`);
    
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
      const columnDefinitions = columns.map(col => {
        // Normaliser le nom de la colonne pour PostgreSQL
        const pgCol = normalizeColumnName(col);
        return \`"\${pgCol}" TEXT\`;
      });
      
      createTableSQL += columnDefinitions.join(',\\n        ');
      createTableSQL += '\\n      )';
      
      console.log('Requête SQL pour créer la table:');
      console.log(createTableSQL);
      
      await client.query(createTableSQL);
      console.log(\`Table \${tableName} créée avec \${columns.length} colonnes\`);
      
      // Insérer les données ligne par ligne
      let insertedCount = 0;
      let errorCount = 0;
      
      // Utiliser une transaction pour l'insertion
      await client.query('BEGIN');
      
      for (const [index, row] of data.entries()) {
        try {
          // Préparer les colonnes et les valeurs pour l'insertion
          const insertColumns = [];
          const insertValues = [];
          const placeholders = [];
          
          // Pour chaque colonne dans le fichier Excel
          columns.forEach((col, i) => {
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
          if (insertedCount % 100 === 0 || insertedCount === data.length) {
            console.log(\`Progression: \${insertedCount}/\${data.length} lignes insérées (\${Math.round(insertedCount / data.length * 100)}%)\`);
          }
        } catch (error) {
          console.error(\`Erreur lors de l'insertion de la ligne \${index + 1}:\`, error);
          errorCount++;
        }
      }
      
      // Valider la transaction
      await client.query('COMMIT');
      
      // Vérifier le nombre final de lignes
      const countResult = await client.query(\`SELECT COUNT(*) FROM "\${tableName}"\`);
      const finalCount = parseInt(countResult.rows[0].count);
      
      console.log(\`Importation terminée:
      - Lignes dans le fichier Excel: \${data.length}
      - Lignes insérées avec succès: \${insertedCount}
      - Lignes avec erreurs: \${errorCount}
      - Nombre final de lignes dans la table: \${finalCount}
      \`);
      
      // Retourner une réponse de succès
      return res.status(200).json({
        message: \`Importation réussie dans la table \${tableName}\`,
        table: tableName,
        stats: {
          totalRows: data.length,
          insertedRows: insertedCount,
          errorCount: errorCount,
          finalTableRows: finalCount,
          matchesExcelRowCount: finalCount === data.length
        }
      });
    } catch (error) {
      // Annuler la transaction en cas d'erreur
      await client.query('ROLLBACK');
      console.error('Erreur lors de l\\'importation:', error);
      return res.status(500).json({
        error: 'Une erreur est survenue lors de l\\'importation',
        details: error.message
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Erreur globale lors de l\\'upload:', error);
    return res.status(500).json({
      error: 'Une erreur est survenue lors du traitement du fichier',
      details: error.message
    });
  }
});`;

// Fonction de normalisation des noms de colonnes améliorée
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

// Trouver la fonction d'importation Excel existante
const uploadFunctionPattern = /\/\/ Route pour importer un fichier Excel[\s\S]*?router\.post\('\/upload'[\s\S]*?}\);/;
const uploadFunctionMatch = originalContent.match(uploadFunctionPattern);

if (!uploadFunctionMatch) {
  console.error("Impossible de trouver la fonction d'upload. Aucune modification n'a été effectuée.");
  process.exit(1);
}

// Trouver la fonction de normalisation des noms de colonnes
const normalizeColumnNamePattern = /\/\/ Fonction pour normaliser les noms de colonnes[\s\S]*?function normalizeColumnName\([^)]*\) {[\s\S]*?return [^;]*;[\s\S]*?}/;
const normalizeColumnNameMatch = originalContent.match(normalizeColumnNamePattern);

if (!normalizeColumnNameMatch) {
  console.error("Impossible de trouver la fonction de normalisation des noms de colonnes. Aucune modification n'a été effectuée.");
  process.exit(1);
}

// Créer une nouvelle version du contenu
let modifiedContent = originalContent;

// Remplacer la fonction de normalisation des noms de colonnes
modifiedContent = modifiedContent.replace(normalizeColumnNameMatch[0], improvedNormalizeColumnNameFunction);

// Remplacer la fonction d'importation Excel
modifiedContent = modifiedContent.replace(uploadFunctionMatch[0], newExcelImportCode);

// Vérifier la syntaxe du code modifié
console.log("Vérification de la syntaxe du code modifié...");
const syntaxCheck = checkSyntax(modifiedContent);

if (!syntaxCheck.valid) {
  console.error("Le code modifié contient des erreurs de syntaxe:");
  console.error(syntaxCheck.error);
  console.log("Aucune modification n'a été appliquée au fichier.");
  process.exit(1);
}

// Écrire le contenu modifié dans le fichier
fs.writeFileSync(fournisseursPath, modifiedContent);
console.log(`Le fichier ${fournisseursPath} a été modifié avec succès.`);
console.log('Les modifications suivantes ont été apportées:');
console.log('1. Remplacement de la fonction d\'importation Excel');
console.log('2. Lecture directe des cellules de la première ligne pour identifier les en-têtes réels');
console.log('3. Lecture ligne par ligne des données pour éviter les problèmes de fusion de colonnes');
console.log('4. Filtrage des lignes qui semblent être des en-têtes dupliqués');
console.log('5. Amélioration de la fonction de normalisation des noms de colonnes');
console.log('\nVeuillez redémarrer le serveur backend pour appliquer les modifications.');
