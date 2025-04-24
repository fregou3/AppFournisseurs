const pool = require('./db');

/**
 * Fonction pour cloner la structure d'une table
 * @param {string} sourceTable - Nom de la table source
 * @param {string} targetTable - Nom de la table cible
 * @returns {Promise<boolean>} - True si le clonage a réussi, false sinon
 */
async function cloneTableStructure(sourceTable, targetTable) {
  const client = await pool.connect();
  try {
    console.log(`Clonage de la structure de la table ${sourceTable} vers ${targetTable}...`);
    
    // Vérifier si la table source existe
    const sourceTableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = $1
      )
    `, [sourceTable]);
    
    if (!sourceTableCheck.rows[0].exists) {
      console.error(`La table source ${sourceTable} n'existe pas.`);
      return false;
    }
    
    // Vérifier si la table cible existe déjà
    const targetTableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = $1
      )
    `, [targetTable]);
    
    if (targetTableCheck.rows[0].exists) {
      console.log(`La table cible ${targetTable} existe déjà.`);
      return true;
    }
    
    // Récupérer la structure de la table source
    const columnsQuery = `
      SELECT 
        column_name, 
        data_type, 
        character_maximum_length,
        is_nullable,
        column_default,
        ordinal_position
      FROM 
        information_schema.columns 
      WHERE 
        table_schema = 'public' 
        AND table_name = $1
      ORDER BY 
        ordinal_position
    `;
    
    const columnsResult = await client.query(columnsQuery, [sourceTable]);
    
    if (columnsResult.rows.length === 0) {
      console.error(`Aucune colonne trouvée pour la table ${sourceTable}.`);
      return false;
    }
    
    // Construire la définition des colonnes pour la nouvelle table
    const columnDefinitions = columnsResult.rows.map(column => {
      let columnDef = `"${column.column_name}" ${column.data_type}`;
      
      // Ajouter la longueur maximale pour les types character
      if (column.character_maximum_length) {
        columnDef += `(${column.character_maximum_length})`;
      }
      
      // Ajouter la contrainte NOT NULL si nécessaire
      if (column.is_nullable === 'NO') {
        columnDef += ' NOT NULL';
      }
      
      // Ajouter la valeur par défaut si elle existe
      if (column.column_default) {
        // Pour la colonne id avec séquence, ne pas ajouter le default
        if (column.column_name === 'id' && column.column_default.includes('nextval')) {
          // Ne rien ajouter, la séquence sera créée séparément
        } else {
          columnDef += ` DEFAULT ${column.column_default}`;
        }
      }
      
      return columnDef;
    }).join(',\n  ');
    
    // Créer la table cible avec la même structure que la table source
    const createTableQuery = `
      CREATE TABLE "${targetTable}" (
        ${columnDefinitions}
      )
    `;
    
    await client.query('BEGIN');
    
    // Créer la table
    await client.query(createTableQuery);
    
    // Récupérer les contraintes de clé primaire
    const primaryKeyQuery = `
      SELECT
        tc.constraint_name,
        kcu.column_name
      FROM
        information_schema.table_constraints tc
      JOIN
        information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
      WHERE
        tc.constraint_type = 'PRIMARY KEY'
        AND tc.table_schema = 'public'
        AND tc.table_name = $1
    `;
    
    const primaryKeyResult = await client.query(primaryKeyQuery, [sourceTable]);
    
    // Ajouter la contrainte de clé primaire si elle existe
    if (primaryKeyResult.rows.length > 0) {
      const pkColumns = primaryKeyResult.rows.map(row => `"${row.column_name}"`).join(', ');
      const addPkQuery = `
        ALTER TABLE "${targetTable}"
        ADD PRIMARY KEY (${pkColumns})
      `;
      await client.query(addPkQuery);
    }
    
    // Créer une séquence pour la colonne id si nécessaire
    const idColumn = columnsResult.rows.find(col => col.column_name === 'id');
    if (idColumn && idColumn.column_default && idColumn.column_default.includes('nextval')) {
      // Extraire le nom de la séquence
      const sequenceName = `${targetTable}_id_seq`;
      
      // Créer la séquence
      await client.query(`CREATE SEQUENCE IF NOT EXISTS "${sequenceName}"`);
      
      // Associer la séquence à la colonne id
      await client.query(`
        ALTER TABLE "${targetTable}"
        ALTER COLUMN "id" SET DEFAULT nextval('"${sequenceName}"')
      `);
      
      // Définir la propriété de la séquence
      await client.query(`
        ALTER SEQUENCE "${sequenceName}" OWNED BY "${targetTable}"."id"
      `);
    }
    
    await client.query('COMMIT');
    
    console.log(`Table ${targetTable} créée avec succès.`);
    return true;
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erreur lors du clonage de la structure de la table:', error);
    return false;
  } finally {
    client.release();
  }
}

// Si le script est exécuté directement, utiliser les arguments de ligne de commande
if (require.main === module) {
  const sourceTable = process.argv[2];
  const targetTable = process.argv[3];
  
  if (!sourceTable || !targetTable) {
    console.error('Usage: node clone_table_structure.js <sourceTable> <targetTable>');
    process.exit(1);
  }
  
  cloneTableStructure(sourceTable, targetTable)
    .then(success => {
      if (success) {
        console.log('Clonage terminé avec succès.');
      } else {
        console.error('Échec du clonage.');
      }
      pool.end();
    })
    .catch(err => {
      console.error('Erreur:', err);
      pool.end();
      process.exit(1);
    });
} else {
  // Exporter la fonction pour l'utiliser dans d'autres modules
  module.exports = cloneTableStructure;
}
