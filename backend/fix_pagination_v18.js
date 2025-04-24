/**
 * Script pour corriger la pagination de la table fournisseurs_fournisseurs_v18
 */

const fs = require('fs');
const path = require('path');

// Chemin du fichier fournisseurs.js à modifier
const fournisseursPath = path.join(__dirname, 'routes', 'fournisseurs.js');

// Lire le contenu du fichier
console.log(`Lecture du fichier ${fournisseursPath}...`);
let content = fs.readFileSync(fournisseursPath, 'utf8');

// Créer une sauvegarde du fichier
const backupPath = `${fournisseursPath}.backup.${Date.now()}`;
fs.writeFileSync(backupPath, content);
console.log(`Sauvegarde créée: ${backupPath}`);

// Rechercher la route pour récupérer les données d'une table spécifique
const tableRoutePattern = /router\.get\('\/table\/:tableName', async \(req, res\) => \{[\s\S]+?res\.json\(\{[\s\S]+?\}\);[\s\S]+?client\.release\(\);\s*\}\s*\} catch \(error\) \{[\s\S]+?res\.status\(500\)\.json\(\{ error: 'Erreur lors de la récupération des données' \}\);\s*\}\s*\}\);/;

// Nouvelle implémentation de la route
const newTableRoute = `router.get('/table/:tableName', async (req, res) => {
  try {
    const { tableName } = req.params;
    const { page = 1, pageSize = 50, sortBy, sortOrder, filters } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(pageSize);
    const limit = parseInt(pageSize);
    
    console.log('Route /fournisseurs/table/:tableName appelée avec:', {
      tableName,
      page,
      pageSize,
      offset,
      limit,
      sortBy,
      sortOrder,
      filters
    });
    
    // Vérifier que le nom de la table est valide
    if (!tableName.startsWith('fournisseurs_') && tableName !== 'fournisseurs') {
      console.log('Nom de table invalide:', tableName);
      return res.json({ 
        data: [],
        pagination: {
          page: parseInt(page),
          pageSize: limit,
          totalRows: 0,
          totalPages: 0
        }
      });
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
        console.log('Table non trouvée:', tableName);
        return res.json({ 
          data: [],
          pagination: {
            page: parseInt(page),
            pageSize: limit,
            totalRows: 0,
            totalPages: 0
          }
        });
      }
      
      // Compter le nombre total de lignes
      const countQuery = \`SELECT COUNT(*) FROM "\${tableName}"\`;
      const countResult = await client.query(countQuery);
      const totalRows = parseInt(countResult.rows[0].count);
      const totalPages = Math.ceil(totalRows / limit);
      
      console.log('Informations de pagination:', { totalRows, totalPages });
      
      // Construire la requête de base
      let query = \`SELECT * FROM "\${tableName}"\`;
      let queryParams = [];
      let whereClause = '';
      
      // Ajouter les filtres si présents
      if (filters) {
        try {
          const parsedFilters = typeof filters === 'string' ? JSON.parse(filters) : filters;
          const filterConditions = [];
          
          Object.entries(parsedFilters).forEach(([column, values]) => {
            if (Array.isArray(values) && values.length > 0) {
              const placeholders = values.map((_, idx) => \`$\${queryParams.length + idx + 1}\`).join(', ');
              filterConditions.push(\`"\${column}" IN (\${placeholders})\`);
              queryParams.push(...values);
            }
          });
          
          if (filterConditions.length > 0) {
            whereClause = \` WHERE \${filterConditions.join(' AND ')}\`;
            query += whereClause;
          }
        } catch (error) {
          console.error('Erreur lors du parsing des filtres:', error);
        }
      }
      
      // Ajouter le tri si présent
      if (sortBy && sortOrder) {
        query += \` ORDER BY "\${sortBy}" \${sortOrder === 'desc' ? 'DESC' : 'ASC'}\`;
      } else {
        // Tri par défaut
        query += \` ORDER BY id\`;
      }
      
      // Ajouter la pagination
      query += \` LIMIT $\${queryParams.length + 1} OFFSET $\${queryParams.length + 2}\`;
      queryParams.push(limit, offset);
      
      console.log('Requête SQL:', query);
      console.log('Paramètres:', queryParams);
      
      // Exécuter la requête
      const result = await client.query(query, queryParams);
      console.log(\`\${result.rows.length} lignes récupérées sur un total de \${totalRows}\`);
      
      // Log détaillé pour le débogage
      console.log('=== End Request Details ===');
      console.log(\`Route /fournisseurs/table/:tableName appelée avec: \${JSON.stringify({
        tableName,
        page,
        pageSize,
        sortBy,
        sortOrder,
        filters
      }, null, 2)}\`);
      console.log(\`Données récupérées: \${result.rows.length} lignes sur un total de \${totalRows}\`);
      console.log('=== Request Details ===');
      
      // Renvoyer les données avec les informations de pagination
      res.json({ 
        data: result.rows,
        pagination: {
          page: parseInt(page),
          pageSize: limit,
          totalRows,
          totalPages
        }
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des données:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des données' });
  }
});`;

// Remplacer la route existante
if (tableRoutePattern.test(content)) {
  content = content.replace(tableRoutePattern, newTableRoute);
  console.log('Route de table modifiée pour corriger la pagination');
} else {
  console.log('Pattern de la route de table non trouvé, recherche de la route existante...');
  
  // Rechercher la route de table existante
  const tableRouteIndex = content.indexOf("router.get('/table/:tableName'");
  
  if (tableRouteIndex !== -1) {
    // Trouver la fin de la route
    let braceCount = 0;
    let endIndex = tableRouteIndex;
    let foundStart = false;
    
    for (let i = tableRouteIndex; i < content.length; i++) {
      if (content[i] === '{') {
        braceCount++;
        foundStart = true;
      } else if (content[i] === '}') {
        braceCount--;
        if (foundStart && braceCount === 0) {
          endIndex = i + 1;
          break;
        }
      }
    }
    
    // Remplacer la route existante
    if (endIndex > tableRouteIndex) {
      const beforeRoute = content.substring(0, tableRouteIndex);
      const afterRoute = content.substring(endIndex);
      content = beforeRoute + newTableRoute + afterRoute;
      console.log('Route de table existante remplacée');
    } else {
      console.log('Impossible de trouver la fin de la route de table');
    }
  } else {
    console.log('Route de table non trouvée, ajout manuel de la route...');
    
    // Ajouter la route manuellement après la route racine
    const afterRootRoutePattern = /router\.get\('\/', async \(req, res\) => \{[\s\S]+?\}\);/;
    content = content.replace(afterRootRoutePattern, (match) => {
      return match + '\n\n' + newTableRoute;
    });
    console.log('Route de table ajoutée manuellement');
  }
}

// Écrire le contenu modifié dans le fichier
fs.writeFileSync(fournisseursPath, content);
console.log(`Fichier ${fournisseursPath} modifié avec succès!`);

console.log('Veuillez redémarrer le serveur backend pour appliquer les modifications.');
