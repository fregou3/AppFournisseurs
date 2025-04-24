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

async function analyseScoreMatieresPremieres() {
    try {
        const result = await pool.query(`
            SELECT id, nature_tier, localisation, region_intervention, pays_intervention, score
            FROM fournisseurs 
            WHERE nature_tier = 'Four. / Presta. - Fourniture de matières premières'
            ORDER BY id
        `);

        console.log('Analyse des scores pour les fournisseurs de matières premières :');
        console.log('=========================================================');

        for (const row of result.rows) {
            console.log(`\nID: ${row.id}`);
            console.log('Données :');
            console.log('- Nature du tiers:', row.nature_tier);
            console.log('- Localisation:', row.localisation);
            console.log('- Région d\'intervention:', row.region_intervention);
            console.log('- Pays d\'intervention:', row.pays_intervention);

            console.log('\nDétail du calcul :');
            
            // 1. Points pour nature du tiers
            console.log('1. Nature du tiers :');
            console.log('   → 5 points (Fourniture de matières premières)');

            // 2. Points pour région et localisation
            console.log('2. Région et localisation :');
            const regionLower = row.region_intervention ? row.region_intervention.toLowerCase() : '';
            const localisationLower = row.localisation ? row.localisation.toLowerCase() : '';

            let pointsRegion = 0;
            if (regionLower.includes('europe') || 
                regionLower.includes('france - siège') ||
                regionLower.includes('amerique du nord')) {
                pointsRegion = 1;
                console.log('   → 1 point (Région Europe/Amérique du Nord)');
            } else if (regionLower.includes('apac') ||
                      regionLower.includes('future growth markets') ||
                      regionLower.includes('global travel retail')) {
                pointsRegion = 3;
                console.log('   → 3 points (Région APAC/FGM/GTR)');
                if (localisationLower === 'france') {
                    console.log('   → +1 point bonus pour localisation France');
                    pointsRegion += 1;
                }
            } else if (localisationLower === 'france') {
                pointsRegion = 1;
                console.log('   → 1 point pour localisation France');
            } else {
                console.log('   → 0 point pour la région');
            }

            // Recalcul du score
            const nouveauScore = calculEvaluationPremierNiveau(
                row.nature_tier,
                row.localisation,
                row.region_intervention,
                row.pays_intervention
            );

            console.log('\nScore actuel dans la base :', row.score);
            console.log('Score calculé :', nouveauScore);
            
            if (row.score !== nouveauScore) {
                console.log('⚠️ Différence détectée entre le score stocké et le score calculé !');
            }

            console.log('----------------------------------------------------');
        }

        console.log('\nStatistiques :');
        console.log(`Nombre total de fournisseurs de matières premières : ${result.rows.length}`);

    } catch (error) {
        console.error('Erreur:', error);
    } finally {
        await pool.end();
    }
}

analyseScoreMatieresPremieres();
