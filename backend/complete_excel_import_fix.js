/**
 * Script complet pour améliorer l'importation des fichiers Excel
 * Ce script garantit que toutes les colonnes du fichier Excel sont créées dans la base de données,
 * même si elles sont vides, et corrige toutes les erreurs précédentes
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

// Remplacer la fonction d'importation Excel complète
// Cette version garantit que toutes les colonnes sont préservées
const excelImportCode = `router.post('/upload', async (req, res) => {
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
    
    // Extraire tous les en-têtes de colonnes (première ligne)
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
    }
    
    // Créer un ensemble de données complet avec toutes les colonnes
    const data = [];
    
    // Parcourir toutes les lignes de données (en sautant la ligne d'en-tête)
    for (let R = range.s.r + 1; R <= range.e.r; ++R) {
      const row = {};
      let hasData = false; // Pour vérifier si la ligne contient des données
      
      // Pour chaque colonne, récupérer la valeur ou null
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const headerName = allHeaders[C];
        if (!headerName) continue; // Ignorer les colonnes sans en-tête
        
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
      
      // Ajouter la colonne Score si elle n'existe pas
      if (!scoreExists) {
        row['Score'] = null;
      }
      
      // N'ajouter la ligne que si elle contient des données
      if (hasData) {
        data.push(row);
      }
    }
    
    console.log(\`Nombre de lignes lues dans le fichier Excel: \${data.length}\`);
    
    if (data.length === 0) {
      return res.status(400).json({ error: 'Le fichier Excel est vide ou ne contient pas de données valides' });
    }
    
    // Extraire les noms de colonnes à partir des données
    const columns = allHeaders.filter(header => header !== undefined);
    console.log(\`Colonnes utilisées pour la création de la table: \${columns.join(', ')}\`);
    
    // Connexion à la base de données
    const client = await pool.connect();
    
    try {
      // Supprimer la table si elle existe déjà
      await client.query(\`DROP TABLE IF EXISTS "\${tableName}" CASCADE\`);
      console.log(\`Table \${tableName} supprimée si elle existait\`);
      
      // Créer la table avec toutes les colonnes du fichier Excel
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
      
      console.log(\`Importation terminée: \${insertedCount} lignes insérées, \${errorCount} erreurs\`);
      
      // Vérifier que la colonne Score existe dans la table
      const checkScoreQuery = \`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = $1
        AND column_name = 'Score'
      \`;
      const scoreResult = await client.query(checkScoreQuery, [tableName]);
      
      if (scoreResult.rows.length === 0) {
        console.log(\`La colonne Score n'existe pas dans la table \${tableName}. Ajout de la colonne.\`);
        await client.query(\`ALTER TABLE "\${tableName}" ADD COLUMN "Score" TEXT\`);
      }
      
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

// Trouver la fonction d'importation Excel existante
const startMarker = "router.post('/upload', async (req, res) => {";
const endMarker = "});";

// Trouver la position de début de la fonction
const startPos = content.indexOf(startMarker);
if (startPos === -1) {
  console.error("Impossible de trouver le début de la fonction d'importation Excel.");
  process.exit(1);
}

// Trouver la position de fin de la fonction
let endPos = startPos;
let braceCount = 0;
let inString = false;
let stringChar = '';
let escaped = false;

for (let i = startPos; i < content.length; i++) {
  const char = content[i];
  
  // Gérer les chaînes de caractères
  if ((char === '"' || char === "'") && !escaped) {
    if (!inString) {
      inString = true;
      stringChar = char;
    } else if (char === stringChar) {
      inString = false;
    }
  }
  
  // Gérer les caractères d'échappement
  if (char === '\\' && !escaped) {
    escaped = true;
  } else {
    escaped = false;
  }
  
  // Compter les accolades
  if (!inString) {
    if (char === '{') {
      braceCount++;
    } else if (char === '}') {
      braceCount--;
      if (braceCount === 0) {
        endPos = i + 1;
        break;
      }
    }
  }
}

if (endPos === startPos) {
  console.error("Impossible de trouver la fin de la fonction d'importation Excel.");
  process.exit(1);
}

// Remplacer la fonction d'importation Excel par la version améliorée
const oldFunction = content.substring(startPos, endPos);
content = content.replace(oldFunction, excelImportCode);

// Remplacer la fonction de normalisation par la version améliorée
content = content.replace(normalizeColumnNameFunction, improvedNormalizeColumnNameFunction);

// Écrire le contenu modifié dans le fichier
fs.writeFileSync(fournisseursPath, content);
console.log(`Le fichier ${fournisseursPath} a été modifié avec succès.`);
console.log('Les modifications suivantes ont été apportées:');
console.log('1. Remplacement complet de la fonction d\'importation Excel pour garantir que toutes les colonnes sont préservées');
console.log('2. Amélioration de la détection des en-têtes de colonnes');
console.log('3. Gestion robuste des colonnes vides et des valeurs nulles');
console.log('4. Vérification et ajout automatique de la colonne Score si nécessaire');
console.log('5. Amélioration de la fonction de normalisation des noms de colonnes');
console.log('\nVeuillez redémarrer le serveur backend pour appliquer les modifications.');
