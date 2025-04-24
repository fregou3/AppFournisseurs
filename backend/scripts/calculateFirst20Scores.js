const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { Pool } = require('pg');
const { calculEvaluationPremierNiveau } = require('./calculEvaluationPremierNiveau');

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function calculateFirst20Scores() {
    try {
        // Récupérer les 20 premières lignes
        const result = await pool.query(`
            SELECT id, nature_tier, localisation, region_intervention, pays_intervention 
            FROM fournisseurs 
            ORDER BY id 
            LIMIT 20
        `);

        console.log('Calcul des scores pour les 20 premières lignes :');
        console.log('------------------------------------------------');

        // Calculer et afficher les scores
        for (const row of result.rows) {
            const score = calculEvaluationPremierNiveau(
                row.nature_tier,
                row.localisation,
                row.region_intervention,
                row.pays_intervention
            );

            console.log(`ID: ${row.id}`);
            console.log(`Nature du tiers: ${row.nature_tier || 'Non défini'}`);
            console.log(`Localisation: ${row.localisation || 'Non défini'}`);
            console.log(`Région d'intervention: ${row.region_intervention || 'Non défini'}`);
            console.log(`Pays d'intervention: ${row.pays_intervention || 'Non défini'}`);
            console.log(`Score calculé: ${score}`);
            console.log('------------------------------------------------');

            // Mettre à jour le score dans la base de données
            await pool.query(
                'UPDATE fournisseurs SET score = $1 WHERE id = $2',
                [score, row.id]
            );
        }

        // Afficher un tableau récapitulatif
        console.log('\nRécapitulatif des scores :');
        const scores = await pool.query(`
            SELECT id, nature_tier, localisation, region_intervention, pays_intervention, score 
            FROM fournisseurs 
            WHERE id <= 20 
            ORDER BY id
        `);
        console.table(scores.rows);

    } catch (error) {
        console.error('Erreur:', error);
    } finally {
        await pool.end();
    }
}

calculateFirst20Scores();
