require('dotenv').config({ path: '../.env' });
const { Pool } = require('pg');

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function forceCleanupMetadata() {
    const client = await pool.connect();
    try {
        // 1. Supprimer la table metadata si elle existe
        await client.query('DROP TABLE IF EXISTS "group_metadata" CASCADE');
        console.log('1. Table group_metadata supprimée');

        // 2. Vérifier si la table existe encore
        const checkResult = await client.query(`
            SELECT EXISTS (
                SELECT 1 
                FROM pg_tables 
                WHERE schemaname = 'public' 
                AND tablename = 'group_metadata'
            );
        `);
        console.log('2. Table existe encore?', checkResult.rows[0].exists);

        // 3. Forcer la suppression si elle existe encore
        if (checkResult.rows[0].exists) {
            await client.query('DROP TABLE IF EXISTS "group_metadata" CASCADE');
            console.log('3. Suppression forcée effectuée');
        }

        // 4. Supprimer aussi la table metadata sans préfixe group_ si elle existe
        await client.query('DROP TABLE IF EXISTS "metadata" CASCADE');
        console.log('4. Table metadata supprimée');

        // 5. Vérifier toutes les tables qui contiennent "metadata"
        const metadataTables = await client.query(`
            SELECT tablename 
            FROM pg_tables 
            WHERE schemaname = 'public' 
            AND tablename LIKE '%metadata%';
        `);
        console.log('5. Tables contenant "metadata":', metadataTables.rows);

        // 6. Supprimer toutes les tables trouvées
        for (const row of metadataTables.rows) {
            await client.query(`DROP TABLE IF EXISTS "${row.tablename}" CASCADE`);
            console.log(`6. Table ${row.tablename} supprimée`);
        }

    } catch (error) {
        console.error('Erreur lors du nettoyage forcé:', error);
    } finally {
        client.release();
        await pool.end();
    }
}

forceCleanupMetadata();
