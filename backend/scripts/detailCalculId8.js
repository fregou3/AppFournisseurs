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

async function detailCalculId8() {
    try {
        const result = await pool.query(`
            SELECT id, nature_tier, localisation, region_intervention, pays_intervention 
            FROM fournisseurs 
            WHERE id = 8
        `);
        
        const fournisseur = result.rows[0];
        
        console.log('Détail du calcul pour ID 8:');
        console.log('---------------------------');
        console.log('Données du fournisseur :');
        console.log('Nature du tiers:', fournisseur.nature_tier);
        console.log('Localisation:', fournisseur.localisation);
        console.log('Région d\'intervention:', fournisseur.region_intervention);
        console.log('Pays d\'intervention:', fournisseur.pays_intervention);
        console.log('\nCalcul du score :');
        
        // Calcul du score pour la nature du tiers
        let scoreNatureTier = 0;
        if (fournisseur.nature_tier && fournisseur.nature_tier.toLowerCase().includes('conseils')) {
            scoreNatureTier = 5;
            console.log('1. Score nature du tiers (Conseils) :', scoreNatureTier);
        }
        
        // Calcul du bonus pour la localisation
        let scoreLocalisation = 0;
        if (fournisseur.localisation && fournisseur.localisation.toLowerCase() === 'france') {
            scoreLocalisation = 1;
            console.log('2. Bonus localisation (France) :', scoreLocalisation);
        } else {
            console.log('2. Pas de bonus localisation (localisation:', fournisseur.localisation, ')');
        }

        // Calcul du score pour la région d'intervention
        let scoreRegion = 0;
        const regionLower = fournisseur.region_intervention ? fournisseur.region_intervention.toLowerCase() : '';
        if (regionLower) {
            if (regionLower.includes('france - siège') ||
                regionLower.includes('europe') ||
                regionLower.includes('amerique du nord')) {
                scoreRegion = 1;
                console.log('3. Score région d\'intervention (Europe/Amérique du Nord/France) :', scoreRegion);
            } else if (regionLower.includes('apac') ||
                      regionLower.includes('future growth markets') ||
                      regionLower.includes('global travel retail')) {
                scoreRegion = 3;
                console.log('3. Score région d\'intervention (APAC/FGM/GTR) :', scoreRegion);
            } else {
                console.log('3. Pas de score pour la région d\'intervention :', fournisseur.region_intervention);
            }
        }
        
        // Score total
        const scoreTotal = scoreNatureTier + scoreLocalisation + scoreRegion;
        console.log('\nScore total = Score nature du tiers + Bonus localisation + Score région');
        console.log(`Score total = ${scoreNatureTier} + ${scoreLocalisation} + ${scoreRegion} = ${scoreTotal}`);
        
    } catch (error) {
        console.error('Erreur:', error);
    } finally {
        await pool.end();
    }
}

detailCalculId8();
