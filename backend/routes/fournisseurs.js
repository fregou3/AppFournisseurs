const express = require('express');
const router = express.Router();
const XLSX = require('xlsx');
const ExcelJS = require('exceljs');
const { Parser } = require('json2csv');
const path = require('path');
const pool = require('../db');
const multer = require('multer');
const fs = require('fs');
const { exec } = require('child_process');

// Configuration du stockage pour multer
const storage = multer.diskStorage({
  destination(req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename(req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({
  storage: storage,
  fileFilter(req, file, cb) {
    if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
        file.mimetype === 'application/vnd.ms-excel') {
      cb(null, true);
    } else {
      cb(new Error('Le fichier doit être un fichier Excel (.xlsx ou .xls)'));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // Limite à 10MB
  }
});

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
  
  // NOUVELLE APPROCHE : Préserver le nom original de la colonne
  // Remplacer uniquement les caractères non valides pour PostgreSQL
  // PostgreSQL permet les lettres, chiffres, espaces et accents dans les noms de colonnes
  // quand ils sont entourés de guillemets doubles
  return columnName;
}

// Route racine pour récupérer les données de la table fournisseurs standard
router.get('/', async (req, res) => {
  try {
    console.log('Route racine /fournisseurs appelée');
    const { page = 1, pageSize = 50, sortBy, sortOrder, filters } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(pageSize);
    
    // Construire la requête de base
    let query = 'SELECT * FROM fournisseurs';
    let countQuery = 'SELECT COUNT(*) FROM fournisseurs';
    const queryParams = [];
    
    // Ajouter les filtres si présents
    if (filters && Object.keys(JSON.parse(filters)).length > 0) {
      const parsedFilters = JSON.parse(filters);
      const filterClauses = [];
      
      Object.entries(parsedFilters).forEach(([column, value], index) => {
        if (value !== null && value !== undefined && value !== '') {
          filterClauses.push(`"${column}" ILIKE $${index + 1}`);
          queryParams.push(`%${value}%`);
        }
      });
      
      if (filterClauses.length > 0) {
        query += ' WHERE ' + filterClauses.join(' AND ');
        countQuery += ' WHERE ' + filterClauses.join(' AND ');
      }
    }
    
    // Ajouter le tri si présent
    if (sortBy && sortOrder) {
      query += ` ORDER BY "${sortBy}" ${sortOrder === 'desc' ? 'DESC' : 'ASC'}`;
    } else {
      query += ' ORDER BY id ASC';
    }
    
    // Ajouter la pagination
    query += ` LIMIT ${pageSize} OFFSET ${offset}`;
    
    // Exécuter les requêtes
    const client = await pool.connect();
    try {
      const result = await client.query(query, queryParams);
      const countResult = await client.query(countQuery, queryParams);
      
      res.json({
        data: result.rows,
        total: parseInt(countResult.rows[0].count),
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        totalPages: Math.ceil(parseInt(countResult.rows[0].count) / parseInt(pageSize))
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des fournisseurs:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des fournisseurs' });
  }
});

// Route pour récupérer les données d'une table spécifique
router.get('/table/:tableName', async (req, res) => {
  try {
    const { tableName } = req.params;
    const { page = 1, pageSize = 50, sortBy, sortOrder, filters } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(pageSize);
    
    // Vérifier que le nom de la table est valide
    if (!tableName.match(/^[a-zA-Z0-9_]+$/)) {
      return res.status(400).json({ error: 'Nom de table invalide' });
    }
    
    // Construire la requête de base
    let query = `SELECT * FROM "${tableName}"`;
    let countQuery = `SELECT COUNT(*) FROM "${tableName}"`;
    const queryParams = [];
    
    // Ajouter les filtres si présents
    if (filters && Object.keys(JSON.parse(filters)).length > 0) {
      const parsedFilters = JSON.parse(filters);
      const filterClauses = [];
      
      Object.entries(parsedFilters).forEach(([column, value], index) => {
        if (value !== null && value !== undefined && value !== '') {
          filterClauses.push(`"${column}" ILIKE $${index + 1}`);
          queryParams.push(`%${value}%`);
        }
      });
      
      if (filterClauses.length > 0) {
        query += ' WHERE ' + filterClauses.join(' AND ');
        countQuery += ' WHERE ' + filterClauses.join(' AND ');
      }
    }
    
    // Ajouter le tri si présent
    if (sortBy && sortOrder) {
      query += ` ORDER BY "${sortBy}" ${sortOrder === 'desc' ? 'DESC' : 'ASC'}`;
    } else {
      query += ' ORDER BY id ASC';
    }
    
    // Ajouter la pagination
    query += ` LIMIT ${pageSize} OFFSET ${offset}`;
    
    // Exécuter les requêtes
    const client = await pool.connect();
    try {
      // Vérifier si la table existe
      const tableCheck = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'public'
          AND table_name = $1
        )
      `, [tableName]);
      
      if (!tableCheck.rows[0].exists) {
        return res.status(404).json({ error: 'Table non trouvée' });
      }
      
      const result = await client.query(query, queryParams);
      const countResult = await client.query(countQuery, queryParams);
      
      res.json({
        data: result.rows,
        total: parseInt(countResult.rows[0].count),
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        totalPages: Math.ceil(parseInt(countResult.rows[0].count) / parseInt(pageSize))
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des données:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des données' });
  }
});

// Route pour récupérer la structure des colonnes d'une table
router.get('/table-structure/columns/:tableName', async (req, res) => {
  const { tableName } = req.params;
  const client = await pool.connect();
  
  try {
    console.log(`Récupération de la structure des colonnes pour la table ${tableName}`);
    
    // Vérifier si la table existe
    const tableExists = await client.query(
      `SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = $1
      )`,
      [tableName]
    );
    
    if (!tableExists.rows[0].exists) {
      return res.status(404).json({ error: `La table ${tableName} n'existe pas` });
    }
    
    // Récupérer les colonnes et leur position
    const columnsQuery = await client.query(
      `SELECT column_name as name, ordinal_position as position, data_type as type
       FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = $1
       ORDER BY ordinal_position`,
      [tableName]
    );
    
    console.log(`Structure des colonnes récupérée pour la table ${tableName}`);
    res.status(200).json({ columns: columnsQuery.rows });
  } catch (error) {
    console.error(`Erreur lors de la récupération de la structure de la table ${tableName}:`, error);
    res.status(500).json({ 
      error: `Erreur lors de la récupération de la structure de la table ${tableName}`, 
      details: error.message 
    });
  } finally {
    client.release();
  }
});

// Route pour récupérer la liste des tables de fournisseurs
router.get('/tables', async (req, res) => {
  console.log('Route /fournisseurs/tables appelée');
  
  // Définir un timeout pour la requête
  const timeout = setTimeout(() => {
    console.log('Timeout atteint pour la route /fournisseurs/tables');
    if (!res.headersSent) {
      res.status(504).json({ 
        error: 'Timeout lors de la récupération des tables',
        message: 'La requête a pris trop de temps à s\'exécuter. Veuillez réessayer ultérieurement.'
      });
    }
  }, 30000); // 30 secondes de timeout
  
  try {
    const client = await pool.connect();
    try {
      // Optimiser la requête en limitant le nombre de résultats et en ajoutant une condition sur la date de création
      const result = await client.query(`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name LIKE 'fournisseurs_%'
        ORDER BY table_name DESC
        LIMIT 50
      `);
      
      clearTimeout(timeout); // Annuler le timeout car la requête a réussi
      console.log(`Route /fournisseurs/tables: ${result.rows.length} tables trouvées`);
      
      res.json({ tables: result.rows.map(row => row.table_name) });
    } finally {
      client.release();
    }
  } catch (error) {
    clearTimeout(timeout); // Annuler le timeout en cas d'erreur
    console.error('Erreur lors de la récupération des tables:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Erreur lors de la récupération des tables' });
    }
  }
});

// Cache pour suivre les requêtes d'importation récentes
const recentUploads = new Map();

// Nettoyer les entrées anciennes du cache toutes les 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, timestamp] of recentUploads.entries()) {
    // Supprimer les entrées de plus de 5 minutes
    if (now - timestamp > 5 * 60 * 1000) {
      recentUploads.delete(key);
    }
  }
}, 10 * 60 * 1000);

// Route pour importer un fichier Excel
router.post('/upload', async (req, res) => {
  try {
    console.log('Upload request received');
    console.log('Request body:', req.body);
    console.log('Request files:', req.files ? Object.keys(req.files) : 'No files');
    
    // Vérifier si un identifiant de requête est fourni
    const requestId = req.body.requestId || req.headers['x-request-id'] || `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
    console.log(`Request ID: ${requestId}`);
    
    // Vérifier si cette requête a déjà été traitée récemment
    if (recentUploads.has(requestId)) {
      console.log(`Duplicate upload request detected with ID: ${requestId}`);
      return res.status(200).json({
        message: 'Fichier déjà importé avec succès (requête dupliquée ignorée)',
        duplicate: true
      });
    }
    
    // Enregistrer cette requête dans le cache
    recentUploads.set(requestId, Date.now());
    
    if (!req.files || !req.files.file) {
      return res.status(400).json({ error: 'Aucun fichier n\'a été uploadé' });
    }
    
    // Vérifier que le fichier est un fichier Excel
    const file = req.files.file;
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      return res.status(400).json({ error: 'Le fichier doit être un fichier Excel (.xlsx ou .xls)' });
    }
    
    // Créer le nom de la table à partir du nom du fichier
    let tableName = req.body.tableName;
    tableName = tableName.toLowerCase().replace(/[^a-z0-9_]/g, '_');
    console.log(`Nom de la table: ${tableName}`);
    
    // Lire le fichier Excel
    console.log(`Lecture du fichier Excel: ${file.name}`);
    const workbook = XLSX.read(file.data);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Obtenir la plage de cellules du fichier Excel
    const range = XLSX.utils.decode_range(worksheet['!ref']);
    console.log(`Plage du fichier Excel: ${worksheet['!ref']}`);
    
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
    
    console.log(`En-têtes réellement trouvés dans le fichier Excel (${realHeaders.length}): ${realHeaders.join(', ')}`);
    
    // Ne plus ajouter automatiquement la colonne Score
    const scoreExists = realHeaders.some(header => 
      header.toLowerCase() === 'score'
    );
    
    // Commentaire pour référence : Nous ne créons plus automatiquement la colonne Score
    // if (!scoreExists) {
    //   console.log('Colonne Score non trouvée dans le fichier Excel. Ajout de la colonne Score.');
    //   realHeaders.push('Score');
    // }
    
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
      
      // Ne plus ajouter automatiquement la colonne Score
      // if (!scoreExists) {
      //   row['Score'] = null;
      // }
      
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
          console.log(`Ligne ${R + 1} ignorée car elle semble être une ligne d'en-tête`);
          isHeaderRow = true;
        }
      }
      
      // N'ajouter la ligne que si elle contient des données et n'est pas une ligne d'en-tête
      if (hasData && !isHeaderRow) {
        data.push(row);
      }
    }
    
    console.log(`Nombre de lignes lues dans le fichier Excel: ${data.length}`);
    
    if (data.length === 0) {
      return res.status(400).json({ error: 'Le fichier Excel est vide ou ne contient pas de données valides' });
    }
    
    // Utiliser uniquement les en-têtes réels comme colonnes
    const columns = realHeaders;
    console.log(`Colonnes utilisées pour la création de la table: ${columns.join(', ')}`);
    
    // Connexion à la base de données
    const client = await pool.connect();
    
    try {
      // Supprimer la table si elle existe déjà
      await client.query(`DROP TABLE IF EXISTS "${tableName}" CASCADE`);
      console.log(`Table ${tableName} supprimée si elle existait`);
      
      // Créer la table avec uniquement les colonnes qui existent réellement dans le fichier Excel
      let createTableSQL = `CREATE TABLE "${tableName}" (
        id SERIAL PRIMARY KEY,
      `;
      
      // Ajouter chaque colonne avec le type TEXT
      const columnDefinitions = columns.map(col => {
        // Normaliser le nom de la colonne pour PostgreSQL
        const pgCol = normalizeColumnName(col);
        return `"${pgCol}" TEXT`;
      });
      
      createTableSQL += columnDefinitions.join(',\n        ');
      createTableSQL += '\n      )';
      
      console.log('Requête SQL pour créer la table:');
      console.log(createTableSQL);
      
      await client.query(createTableSQL);
      console.log(`Table ${tableName} créée avec ${columns.length} colonnes`);
      
      // Insérer les données ligne par ligne
      let insertedCount = 0;
      let errorCount = 0;
      
      // Utiliser une transaction pour l'insertion
      await client.query('BEGIN');
      
      // Enregistrer l'heure de début pour le suivi des performances
      const startTime = Date.now();
      
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
            placeholders.push(`$${i + 1}`);
          });
          
          // Construire la requête d'insertion
          const insertQuery = `
            INSERT INTO "${tableName}" (${insertColumns.map(col => `"${col}"`).join(', ')})
            VALUES (${placeholders.join(', ')})
          `;
          
          // Exécuter la requête d'insertion
          await client.query(insertQuery, insertValues);
          insertedCount++;
          
          // Afficher la progression
          if (insertedCount % 100 === 0 || insertedCount === data.length) {
            console.log(`Progression: ${insertedCount}/${data.length} lignes insérées (${Math.round(insertedCount / data.length * 100)}%)`);
          }
        } catch (error) {
          console.error(`Erreur lors de l'insertion de la ligne ${index + 1}:`, error);
          errorCount++;
        }
      }
      
      // Valider la transaction
      await client.query('COMMIT');
      
            // Vérifier le nombre final de lignes
      let finalCount = 0;
      try {
        const countResult = await client.query(`SELECT COUNT(*) FROM "${tableName}"`); 
        finalCount = parseInt(countResult.rows[0].count);
      } catch (countError) {
        console.error('Erreur lors du comptage des lignes finales:', countError);
        finalCount = insertedCount;
      }
      
      // Calculer le temps d'exécution
      const endTime = Date.now();
      const executionTimeSeconds = ((endTime - startTime) / 1000).toFixed(2);
      
      console.log(`Importation terminée (${executionTimeSeconds}s):\n      - Lignes dans le fichier Excel: ${data.length}\n      - Lignes insérées avec succès: ${insertedCount}\n      - Lignes avec erreurs: ${errorCount}\n      - Nombre final de lignes dans la table: ${finalCount}`);
      
      // Retourner une réponse de succès
      return res.status(200).json({
        message: `Importation réussie dans la table ${tableName} en ${executionTimeSeconds} secondes`,
        table: tableName,
        stats: {
          totalRows: data.length,
          insertedRows: insertedCount,
          errorCount: errorCount,
          finalTableRows: finalCount,
          executionTime: executionTimeSeconds,
          matchesExcelRowCount: finalCount === data.length
        }
      });
    } catch (error) {
      // Annuler la transaction en cas d'erreur
      await client.query('ROLLBACK');
      console.error('Erreur lors de l\'importation:', error);
      return res.status(500).json({
        error: 'Une erreur est survenue lors de l\'importation',
        details: error.message
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Erreur globale lors de l\'upload:', error);
    return res.status(500).json({
      error: 'Une erreur est survenue lors du traitement du fichier',
      details: error.message
    });
  }
});

// Route pour vider une table (truncate)
router.post('/truncate/:tableName', async (req, res) => {
  const { tableName } = req.params;
  const client = await pool.connect();
  
  try {
    console.log(`Demande de vidage de la table ${tableName}`);
    
    // Vérifier si la table existe
    const tableExists = await client.query(
      `SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = $1
      )`,
      [tableName]
    );
    
    if (!tableExists.rows[0].exists) {
      return res.status(404).json({ error: `La table ${tableName} n'existe pas` });
    }
    
    // Vider la table sans la supprimer
    await client.query(`TRUNCATE TABLE "${tableName}" RESTART IDENTITY CASCADE`);
    
    console.log(`Table ${tableName} vidée avec succès`);
    res.status(200).json({ message: `Table ${tableName} vidée avec succès` });
  } catch (error) {
    console.error(`Erreur lors du vidage de la table ${tableName}:`, error);
    res.status(500).json({ 
      error: `Erreur lors du vidage de la table ${tableName}`, 
      details: error.message 
    });
  } finally {
    client.release();
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
      const tableCheck = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'public'
          AND table_name = $1
        )
      `, [tableName]);
      
      if (!tableCheck.rows[0].exists) {
        return res.status(404).json({ error: 'Table non trouvée' });
      }
      
      // Supprimer la table
      await client.query(`DROP TABLE IF EXISTS "${tableName}" CASCADE`);
      
      res.json({ message: `Table ${tableName} supprimée avec succès` });
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
      const tableCheck = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'public'
          AND table_name = $1
        )
      `, [tableName]);
      
      if (!tableCheck.rows[0].exists) {
        return res.status(404).json({ error: 'Table non trouvée' });
      }
      
      // Récupérer les données de la table
      const result = await client.query(`SELECT * FROM "${tableName}"`);
      
      // Créer un nouveau classeur Excel
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(result.rows);
      
      // Ajouter la feuille au classeur
      XLSX.utils.book_append_sheet(wb, ws, 'Données');
      
      // Générer le fichier Excel
      const excelBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
      
      // Définir les en-têtes de la réponse
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=${tableName}.xlsx`);
      
      // Envoyer le fichier
      res.send(excelBuffer);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Erreur lors de l\'exportation de la table:', error);
    res.status(500).json({ error: 'Erreur lors de l\'exportation de la table' });
  }
});

// Stockage des tâches en cours
const runningTasks = {};

// Route pour récupérer les métadonnées des colonnes d'une table
router.get('/columns/:tableName', async (req, res) => {
  const { tableName } = req.params;
  const client = await pool.connect();
  
  try {
    console.log(`Récupération des métadonnées des colonnes pour la table ${tableName}`);
    
    // Vérifier si la table existe
    const tableCheckQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = $1
      );
    `;
    
    const tableExists = await client.query(tableCheckQuery, [tableName]);
    
    if (!tableExists.rows[0].exists) {
      return res.status(404).json({ error: `La table ${tableName} n'existe pas` });
    }
    
    // Récupérer les métadonnées des colonnes
    const columnsQuery = `
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = $1
      ORDER BY ordinal_position;
    `;
    
    const result = await client.query(columnsQuery, [tableName]);
    
    console.log(`${result.rows.length} colonnes trouvées pour la table ${tableName}`);
    
    res.json(result.rows);
  } catch (error) {
    console.error(`Erreur lors de la récupération des métadonnées des colonnes pour ${tableName}:`, error);
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
});

// Route pour récupérer la liste des tables
router.get('/tables', async (req, res) => {
  const client = await pool.connect();
  try {
    console.log('Récupération de la liste des tables');
    
    // Requête pour obtenir toutes les tables de la base de données (sauf les tables système)
    const query = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE' 
      ORDER BY table_name
    `;
    
    const result = await client.query(query);
    const tables = result.rows.map(row => row.table_name);
    
    console.log(`${tables.length} tables trouvées:`, tables);
    
    res.json({ tables });
  } catch (error) {
    console.error('Erreur lors de la récupération des tables:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la récupération des tables', 
      details: error.message 
    });
  } finally {
    client.release();
  }
});

// Route pour vérifier l'état d'une tâche de calcul
router.get('/calculate-scores/status/:taskId', (req, res) => {
  const { taskId } = req.params;
  
  if (!taskId || !runningTasks[taskId]) {
    return res.status(404).json({ error: 'Tâche non trouvée' });
  }
  
  const task = runningTasks[taskId];
  res.json({
    taskId,
    tableName: task.tableName,
    status: task.status,
    progress: task.progress,
    stats: task.stats,
    error: task.error,
    startTime: task.startTime,
    endTime: task.endTime
  });
});

// Route pour calculer les scores d'une table (version asynchrone)
router.post('/calculate-scores/:tableName', (req, res) => {
  const { tableName } = req.params;
  
  if (!tableName) {
    return res.status(400).json({ error: 'Nom de table requis' });
  }
  
  console.log(`Demande de calcul des scores pour la table: ${tableName}`);
  
  // Générer un ID unique pour cette tâche
  const taskId = Date.now().toString() + Math.random().toString(36).substring(2, 15);
  
  // Initialiser la tâche
  runningTasks[taskId] = {
    tableName,
    status: 'starting',
    progress: 0,
    stats: {
      updated: 0,
      unchanged: 0,
      errors: 0,
      total: 0
    },
    error: null,
    startTime: new Date(),
    endTime: null
  };
  
  // Répondre immédiatement avec l'ID de la tâche
  res.json({
    success: true,
    message: `Calcul des scores démarré pour la table ${tableName}`,
    taskId
  });
  
  // Chemin vers le script de calcul des scores
  const scriptPath = path.join(__dirname, '..', 'calculate_scores.js');
  
  // Mettre à jour le statut
  runningTasks[taskId].status = 'running';
  
  // Exécuter le script avec le nom de la table en paramètre avec un tampon plus grand
  const process = exec(`node "${scriptPath}" ${tableName}`, { maxBuffer: 20 * 1024 * 1024 }, (error, stdout, stderr) => {
    if (error) {
      console.error(`Erreur lors de l'exécution du script: ${error.message}`);
      runningTasks[taskId].status = 'error';
      runningTasks[taskId].error = {
        message: error.message,
        stderr: stderr
      };
      runningTasks[taskId].endTime = new Date();
      return;
    }
    
    if (stderr) {
      console.warn(`Avertissements lors de l'exécution du script: ${stderr}`);
    }
    
    console.log(`Résultat du calcul des scores: ${stdout.substring(0, 200)}...`);
    
    // Extraire les statistiques du résultat
    try {
      const updatedMatch = stdout.match(/Scores mis à jour : (\d+)/);
      const unchangedMatch = stdout.match(/Scores inchangés : (\d+)/);
      const errorMatch = stdout.match(/Erreurs : (\d+)/);
      const totalMatch = stdout.match(/Total traité : (\d+)/);
      
      if (updatedMatch) runningTasks[taskId].stats.updated = parseInt(updatedMatch[1]);
      if (unchangedMatch) runningTasks[taskId].stats.unchanged = parseInt(unchangedMatch[1]);
      if (errorMatch) runningTasks[taskId].stats.errors = parseInt(errorMatch[1]);
      if (totalMatch) runningTasks[taskId].stats.total = parseInt(totalMatch[1]);
      
      runningTasks[taskId].status = 'completed';
      runningTasks[taskId].progress = 100;
    } catch (parseError) {
      console.error('Erreur lors de l\'analyse des statistiques:', parseError);
      runningTasks[taskId].status = 'completed_with_errors';
      runningTasks[taskId].error = {
        message: 'Erreur lors de l\'analyse des statistiques',
        details: parseError.message
      };
    }
    
    runningTasks[taskId].endTime = new Date();
    
    // Nettoyer les tâches terminées après 1 heure
    setTimeout(() => {
      delete runningTasks[taskId];
    }, 3600000); // 1 heure
  });
  
  // Gérer les erreurs de démarrage du processus
  process.on('error', (error) => {
    console.error(`Erreur lors du démarrage du processus: ${error.message}`);
    runningTasks[taskId].status = 'error';
    runningTasks[taskId].error = {
      message: 'Erreur lors du démarrage du calcul des scores',
      details: error.message
    };
    runningTasks[taskId].endTime = new Date();
  });
});

// Route pour exporter les données d'une table au format Excel ou CSV
router.post('/export/:format', async (req, res) => {
  console.log('=== Export Fournisseurs ===');
  console.log('URL:', req.url);
  console.log('Format:', req.params.format);
  console.log('Body:', req.body);
  
  if (!req.body || !req.body.tableName) {
    console.error('Nom de la table manquant dans la requête');
    return res.status(400).json({ error: 'Le nom de la table est requis' });
  }

  const { tableName, filters, visibleColumns } = req.body;
  const format = req.params.format.toLowerCase();
  
  if (!['excel', 'csv'].includes(format)) {
    return res.status(400).json({ error: 'Format non supporté. Utilisez excel ou csv.' });
  }

  console.log('Nom de la table à exporter:', tableName);
  console.log('Format d\'export:', format);
  console.log('Filtres:', filters);
  console.log('Colonnes visibles:', visibleColumns);
  
  const client = await pool.connect();

  try {
    // Vérifier si la table existe
    const exists = await client.query(`
      SELECT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = $1
      )
    `, [tableName]);

    if (!exists.rows[0].exists) {
      return res.status(404).json({ error: 'Table non trouvée' });
    }

    // Construire la requête SQL avec filtres et colonnes visibles
    let query = `SELECT `;
    
    // Sélectionner toutes les colonnes ou seulement les colonnes visibles
    if (visibleColumns && visibleColumns.length > 0) {
      // Échapper les noms de colonnes pour éviter les injections SQL
      const escapedColumns = visibleColumns.map(col => `"${col}"`).join(', ');
      query += escapedColumns;
    } else {
      query += '* ';
    }
    
    query += ` FROM "${tableName}"`;
    
    // Ajouter les filtres à la requête si présents
    const queryParams = [];
    if (filters && Object.keys(filters).length > 0) {
      const filterConditions = [];
      
      Object.entries(filters).forEach(([column, values], index) => {
        if (values && values.length > 0) {
          // Pour chaque valeur de filtre, créer une condition
          const conditions = values.map((_, valueIndex) => {
            const paramIndex = queryParams.length + 1;
            queryParams.push(values[valueIndex]);
            return `"${column}" = $${paramIndex}`;
          });
          
          // Combiner les conditions pour cette colonne avec OR
          filterConditions.push(`(${conditions.join(' OR ')})`);
        }
      });
      
      // Ajouter la clause WHERE si des filtres sont présents
      if (filterConditions.length > 0) {
        query += ` WHERE ${filterConditions.join(' AND ')}`;
      }
    }
    
    console.log('Requête SQL:', query);
    console.log('Paramètres:', queryParams);
    
    // Exécuter la requête
    const result = await client.query(query, queryParams);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Aucune donnée trouvée dans la table avec les filtres spécifiés' });
    }

    if (format === 'csv') {
      // Export CSV
      const json2csvParser = new Parser();
      const csv = json2csvParser.parse(result.rows);

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${tableName}_${new Date().toISOString().split('T')[0]}.csv"`
      );

      res.send(csv);
    } else {
      // Export Excel
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet(tableName);

      // Ajouter les en-têtes
      if (result.rows.length > 0) {
        worksheet.columns = Object.keys(result.rows[0]).map(key => ({
          header: key,
          key: key,
          width: 15
        }));
      }

      // Ajouter les données
      worksheet.addRows(result.rows);

      // Appliquer un style aux en-têtes
      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFD3D3D3' } // Couleur gris clair
      };

      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${tableName}_${new Date().toISOString().split('T')[0]}.xlsx"`
      );

      await workbook.xlsx.write(res);
      res.end();
    }

  } catch (error) {
    console.error(`Erreur lors de l'export ${format}:`, error);
    res.status(500).json({ 
      error: `Erreur lors de l'export ${format}`,
      details: error.message 
    });
  } finally {
    client.release();
  }
});

module.exports = router;
