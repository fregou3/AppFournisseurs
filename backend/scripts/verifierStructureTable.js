const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

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

async function verifierStructureTable() {
    const client = await pool.connect();
    try {
        console.log('Vérification de la structure de la table fournisseurs_2023_add_2024_v10...');
        
        // Vérifier si la table existe
        const tableExistsQuery = `
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'fournisseurs_2023_add_2024_v10'
            );
        `;
        
        const tableExists = await client.query(tableExistsQuery);
        
        if (!tableExists.rows[0].exists) {
            console.log('La table fournisseurs_2023_add_2024_v10 n\'existe pas.');
            
            // Lister toutes les tables disponibles
            console.log('\nListe des tables disponibles:');
            const tablesQuery = `
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public'
                ORDER BY table_name;
            `;
            
            const tables = await client.query(tablesQuery);
            tables.rows.forEach((row, index) => {
                console.log(`${index + 1}. ${row.table_name}`);
            });
            
            return;
        }
        
        // Récupérer la structure de la table
        const columnsQuery = `
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'fournisseurs_2023_add_2024_v10'
            ORDER BY ordinal_position;
        `;
        
        const columns = await client.query(columnsQuery);
        
        console.log('\nStructure de la table fournisseurs_2023_add_2024_v10:');
        console.log('--------------------------------------------------');
        columns.rows.forEach(column => {
            console.log(`${column.column_name} (${column.data_type})`);
        });
        
        // Afficher un exemple de données
        console.log('\nExemple de données (première ligne):');
        console.log('----------------------------------');
        
        const sampleDataQuery = `
            SELECT * FROM fournisseurs_2023_add_2024_v10 LIMIT 1;
        `;
        
        const sampleData = await client.query(sampleDataQuery);
        
        if (sampleData.rows.length > 0) {
            const row = sampleData.rows[0];
            Object.keys(row).forEach(key => {
                console.log(`${key}: ${row[key]}`);
            });
        } else {
            console.log('Aucune donnée trouvée dans la table.');
        }
        
    } catch (error) {
        console.error('Erreur lors de la vérification de la structure de la table:', error);
    } finally {
        client.release();
        pool.end();
    }
}

verifierStructureTable().catch(console.error);
