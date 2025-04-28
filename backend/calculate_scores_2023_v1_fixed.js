const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { calculEvaluationPremierNiveau } = require('./scripts/calculEvaluationPremierNiveau');

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

async function calculateScores2023V1() {
    console.log('Tentative de connexion à la base de données...');
    let client;
    try {
        client = await pool.connect();
        console.log('Connexion à la base de données établie');
        
        // Vérifier si la table existe
        const tableExists = await client.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'fournisseurs_2023_v1'
            );
        `);
        
        if (!tableExists.rows[0].exists) {
            console.error('Erreur: La table fournisseurs_2023_v1 n\'existe pas.');
            return;
        }
        
        // Vérifier la structure de la table pour connaître les noms exacts des colonnes
        console.log('Vérification de la structure de la table fournisseurs_2023_v1...');
        const columnsResult = await client.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'fournisseurs_2023_v1'
            ORDER BY ordinal_position;
        `);
        
        const columns = columnsResult.rows.map(row => row.column_name);
        console.log('Colonnes disponibles:', columns);
        
        // Déterminer les noms de colonnes corrects
        const natureTiersColumn = columns.find(col => col.includes('nature')) || 'nature_du_tiers';
        const localisationColumn = columns.find(col => col.includes('localisation')) || 'localisation';
        const regionInterventionColumn = columns.find(col => col.includes('region')) || 'r_gion_d_intervention';
        const paysInterventionColumn = columns.find(col => col.includes('pays')) || 'pays_d_intervention';
        
        console.log('Noms de colonnes utilisés:');
        console.log(`- Nature du tiers: ${natureTiersColumn}`);
        console.log(`- Localisation: ${localisationColumn}`);
        console.log(`- Région d'intervention: ${regionInterventionColumn}`);
        console.log(`- Pays d'intervention: ${paysInterventionColumn}`);
        
        // Vérifier si la colonne Score existe (avec S majuscule)
        const scoreColumnName = columns.find(col => col.toLowerCase() === 'score') || 'Score';
        console.log(`Colonne de score identifiée: ${scoreColumnName}`);
        
        // Vérifier si la colonne Score existe
        const scoreExists = columns.includes(scoreColumnName);
        
        if (!scoreExists) {
            console.log(`La colonne ${scoreColumnName} n'existe pas. Création de la colonne...`);
            await client.query(`
                ALTER TABLE fournisseurs_2023_v1 
                ADD COLUMN "${scoreColumnName}" INTEGER;
            `);
            console.log(`Colonne ${scoreColumnName} créée avec succès.`);
        }
        
        // Récupérer tous les fournisseurs
        console.log('Récupération des fournisseurs de la table fournisseurs_2023_v1...');
        const query = `
            SELECT 
                id,
                "${natureTiersColumn}" as nature_tiers,
                "${localisationColumn}" as localisation, 
                "${regionInterventionColumn}" as region_intervention, 
                "${paysInterventionColumn}" as pays_intervention, 
                "${scoreColumnName}" as score
            FROM fournisseurs_2023_v1
            ORDER BY id
        `;
        
        console.log('Requête SQL:', query);
        const result = await client.query(query);

        console.log(`Calcul des scores pour ${result.rows.length} fournisseurs :`);
        console.log('================================================\n');

        let updatedCount = 0;
        let unchangedCount = 0;
        let errorCount = 0;

        // Traiter chaque fournisseur
        for (const row of result.rows) {
            const { id, nature_tiers, localisation, region_intervention, pays_intervention, score } = row;
            
            try {
                console.log(`\nTraitement du fournisseur ID ${id}:`);
                console.log(`- Nature du tiers: ${nature_tiers || 'Non spécifié'}`);
                console.log(`- Localisation: ${localisation || 'Non spécifié'}`);
                console.log(`- Région d'intervention: ${region_intervention || 'Non spécifié'}`);
                console.log(`- Pays d'intervention: ${pays_intervention || 'Non spécifié'}`);
                console.log(`- Score actuel: ${score === null ? 'null' : Math.round(score)}`);
                
                // Calculer le nouveau score
                const newScoreFloat = calculEvaluationPremierNiveau(nature_tiers, localisation, region_intervention, pays_intervention);
                const newScore = newScoreFloat === null ? null : Math.round(newScoreFloat);
                console.log(`- Nouveau score calculé: ${newScore}`);
                
                // Si le score est différent, mettre à jour
                const currentScore = score === null ? null : Math.round(score);
                if (newScore !== currentScore) {
                    await client.query(
                        `UPDATE fournisseurs_2023_v1 SET "${scoreColumnName}" = $1 WHERE id = $2`,
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

calculateScores2023V1().catch(err => {
    console.error('Erreur non gérée :', err);
    process.exit(1);
});
