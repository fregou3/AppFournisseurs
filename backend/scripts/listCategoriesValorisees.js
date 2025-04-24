const { Pool } = require('pg');
require('dotenv').config({ path: '../.env' });

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function listCategoriesValorisees() {
    try {
        const client = await pool.connect();
        
        // Récupérer toutes les natures de tiers uniques
        const result = await client.query('SELECT DISTINCT nature_tier FROM fournisseurs WHERE nature_tier IS NOT NULL ORDER BY nature_tier');
        
        const categories10Points = [
            'Cible de croissance externe',
            'Client - Wholesalers',
            'Bénéficiaire d\'actions de sponsoring / mécénat'
        ];

        const categories5Points = [
            'Client - Retailers',
            'Client - Department stores',
            'Four. / Presta. - Baux et loyers',
            'Four. / Presta. - Communication et média',
            'Four. / Presta. - Conseils (juridiques, stratégiques, etc.)',
            'Four. / Presta. - Fourniture de matériel de promotion',
            'Four. / Presta. - Fourniture de packaging',
            'Four. / Presta. - Fourniture de matières premières',
            'Four. / Presta. - Immobilier',
            'Four. / Presta. - Influenceurs',
            'Four. / Presta. - Intérimaires',
            'Four. / Presta. - Logistique',
            'Four. / Presta. - Organismes de recherche',
            'Four. / Presta. - Promotion de la marque',
            'Four. / Presta. - Sous-traitance production',
            'Four. / Presta. - Transport de marchandise et services liés',
            'Auditeurs / Organismes certificateurs (secteur privé)',
            'Agents publics'
        ];

        const categories3Points = [
            'Four. / Presta. - Equipement de sécurité',
            'Four. / Presta. - Installations et équipements techniques',
            'Four. / Presta. - Maintenance des bâtiments',
            'Four. / Presta. - Matériel informatique',
            'Four. / Presta. - Mobilier de bureau',
            'Four. / Presta. - Nourriture et boissons',
            'Four. / Presta. - Services de nettoyage',
            'Four. / Presta. - Services de sécurité',
            'Four. / Presta. - Services liés au e-commerce',
            'Four. / Presta. - Télécommunications',
            'Four. / Presta. - Transport de taxi et de personnel'
        ];

        const categories1Point = [
            'Four. / Presta. - Électricité et gaz',
            'Four. / Presta. - Hébergement',
            'Four. / Presta. - Maintenance informatique'
        ];

        console.log('Liste des catégories de nature de tiers :');
        console.log('========================================\n');

        console.log('Catégories valorisées à 10 points :');
        console.log('--------------------------------');
        categories10Points.sort().forEach(cat => {
            console.log(`- ${cat}`);
        });
        console.log('');

        console.log('Catégories valorisées à 5 points :');
        console.log('--------------------------------');
        categories5Points.sort().forEach(cat => {
            console.log(`- ${cat}`);
        });
        console.log('');

        console.log('Catégories valorisées à 3 points :');
        console.log('--------------------------------');
        categories3Points.sort().forEach(cat => {
            console.log(`- ${cat}`);
        });
        console.log('');

        console.log('Catégories valorisées à 1 point :');
        console.log('--------------------------------');
        categories1Point.sort().forEach(cat => {
            console.log(`- ${cat}`);
        });
        console.log('');

        console.log('Catégories non valorisées (0 point) :');
        console.log('----------------------------------');
        result.rows.forEach(row => {
            if (!categories10Points.includes(row.nature_tier) && 
                !categories5Points.includes(row.nature_tier) && 
                !categories3Points.includes(row.nature_tier) &&
                !categories1Point.includes(row.nature_tier)) {
                console.log(`- ${row.nature_tier}`);
            }
        });
        console.log('');

        console.log('Statistiques :');
        console.log('-------------');
        console.log(`Nombre de catégories à 10 points : ${categories10Points.length}`);
        console.log(`Nombre de catégories à 5 points : ${categories5Points.length}`);
        console.log(`Nombre de catégories à 3 points : ${categories3Points.length}`);
        console.log(`Nombre de catégories à 1 point : ${categories1Point.length}`);
        console.log(`Nombre de catégories à 0 point : ${result.rows.length - categories10Points.length - categories5Points.length - categories3Points.length - categories1Point.length}`);
        console.log(`Nombre total de catégories : ${result.rows.length}`);

        client.release();
    } catch (err) {
        console.error('Erreur lors de la récupération des catégories :', err);
    } finally {
        pool.end();
    }
}

listCategoriesValorisees();
