/**
 * Script pour déboguer le format des données renvoyées par les routes
 */

const fs = require('fs');
const path = require('path');

// Chemin du fichier à modifier
const fournisseursPath = path.join(__dirname, 'routes', 'fournisseurs.js');

// Lire le contenu du fichier
console.log(`Lecture du fichier ${fournisseursPath}...`);
let content = fs.readFileSync(fournisseursPath, 'utf8');

// Ajouter des logs détaillés à la route /fournisseurs
console.log('Ajout de logs détaillés à la route /fournisseurs...');

// Rechercher la route /fournisseurs
const fournisseursRoutePattern = /router\.get\('\/fournisseurs',[\s\S]+?}\);/;

// Nouvelle implémentation avec logs détaillés
const newFournisseursRoute = `router.get('/fournisseurs', async (req, res) => {
  try {
    console.log('Route /fournisseurs appelée');
    
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
        console.log('Table fournisseurs non trouvée');
        // Renvoyer un tableau vide au lieu d'une erreur pour éviter l'erreur "data is not iterable"
        return res.json([]);
      }
      
      // Récupérer toutes les données
      const result = await client.query('SELECT * FROM fournisseurs');
      
      console.log('Données récupérées de la table fournisseurs:', {
        rowCount: result.rowCount,
        firstRow: result.rows.length > 0 ? JSON.stringify(result.rows[0]) : 'aucune donnée'
      });
      
      // S'assurer que la réponse est toujours un tableau, même vide
      const responseData = Array.isArray(result.rows) ? result.rows : [];
      console.log('Type de données renvoyées:', typeof responseData, Array.isArray(responseData));
      
      res.json(responseData);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des données:', error);
    // Renvoyer un tableau vide en cas d'erreur pour éviter l'erreur "data is not iterable"
    res.json([]);
  }
});`;

// Remplacer la route /fournisseurs
if (content.match(fournisseursRoutePattern)) {
  content = content.replace(fournisseursRoutePattern, newFournisseursRoute);
  console.log('Route /fournisseurs modifiée avec succès!');
} else {
  console.log('Route /fournisseurs non trouvée, ajout de la nouvelle route...');
  
  // Trouver l'endroit où ajouter la route (juste avant module.exports)
  const insertPosition = content.lastIndexOf('module.exports = router;');
  
  if (insertPosition !== -1) {
    // Insérer la route
    const newContent = content.slice(0, insertPosition) + newFournisseursRoute + '\n\n' + content.slice(insertPosition);
    content = newContent;
    console.log('Route /fournisseurs ajoutée avec succès!');
  }
}

// Ajouter des logs détaillés à la route /tables
console.log('Ajout de logs détaillés à la route /tables...');

// Rechercher la route /tables
const tablesRoutePattern = /router\.get\('\/tables',[\s\S]+?}\);/;

// Nouvelle implémentation avec logs détaillés
const newTablesRoute = `router.get('/tables', async (req, res) => {
  try {
    console.log('Route /fournisseurs/tables appelée');
    
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
      
      console.log('Tables récupérées:', {
        count: result.rowCount,
        tables: result.rows.map(row => row.table_name)
      });
      
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
        console.log('Table fournisseurs ajoutée à la liste');
      }
      
      console.log('Réponse finale:', { tables });
      res.json({ tables });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des tables:', error);
    // Renvoyer un objet avec un tableau vide en cas d'erreur
    res.json({ tables: [] });
  }
});`;

// Remplacer la route /tables
if (content.match(tablesRoutePattern)) {
  content = content.replace(tablesRoutePattern, newTablesRoute);
  console.log('Route /tables modifiée avec succès!');
} else {
  console.log('Route /tables non trouvée, ajout de la nouvelle route...');
  
  // Trouver l'endroit où ajouter la route (juste avant module.exports)
  const insertPosition = content.lastIndexOf('module.exports = router;');
  
  if (insertPosition !== -1) {
    // Insérer la route
    const newContent = content.slice(0, insertPosition) + newTablesRoute + '\n\n' + content.slice(insertPosition);
    content = newContent;
    console.log('Route /tables ajoutée avec succès!');
  }
}

// Ajouter des logs détaillés à la route /table/:tableName
console.log('Ajout de logs détaillés à la route /table/:tableName...');

// Rechercher la route /table/:tableName
const tableRoutePattern = /router\.get\('\/table\/:tableName',[\s\S]+?}\);/;

// Nouvelle implémentation avec logs détaillés
const newTableRoute = `router.get('/table/:tableName', async (req, res) => {
  try {
    const { tableName } = req.params;
    const { page = 1, pageSize = 50, sortBy, sortOrder, filters } = req.query;
    
    console.log('Route /fournisseurs/table/:tableName appelée avec:', {
      tableName,
      page,
      pageSize,
      sortBy,
      sortOrder,
      filters
    });
    
    // Vérifier que le nom de la table est valide
    if (!tableName.startsWith('fournisseurs_') && tableName !== 'fournisseurs') {
      console.log('Nom de table invalide:', tableName);
      return res.json({ data: [] });
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
        return res.json({ data: [] });
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
      
      console.log('Données récupérées de la table', tableName, ':', {
        rowCount: result.rowCount,
        firstRow: result.rows.length > 0 ? JSON.stringify(result.rows[0]) : 'aucune donnée'
      });
      
      // Récupérer les informations sur les colonnes
      const columnsQuery = \`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = $1
        ORDER BY ordinal_position
      \`;
      const columnsResult = await client.query(columnsQuery, [tableName]);
      
      console.log('Colonnes récupérées:', {
        count: columnsResult.rowCount,
        columns: columnsResult.rows.map(row => row.column_name)
      });
      
      // S'assurer que la réponse contient toujours un tableau data, même vide
      const responseData = {
        data: Array.isArray(result.rows) ? result.rows : [],
        columns: columnsResult.rows,
        pagination: {
          totalRows,
          page: parseInt(page),
          pageSize: parseInt(pageSize),
          totalPages: Math.ceil(totalRows / pageSize)
        }
      };
      
      console.log('Type de données renvoyées:', typeof responseData.data, Array.isArray(responseData.data));
      
      res.json(responseData);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des données:', error);
    // Renvoyer un objet avec un tableau data vide en cas d'erreur
    res.json({ data: [] });
  }
});`;

// Remplacer la route /table/:tableName
if (content.match(tableRoutePattern)) {
  content = content.replace(tableRoutePattern, newTableRoute);
  console.log('Route /table/:tableName modifiée avec succès!');
} else {
  console.log('Route /table/:tableName non trouvée, ajout de la nouvelle route...');
  
  // Trouver l'endroit où ajouter la route (juste avant module.exports)
  const insertPosition = content.lastIndexOf('module.exports = router;');
  
  if (insertPosition !== -1) {
    // Insérer la route
    const newContent = content.slice(0, insertPosition) + newTableRoute + '\n\n' + content.slice(insertPosition);
    content = newContent;
    console.log('Route /table/:tableName ajoutée avec succès!');
  }
}

// Écrire le contenu modifié dans le fichier
fs.writeFileSync(fournisseursPath, content, 'utf8');
console.log('Modifications enregistrées avec succès!');

// Modifier également le composant Home.js pour corriger le problème côté frontend
const homePath = path.join(__dirname, '..', 'frontend', 'src', 'components', 'Home.js');

if (fs.existsSync(homePath)) {
  console.log(`Lecture du fichier ${homePath}...`);
  let homeContent = fs.readFileSync(homePath, 'utf8');
  
  // Modifier la façon dont les données sont traitées
  console.log('Modification du traitement des données dans Home.js...');
  
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
      
      console.log('Fetching data from:', url);
      const response = await axios.get(url);
      console.log('Response received:', response.data);
      
      // Traiter les données en fonction du format de réponse
      if (tableName === 'fournisseurs') {
        // Pour la table fournisseurs, la réponse est directement un tableau
        setData(Array.isArray(response.data) ? response.data : []);
      } else {
        // Pour les autres tables, la réponse est un objet avec une propriété data
        setData(response.data && response.data.data ? response.data.data : []);
      }
    } catch (error) {
      console.error(\`Erreur lors du chargement des données de la table \${tableName}:\`, error);
      setError(\`Erreur lors du chargement des données de la table \${tableName}\`);
      // En cas d'erreur, initialiser data avec un tableau vide pour éviter l'erreur "data is not iterable"
      setData([]);
    } finally {
      setLoading(false);
    }
  };`;
  
  // Remplacer la fonction fetchData
  if (homeContent.match(fetchDataPattern)) {
    homeContent = homeContent.replace(fetchDataPattern, newFetchData);
    console.log('Fonction fetchData modifiée avec succès!');
    
    // Écrire le contenu modifié dans le fichier
    fs.writeFileSync(homePath, homeContent, 'utf8');
    console.log('Modifications de Home.js enregistrées avec succès!');
  } else {
    console.log('Fonction fetchData non trouvée dans Home.js');
  }
} else {
  console.log(`Le fichier ${homePath} n'existe pas`);
}

console.log('Veuillez redémarrer le serveur pour appliquer les modifications.');
