const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { calculEvaluationPremierNiveau } = require('./calculEvaluationPremierNiveau');

// Table à traiter - nom corrigé avec deux "n" dans "fournisseurs"
const tableName = 'fournisseurs_fournisseurs_v20';

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

async function calculateScoresForV20() {
    console.log('Tentative de connexion à la base de données...');
    let client;
    try {
        client = await pool.connect();
        console.log('Connexion à la base de données établie');
        
        // Vérifier les colonnes disponibles
        const columnCheck = await client.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = $1
        `, [tableName]);
        
        const columns = columnCheck.rows.map(row => row.column_name);
        console.log(`Colonnes disponibles dans la table ${tableName}:`, columns);
        
        // Vérifier si la colonne Score existe, sinon la créer
        if (!columns.includes('Score')) {
            console.log(`La colonne "Score" n'existe pas dans la table "${tableName}", création de la colonne...`);
            await client.query(`ALTER TABLE "${tableName}" ADD COLUMN "Score" TEXT`);
            console.log('Colonne "Score" créée avec succès.');
        }
        
        // Déterminer les noms de colonnes à utiliser pour le calcul
        let natureTiersCol = columns.find(col => col.toLowerCase() === 'nature_du_tiers') || 
                            columns.find(col => col.toLowerCase() === 'nature_tiers') || 
                            'Nature_du_tiers';
                            
        let localisationCol = columns.find(col => col.toLowerCase() === 'localisation') || 
                             'Localisation';
                             
        let regionInterventionCol = columns.find(col => col.toLowerCase() === 'région_d_intervention') || 
                                   columns.find(col => col.toLowerCase() === 'region_intervention') || 
                                   'Région_d_intervention';
                                   
        let paysInterventionCol = columns.find(col => col.toLowerCase() === 'pays_d_intervention') || 
                                 columns.find(col => col.toLowerCase() === 'pays_intervention') || 
                                 'Pays_d_intervention';
        
        console.log('Colonnes utilisées pour le calcul:');
        console.log(`- Nature du tiers: "${natureTiersCol}"`);
        console.log(`- Localisation: "${localisationCol}"`);
        console.log(`- Région d'intervention: "${regionInterventionCol}"`);
        console.log(`- Pays d'intervention: "${paysInterventionCol}"`);
        
        // Récupérer tous les fournisseurs de la table
        console.log(`Récupération des données de la table ${tableName}...`);
        const query = `
            SELECT 
                id,
                "${natureTiersCol}" AS nature_tiers,
                "${localisationCol}" AS localisation, 
                "${regionInterventionCol}" AS region_intervention, 
                "${paysInterventionCol}" AS pays_intervention, 
                "Score"
            FROM "${tableName}"
            ORDER BY id
        `;
        
        console.log('Exécution de la requête:', query);
        const result = await client.query(query);

        console.log(`Calcul des scores pour ${result.rows.length} entrées :`);
        console.log('================================================\n');

        let updatedCount = 0;
        let unchangedCount = 0;
        let errorCount = 0;

        // Traiter chaque entrée
        for (const row of result.rows) {
            const { id, nature_tiers, localisation, region_intervention, pays_intervention, Score } = row;
            
            try {
                console.log(`\nTraitement de l'ID ${id}:`);
                console.log(`- Nature du tiers: ${nature_tiers}`);
                console.log(`- Localisation: ${localisation}`);
                console.log(`- Région d'intervention: ${region_intervention}`);
                console.log(`- Pays d'intervention: ${pays_intervention}`);
                console.log(`- Score actuel: ${Score === null ? 'null' : Score}`);
                
                // Calculer le nouveau score
                const newScoreFloat = calculEvaluationPremierNiveau(nature_tiers, localisation, region_intervention, pays_intervention);
                const newScore = newScoreFloat === null ? null : Math.round(newScoreFloat).toString();
                console.log(`- Nouveau score calculé: ${newScore}`);
                
                // Si le score est différent, mettre à jour
                if (newScore !== Score) {
                    await client.query(
                        `UPDATE "${tableName}" SET "Score" = $1 WHERE id = $2`,
                        [newScore, id]
                    );
                    console.log(`✓ ID ${id}: Score mis à jour ${Score} → ${newScore}`);
                    updatedCount++;
                } else {
                    console.log(`- ID ${id}: Score inchangé (${Score})`);
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
calculateScoresForV20();
