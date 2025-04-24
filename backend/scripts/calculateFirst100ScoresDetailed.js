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

async function calculateFirst100Scores() {
    try {
        // Récupérer les 100 premiers fournisseurs
        const result = await pool.query(`
            SELECT id, nature_tier, localisation, region_intervention, pays_intervention, score
            FROM fournisseurs 
            WHERE id <= 100
            ORDER BY id
        `);

        console.log('Calcul des scores pour les 100 premiers fournisseurs :');
        console.log('================================================');

        let updatedCount = 0;
        let unchangedCount = 0;
        let errorCount = 0;

        for (const row of result.rows) {
            console.log(`\nID: ${row.id}`);
            console.log('Données :');
            console.log('- Nature du tiers:', row.nature_tier);
            console.log('- Localisation:', row.localisation);
            console.log('- Région d\'intervention:', row.region_intervention);
            console.log('- Pays d\'intervention:', row.pays_intervention);

            // Calculer le nouveau score
            const nouveauScore = calculEvaluationPremierNiveau(
                row.nature_tier,
                row.localisation,
                row.region_intervention,
                row.pays_intervention
            );

            // Toujours mettre à jour le score, même s'il est null
            try {
                await pool.query(
                    'UPDATE fournisseurs SET score = $1 WHERE id = $2',
                    [nouveauScore, row.id]
                );
                if (row.score !== nouveauScore) {
                    console.log('✓ Score mis à jour :', nouveauScore);
                    updatedCount++;
                } else {
                    console.log('= Score inchangé :', nouveauScore);
                    unchangedCount++;
                }
            } catch (error) {
                console.error('Erreur lors de la mise à jour :', error);
                errorCount++;
            }

            console.log('----------------------------------------------------');
        }

        console.log('\nRésumé des mises à jour :');
        console.log(`- Scores mis à jour : ${updatedCount}`);
        console.log(`- Scores inchangés : ${unchangedCount}`);
        console.log(`- Erreurs : ${errorCount}`);
        console.log(`- Total traité : ${result.rows.length}`);

        // Vérifier que tous les scores ont été enregistrés
        const verificationResult = await pool.query(`
            SELECT id, score 
            FROM fournisseurs 
            WHERE id <= 100 
            ORDER BY id
        `);

        console.log('\nVérification des scores enregistrés :');
        verificationResult.rows.forEach(row => {
            console.log(`ID ${row.id}: ${row.score === null ? 'null' : row.score}`);
        });

    } catch (error) {
        console.error('Erreur:', error);
    } finally {
        await pool.end();
    }
}

calculateFirst100Scores();
