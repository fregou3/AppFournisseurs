const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

// Configuration de la connexion à la base de données
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function createApacGroup() {
  const client = await pool.connect();
  try {
    console.log('Création du groupe APAC 2023...');
    
    // Vérifier si la table existe déjà
    const checkTableQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'group_apac_2023'
      );
    `;
    
    const tableExists = await client.query(checkTableQuery);
    
    if (tableExists.rows[0].exists) {
      console.log('La table group_apac_2023 existe déjà. Suppression en cours...');
      await client.query('DROP TABLE "group_apac_2023";');
      console.log('Table group_apac_2023 supprimée.');
    }
    
    // Récupérer les colonnes existantes de la table fournisseurs
    const columnsQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'fournisseurs'
      ORDER BY ordinal_position;
    `;
    
    const columnsResult = await client.query(columnsQuery);
    const columns = columnsResult.rows.map(row => `"${row.column_name}"`).join(', ');
    
    // Créer la requête dynamiquement avec les colonnes existantes
    const createTableQuery = `
      CREATE TABLE "group_apac_2023" AS 
      SELECT ${columns} 
      FROM fournisseurs 
      WHERE "organization_2" IN ('APAC');
    `;
    
    console.log('Exécution de la requête :');
    console.log(createTableQuery);
    
    await client.query(createTableQuery);
    
    // Vérifier le nombre de lignes dans la nouvelle table
    const countQuery = `SELECT COUNT(*) FROM "group_apac_2023";`;
    const countResult = await client.query(countQuery);
    
    console.log(`Table group_apac_2023 créée avec succès. Nombre de lignes : ${countResult.rows[0].count}`);
    
  } catch (err) {
    console.error('Erreur lors de la création du groupe :', err);
  } finally {
    client.release();
    await pool.end();
  }
}

createApacGroup();
