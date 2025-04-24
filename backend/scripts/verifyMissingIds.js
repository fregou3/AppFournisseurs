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

async function verifyMissingIds() {
    try {
        // Vérifier les IDs 1, 2 et 24 spécifiquement
        const result = await pool.query(`
            SELECT id, nature_tier, localisation, region_intervention, pays_intervention, score
            FROM fournisseurs 
            WHERE id IN (1, 2, 24)
            ORDER BY id
        `);

        console.log('Vérification des IDs spécifiques :');
        console.log('==================================');

        if (result.rows.length === 0) {
            console.log('Aucun des IDs recherchés n\'a été trouvé dans la base de données.');
        } else {
            result.rows.forEach(row => {
                console.log(`\nID: ${row.id}`);
                console.log('Données :');
                console.log('- Nature du tiers:', row.nature_tier);
                console.log('- Localisation:', row.localisation);
                console.log('- Région d\'intervention:', row.region_intervention);
                console.log('- Pays d\'intervention:', row.pays_intervention);
                console.log('- Score:', row.score);
                console.log('----------------------------------------------------');
            });
        }

        // Vérifier la séquence des IDs
        const sequenceResult = await pool.query(`
            SELECT last_value, is_called 
            FROM fournisseurs_id_seq
        `);

        console.log('\nInformations sur la séquence :');
        console.log('- Dernière valeur:', sequenceResult.rows[0].last_value);
        console.log('- Séquence utilisée:', sequenceResult.rows[0].is_called);

        // Vérifier les trous dans la séquence des IDs
        const gapsResult = await pool.query(`
            WITH RECURSIVE sequence AS (
                SELECT 1 as id
                UNION ALL
                SELECT id + 1
                FROM sequence
                WHERE id < 100
            )
            SELECT s.id
            FROM sequence s
            LEFT JOIN fournisseurs f ON f.id = s.id
            WHERE f.id IS NULL
            ORDER BY s.id;
        `);

        if (gapsResult.rows.length > 0) {
            console.log('\nIDs manquants dans la séquence (1-100) :');
            console.log(gapsResult.rows.map(row => row.id).join(', '));
        } else {
            console.log('\nAucun ID manquant dans la séquence 1-100.');
        }

    } catch (error) {
        console.error('Erreur:', error);
    } finally {
        await pool.end();
    }
}

verifyMissingIds();
