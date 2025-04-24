/**
 * Script pour restaurer la fonctionnalité d'origine de l'application
 */

const fs = require('fs');
const path = require('path');

// Chemin du fichier à modifier
const fournisseursPath = path.join(__dirname, 'routes', 'fournisseurs.js');

// Créer une sauvegarde du fichier actuel
const backupPath = `${fournisseursPath}.backup.${Date.now()}`;
fs.copyFileSync(fournisseursPath, backupPath);
console.log(`Sauvegarde créée: ${backupPath}`);

// Contenu simplifié et fonctionnel
const newContent = `const express = require('express');
const router = express.Router();
const XLSX = require('xlsx');
const path = require('path');
const pool = require('../db');
const moment = require('moment');
const multer = require('multer');
const fs = require('fs');

// Configuration de multer pour l'upload de fichiers
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../../Reports_Moodies');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Utiliser l'id comme nom de fichier
    const fileName = \`\${req.params.id}_\${Date.now()}\${path.extname(file.originalname)}\`;
    cb(null, fileName);
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Seuls les fichiers PDF sont acceptés'));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // Limite à 10MB
  }
});

// Fonction pour normaliser les noms de colonnes PostgreSQL tout en préservant les accents
function normalizeColumnName(name) {
  // Remplacer les caractères non alphanumériques (sauf les accents) par des underscores
  return name.replace(/[^a-zA-Z0-9àáâäãåąčćęèéêëėįìíîïłńòóôöõøùúûüųūÿýżźñçšžÀÁÂÄÃÅĄĆČĖĘÈÉÊËÌÍÎÏĮŁŃÒÓÔÖÕØÙÚÛÜŲŪŸÝŻŹÑßÇŒÆŠŽ]+/g, '_')
    .replace(/^_|_$/g, '')        // Supprimer les underscores au début et à la fin
    .replace(/__+/g, '_');        // Remplacer les underscores multiples par un seul
}

// Route pour récupérer la liste des tables fournisseurs
router.get('/tables', async (req, res) => {
  try {
    const client = await pool.connect();
    try {
      // Récupérer toutes les tables commençant par "fournisseurs_"
      const result = await client.query(\`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name LIKE 'fournisseurs_%'
        ORDER BY table_name
      \`);
      
      // Ajouter la table "fournisseurs" si elle existe
      const fournisseursCheck = await client.query(\`
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'public'
          AND table_name = 'fournisseurs'
        )
      \`);
      
      let tables = result.rows.map(row => row.table_name);
      
      if (fournisseursCheck.rows[0].exists) {
        tables.unshift('fournisseurs');
      }
      
      res.json({ tables });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des tables:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des tables' });
  }
});

// Route pour récupérer les données de la table fournisseurs standard
router.get('/fournisseurs', async (req, res) => {
  try {
    const client = await pool.connect();
    try {
      // Récupérer toutes les données
      const result = await client.query('SELECT * FROM fournisseurs');
      res.json(result.rows);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des données:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des données' });
  }
});

// Route pour récupérer les données d'une table spécifique
router.get('/table/:tableName', async (req, res) => {
  try {
    const { tableName } = req.params;
    const { page = 1, pageSize = 50, sortBy, sortOrder, filters } = req.query;
    
    // Vérifier que le nom de la table est valide
    if (!tableName.startsWith('fournisseurs_') && tableName !== 'fournisseurs') {
      return res.status(400).json({ error: 'Nom de table invalide' });
    }
    
    const client = await pool.connect();
    try {
      // Vérifier si la table existe
      const tableCheck = await client.query(\`
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'public'
          AND table_name = $1
        )
      \`, [tableName]);
      
      if (!tableCheck.rows[0].exists) {
        return res.status(404).json({ error: 'Table non trouvée' });
      }
      
      // Construire la requête de base
      let query = \`SELECT * FROM "\${tableName}"\`;
      const queryParams = [];
      
      // Ajouter des filtres si nécessaire
      if (filters) {
        const parsedFilters = JSON.parse(filters);
        if (Object.keys(parsedFilters).length > 0) {
          query += ' WHERE ';
          const filterConditions = [];
          
          Object.entries(parsedFilters).forEach(([column, value], index) => {
            if (value) {
              filterConditions.push(\`"\${column}"::text ILIKE $\${index + 1}\`);
              queryParams.push(\`%\${value}%\`);
            }
          });
          
          query += filterConditions.join(' AND ');
        }
      }
      
      // Ajouter le tri si nécessaire
      if (sortBy && sortOrder) {
        query += \` ORDER BY "\${sortBy}" \${sortOrder === 'desc' ? 'DESC' : 'ASC'}\`;
      }
      
      // Compter le nombre total de lignes (pour la pagination)
      const countQuery = query.replace('SELECT *', 'SELECT COUNT(*)');
      const countResult = await client.query(countQuery, queryParams);
      const totalRows = parseInt(countResult.rows[0].count);
      
      // Ajouter la pagination
      const offset = (page - 1) * pageSize;
      query += \` LIMIT \${pageSize} OFFSET \${offset}\`;
      
      // Exécuter la requête
      const result = await client.query(query, queryParams);
      
      // Récupérer les informations sur les colonnes
      const columnsQuery = \`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = $1
        ORDER BY ordinal_position
      \`;
      const columnsResult = await client.query(columnsQuery, [tableName]);
      
      res.json({
        data: result.rows,
        columns: columnsResult.rows,
        pagination: {
          totalRows,
          page: parseInt(page),
          pageSize: parseInt(pageSize),
          totalPages: Math.ceil(totalRows / pageSize)
        }
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des données:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des données' });
  }
});

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

// Route pour supprimer une table
router.delete('/table/:tableName', async (req, res) => {
  try {
    const { tableName } = req.params;
    
    // Vérifier que le nom de la table est valide (commence par fournisseurs_)
    if (!tableName.startsWith('fournisseurs_')) {
      return res.status(400).json({ error: 'Nom de table invalide' });
    }
    
    const client = await pool.connect();
    try {
      // Vérifier si la table existe
      const tableCheck = await client.query(\`
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'public'
          AND table_name = $1
        )
      \`, [tableName]);
      
      if (!tableCheck.rows[0].exists) {
        return res.status(404).json({ error: 'Table non trouvée' });
      }
      
      // Supprimer la table
      await client.query(\`DROP TABLE IF EXISTS "\${tableName}" CASCADE\`);
      
      res.json({ message: \`Table \${tableName} supprimée avec succès\` });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Erreur lors de la suppression de la table:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression de la table' });
  }
});

// Route pour exporter une table en Excel
router.get('/export/:tableName', async (req, res) => {
  try {
    const { tableName } = req.params;
    
    // Vérifier que le nom de la table est valide
    if (!tableName.startsWith('fournisseurs_') && tableName !== 'fournisseurs') {
      return res.status(400).json({ error: 'Nom de table invalide' });
    }
    
    const client = await pool.connect();
    try {
      // Vérifier si la table existe
      const tableCheck = await client.query(\`
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'public'
          AND table_name = $1
        )
      \`, [tableName]);
      
      if (!tableCheck.rows[0].exists) {
        return res.status(404).json({ error: 'Table non trouvée' });
      }
      
      // Récupérer toutes les données de la table
      const result = await client.query(\`SELECT * FROM "\${tableName}"\`);
      
      // Créer un workbook Excel
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(result.rows);
      
      // Ajouter la feuille au workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, tableName);
      
      // Convertir le workbook en buffer
      const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      
      // Définir les headers pour le téléchargement
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', \`attachment; filename=\${tableName}.xlsx\`);
      
      // Envoyer le fichier
      res.send(excelBuffer);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Erreur lors de l\\'exportation de la table:', error);
    res.status(500).json({ error: 'Erreur lors de l\\'exportation de la table' });
  }
});

module.exports = router;`;

// Écrire le nouveau contenu dans le fichier
fs.writeFileSync(fournisseursPath, newContent);
console.log(`Fichier ${fournisseursPath} restauré avec succès!`);

// Vérifier également si le fichier Home.js a été modifié
const homePath = path.join(__dirname, '..', 'frontend', 'src', 'components', 'Home.js');

if (fs.existsSync(homePath)) {
  console.log(`Vérification du fichier ${homePath}...`);
  
  // Lire le contenu du fichier
  const homeContent = fs.readFileSync(homePath, 'utf8');
  
  // Vérifier si le fichier a été modifié
  if (homeContent.includes('console.log(\'Response received:\'')) {
    console.log('Le fichier Home.js a été modifié, restauration de la fonction fetchData...');
    
    // Rechercher la fonction fetchData
    const fetchDataPattern = /const fetchData = async \(tableName\) => \{[\s\S]+?setLoading\(false\);\s*\}\s*\};/;
    
    // Nouvelle implémentation de fetchData
    const newFetchData = `const fetchData = async (tableName) => {
    setLoading(true);
    setError(null);
    try {
      // Si le nom de la table est 'fournisseurs', utiliser la route standard
      // Sinon, utiliser une route spécifique pour la table sélectionnée
      const url = tableName === 'fournisseurs' 
        ? \`\${config.apiUrl}/fournisseurs\` 
        : \`\${config.apiUrl}/fournisseurs/table/\${tableName}\`;
      
      const response = await axios.get(url);
      setData(response.data);
    } catch (error) {
      console.error(\`Erreur lors du chargement des données de la table \${tableName}:\`, error);
      setError(\`Erreur lors du chargement des données de la table \${tableName}\`);
    } finally {
      setLoading(false);
    }
  };`;
    
    // Remplacer la fonction fetchData
    if (homeContent.match(fetchDataPattern)) {
      const newHomeContent = homeContent.replace(fetchDataPattern, newFetchData);
      
      // Écrire le contenu modifié dans le fichier
      fs.writeFileSync(homePath, newHomeContent, 'utf8');
      console.log('Fonction fetchData restaurée avec succès!');
    } else {
      console.log('Fonction fetchData non trouvée dans Home.js');
    }
  } else {
    console.log('Le fichier Home.js n\'a pas été modifié, aucune restauration nécessaire.');
  }
} else {
  console.log(`Le fichier ${homePath} n'existe pas`);
}

console.log('Veuillez redémarrer le serveur pour appliquer les modifications.');
