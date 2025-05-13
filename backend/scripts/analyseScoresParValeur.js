const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { calculEvaluationPremierNiveau } = require('./calculEvaluationPremierNiveau');

console.log('Configuration de la base de données :');
console.log('- DB_USER:', process.env.DB_USER);
console.log('- DB_HOST:', process.env.DB_HOST);
console.log('- DB_NAME:', process.env.DB_NAME);
console.log('- DB_PORT:', process.env.DB_PORT);

// Configuration de la connexion à la base de données
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT
});

async function analyseScores() {
    const client = await pool.connect();
    try {
        console.log('Analyse des scores pour la table fournisseurs_2023_add_2024_v10...');
        
        // Récupérer les données de la table
        const result = await client.query(`
            SELECT 
                id, 
                "Nature du tiers", 
                "Localisation", 
                "Région d'intervention", 
                "Pays d'intervention"
            FROM 
                fournisseurs_2023_add_2024_v10
            WHERE 
                "Nature du tiers" IS NOT NULL 
                AND "Localisation" IS NOT NULL 
                AND "Région d'intervention" IS NOT NULL 
                AND "Pays d'intervention" IS NOT NULL
        `);
        
        console.log(`Nombre de fournisseurs à analyser: ${result.rows.length}`);
        
        // Calculer les scores
        const scores = {};
        let nonCalculables = 0;
        
        for (const row of result.rows) {
            const { id, "Nature du tiers": natureTiers, "Localisation": localisation, "Région d'intervention": regionIntervention, "Pays d'intervention": paysIntervention } = row;
            
            const score = calculEvaluationPremierNiveau(
                natureTiers, 
                localisation, 
                regionIntervention, 
                paysIntervention
            );
            
            if (score === null) {
                nonCalculables++;
                continue;
            }
            
            // Incrémenter le compteur pour ce score
            scores[score] = (scores[score] || 0) + 1;
        }
        
        // Afficher les résultats
        console.log('\nVentilation des scores:');
        console.log('----------------------');
        
        // Trier les scores par ordre croissant
        const scoresSorted = Object.keys(scores).sort((a, b) => parseInt(a) - parseInt(b));
        
        let totalFournisseurs = 0;
        for (const score of scoresSorted) {
            console.log(`Score ${score}: ${scores[score]} fournisseurs`);
            totalFournisseurs += scores[score];
        }
        
        console.log('----------------------');
        console.log(`Total des fournisseurs avec score calculable: ${totalFournisseurs}`);
        console.log(`Fournisseurs avec score non calculable: ${nonCalculables}`);
        console.log(`Total des fournisseurs analysés: ${result.rows.length}`);
        
        // Catégorisation des risques
        const risqueFaible = scoresSorted.filter(s => parseInt(s) <= 5).reduce((acc, s) => acc + scores[s], 0);
        const risqueMoyen = scoresSorted.filter(s => parseInt(s) >= 6 && parseInt(s) <= 9).reduce((acc, s) => acc + scores[s], 0);
        const risqueEleve = scoresSorted.filter(s => parseInt(s) >= 10).reduce((acc, s) => acc + scores[s], 0);
        
        console.log('\nRépartition par niveau de risque:');
        console.log('--------------------------------');
        console.log(`Risque faible (score ≤ 5): ${risqueFaible} fournisseurs (${((risqueFaible / totalFournisseurs) * 100).toFixed(2)}%)`);
        console.log(`Risque moyen (score 6-9): ${risqueMoyen} fournisseurs (${((risqueMoyen / totalFournisseurs) * 100).toFixed(2)}%)`);
        console.log(`Risque élevé (score ≥ 10): ${risqueEleve} fournisseurs (${((risqueEleve / totalFournisseurs) * 100).toFixed(2)}%)`);
        
    } catch (error) {
        console.error('Erreur lors de l\'analyse des scores:', error);
    } finally {
        client.release();
        pool.end();
    }
}

analyseScores().catch(console.error);
