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

async function detailCalculId6() {
    try {
        const result = await pool.query(`
            SELECT id, nature_tier, localisation, region_intervention, pays_intervention 
            FROM fournisseurs 
            WHERE id = 6
        `);
        
        if (result.rows.length === 0) {
            console.log('Aucun fournisseur trouvé avec l\'ID 6');
            return;
        }

        const fournisseur = result.rows[0];
        
        console.log('Détail du calcul pour ID 6:');
        console.log('---------------------------');
        console.log('Données brutes du fournisseur :');
        console.log(JSON.stringify(fournisseur, null, 2));
        console.log('\nAnalyse du calcul :');

        // 1. Score nature du tiers
        let score = 0;
        const natureTierLower = fournisseur.nature_tier ? fournisseur.nature_tier.toLowerCase() : '';
        if (natureTierLower.includes('conseils')) {
            score += 5;
            console.log('1. Nature du tiers (Conseils) : 5 points');
            console.log('   - Raison : Contient "conseils"');
        }

        // 2. Score région et localisation
        const regionLower = fournisseur.region_intervention ? fournisseur.region_intervention.toLowerCase() : '';
        const localisationLower = fournisseur.localisation ? fournisseur.localisation.toLowerCase() : '';
        
        if (regionLower) {
            if (regionLower.includes('europe')) {
                score += 1;
                console.log('2. Région d\'intervention : 1 point');
                console.log('   - Raison : Région Europe (le point France n\'est pas ajouté car déjà en Europe)');
            } else if (regionLower.includes('apac') ||
                      regionLower.includes('future growth markets') ||
                      regionLower.includes('global travel retail')) {
                score += 3;
                if (localisationLower === 'france') {
                    score += 1;
                    console.log('2. Points géographiques : 4 points');
                    console.log('   - 3 points pour région APAC/FGM/GTR');
                    console.log('   - 1 point pour localisation France');
                } else {
                    console.log('2. Région d\'intervention : 3 points');
                    console.log('   - Raison : Région APAC/FGM/GTR');
                }
            } else if (localisationLower === 'france') {
                score += 1;
                console.log('2. Localisation : 1 point');
                console.log('   - Raison : Localisation France (région non Europe/APAC)');
            }
        } else if (localisationLower === 'france') {
            score += 1;
            console.log('2. Localisation : 1 point');
            console.log('   - Raison : Localisation France (pas de région spécifiée)');
        }

        // Score total
        console.log('\nScore total :', score, 'points');
        console.log('Détail : 5 (nature du tiers) + 1 (région Europe) = 6');

    } catch (error) {
        console.error('Erreur:', error);
    } finally {
        await pool.end();
    }
}

detailCalculId6();
