const pool = require('./db');

async function showColumns(tableName) {
  const client = await pool.connect();
  try {
    console.log(`Récupération des colonnes pour la table ${tableName}...`);
    
    // Vérifier si la table existe
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = $1
      )
    `, [tableName]);
    
    if (!tableCheck.rows[0].exists) {
      console.log(`La table ${tableName} n'existe pas.`);
      return;
    }
    
    // Récupérer les informations sur les colonnes
    const columnsQuery = `
      SELECT 
        column_name, 
        data_type, 
        character_maximum_length,
        is_nullable
      FROM 
        information_schema.columns 
      WHERE 
        table_schema = 'public' 
        AND table_name = $1
      ORDER BY 
        ordinal_position
    `;
    
    const result = await client.query(columnsQuery, [tableName]);
    
    console.log(`\nColonnes de la table ${tableName}:`);
    console.log('='.repeat(80));
    console.log('| Nom de la colonne'.padEnd(40) + '| Type de données'.padEnd(25) + '| Nullable |');
    console.log('-'.repeat(80));
    
    result.rows.forEach(row => {
      let dataType = row.data_type;
      if (row.character_maximum_length) {
        dataType += `(${row.character_maximum_length})`;
      }
      
      const columnName = row.column_name.padEnd(40);
      const typeInfo = dataType.padEnd(25);
      const nullable = row.is_nullable === 'YES' ? 'Oui' : 'Non';
      
      console.log(`| ${columnName}| ${typeInfo}| ${nullable.padEnd(8)}|`);
    });
    
    console.log('='.repeat(80));
    console.log(`Total: ${result.rowCount} colonnes`);
    
  } catch (error) {
    console.error('Erreur lors de la récupération des colonnes:', error);
  } finally {
    client.release();
    pool.end();
  }
}

// Exécuter la fonction avec le nom de la table en argument
const tableName = process.argv[2];
if (!tableName) {
  console.error('Veuillez spécifier un nom de table.');
  process.exit(1);
}

showColumns(tableName);
