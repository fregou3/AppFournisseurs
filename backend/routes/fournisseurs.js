const express = require('express');
const router = express.Router();
const XLSX = require('xlsx');
const path = require('path');
const pool = require('../db');
const multer = require('multer');
const fs = require('fs');

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

// Route pour importer un fichier Excel
router.post('/upload', async (req, res) => {
  try {
    console.log('Upload request received');
    console.log('Request body:', req.body);
    console.log('Request files:', req.files ? Object.keys(req.files) : 'No files');
    
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

      console.log(`Importation terminée:
      - Lignes dans le fichier Excel: ${data.length}
      - Lignes insérées avec succès: ${insertedCount}
      - Lignes avec erreurs: ${errorCount}
      - Nombre final de lignes dans la table: ${finalCount}
      `);
      
      // Retourner une réponse de succès
      return res.status(200).json({
        message: `Importation réussie dans la table ${tableName}`,
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

module.exports = router;
