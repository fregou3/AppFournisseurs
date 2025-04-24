/**
 * Script pour ajouter les routes manquantes au fichier fournisseurs.js
 */

const fs = require('fs');
const path = require('path');

// Chemin du fichier à modifier
const fournisseursPath = path.join(__dirname, 'routes', 'fournisseurs.js');

// Lire le contenu du fichier
console.log(`Lecture du fichier ${fournisseursPath}...`);
let content = fs.readFileSync(fournisseursPath, 'utf8');

// Ajouter les routes manquantes
console.log('Ajout des routes manquantes...');

// Trouver l'endroit où ajouter les routes (juste avant module.exports)
const insertPosition = content.lastIndexOf('module.exports = router;');

if (insertPosition !== -1) {
  // Routes à ajouter
  const missingRoutes = `
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
      
      res.json(result.rows.map(row => row.table_name));
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des tables:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des tables' });
  }
});

// Route pour récupérer les données d'une table
router.get('/table/:tableName', async (req, res) => {
  try {
    const { tableName } = req.params;
    const { page = 1, pageSize = 50, sortBy, sortOrder, filters } = req.query;
    
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

// Route pour récupérer les informations sur les colonnes d'une table
router.get('/table/:tableName/columns', async (req, res) => {
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
      
      // Récupérer les informations sur les colonnes
      const columnsQuery = \`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = $1
        ORDER BY ordinal_position
      \`;
      const columnsResult = await client.query(columnsQuery, [tableName]);
      
      res.json(columnsResult.rows);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des colonnes:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des colonnes' });
  }
});

// Route pour exporter une table en Excel
router.get('/export/:tableName', async (req, res) => {
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

`;

  // Insérer les routes manquantes
  const newContent = content.slice(0, insertPosition) + missingRoutes + content.slice(insertPosition);
  
  // Écrire le contenu modifié dans le fichier
  fs.writeFileSync(fournisseursPath, newContent, 'utf8');
  
  console.log('Routes manquantes ajoutées avec succès!');
} else {
  console.log('Impossible de trouver l\'emplacement pour ajouter les routes.');
}

console.log('Veuillez redémarrer le serveur pour appliquer les modifications.');
