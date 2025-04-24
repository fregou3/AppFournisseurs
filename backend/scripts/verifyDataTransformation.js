const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { Pool } = require('pg');

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

// Mapping des noms de colonnes (copié depuis routes/fournisseurs.js)
const columnMapping = {
    'PROCUREMENT ORGA': 'procurement_orga',
    'HUYI MODIFICATION': 'huyi_modification',
    'PARTNERS GROUP': 'partners_group',
    'PARTNERS TRADUCTION': 'partners_traduction',
    'Evaluated / Not Evaluated': 'evaluated_not_evaluated',
    'Activity Area': 'activity_area',
    'Ecovadis Name': 'ecovadis_name',
    'Ecovadis score': 'ecovadis_score',
    'Date': 'date',
    'Ecovadis ID': 'ecovadis_id',
    'Notation ESG': 'notation_esg',
    'Santé financière': 'sante_financiere',
    'Risques compliance': 'risques_compliance',
    'Calcul méthode ADEME': 'calcul_methode_ademe',
    'Scope 1': 'scope_1',
    'Scope 2': 'scope_2',
    'Scope 3': 'scope_3',
    'Vision gloable': 'vision_globale',
    'ORGANIZATION 1': 'organization_1',
    'ORGANIZATION 2': 'organization_2',
    'ORGANIZATION 3': 'organization_3',
    'ORGANIZATION ZONE': 'organization_zone',
    'ORGANIZATION COUNTRY': 'organization_country',
    'SUBSIDIARY': 'subsidiary',
    'ORIGINAL NAME PARTNER': 'original_name_partner',
    'Country of Supplier Contact': 'country_of_supplier_contact',
    'VAT number': 'vat_number',
    'Activity Area_1': 'activity_area_1',
    'Annual spend k€ A-2023': 'annual_spend_k_euros_a_2023',
    'Supplier Contact First Name': 'supplier_contact_first_name',
    'Supplier Contact Last Name': 'supplier_contact_last_name',
    'Supplier Contact Email': 'supplier_contact_email',
    'Supplier Contact Phone': 'supplier_contact_phone',
    'Adresse fournisseur': 'adresse',
    'Comments': 'comments',
    'Analyse des risques Loi Sapin II': 'analyse_des_risques_loi_sapin_ii',
    'Region d\'intervention': 'region_intervention',
    'Pays d\'intervention': 'pays_intervention',
    'Localisation': 'localisation',
    'Nature de Tier': 'nature_tier'
};

async function verifyDataTransformation() {
    try {
        // 1. Vérifier les données brutes
        const rawResult = await pool.query('SELECT * FROM fournisseurs ORDER BY id ASC LIMIT 100');
        console.log('1. Données brutes de la base de données :');
        console.log(`Nombre total de lignes : ${rawResult.rows.length}`);
        console.log('Premier enregistrement :', rawResult.rows[0]);
        console.log('\n-----------------------------------\n');

        // 2. Simuler la transformation comme dans le backend
        console.log('2. Transformation des données :');
        const formattedResults = rawResult.rows.map(row => {
            const formattedRow = {};
            for (const [dbCol, value] of Object.entries(row)) {
                if (dbCol === 'id') {
                    formattedRow[dbCol] = value;
                } else {
                    const originalCol = Object.keys(columnMapping).find(key => columnMapping[key] === dbCol) || dbCol;
                    formattedRow[originalCol] = value;
                }
            }
            return formattedRow;
        });

        console.log('Premier enregistrement après transformation :', formattedResults[0]);
        console.log('\n-----------------------------------\n');

        // 3. Vérifier les colonnes manquantes ou problématiques
        console.log('3. Vérification des colonnes :');
        const expectedColumns = new Set(['id', ...Object.keys(columnMapping)]);
        const actualColumns = new Set(Object.keys(formattedResults[0]));

        console.log('Colonnes manquantes :', 
            [...expectedColumns].filter(col => !actualColumns.has(col)));
        console.log('Colonnes inattendues :', 
            [...actualColumns].filter(col => !expectedColumns.has(col)));
        console.log('\n-----------------------------------\n');

        // 4. Vérifier les IDs spécifiques
        console.log('4. Vérification des IDs spécifiques (1, 2, 24) :');
        const specificIds = [1, 2, 24];
        specificIds.forEach(id => {
            const rawRow = rawResult.rows.find(row => row.id === id);
            const formattedRow = formattedResults.find(row => row.id === id);
            
            console.log(`\nID ${id}:`);
            console.log('Données brutes:', rawRow ? 'Présent' : 'Absent');
            console.log('Données transformées:', formattedRow ? 'Présent' : 'Absent');
            if (rawRow && formattedRow) {
                console.log('Nature du tiers (brut):', rawRow.nature_tier);
                console.log('Nature du tiers (transformé):', formattedRow['Nature de Tier']);
            }
        });

    } catch (error) {
        console.error('Erreur:', error);
    } finally {
        await pool.end();
    }
}

verifyDataTransformation();
