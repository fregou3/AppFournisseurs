const { Pool } = require('pg');
const dotenv = require('dotenv');
dotenv.config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT
});

async function describeTable(tableName) {
  try {
    const client = await pool.connect();
    
    // Récupérer la structure de la table
    const result = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = $1
      ORDER BY ordinal_position
    `, [tableName]);
    
    console.log(`Structure de la table ${tableName}:`);
    console.log('-------------------------------------');
    console.log('Colonne\t\tType\t\tNullable');
    console.log('-------------------------------------');
    result.rows.forEach(row => {
      console.log(`${row.column_name}\t\t${row.data_type}\t\t${row.is_nullable}`);
    });
    
    // Récupérer quelques exemples de données
    try {
      const dataResult = await client.query(`
        SELECT * FROM "${tableName}" LIMIT 3
      `);
      
      if (dataResult.rows.length > 0) {
        console.log('\nExemples de données:');
        console.log(JSON.stringify(dataResult.rows, null, 2));
      } else {
        console.log('\nAucune donnée trouvée dans la table.');
      }
    } catch (err) {
      console.error('Erreur lors de la récupération des données:', err.message);
    }
    
    client.release();
  } catch (err) {
    console.error('Erreur:', err);
  } finally {
    pool.end();
  }
}

// Appeler la fonction avec le nom de la table
describeTable('system_group_metadata');
