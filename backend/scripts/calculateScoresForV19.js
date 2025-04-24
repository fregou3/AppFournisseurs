const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { calculEvaluationPremierNiveau } = require('./calculEvaluationPremierNiveau');

// Table à traiter
const tableName = 'fournisseurs_fournisseurs_2025_v19';

console.log(`Calcul des scores pour la table: ${tableName}`);
console.log('Configuration de la base de données :');
console.log('- DB_USER:', process.env.DB_USER);
console.log('- DB_HOST:', process.env.DB_HOST);
console.log('- DB_NAME:', process.env.DB_NAME);
console.log('- DB_PORT:', process.env.DB_PORT);

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function calculateScoresForV19() {
    console.log('Tentative de connexion à la base de données...');
    let client;
    try {
        client = await pool.connect();
        console.log('Connexion à la base de données établie');
        
        // Récupérer tous les fournisseurs de la table v19
        console.log(`Récupération des données de la table ${tableName}...`);
        const result = await client.query(`
            SELECT 
                id,
                "Nature_du_tiers" AS nature_tiers,
                "Localisation" AS localisation, 
                "Région_d_intervention" AS region_intervention, 
                "Pays_d_intervention" AS pays_intervention, 
                score
            FROM "${tableName}"
            ORDER BY id
        `);

        console.log(`Calcul des scores pour ${result.rows.length} entrées :`);
        console.log('================================================\n');

        let updatedCount = 0;
        let unchangedCount = 0;
        let errorCount = 0;

        // Traiter chaque entrée
        for (const row of result.rows) {
            const { id, nature_tiers, localisation, region_intervention, pays_intervention, score } = row;
            
            try {
                console.log(`\nTraitement de l'ID ${id}:`);
                console.log(`- Nature du tiers: ${nature_tiers}`);
                console.log(`- Localisation: ${localisation}`);
                console.log(`- Région d'intervention: ${region_intervention}`);
                console.log(`- Pays d'intervention: ${pays_intervention}`);
                console.log(`- Score actuel: ${score === null ? 'null' : Math.round(score)}`);
                
                // Calculer le nouveau score
                const newScoreFloat = calculEvaluationPremierNiveau(nature_tiers, localisation, region_intervention, pays_intervention);
                const newScore = newScoreFloat === null ? null : Math.round(newScoreFloat);
                console.log(`- Nouveau score calculé: ${newScore}`);
                
                // Si le score est différent, mettre à jour
                const currentScore = score === null ? null : Math.round(score);
                if (newScore !== currentScore) {
                    await client.query(
                        `UPDATE "${tableName}" SET score = $1 WHERE id = $2`,
                        [newScore, id]
                    );
                    console.log(`✓ ID ${id}: Score mis à jour ${currentScore} → ${newScore}`);
                    updatedCount++;
                } else {
                    console.log(`- ID ${id}: Score inchangé (${currentScore})`);
                    unchangedCount++;
                }
            } catch (err) {
                console.error(`❌ Erreur pour l'ID ${id}:`, err);
                errorCount++;
            }
        }

        // Afficher le résumé
        console.log('\nRésumé des mises à jour :');
        console.log(`- Scores mis à jour : ${updatedCount}`);
        console.log(`- Scores inchangés : ${unchangedCount}`);
        console.log(`- Erreurs : ${errorCount}`);
        console.log(`- Total traité : ${result.rows.length}`);

    } catch (err) {
        console.error('Erreur lors du calcul des scores :', err);
    } finally {
        if (client) {
            console.log('Fermeture de la connexion...');
            client.release();
        }
        console.log('Fermeture du pool...');
        await pool.end();
    }
}

// Exécuter la fonction
calculateScoresForV19();
