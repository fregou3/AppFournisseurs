const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { Pool } = require('pg');
const { calculEvaluationPremierNiveau } = require('./calculEvaluationPremierNiveau');

// Vérifier que les variables d'environnement sont chargées
console.log('Configuration de la base de données :');
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_NAME:', process.env.DB_NAME);
console.log('DB_PORT:', process.env.DB_PORT);
// Ne pas afficher le mot de passe pour des raisons de sécurité

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function updateScores() {
    try {
        // Récupérer les 20 premières lignes
        const result = await pool.query(`
            SELECT id, nature_tier, localisation, region_intervention, pays_intervention 
            FROM fournisseurs 
            ORDER BY id 
            LIMIT 20
        `);

        console.log('Données récupérées:', result.rows);

        // Calculer et mettre à jour les scores
        for (const row of result.rows) {
            const score = calculEvaluationPremierNiveau(
                row.nature_tier,
                row.localisation,
                row.region_intervention,
                row.pays_intervention
            );

            console.log(`ID: ${row.id}`);
            console.log(`Nature du tiers: ${row.nature_tier}`);
            console.log(`Localisation: ${row.localisation}`);
            console.log(`Région d'intervention: ${row.region_intervention}`);
            console.log(`Pays d'intervention: ${row.pays_intervention}`);
            console.log(`Score calculé: ${score}`);
            console.log('-------------------');

            // Mettre à jour le score dans la base de données
            await pool.query(
                'UPDATE fournisseurs SET score = $1 WHERE id = $2',
                [score, row.id]
            );
        }

        // Afficher les résultats mis à jour
        const updatedRows = await pool.query(`
            SELECT id, nature_tier, localisation, region_intervention, pays_intervention, score 
            FROM fournisseurs 
            WHERE id IN (SELECT id FROM fournisseurs ORDER BY id LIMIT 20)
            ORDER BY id
        `);

        console.log('\nRésultats mis à jour :');
        console.table(updatedRows.rows);

    } catch (error) {
        console.error('Erreur lors de la mise à jour des scores:', error);
    } finally {
        await pool.end();
    }
}

updateScores();
