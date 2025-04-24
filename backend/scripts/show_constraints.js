const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 5432,
});

async function showConstraints() {
  try {
    const query = `
      SELECT
        tc.table_schema, 
        tc.constraint_name, 
        tc.table_name, 
        kcu.column_name,
        ccu.table_schema AS foreign_table_schema,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name 
      FROM 
        information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY';
    `;

    const result = await pool.query(query);
    console.log('\nContraintes de clé étrangère dans la base de données:');
    console.log('------------------------------------------------');
    result.rows.forEach(row => {
      console.log(`Table: ${row.table_name}`);
      console.log(`Contrainte: ${row.constraint_name}`);
      console.log(`Colonne: ${row.column_name}`);
      console.log(`Référence: ${row.foreign_table_name}(${row.foreign_column_name})`);
      console.log('------------------------------------------------');
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des contraintes:', error);
  } finally {
    await pool.end();
  }
}

showConstraints();
