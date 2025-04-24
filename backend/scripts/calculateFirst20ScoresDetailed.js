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

async function calculateFirst20ScoresDetailed() {
    try {
        const result = await pool.query(`
            SELECT id, nature_tier, localisation, region_intervention, pays_intervention 
            FROM fournisseurs 
            ORDER BY id 
            LIMIT 20
        `);

        console.log('Calcul détaillé des scores pour les 20 premières lignes :');
        console.log('====================================================');

        for (const row of result.rows) {
            console.log(`\nID: ${row.id}`);
            console.log('Données :');
            console.log('- Nature du tiers:', row.nature_tier || 'Non défini');
            console.log('- Localisation:', row.localisation || 'Non défini');
            console.log('- Région d\'intervention:', row.region_intervention || 'Non défini');
            console.log('- Pays d\'intervention:', row.pays_intervention || 'Non défini');

            // Vérifier si tous les paramètres sont renseignés
            if (!row.nature_tier || !row.localisation || !row.region_intervention || !row.pays_intervention) {
                console.log('\nScore non calculé : données manquantes');
                console.log('Paramètres manquants :');
                if (!row.nature_tier) console.log('- Nature du tiers');
                if (!row.localisation) console.log('- Localisation');
                if (!row.region_intervention) console.log('- Région d\'intervention');
                if (!row.pays_intervention) console.log('- Pays d\'intervention');

                // Mettre le score à null dans la base de données
                await pool.query(
                    'UPDATE fournisseurs SET score = NULL WHERE id = $1',
                    [row.id]
                );
                console.log('----------------------------------------------------');
                continue;
            }

            // Calcul du score
            let score = calculEvaluationPremierNiveau(
                row.nature_tier,
                row.localisation,
                row.region_intervention,
                row.pays_intervention
            );

            if (score === null) {
                console.log('\nScore non calculé : erreur dans le calcul');
            } else {
                // Détail du calcul
                const natureTierLower = row.nature_tier.toLowerCase();
                let scoreDetail = [];

                // 1. Score nature du tiers
                if (natureTierLower.includes('conseils') || 
                    natureTierLower.includes('communication') || 
                    natureTierLower.includes('matériel de promotion') ||
                    natureTierLower.includes('retailers')) {
                    scoreDetail.push('5 points pour nature du tiers');
                } else if (natureTierLower.includes('télécommunications')) {
                    scoreDetail.push('3 points pour nature du tiers');
                }

                // 2. Score région et localisation
                const regionLower = row.region_intervention.toLowerCase();
                if (regionLower.includes('europe') ||
                    regionLower.includes('france - siège') ||
                    regionLower.includes('amerique du nord')) {
                    scoreDetail.push('1 point pour région Europe/Amérique du Nord');
                } else if (regionLower.includes('apac') ||
                          regionLower.includes('future growth markets') ||
                          regionLower.includes('global travel retail')) {
                    scoreDetail.push('3 points pour région APAC/FGM/GTR');
                    if (row.localisation.toLowerCase() === 'france') {
                        scoreDetail.push('1 point bonus pour localisation France');
                    }
                } else if (row.localisation.toLowerCase() === 'france') {
                    scoreDetail.push('1 point pour localisation France');
                }

                console.log('\nDétail du calcul :');
                scoreDetail.forEach(detail => console.log('-', detail));
                console.log('Score total :', score);
            }

            // Mettre à jour le score dans la base de données
            await pool.query(
                'UPDATE fournisseurs SET score = $1 WHERE id = $2',
                [score, row.id]
            );
            console.log('----------------------------------------------------');
        }

        // Afficher un tableau récapitulatif
        console.log('\nRécapitulatif des scores mis à jour :');
        const scores = await pool.query(`
            SELECT id, nature_tier, localisation, region_intervention, score 
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

calculateFirst20ScoresDetailed();
