require('dotenv').config({ path: '../.env' });
const { Pool } = require('pg');

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function cleanupMetadata() {
    const client = await pool.connect();
    try {
        // Supprimer la table metadata si elle existe en tant que groupe
        await client.query(`DROP TABLE IF EXISTS "group_metadata" CASCADE`);
        console.log('Table group_metadata supprimée avec succès');

    } catch (error) {
        console.error('Erreur lors du nettoyage:', error);
    } finally {
        client.release();
        await pool.end();
    }
}

cleanupMetadata();
