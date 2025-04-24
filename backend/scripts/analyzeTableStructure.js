const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Récupérer le nom de la table à partir des arguments
const tableName = process.argv[2] || 'fournisseurs_fournisseurs_2025_v19';

console.log(`Analyse de la structure de la table: ${tableName}`);
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

async function analyzeTableStructure(tableName) {
    console.log('Tentative de connexion à la base de données...');
    let client;
    try {
        client = await pool.connect();
        console.log('Connexion à la base de données établie');
        
        // Vérifier si la table existe
        const tableCheck = await client.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = $1
            )
        `, [tableName]);
        
        if (!tableCheck.rows[0].exists) {
            console.error(`La table "${tableName}" n'existe pas dans la base de données.`);
            return;
        }
        
        // Récupérer les colonnes de la table
        const columnQuery = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = $1
            ORDER BY ordinal_position
        `, [tableName]);
        
        console.log(`\nStructure de la table ${tableName}:`);
        console.log('=================================');
        
        columnQuery.rows.forEach(column => {
            console.log(`- ${column.column_name} (${column.data_type})`);
        });
        
        // Récupérer le nombre de lignes dans la table
        const countQuery = await client.query(`
            SELECT COUNT(*) FROM "${tableName}"
        `);
        
        console.log(`\nNombre total de lignes: ${countQuery.rows[0].count}`);
        
        // Récupérer un échantillon de données
        const sampleQuery = await client.query(`
            SELECT * FROM "${tableName}" LIMIT 1
        `);
        
        if (sampleQuery.rows.length > 0) {
            console.log('\nExemple de données (première ligne):');
            console.log('===================================');
            
            const row = sampleQuery.rows[0];
            for (const [key, value] of Object.entries(row)) {
                console.log(`- ${key}: ${value}`);
            }
        }
        
        // Suggérer des colonnes qui pourraient être utilisées pour le calcul du score
        console.log('\nSuggestions pour le calcul du score:');
        console.log('===================================');
        
        const potentialMappings = {
            'nature_tiers': ['nature_tiers', 'nature', 'type', 'supplier_type', 'type_fournisseur'],
            'localisation': ['localisation', 'location', 'country', 'pays', 'supplier_country'],
            'region_intervention': ['region_intervention', 'region', 'zone', 'area', 'organization_zone'],
            'pays_intervention': ['pays_intervention', 'intervention_country', 'country_intervention']
        };
        
        const availableColumns = columnQuery.rows.map(col => col.column_name.toLowerCase());
        
        for (const [requiredColumn, possibleMatches] of Object.entries(potentialMappings)) {
            const match = possibleMatches.find(col => availableColumns.includes(col.toLowerCase()));
            
            if (match) {
                console.log(`- Pour "${requiredColumn}", utilisez la colonne "${match}"`);
            } else {
                console.log(`- Aucune correspondance trouvée pour "${requiredColumn}"`);
            }
        }

    } catch (err) {
        console.error('Erreur lors de l\'analyse de la structure de la table :', err);
    } finally {
        if (client) {
            console.log('\nFermeture de la connexion...');
            client.release();
        }
        console.log('Fermeture du pool...');
        await pool.end();
    }
}

// Exécuter la fonction
analyzeTableStructure(tableName);
