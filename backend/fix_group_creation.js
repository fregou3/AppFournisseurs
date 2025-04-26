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

async function fixGroupCreation() {
  const client = await pool.connect();
  try {
    console.log('Vérification et correction des problèmes de création de groupes...');
    
    // 1. Vérifier si la table de métadonnées existe
    const metadataExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'system_group_metadata'
      );
    `);
    
    if (!metadataExists.rows[0].exists) {
      console.log('Création de la table system_group_metadata...');
      await client.query(`
        CREATE TABLE system_group_metadata (
          group_name TEXT PRIMARY KEY,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          filters JSONB,
          visible_columns JSONB
        )
      `);
      console.log('Table system_group_metadata créée avec succès.');
    } else {
      console.log('La table system_group_metadata existe déjà.');
    }
    
    // 2. Récupérer la liste des colonnes de la table fournisseurs
    const columnsResult = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'fournisseurs'
      ORDER BY ordinal_position;
    `);
    
    const columns = columnsResult.rows.map(row => row.column_name);
    console.log('Colonnes disponibles dans la table fournisseurs:');
    console.log(columns);
    
    // 3. Vérifier si des groupes existent déjà
    const groupsQuery = `
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename LIKE 'group_%';
    `;
    
    const groupsResult = await client.query(groupsQuery);
    console.log(`${groupsResult.rows.length} groupes existants trouvés.`);
    
    for (const row of groupsResult.rows) {
      const groupName = row.tablename;
      console.log(`Vérification du groupe: ${groupName}`);
      
      // Vérifier si le groupe a des métadonnées
      const metadataResult = await client.query(`
        SELECT * FROM system_group_metadata 
        WHERE group_name = $1
      `, [groupName]);
      
      if (metadataResult.rows.length === 0) {
        console.log(`Aucune métadonnée trouvée pour le groupe ${groupName}. Ajout des métadonnées...`);
        
        // Ajouter des métadonnées par défaut
        await client.query(`
          INSERT INTO system_group_metadata (group_name, filters, visible_columns)
          VALUES ($1, $2, $3)
        `, [groupName, '{}', JSON.stringify(columns)]);
        
        console.log(`Métadonnées ajoutées pour le groupe ${groupName}.`);
      } else {
        console.log(`Métadonnées existantes pour le groupe ${groupName}.`);
      }
    }
    
    console.log('Vérification et correction terminées avec succès.');
    
  } catch (err) {
    console.error('Erreur lors de la correction :', err);
  } finally {
    client.release();
    await pool.end();
  }
}

fixGroupCreation();
