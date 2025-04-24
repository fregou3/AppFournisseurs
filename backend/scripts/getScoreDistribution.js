require('dotenv').config({ path: '../.env' });
const { Pool } = require('pg');

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function getScoreDistribution() {
    const client = await pool.connect();
    try {
        // Requête pour obtenir la distribution des scores
        const result = await client.query(`
            SELECT 
                score,
                COUNT(*) as count,
                ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
            FROM fournisseurs
            GROUP BY score
            ORDER BY score ASC NULLS FIRST;
        `);

        console.log('\nDistribution des scores :');
        console.log('=========================\n');
        
        let totalCount = 0;
        result.rows.forEach(row => {
            const scoreLabel = row.score === null ? 'NULL (pas de nature du tiers)' : row.score;
            console.log(`Score ${scoreLabel}:`);
            console.log(`- Nombre de fournisseurs: ${row.count}`);
            console.log(`- Pourcentage: ${row.percentage}%\n`);
            totalCount += parseInt(row.count);
        });

        console.log('=========================');
        console.log(`Total des fournisseurs: ${totalCount}`);

    } catch (error) {
        console.error('Erreur lors de la récupération de la distribution des scores:', error);
    } finally {
        client.release();
        await pool.end();
    }
}

getScoreDistribution();
