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

async function testScoreId6() {
    try {
        const result = await pool.query('SELECT nature_tier, localisation, region_intervention, pays_intervention FROM fournisseurs WHERE id = 6');
        const fournisseur = result.rows[0];
        
        console.log('Données du fournisseur ID 6 :');
        console.log('Nature du tiers:', fournisseur.nature_tier);
        console.log('Localisation:', fournisseur.localisation);
        console.log('Région d\'intervention:', fournisseur.region_intervention);
        console.log('Pays d\'intervention:', fournisseur.pays_intervention);
        
        const score = calculEvaluationPremierNiveau(
            fournisseur.nature_tier,
            fournisseur.localisation,
            fournisseur.region_intervention,
            fournisseur.pays_intervention
        );
        
        console.log('\nScore calculé:', score);
        
    } catch (error) {
        console.error('Erreur:', error);
    } finally {
        await pool.end();
    }
}

testScoreId6();
