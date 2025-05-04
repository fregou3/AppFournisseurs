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

async function listTables() {
  try {
    const client = await pool.connect();
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE' 
      ORDER BY table_name
    `);
    
    console.log('Liste des tables dans la base de données:');
    result.rows.forEach(row => console.log(row.table_name));
    
    client.release();
  } catch (err) {
    console.error('Erreur lors de la récupération des tables:', err);
  } finally {
    pool.end();
  }
}

listTables();
