const { Pool } = require('pg');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

const pool = new Pool({
  user: 'admin',
  host: 'localhost',
  database: 'gestion_fournisseurs',
  password: 'admin123',
  port: 5435,
});

// Fonction pour normaliser les noms (supprimer la ponctuation et les espaces supplémentaires)
function normalizeName(name) {
  return name
    .toLowerCase()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Fonction pour trouver le fichier correspondant au nom du fournisseur
function findMatchingFile(files, supplierName) {
  const normalizedSupplierName = normalizeName(supplierName);
  
  return files.find(file => {
    const fileName = path.parse(file).name;
    const normalizedFileName = normalizeName(fileName);
    
    // Vérifier si le nom normalisé du fournisseur est contenu dans le nom normalisé du fichier
    // ou vice versa
    return normalizedFileName.includes(normalizedSupplierName) || 
           normalizedSupplierName.includes(normalizedFileName);
  });
}

async function importDetails() {
  try {
    // Récupérer les 25 premiers fournisseurs
    const fournisseurs = await pool.query(
      'SELECT id, partners_group FROM fournisseurs WHERE id <= 25 ORDER BY id'
    );

    const fichesDir = 'C:/App/AppGetionFournisseurs/AppGetionFournisseurs_1.9/Fiches';
    const files = await fs.readdir(fichesDir);

    for (const fournisseur of fournisseurs.rows) {
      const id = fournisseur.id;
      const name = fournisseur.partners_group;

      // Chercher un fichier correspondant au nom du fournisseur
      const matchingFile = findMatchingFile(files, name);

      if (matchingFile) {
        // Lire le contenu du fichier
        const filePath = path.join(fichesDir, matchingFile);
        const content = await fs.readFile(filePath, 'utf-8');

        // Insérer ou mettre à jour les détails dans la base de données
        await pool.query(
          `INSERT INTO details (id, name, details) 
           VALUES ($1, $2, $3)
           ON CONFLICT (id) 
           DO UPDATE SET name = $2, details = $3`,
          [id, name, content]
        );

        console.log(`Importé avec succès : ${name} (ID: ${id}) - Fichier: ${matchingFile}`);
      } else {
        console.log(`Aucun fichier trouvé pour : ${name} (ID: ${id})`);
      }
    }

    console.log('Import terminé');
  } catch (error) {
    console.error('Erreur lors de l\'import :', error);
  } finally {
    await pool.end();
  }
}

importDetails();
