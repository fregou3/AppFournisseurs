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

async function checkView() {
  try {
    const client = await pool.connect();
    
    // Vérifier si c'est une vue ou une table
    const viewResult = await client.query(`
      SELECT table_name, table_type
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'fournisseurs_view'
    `);
    
    if (viewResult.rows.length > 0) {
      console.log(`'fournisseurs_view' est de type: ${viewResult.rows[0].table_type}`);
      
      if (viewResult.rows[0].table_type === 'VIEW') {
        // Si c'est une vue, récupérer sa définition
        const viewDefResult = await client.query(`
          SELECT view_definition
          FROM information_schema.views
          WHERE table_schema = 'public' AND table_name = 'fournisseurs_view'
        `);
        
        if (viewDefResult.rows.length > 0) {
          console.log('\nDéfinition de la vue:');
          console.log(viewDefResult.rows[0].view_definition);
        }
      } else {
        // Si c'est une table, récupérer sa structure
        const columnsResult = await client.query(`
          SELECT column_name, data_type
          FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = 'fournisseurs_view'
          ORDER BY ordinal_position
        `);
        
        console.log('\nStructure de la table:');
        columnsResult.rows.forEach(row => {
          console.log(`${row.column_name}: ${row.data_type}`);
        });
        
        // Récupérer quelques exemples de données
        const dataResult = await client.query(`
          SELECT * FROM fournisseurs_view LIMIT 3
        `);
        
        if (dataResult.rows.length > 0) {
          console.log('\nExemples de données:');
          console.log(JSON.stringify(dataResult.rows, null, 2));
        } else {
          console.log('\nAucune donnée trouvée dans la table.');
        }
      }
    } else {
      console.log("La table ou vue 'fournisseurs_view' n'existe pas.");
    }
    
    client.release();
  } catch (err) {
    console.error('Erreur:', err);
  } finally {
    pool.end();
  }
}

checkView();
