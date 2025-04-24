const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { Pool } = require('pg');

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function addScoreColumn() {
    try {
        await pool.query('ALTER TABLE fournisseurs ADD COLUMN IF NOT EXISTS score INTEGER');
        console.log('Colonne score ajoutée avec succès');
    } catch (error) {
        console.error('Erreur lors de l\'ajout de la colonne score:', error);
    } finally {
        await pool.end();
    }
}

addScoreColumn();
