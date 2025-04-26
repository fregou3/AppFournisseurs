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

// Simuler la création d'un groupe avec des données de test
async function testGroupCreation() {
  const client = await pool.connect();
  
  try {
    console.log('Simulation de création de groupe...');
    
    // Données de test similaires à celles envoyées par le frontend
    const groupData = {
      name: 'test_debug_group',
      filters: { organization_2: ['APAC'] },
      visibleColumns: [
        'id', 'supplier_id', 'procurement_orga', 'partners', 
        'evaluated_not_evaluated', 'ecovadis_name', 'ecovadis_score', 
        'date', 'organization_1', 'organization_2', 'score'
      ]
    };
    
    console.log('Données du groupe:', JSON.stringify(groupData, null, 2));
    
    // Vérifier si le groupe existe déjà
    const groupName = `group_${groupData.name.toLowerCase()}`;
    console.log(`Vérification de l'existence du groupe: ${groupName}`);
    
    const exists = await client.query(`
      SELECT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = $1
      )
    `, [groupName]);
    
    if (exists.rows[0].exists) {
      console.log(`Le groupe ${groupName} existe déjà. Suppression...`);
      await client.query(`DROP TABLE "${groupName}"`);
      console.log(`Groupe ${groupName} supprimé.`);
    }
    
    // Vérifier si la table de métadonnées existe
    console.log('Vérification de la table de métadonnées...');
    
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
    
    // Vérifier les colonnes existantes dans la table fournisseurs
    console.log('Vérification des colonnes de la table fournisseurs...');
    
    const columnsResult = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'fournisseurs'
      ORDER BY ordinal_position;
    `);
    
    const existingColumns = columnsResult.rows.map(row => row.column_name);
    console.log('Colonnes existantes:', existingColumns);
    
    // Filtrer les colonnes visibles pour ne garder que celles qui existent
    const validVisibleColumns = groupData.visibleColumns.filter(col => 
      existingColumns.includes(col)
    );
    
    console.log('Colonnes valides:', validVisibleColumns);
    
    // Construire la requête SQL
    let sql = `CREATE TABLE "${groupName}" AS SELECT `;
    
    if (validVisibleColumns.length > 0) {
      sql += validVisibleColumns.map(col => `"${col}"`).join(', ');
    } else {
      sql += '*';
    }
    
    sql += ' FROM fournisseurs';
    
    // Ajouter les filtres
    if (groupData.filters && Object.keys(groupData.filters).length > 0) {
      const conditions = [];
      
      Object.entries(groupData.filters).forEach(([column, values]) => {
        if (values && values.length > 0) {
          // Vérifier si la colonne existe
          if (existingColumns.includes(column)) {
            const valueList = values.map(v => `'${v.replace(/'/g, "''")}'`).join(',');
            conditions.push(`"${column}" IN (${valueList})`);
          } else {
            console.log(`Attention: La colonne de filtre '${column}' n'existe pas et sera ignorée.`);
          }
        }
      });
      
      if (conditions.length > 0) {
        sql += ' WHERE ' + conditions.join(' AND ');
      }
    }
    
    console.log('Requête SQL générée:', sql);
    
    // Exécuter la requête
    console.log('Exécution de la requête...');
    try {
      await client.query('BEGIN');
      await client.query(sql);
      
      // Sauvegarder les métadonnées
      await client.query(`
        INSERT INTO system_group_metadata (group_name, filters, visible_columns)
        VALUES ($1, $2, $3)
      `, [groupName, JSON.stringify(groupData.filters || {}), JSON.stringify(validVisibleColumns)]);
      
      // Compter le nombre de lignes
      const countResult = await client.query(`SELECT COUNT(*) FROM "${groupName}"`);
      const rowCount = parseInt(countResult.rows[0].count);
      
      await client.query('COMMIT');
      
      console.log(`Groupe ${groupName} créé avec succès. Nombre de lignes: ${rowCount}`);
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Erreur lors de l\'exécution de la requête:', error);
      throw error;
    }
    
  } catch (error) {
    console.error('Erreur lors de la simulation:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

// Exécuter le test
testGroupCreation();
