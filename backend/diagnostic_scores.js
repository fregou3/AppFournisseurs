const { Pool } = require('pg');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '.env') });

// Récupérer les arguments de la ligne de commande
const args = process.argv.slice(2);
const tableName = args[0] || 'fournisseurs_2023_sup_5000_add_2024'; // Table par défaut si non spécifiée

console.log('=== DIAGNOSTIC DU CALCUL DE SCORES ===');
console.log('Date et heure:', new Date().toISOString());
console.log('Version de Node.js:', process.version);
console.log('Chemin du script:', __dirname);
console.log('Chemin complet du script:', __filename);
console.log('Arguments:', process.argv);
console.log('Table à analyser:', tableName);

// Vérifier si le fichier .env existe
console.log('\n=== VÉRIFICATION DU FICHIER .ENV ===');
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
    console.log('Le fichier .env existe');
    try {
        const envContent = fs.readFileSync(envPath, 'utf8');
        // Afficher le contenu du fichier .env sans les mots de passe
        const safeEnvContent = envContent
            .split('\n')
            .map(line => {
                if (line.toLowerCase().includes('password')) {
                    return line.split('=')[0] + '=********';
                }
                return line;
            })
            .join('\n');
        console.log('Contenu du fichier .env (sécurisé):', safeEnvContent);
    } catch (err) {
        console.error('Erreur lors de la lecture du fichier .env:', err.message);
    }
} else {
    console.error('Le fichier .env n\'existe PAS');
}

// Vérifier si le script de calcul existe
console.log('\n=== VÉRIFICATION DU SCRIPT DE CALCUL ===');
const calculScriptPath = path.join(__dirname, 'scripts', 'calculEvaluationPremierNiveau.js');
if (fs.existsSync(calculScriptPath)) {
    console.log('Le script calculEvaluationPremierNiveau.js existe');
} else {
    console.error('Le script calculEvaluationPremierNiveau.js n\'existe PAS');
}

// Tester la connexion à la base de données
console.log('\n=== TEST DE CONNEXION À LA BASE DE DONNÉES ===');
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function runDiagnostic() {
    let client;
    try {
        console.log('Tentative de connexion à la base de données...');
        console.log('Paramètres de connexion:');
        console.log('- Host:', process.env.DB_HOST);
        console.log('- Database:', process.env.DB_NAME);
        console.log('- User:', process.env.DB_USER);
        console.log('- Port:', process.env.DB_PORT);
        
        client = await pool.connect();
        console.log('Connexion à la base de données établie avec succès');
        
        // Vérifier si la table existe
        console.log('\n=== VÉRIFICATION DE LA TABLE ===');
        const tableExists = await client.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = $1
            );
        `, [tableName]);
        
        if (tableExists.rows[0].exists) {
            console.log(`La table ${tableName} existe`);
            
            // Vérifier la structure de la table
            console.log('\n=== STRUCTURE DE LA TABLE ===');
            const columnsResult = await client.query(`
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = $1
                ORDER BY ordinal_position;
            `, [tableName]);
            
            const columns = columnsResult.rows.map(row => row.column_name);
            console.log(`Nombre de colonnes: ${columns.length}`);
            console.log('Colonnes:', columns);
            
            // Vérifier les colonnes importantes pour le calcul
            const importantColumns = [
                'Nature du tiers',
                'Localisation',
                'Région d\'intervention',
                'Pays d\'intervention',
                'Score'
            ];
            
            console.log('\n=== VÉRIFICATION DES COLONNES IMPORTANTES ===');
            for (const col of importantColumns) {
                const found = columns.find(c => c === col || c.toLowerCase() === col.toLowerCase());
                console.log(`Colonne "${col}": ${found ? 'TROUVÉE (' + found + ')' : 'NON TROUVÉE'}`);
            }
            
            // Vérifier le nombre de lignes dans la table
            const countResult = await client.query(`SELECT COUNT(*) FROM "${tableName}"`);
            console.log(`\nNombre de lignes dans la table: ${countResult.rows[0].count}`);
            
            // Tester le calcul sur une ligne
            try {
                console.log('\n=== TEST DE CALCUL SUR UNE LIGNE ===');
                const { calculEvaluationPremierNiveau } = require('./scripts/calculEvaluationPremierNiveau');
                
                // Récupérer une ligne de la table
                const sampleRow = await client.query(`
                    SELECT * FROM "${tableName}" LIMIT 1
                `);
                
                if (sampleRow.rows.length > 0) {
                    const row = sampleRow.rows[0];
                    console.log('Ligne de test:', JSON.stringify(row, null, 2));
                    
                    // Déterminer les noms de colonnes corrects
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
                    
                    // Tester le calcul
                    const natureTiers = row[natureTiersColumn];
                    const localisation = row[localisationColumn];
                    const regionIntervention = row[regionInterventionColumn];
                    const paysIntervention = row[paysInterventionColumn];
                    
                    console.log('Valeurs extraites:');
                    console.log(`- Nature du tiers: ${natureTiers}`);
                    console.log(`- Localisation: ${localisation}`);
                    console.log(`- Région d'intervention: ${regionIntervention}`);
                    console.log(`- Pays d'intervention: ${paysIntervention}`);
                    
                    const score = calculEvaluationPremierNiveau(natureTiers, localisation, regionIntervention, paysIntervention);
                    console.log(`Score calculé: ${score}`);
                } else {
                    console.log('Aucune ligne trouvée dans la table');
                }
            } catch (calcError) {
                console.error('Erreur lors du test de calcul:', calcError);
                console.error('Stack:', calcError.stack);
            }
        } else {
            console.error(`La table ${tableName} n'existe PAS`);
        }
    } catch (err) {
        console.error('ERREUR LORS DU DIAGNOSTIC:');
        console.error('Message:', err.message);
        console.error('Stack:', err.stack);
        console.error('Code:', err.code);
        
        // Afficher des messages spécifiques selon le code d'erreur
        if (err.code === '42P01') {
            console.error('La table spécifiée n\'existe pas');
        } else if (err.code === '28P01') {
            console.error('Erreur d\'authentification à la base de données');
        } else if (err.code === 'ECONNREFUSED') {
            console.error('Impossible de se connecter au serveur de base de données');
        }
    } finally {
        if (client) {
            console.log('\nFermeture de la connexion...');
            client.release();
        }
        console.log('Fermeture du pool...');
        await pool.end();
        console.log('\n=== FIN DU DIAGNOSTIC ===');
    }
}

runDiagnostic().catch(err => {
    console.error('Erreur non gérée:', err);
    process.exit(1);
});
