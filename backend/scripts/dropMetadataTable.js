require('dotenv').config({ path: '../.env' });
const { Pool } = require('pg');

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function dropMetadataTable() {
    const client = await pool.connect();
    try {
        // Supprimer la table metadata si elle existe
        await client.query('DROP TABLE IF EXISTS "metadata" CASCADE');
        await client.query('DROP TABLE IF EXISTS "group_metadata" CASCADE');
        console.log('Tables metadata supprimées avec succès');

        // Vérifier qu'il n'y a plus de tables metadata
        const result = await client.query(`
            SELECT tablename 
            FROM pg_tables 
            WHERE schemaname = 'public' 
            AND tablename LIKE '%metadata%'
        `);
        
        if (result.rows.length > 0) {
            console.log('Tables restantes contenant "metadata":', result.rows.map(r => r.tablename));
            // Supprimer ces tables aussi
            for (const row of result.rows) {
                if (row.tablename !== 'system_group_metadata') {
                    await client.query(`DROP TABLE IF EXISTS "${row.tablename}" CASCADE`);
                    console.log(`Table ${row.tablename} supprimée`);
                }
            }
        } else {
            console.log('Aucune table metadata restante');
        }

    } catch (error) {
        console.error('Erreur lors de la suppression:', error);
    } finally {
        client.release();
        await pool.end();
    }
}

dropMetadataTable();
