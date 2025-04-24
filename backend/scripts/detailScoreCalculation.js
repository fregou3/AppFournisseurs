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

async function detailScoreCalculation(id) {
    try {
        const result = await pool.query(`
            SELECT id, nature_tier, localisation, region_intervention, pays_intervention
            FROM fournisseurs 
            WHERE id = $1
        `, [id]);

        if (result.rows.length === 0) {
            console.log(`Aucun fournisseur trouvé avec l'ID ${id}`);
            return;
        }

        const row = result.rows[0];
        console.log('\nDétail du calcul du score pour le fournisseur ID', id);
        console.log('================================================');
        
        console.log('\nDonnées du fournisseur :');
        console.log('- Nature du tiers:', row.nature_tier);
        console.log('- Localisation:', row.localisation);
        console.log('- Région d\'intervention:', row.region_intervention);
        console.log('- Pays d\'intervention:', row.pays_intervention);
        
        console.log('\nCalcul du score :');
        console.log('----------------');
        
        // 1. Points pour nature du tiers
        console.log('\n1. Points pour nature du tiers :');
        const natureTierLower = row.nature_tier ? row.nature_tier.toLowerCase() : '';
        let pointsNatureTier = 0;
        
        if (natureTierLower.includes('matières premières') ||
            natureTierLower.includes('conseils') || 
            natureTierLower.includes('communication') || 
            natureTierLower.includes('matériel de promotion') ||
            natureTierLower.includes('retailers')) {
            pointsNatureTier = 5;
            console.log(`   → 5 points (Catégorie prioritaire)`);
        } else if (natureTierLower.includes('télécommunications')) {
            pointsNatureTier = 3;
            console.log(`   → 3 points (Télécommunications)`);
        } else {
            console.log(`   → 0 point (Autre catégorie)`);
        }
        
        // 2. Points pour région et localisation
        console.log('\n2. Points pour région et localisation :');
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
                console.log('   → +1 point bonus (Localisation France)');
                pointsRegion += 1;
            }
        } else if (localisationLower === 'france') {
            pointsRegion = 1;
            console.log('   → 1 point (Localisation France)');
        } else {
            console.log('   → 0 point (Autre région)');
        }
        
        // Score total
        const scoreTotal = calculEvaluationPremierNiveau(
            row.nature_tier,
            row.localisation,
            row.region_intervention,
            row.pays_intervention
        );
        
        console.log('\nScore total :');
        console.log('------------');
        console.log(`Points nature du tiers : ${pointsNatureTier}`);
        console.log(`Points région/localisation : ${pointsRegion}`);
        console.log(`Score total : ${scoreTotal}`);

    } catch (error) {
        console.error('Erreur:', error);
    } finally {
        await pool.end();
    }
}

// Exécuter pour l'ID 38
detailScoreCalculation(38);
