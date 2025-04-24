/**
 * Script pour ajouter la route racine manquante
 */

const fs = require('fs');
const path = require('path');

// Chemin du fichier à modifier
const fournisseursPath = path.join(__dirname, 'routes', 'fournisseurs.js');

// Lire le contenu du fichier
console.log(`Lecture du fichier ${fournisseursPath}...`);
let content = fs.readFileSync(fournisseursPath, 'utf8');

// Créer une sauvegarde du fichier
const backupPath = `${fournisseursPath}.backup.${Date.now()}`;
fs.writeFileSync(backupPath, content);
console.log(`Sauvegarde créée: ${backupPath}`);

// Vérifier si la route racine existe déjà
if (!content.includes("router.get('/'") && !content.includes('router.get("/")')) {
  console.log('La route racine n\'existe pas, ajout de la route...');
  
  // Trouver l'endroit où ajouter la route (après la fonction normalizeColumnName)
  const insertPosition = content.indexOf('// Route pour récupérer la liste des tables fournisseurs');
  
  if (insertPosition !== -1) {
    // Route à ajouter
    const rootRoute = `// Route pour récupérer les données de la table fournisseurs standard
router.get('/', async (req, res) => {
  try {
    console.log('Route racine /fournisseurs appelée');
    
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
        return res.status(404).json({ error: 'Table fournisseurs non trouvée' });
      }
      
      // Récupérer toutes les données
      const result = await client.query('SELECT * FROM fournisseurs');
      console.log(\`Données récupérées: \${result.rowCount} lignes\`);
      
      // Renvoyer les données directement
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
    const newContent = content.slice(0, insertPosition) + rootRoute + content.slice(insertPosition);
    
    // Écrire le contenu modifié dans le fichier
    fs.writeFileSync(fournisseursPath, newContent, 'utf8');
    
    console.log('Route racine ajoutée avec succès!');
  } else {
    console.log('Impossible de trouver l\'emplacement pour ajouter la route racine.');
  }
} else {
  console.log('La route racine existe déjà.');
}

// Supprimer la route /fournisseurs si elle existe (pour éviter les conflits)
if (content.includes("router.get('/fournisseurs'")) {
  console.log('La route /fournisseurs existe, suppression pour éviter les conflits...');
  
  // Rechercher la route /fournisseurs
  const fournisseursRoutePattern = /router\.get\('\/fournisseurs',[\s\S]+?}\);/;
  
  // Supprimer la route /fournisseurs
  if (content.match(fournisseursRoutePattern)) {
    content = content.replace(fournisseursRoutePattern, '');
    
    // Écrire le contenu modifié dans le fichier
    fs.writeFileSync(fournisseursPath, content, 'utf8');
    
    console.log('Route /fournisseurs supprimée avec succès!');
  } else {
    console.log('Route /fournisseurs non trouvée.');
  }
}

console.log('Veuillez redémarrer le serveur pour appliquer les modifications.');
