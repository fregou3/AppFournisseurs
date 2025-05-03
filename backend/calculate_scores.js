const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { calculEvaluationPremierNiveau } = require('./scripts/calculEvaluationPremierNiveau');

// Récupérer les arguments de la ligne de commande
const args = process.argv.slice(2);
const tableName = args[0];

if (!tableName) {
    console.error('Erreur: Veuillez spécifier le nom de la table en paramètre.');
    console.error('Usage: node calculate_scores.js <nom_de_la_table>');
    process.exit(1);
}

console.log(`Calcul des scores pour la table: ${tableName}`);

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function calculateScores(tableName) {
    console.log('Tentative de connexion à la base de données...');
    let client;
    try {
        client = await pool.connect();
        console.log('Connexion à la base de données établie');
        
        // Vérifier si la table existe
        const tableExists = await client.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = $1
            );
        `, [tableName]);
        
        if (!tableExists.rows[0].exists) {
            console.error(`Erreur: La table ${tableName} n'existe pas.`);
            return;
        }
        
        // Vérifier la structure de la table pour connaître les noms exacts des colonnes
        console.log(`Vérification de la structure de la table ${tableName}...`);
        const columnsResult = await client.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = $1
            ORDER BY ordinal_position;
        `, [tableName]);
        
        const columns = columnsResult.rows.map(row => row.column_name);
        // Nombre de colonnes disponibles
        console.log(`Nombre de colonnes disponibles: ${columns.length}`);
        
        // Déterminer les noms de colonnes corrects avec les nouveaux noms exacts
        const natureTiersColumn = columns.find(col => col === 'Nature du tiers') || 
                                columns.find(col => col.toLowerCase().includes('nature')) || 
                                'nature_du_tiers';
                                
        const localisationColumn = columns.find(col => col === 'Localisation') || 
                                columns.find(col => col.toLowerCase().includes('localisation')) || 
                                'localisation';
                                
        const regionInterventionColumn = columns.find(col => col === 'Région d\'intervention') || 
                                      columns.find(col => col.toLowerCase().includes('region') || 
                                      col.toLowerCase().includes('région')) || 
                                      'r_gion_d_intervention';
                                      
        const paysInterventionColumn = columns.find(col => col === 'Pays d\'intervention') || 
                                    columns.find(col => col.toLowerCase().includes('pays')) || 
                                    'pays_d_intervention';
        
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
                ALTER TABLE ${tableName} 
                ADD COLUMN "${scoreColumnName}" INTEGER;
            `);
            console.log(`Colonne ${scoreColumnName} créée avec succès.`);
        }
        
        // Récupérer tous les fournisseurs
        console.log(`Récupération des fournisseurs de la table ${tableName}...`);
        const query = `
            SELECT 
                id,
                "${natureTiersColumn}" as nature_tiers,
                "${localisationColumn}" as localisation, 
                "${regionInterventionColumn}" as region_intervention, 
                "${paysInterventionColumn}" as pays_intervention, 
                "${scoreColumnName}" as score
            FROM ${tableName}
            ORDER BY id
        `;
        
        // Ne pas afficher la requête SQL complète pour éviter de surcharger les logs
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
                // Traitement silencieux pour éviter de surcharger les logs
                // Afficher un point de progression tous les 100 fournisseurs
                if (result.rows.indexOf(row) % 100 === 0) {
                    process.stdout.write('.');
                }
                
                // Calculer le nouveau score
                const newScoreFloat = calculEvaluationPremierNiveau(nature_tiers, localisation, region_intervention, pays_intervention);
                const newScore = newScoreFloat === null ? null : Math.round(newScoreFloat);
                // Ne pas afficher le nouveau score pour chaque fournisseur
                
                // Si le score est différent, mettre à jour
                const currentScore = score === null ? null : Math.round(score);
                if (newScore !== currentScore) {
                    await client.query(
                        `UPDATE ${tableName} SET "${scoreColumnName}" = $1 WHERE id = $2`,
                        [newScore, id]
                    );
                    // Ne pas afficher chaque mise à jour
                    updatedCount++;
                } else {
                    unchangedCount++;
                }
            } catch (err) {
                // Compter l'erreur sans afficher les détails pour chaque ID
                errorCount++;
            }
        }

        // Afficher le résumé
        console.log('\n\nRésumé des mises à jour :');
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

calculateScores(tableName).catch(err => {
    console.error('Erreur non gérée :', err);
    process.exit(1);
});
