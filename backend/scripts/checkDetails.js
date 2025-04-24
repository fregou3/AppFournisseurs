const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: 'admin',
  host: 'localhost',
  database: 'gestion_fournisseurs',
  password: 'admin123',
  port: 5435,
});

async function checkDetails() {
  try {
    const result = await pool.query(
      'SELECT id, name, LEFT(details, 100) as details_preview FROM details ORDER BY id'
    );

    console.log('Nombre total d\'entrées:', result.rows.length);
    console.log('\nAperçu des détails (100 premiers caractères):\n');

    result.rows.forEach(row => {
      console.log(`ID: ${row.id}`);
      console.log(`Nom: ${row.name}`);
      console.log(`Détails: ${row.details_preview}...`);
      console.log('---');
    });

  } catch (error) {
    console.error('Erreur lors de la vérification:', error);
  } finally {
    await pool.end();
  }
}

checkDetails();
