const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

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

async function listTables() {
    console.log('Tentative de connexion à la base de données...');
    let client;
    try {
        client = await pool.connect();
        console.log('Connexion à la base de données établie');
        
        // Lister toutes les tables
        const result = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name
        `);

        console.log(`\nTables disponibles dans la base de données (${result.rows.length}) :`);
        console.log('================================================');
        
        // Afficher les tables par groupes
        const fournisseursTables = [];
        const otherTables = [];
        
        result.rows.forEach(row => {
            if (row.table_name.includes('fournisseurs')) {
                fournisseursTables.push(row.table_name);
            } else {
                otherTables.push(row.table_name);
            }
        });
        
        console.log('\nTables de fournisseurs :');
        fournisseursTables.forEach(table => {
            console.log(`- ${table}`);
        });
        
        console.log('\nAutres tables :');
        otherTables.forEach(table => {
            console.log(`- ${table}`);
        });

    } catch (err) {
        console.error('Erreur lors de la récupération des tables :', err);
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
listTables();
