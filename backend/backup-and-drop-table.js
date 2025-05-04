const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
dotenv.config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT
});

async function backupAndDropTable(tableName) {
  let client;
  try {
    client = await pool.connect();
    
    // Vérifier si la table existe
    const checkResult = await client.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = $1
      )
    `, [tableName]);
    
    const tableExists = checkResult.rows[0].exists;
    
    if (!tableExists) {
      console.log(`La table ${tableName} n'existe pas dans la base de données.`);
      return;
    }
    
    // Récupérer la structure de la table
    console.log(`Récupération de la structure de la table ${tableName}...`);
    const structureResult = await client.query(`
      SELECT column_name, data_type, character_maximum_length, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = $1
      ORDER BY ordinal_position
    `, [tableName]);
    
    // Récupérer les données de la table
    console.log(`Récupération des données de la table ${tableName}...`);
    const dataResult = await client.query(`SELECT * FROM "${tableName}"`);
    
    // Créer le répertoire de sauvegarde s'il n'existe pas
    const backupDir = path.join(__dirname, 'backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir);
    }
    
    // Créer un nom de fichier avec la date et l'heure
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(backupDir, `${tableName}_backup_${timestamp}.json`);
    
    // Sauvegarder les données et la structure dans un fichier JSON
    const backup = {
      tableName,
      timestamp,
      structure: structureResult.rows,
      data: dataResult.rows
    };
    
    fs.writeFileSync(backupFile, JSON.stringify(backup, null, 2));
    console.log(`Sauvegarde de la table ${tableName} effectuée avec succès dans ${backupFile}`);
    
    // Supprimer la table
    console.log(`Suppression de la table ${tableName}...`);
    await client.query(`DROP TABLE IF EXISTS "${tableName}" CASCADE`);
    console.log(`La table ${tableName} a été supprimée avec succès.`);
    
    return backupFile;
  } catch (err) {
    console.error('Erreur lors de la sauvegarde ou de la suppression de la table:', err);
  } finally {
    if (client) client.release();
    pool.end();
  }
}

// Appeler la fonction avec le nom de la table à sauvegarder et supprimer
backupAndDropTable('fournisseurs');
