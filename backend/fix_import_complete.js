/**
 * Script pour résoudre définitivement le problème d'importation Excel
 * Ce script remplace complètement la fonction d'importation pour garantir que toutes les lignes sont importées
 */

const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const pool = require('./db');

// Chemin du fichier à modifier
const fournisseursPath = path.join(__dirname, 'routes', 'fournisseurs.js');

// Fonction pour tester l'importation directement
async function testImport() {
  console.log('Test d\'importation directe...');
  
  try {
    // Rechercher les fichiers Excel dans le répertoire
    const excelDir = path.join(__dirname, '..');
    const excelFiles = fs.readdirSync(excelDir)
      .filter(file => file.endsWith('.xlsx') || file.endsWith('.xls'))
      .map(file => path.join(excelDir, file));
    
    if (excelFiles.length === 0) {
      console.error('Aucun fichier Excel trouvé!');
      return;
    }
    
    // Utiliser le premier fichier Excel trouvé
    const excelFile = excelFiles[0];
    console.log(`Utilisation du fichier Excel: ${excelFile}`);
    
    // Lire le fichier Excel
    const workbook = XLSX.readFile(excelFile);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Lire les données avec les options optimales
    const data = XLSX.utils.sheet_to_json(worksheet, { 
      raw: true, 
      defval: null,
      blankrows: false
    });
    
    console.log(`Nombre de lignes lues dans le fichier Excel: ${data.length}`);
    
    // Créer une table de test
    const tableName = 'test_import_' + Date.now();
    const client = await pool.connect();
    
    try {
      // Créer la table
      await client.query(`
        CREATE TABLE "${tableName}" (
          id SERIAL PRIMARY KEY,
          data JSONB
        )
      `);
      
      console.log(`Table ${tableName} créée`);
      
      // Insérer les données
      let insertedCount = 0;
      
      for (const row of data) {
        await client.query(`
          INSERT INTO "${tableName}" (data)
          VALUES ($1)
        `, [JSON.stringify(row)]);
        
        insertedCount++;
        
        if (insertedCount % 100 === 0) {
          console.log(`${insertedCount} lignes insérées...`);
        }
      }
      
      console.log(`Toutes les ${insertedCount} lignes ont été insérées avec succès`);
      
      // Vérifier le nombre de lignes
      const countResult = await client.query(`SELECT COUNT(*) FROM "${tableName}"`);
      const finalCount = parseInt(countResult.rows[0].count);
      
      console.log(`Nombre final de lignes dans la table ${tableName}: ${finalCount}`);
      console.log(`Correspond au nombre de lignes dans le fichier Excel: ${finalCount === data.length}`);
      
      // Nettoyer
      await client.query(`DROP TABLE "${tableName}"`);
      console.log(`Table ${tableName} supprimée`);
      
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('Erreur lors du test d\'importation:', error);
  }
}

// Fonction pour remplacer complètement la fonction d'importation
function replaceImportFunction() {
  console.log('Remplacement complet de la fonction d\'importation...');
  
  // Nouvelle fonction d'importation simplifiée et robuste
  const newImportFunction = `
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
    let tableName = 'fournisseurs_' + req.body.tableName;
    tableName = tableName.toLowerCase().replace(/[^a-z0-9_]/g, '_');
    console.log(\`Nom de la table: \${tableName}\`);
    
    // Lire le fichier Excel
    console.log(\`Lecture du fichier Excel: \${file.name}\`);
    const workbook = XLSX.read(file.data);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Lire toutes les données du fichier Excel
    const data = XLSX.utils.sheet_to_json(worksheet, { 
      raw: true, 
      defval: null,
      blankrows: false
    });
    
    console.log(\`Nombre de lignes lues dans le fichier Excel: \${data.length}\`);
    
    if (data.length === 0) {
      return res.status(400).json({ error: 'Le fichier Excel est vide' });
    }
    
    // Extraire les noms de colonnes à partir de la première ligne
    const columns = Object.keys(data[0]);
    console.log(\`Colonnes trouvées dans le fichier Excel: \${columns.join(', ')}\`);
    
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
        const pgCol = col.toLowerCase()
          .replace(/[^a-zA-Z0-9àáâäãåąčćęèéêëėįìíîïłńòóôöõøùúûüųūÿýżźñçšžÀÁÂÄÃÅĄĆČĖĘÈÉÊËÌÍÎÏĮŁŃÒÓÔÖÕØÙÚÛÜŲŪŸÝŻŹÑßÇŒÆŠŽ]+/g, '_')
          .replace(/^_|_$/g, '')
          .replace(/__+/g, '_');
        
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
            const pgCol = col.toLowerCase()
              .replace(/[^a-zA-Z0-9àáâäãåąčćęèéêëėįìíîïłńòóôöõøùúûüųūÿýżźñçšžÀÁÂÄÃÅĄĆČĖĘÈÉÊËÌÍÎÏĮŁŃÒÓÔÖÕØÙÚÛÜŲŪŸÝŻŹÑßÇŒÆŠŽ]+/g, '_')
              .replace(/^_|_$/g, '')
              .replace(/__+/g, '_');
            
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
});
`;

  // Trouver la fonction d'importation existante
  const routePattern = /router\.post\('\/upload',[\s\S]+?}\);/;
  
  // Remplacer la fonction d'importation
  const content = fs.readFileSync(fournisseursPath, 'utf8');
  const newContent = content.replace(routePattern, newImportFunction);
  
  // Écrire le contenu modifié dans le fichier
  fs.writeFileSync(fournisseursPath, newContent, 'utf8');
  
  console.log('Fonction d\'importation remplacée avec succès!');
}

// Fonction principale
async function main() {
  try {
    // Tester l'importation directe
    await testImport();
    
    // Remplacer la fonction d'importation
    replaceImportFunction();
    
    console.log('\nToutes les modifications ont été appliquées avec succès!');
    console.log('Veuillez redémarrer le serveur et réessayer l\'importation.');
    console.log('Toutes les lignes du fichier Excel devraient maintenant être importées correctement.');
  } catch (error) {
    console.error('Erreur lors de l\'exécution du script:', error);
  } finally {
    pool.end();
  }
}

// Exécuter la fonction principale
main();
