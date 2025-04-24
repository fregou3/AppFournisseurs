/**
 * Script pour corriger le format des données renvoyées par la route /fournisseurs/table/:tableName
 */

const fs = require('fs');
const path = require('path');

// Chemin du fichier à modifier
const fournisseursPath = path.join(__dirname, 'routes', 'fournisseurs.js');

// Lire le contenu du fichier
console.log(`Lecture du fichier ${fournisseursPath}...`);
let content = fs.readFileSync(fournisseursPath, 'utf8');

// Trouver et corriger la route /table/:tableName
console.log('Correction de la route /fournisseurs/table/:tableName...');

// Rechercher le bloc de code qui renvoie la réponse dans la route /table/:tableName
const searchPattern = /res\.json\(\{\s*data: result\.rows,\s*columns: columnsResult\.rows,\s*pagination: \{\s*totalRows,\s*page: parseInt\(page\),\s*pageSize: parseInt\(pageSize\),\s*totalPages: Math\.ceil\(totalRows \/ pageSize\)\s*\}\s*\}\);/;

// Nouveau format de réponse
const replacement = `// Pour la table fournisseurs standard, on renvoie directement les données
      if (tableName === 'fournisseurs') {
        res.json(result.rows);
      } else {
        // Pour les autres tables, on renvoie un objet avec les données, les colonnes et la pagination
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
      }`;

// Remplacer le bloc
if (content.match(searchPattern)) {
  content = content.replace(searchPattern, replacement);
  
  // Écrire le contenu modifié dans le fichier
  fs.writeFileSync(fournisseursPath, content, 'utf8');
  
  console.log('Route /fournisseurs/table/:tableName corrigée avec succès!');
} else {
  console.log('Impossible de trouver le bloc à corriger. Essai avec une autre approche...');
  
  // Rechercher une autre partie du code qui pourrait être modifiée
  const alternativePattern = /res\.json\(\{[\s\S]+?pagination:[\s\S]+?\}\);/g;
  
  if (content.match(alternativePattern)) {
    content = content.replace(alternativePattern, replacement);
    
    // Écrire le contenu modifié dans le fichier
    fs.writeFileSync(fournisseursPath, content, 'utf8');
    
    console.log('Route /fournisseurs/table/:tableName corrigée avec succès (approche alternative)!');
  } else {
    console.log('Impossible de trouver le bloc à corriger avec l\'approche alternative.');
    
    // Dernière tentative : modification manuelle de la route complète
    console.log('Tentative de réécriture complète de la route...');
    
    // Rechercher le début de la route
    const routeStart = content.indexOf("router.get('/table/:tableName'");
    
    if (routeStart !== -1) {
      // Trouver la fin de la route (prochaine route ou fin du fichier)
      let routeEnd = content.indexOf("router.", routeStart + 1);
      if (routeEnd === -1) {
        routeEnd = content.indexOf("module.exports", routeStart);
      }
      
      if (routeEnd !== -1) {
        // Extraire la route complète
        const originalRoute = content.substring(routeStart, routeEnd);
        
        // Créer la nouvelle route
        const newRoute = `router.get('/table/:tableName', async (req, res) => {
  try {
    const { tableName } = req.params;
    const { page = 1, pageSize = 50, sortBy, sortOrder, filters } = req.query;
    
    // Vérifier que le nom de la table est valide (commence par fournisseurs_)
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
      
      // Pour la table fournisseurs standard, on renvoie directement les données
      if (tableName === 'fournisseurs') {
        res.json(result.rows);
      } else {
        // Pour les autres tables, on renvoie un objet avec les données, les colonnes et la pagination
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
      }
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des données:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des données' });
  }
});

`;
        
        // Remplacer la route originale par la nouvelle
        content = content.substring(0, routeStart) + newRoute + content.substring(routeEnd);
        
        // Écrire le contenu modifié dans le fichier
        fs.writeFileSync(fournisseursPath, content, 'utf8');
        
        console.log('Route /fournisseurs/table/:tableName réécrite avec succès!');
      } else {
        console.log('Impossible de trouver la fin de la route.');
      }
    } else {
      console.log('Impossible de trouver le début de la route.');
    }
  }
}

// Ajouter la route /fournisseurs si elle n'existe pas
if (!content.includes("router.get('/fournisseurs'")) {
  console.log('Ajout de la route /fournisseurs...');
  
  // Trouver l'endroit où ajouter la route (juste avant module.exports)
  const insertPosition = content.lastIndexOf('module.exports = router;');
  
  if (insertPosition !== -1) {
    // Route à ajouter
    const fournisseursRoute = `
// Route pour récupérer les données de la table fournisseurs
router.get('/fournisseurs', async (req, res) => {
  try {
    const client = await pool.connect();
    try {
      // Vérifier si la table existe
      const tableCheck = await client.query(\`
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'public'
          AND table_name = 'fournisseurs'
        )
      \`);
      
      if (!tableCheck.rows[0].exists) {
        return res.status(404).json({ error: 'Table fournisseurs non trouvée' });
      }
      
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

`;
    
    // Insérer la route
    const newContent = content.slice(0, insertPosition) + fournisseursRoute + content.slice(insertPosition);
    
    // Écrire le contenu modifié dans le fichier
    fs.writeFileSync(fournisseursPath, newContent, 'utf8');
    
    console.log('Route /fournisseurs ajoutée avec succès!');
  } else {
    console.log('Impossible de trouver l\'emplacement pour ajouter la route /fournisseurs.');
  }
}

console.log('Veuillez redémarrer le serveur pour appliquer les modifications.');
