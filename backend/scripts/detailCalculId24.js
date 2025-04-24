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

async function detailCalculId24() {
    try {
        const result = await pool.query(`
            SELECT id, nature_tier, localisation, region_intervention, pays_intervention 
            FROM fournisseurs 
            WHERE id = 24
        `);

        if (result.rows.length === 0) {
            console.log('Fournisseur ID 24 non trouvé');
            return;
        }

        const row = result.rows[0];

        console.log('Détail du calcul pour ID 24 :');
        console.log('=============================');
        console.log('\nDonnées du fournisseur :');
        console.log('- Nature du tiers:', row.nature_tier);
        console.log('- Localisation:', row.localisation);
        console.log('- Région d\'intervention:', row.region_intervention);
        console.log('- Pays d\'intervention:', row.pays_intervention);

        console.log('\nAnalyse détaillée du score :');
        
        // 1. Score nature du tiers
        const natureTierLower = row.nature_tier.toLowerCase();
        console.log('\n1. Points pour nature du tiers :');
        if (natureTierLower.includes('conseils') || 
            natureTierLower.includes('communication') || 
            natureTierLower.includes('matériel de promotion') ||
            natureTierLower.includes('retailers')) {
            console.log('→ 5 points (Conseils, Communication, Matériel de promotion ou Retailers)');
        } else if (natureTierLower.includes('télécommunications')) {
            console.log('→ 3 points (Télécommunications)');
        } else {
            console.log('→ 0 points (Autre nature de tiers)');
            console.log(`   Nature actuelle : ${row.nature_tier}`);
        }

        // 2. Score région et localisation
        console.log('\n2. Points pour région et localisation :');
        const regionLower = row.region_intervention.toLowerCase();
        const localisationLower = row.localisation.toLowerCase();

        if (regionLower.includes('europe') ||
            regionLower.includes('france - siège') ||
            regionLower.includes('amerique du nord')) {
            console.log('→ 1 point (Région Europe/Amérique du Nord)');
            if (localisationLower === 'france') {
                console.log('→ Pas de point bonus pour France car déjà en Europe');
            }
        } else if (regionLower.includes('apac') ||
                  regionLower.includes('future growth markets') ||
                  regionLower.includes('global travel retail')) {
            console.log('→ 3 points (Région APAC/FGM/GTR)');
            if (localisationLower === 'france') {
                console.log('→ +1 point bonus pour localisation France');
            }
        } else {
            console.log('→ 0 points pour la région');
            if (localisationLower === 'france') {
                console.log('→ +1 point pour localisation France');
            }
        }

        // Calcul du score total
        const score = calculEvaluationPremierNiveau(
            row.nature_tier,
            row.localisation,
            row.region_intervention,
            row.pays_intervention
        );

        console.log('\nScore total :', score, 'points');

    } catch (error) {
        console.error('Erreur:', error);
    } finally {
        await pool.end();
    }
}

detailCalculId24();
