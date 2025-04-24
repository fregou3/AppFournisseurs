/**
 * Script final pour corriger l'importation des fichiers Excel
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

// Remplacer complètement la fonction d'upload
const uploadFunctionStart = "router.post('/upload', async (req, res) => {";
const uploadFunctionEnd = "});";

// Trouver le début de la fonction
const startIndex = content.indexOf(uploadFunctionStart);
if (startIndex === -1) {
  console.error("Impossible de trouver le début de la fonction d'upload");
  process.exit(1);
}

// Trouver la fin de la fonction (en comptant les accolades)
let endIndex = -1;
let braceCount = 0;
let inString = false;
let stringChar = '';
let escaped = false;

for (let i = startIndex; i < content.length; i++) {
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
        endIndex = i + 1;
        break;
      }
    }
  }
}

if (endIndex === -1) {
  console.error("Impossible de trouver la fin de la fonction d'upload");
  process.exit(1);
}

// Nouvelle fonction d'upload complète
const newUploadFunction = `router.post('/upload', async (req, res) => {
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
    
    // Méthode directe pour lire les en-têtes (première ligne)
    const range = XLSX.utils.decode_range(worksheet['!ref']);
    const headers = [];
    
    // Parcourir uniquement la première ligne pour extraire les en-têtes
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cellAddress = XLSX.utils.encode_cell({r: range.s.r, c: C});
      const cell = worksheet[cellAddress];
      
      if (cell && cell.v !== undefined && cell.v !== null) {
        const headerName = String(cell.v).trim();
        if (headerName !== '') {
          headers.push(headerName);
        }
      }
    }
    
    console.log(\`En-têtes réellement trouvés dans le fichier Excel: \${headers.join(', ')}\`);
    
    // Vérifier si la colonne Score existe
    const scoreExists = headers.some(header => 
      header === 'Score' || header === 'SCORE' || header === 'score'
    );
    
    // Ajouter la colonne Score uniquement si elle est nécessaire
    if (!scoreExists) {
      console.log('Colonne Score non trouvée dans le fichier Excel. Ajout de la colonne Score.');
      headers.push('Score');
    }
    
    // Lire les données ligne par ligne (en sautant la première ligne qui contient les en-têtes)
    const data = [];
    
    // Utiliser sheet_to_json avec les en-têtes explicites pour garantir que seules les colonnes
    // réellement présentes dans le fichier sont utilisées
    const rawData = XLSX.utils.sheet_to_json(worksheet, {
      raw: true,
      defval: null,
      blankrows: false
    });
    
    // Filtrer les lignes qui semblent être des en-têtes dupliqués
    for (const row of rawData) {
      // Vérifier si cette ligne est probablement un en-tête dupliqué
      let isHeaderRow = false;
      let matchCount = 0;
      let totalFields = 0;
      
      for (const header of headers) {
        if (row[header] !== undefined) {
          totalFields++;
          if (String(row[header]).toLowerCase() === header.toLowerCase()) {
            matchCount++;
          }
        }
      }
      
      // Si plus de 50% des champs correspondent aux en-têtes, c'est probablement une ligne d'en-tête
      if (totalFields > 0 && matchCount / totalFields > 0.5) {
        console.log(\`Ligne ignorée car elle semble être une ligne d'en-tête\`);
        isHeaderRow = true;
      }
      
      if (!isHeaderRow) {
        // Créer une nouvelle ligne avec uniquement les colonnes qui existent réellement
        const newRow = {};
        
        // Copier uniquement les champs qui correspondent aux en-têtes réels
        for (const header of headers) {
          newRow[header] = row[header] !== undefined ? row[header] : null;
        }
        
        // Ajouter la colonne Score si nécessaire
        if (!scoreExists) {
          newRow['Score'] = null;
        }
        
        data.push(newRow);
      }
    }
    
    console.log(\`Nombre de lignes lues dans le fichier Excel: \${data.length}\`);
    
    if (data.length === 0) {
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
      const columnDefinitions = headers.map(col => {
        // Normaliser le nom de la colonne pour PostgreSQL
        const pgCol = normalizeColumnName(col);
        return \`"\${pgCol}" TEXT\`;
      });
      
      createTableSQL += columnDefinitions.join(',\\n        ');
      createTableSQL += '\\n      )';
      
      await client.query(createTableSQL);
      console.log(\`Table \${tableName} créée avec \${headers.length} colonnes\`);
      
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
          headers.forEach((col, i) => {
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

// Remplacer la fonction d'upload
content = content.substring(0, startIndex) + newUploadFunction + content.substring(endIndex);

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
console.log('1. Remplacement complet de la fonction d\'upload pour garantir que seules les colonnes réellement présentes dans le fichier Excel sont créées');
console.log('2. Utilisation d\'une méthode directe pour lire les en-têtes de colonnes');
console.log('3. Filtrage des lignes qui semblent être des en-têtes dupliqués');
console.log('4. Création de la table avec uniquement les colonnes qui existent réellement dans le fichier Excel');
console.log('\nVeuillez redémarrer le serveur backend pour appliquer les modifications.');
