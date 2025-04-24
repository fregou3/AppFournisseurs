/**
 * Script pour corriger la route /fournisseurs
 */

const fs = require('fs');
const path = require('path');

// Chemin du fichier à modifier
const fournisseursPath = path.join(__dirname, 'routes', 'fournisseurs.js');

// Lire le contenu du fichier
console.log(`Lecture du fichier ${fournisseursPath}...`);
let content = fs.readFileSync(fournisseursPath, 'utf8');

// Rechercher la route /fournisseurs
const fournisseursRoutePattern = /router\.get\('\/fournisseurs',[\s\S]+?}\);/;

// Nouvelle implémentation simplifiée
const newFournisseursRoute = `router.get('/fournisseurs', async (req, res) => {
  try {
    console.log('Route /fournisseurs appelée');
    
    const client = await pool.connect();
    try {
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
});`;

// Remplacer la route /fournisseurs
if (content.match(fournisseursRoutePattern)) {
  content = content.replace(fournisseursRoutePattern, newFournisseursRoute);
  
  // Écrire le contenu modifié dans le fichier
  fs.writeFileSync(fournisseursPath, content, 'utf8');
  
  console.log('Route /fournisseurs corrigée avec succès!');
} else {
  console.log('Route /fournisseurs non trouvée.');
}

console.log('Veuillez redémarrer le serveur pour appliquer les modifications.');
