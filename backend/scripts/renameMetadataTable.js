require('dotenv').config({ path: '../.env' });
const { Pool } = require('pg');

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function renameMetadataTable() {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Créer la nouvelle table
        await client.query(`
            CREATE TABLE IF NOT EXISTS system_group_metadata (
                group_name TEXT PRIMARY KEY,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                filters JSONB,
                visible_columns JSONB
            )
        `);
        console.log('1. Nouvelle table system_group_metadata créée');

        // 2. Copier les données de l'ancienne table si elle existe
        const exists = await client.query(`
            SELECT EXISTS (
                SELECT 1 
                FROM pg_tables 
                WHERE schemaname = 'public' 
                AND tablename = 'group_metadata'
            );
        `);

        if (exists.rows[0].exists) {
            await client.query(`
                INSERT INTO system_group_metadata 
                SELECT * FROM group_metadata
                ON CONFLICT (group_name) DO UPDATE 
                SET 
                    created_at = EXCLUDED.created_at,
                    filters = EXCLUDED.filters,
                    visible_columns = EXCLUDED.visible_columns
            `);
            console.log('2. Données copiées de group_metadata vers system_group_metadata');

            // 3. Supprimer l'ancienne table
            await client.query('DROP TABLE IF EXISTS group_metadata CASCADE');
            console.log('3. Ancienne table group_metadata supprimée');
        } else {
            console.log('2. Ancienne table group_metadata n\'existe pas');
        }

        await client.query('COMMIT');
        console.log('Migration terminée avec succès');

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Erreur lors de la migration:', error);
    } finally {
        client.release();
        await pool.end();
    }
}

renameMetadataTable();
