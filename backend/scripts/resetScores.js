require('dotenv').config({ path: '../.env' });
const { Pool } = require('pg');

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function resetScores() {
    const client = await pool.connect();
    try {
        console.log('Configuration de la base de données :');
        console.log('- DB_USER:', process.env.DB_USER);
        console.log('- DB_HOST:', process.env.DB_HOST);
        console.log('- DB_NAME:', process.env.DB_NAME);
        console.log('- DB_PORT:', process.env.DB_PORT);

        console.log('Tentative de connexion à la base de données...');
        console.log('Connexion à la base de données établie');
        
        console.log('Réinitialisation des scores...');
        await client.query('UPDATE fournisseurs SET score = NULL');
        console.log('Tous les scores ont été réinitialisés');

    } catch (error) {
        console.error('Erreur lors de la réinitialisation des scores :', error);
    } finally {
        console.log('Fermeture de la connexion...');
        client.release();
        console.log('Fermeture du pool...');
        await pool.end();
    }
}

resetScores();
