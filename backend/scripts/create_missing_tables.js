/**
 * Script pour créer les tables manquantes dans la base de données
 * Utilisation: node create_missing_tables.js
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Configuration de la connexion à la base de données
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// Fonction pour exécuter le script SQL
async function createMissingTables() {
  const client = await pool.connect();
  try {
    console.log('Connexion à la base de données établie');
    
    // Vérifier si la table system_group_metadata existe déjà
    const checkTableQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'system_group_metadata'
      );
    `;
    
    const tableExists = await client.query(checkTableQuery);
    
    if (tableExists.rows[0].exists) {
      console.log('La table system_group_metadata existe déjà');
    } else {
      console.log('La table system_group_metadata n\'existe pas, création en cours...');
      
      // Lire le contenu du fichier SQL
      const sqlFilePath = path.join(__dirname, 'create_group_metadata_table.sql');
      const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
      
      // Exécuter le script SQL
      await client.query(sqlContent);
      
      console.log('Table system_group_metadata créée avec succès');
    }
    
    // Vérifier si d'autres tables sont nécessaires
    // Vous pouvez ajouter d'autres vérifications et créations de tables ici
    
  } catch (error) {
    console.error('Erreur lors de la création des tables:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

// Exécuter la fonction principale
createMissingTables().catch(err => {
  console.error('Erreur non gérée:', err);
  process.exit(1);
});
