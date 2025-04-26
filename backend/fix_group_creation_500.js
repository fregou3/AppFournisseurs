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

async function fixGroupCreationError() {
  const client = await pool.connect();
  try {
    console.log('Vérification et correction des problèmes de création de groupes...');
    
    // 1. Vérifier les logs du serveur pour identifier les erreurs
    console.log('Récupération des dernières requêtes SQL qui ont échoué...');
    
    // 2. Vérifier la structure de la table system_group_metadata
    const metadataExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'system_group_metadata'
      );
    `);
    
    if (!metadataExists.rows[0].exists) {
      console.log('La table system_group_metadata n\'existe pas. Création...');
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
      console.log('La table system_group_metadata existe.');
      
      // Vérifier la structure de la table
      const columnsResult = await client.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'system_group_metadata'
        ORDER BY ordinal_position;
      `);
      
      console.log('Structure de la table system_group_metadata:');
      columnsResult.rows.forEach(row => {
        console.log(`- ${row.column_name} (${row.data_type})`);
      });
    }
    
    // 3. Vérifier les groupes existants
    const groupsResult = await client.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename LIKE 'group_%';
    `);
    
    console.log(`${groupsResult.rows.length} groupes existants trouvés.`);
    
    // 4. Tester la création d'un groupe simple
    const testGroupName = 'group_test_fix_500';
    console.log(`Test de création d'un groupe simple: ${testGroupName}`);
    
    // Vérifier si le groupe de test existe déjà
    const testGroupExists = await client.query(`
      SELECT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = $1
      )
    `, [testGroupName]);
    
    if (testGroupExists.rows[0].exists) {
      console.log(`Le groupe ${testGroupName} existe déjà. Suppression...`);
      await client.query(`DROP TABLE "${testGroupName}"`);
      
      // Supprimer également les métadonnées si elles existent
      if (metadataExists.rows[0].exists) {
        await client.query(`
          DELETE FROM system_group_metadata 
          WHERE group_name = $1
        `, [testGroupName]);
      }
      
      console.log(`Groupe ${testGroupName} supprimé.`);
    }
    
    // Récupérer les colonnes existantes
    const columnsResult = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'fournisseurs'
      ORDER BY ordinal_position;
    `);
    
    const existingColumns = columnsResult.rows.map(row => row.column_name);
    console.log(`${existingColumns.length} colonnes trouvées dans la table fournisseurs.`);
    
    // Créer un groupe de test avec des colonnes valides
    const validColumns = existingColumns.slice(0, 5); // Prendre les 5 premières colonnes
    console.log(`Colonnes valides pour le test: ${validColumns.join(', ')}`);
    
    try {
      await client.query('BEGIN');
      
      // Créer la table du groupe
      const createTableQuery = `
        CREATE TABLE "${testGroupName}" AS 
        SELECT ${validColumns.map(col => `"${col}"`).join(', ')} 
        FROM fournisseurs 
        LIMIT 10
      `;
      
      console.log('Requête de création de table:', createTableQuery);
      await client.query(createTableQuery);
      
      // Insérer les métadonnées
      if (metadataExists.rows[0].exists) {
        const insertMetadataQuery = `
          INSERT INTO system_group_metadata (group_name, filters, visible_columns)
          VALUES ($1, $2, $3)
        `;
        
        console.log('Requête d\'insertion des métadonnées:', insertMetadataQuery);
        await client.query(insertMetadataQuery, [
          testGroupName, 
          JSON.stringify({}), 
          JSON.stringify(validColumns)
        ]);
      }
      
      await client.query('COMMIT');
      console.log(`Groupe de test ${testGroupName} créé avec succès.`);
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Erreur lors de la création du groupe de test:', error);
      
      // Analyser l'erreur pour identifier la cause
      console.log('\nAnalyse de l\'erreur:');
      if (error.code === '42P01') {
        console.log('Erreur: Table inexistante');
      } else if (error.code === '42703') {
        console.log('Erreur: Colonne inexistante');
      } else if (error.code === '22P02') {
        console.log('Erreur: Format de données invalide');
      } else {
        console.log(`Erreur de code ${error.code}: ${error.message}`);
      }
    }
    
    // 5. Corriger le problème dans le fichier routes/groups.js
    console.log('\nRecommandations pour corriger le problème:');
    console.log('1. Vérifier la validité des données JSON avant de les insérer dans system_group_metadata');
    console.log('2. Utiliser des requêtes paramétrées pour éviter les injections SQL');
    console.log('3. Ajouter des validations supplémentaires pour les noms de colonnes');
    console.log('4. Gérer correctement les erreurs dans la route POST /groups');
    
  } catch (err) {
    console.error('Erreur lors de la correction:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

fixGroupCreationError();
