const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: 'admin',
  host: 'localhost',
  database: 'gestion_fournisseurs',
  password: 'admin123',
  port: 5435,
});

async function displayRisqueTable() {
  try {
    const query = `
      SELECT r.id, r.name, 
             SUBSTRING(r.detail_risque, 1, 100) as extrait_detail,
             r.note_risque_financier, 
             r.note_de_conformite,
             f.organization_zone
      FROM risque r
      JOIN fournisseurs f ON r.id = f.id
      ORDER BY r.note_risque_financier + r.note_de_conformite DESC
      LIMIT 10;
    `;

    const result = await pool.query(query);
    
    console.log('\nTop 10 des fournisseurs par niveau de risque :\n');
    console.log('ID | Nom | Zone | Note Financière | Note Conformité | Extrait du détail');
    console.log('-'.repeat(100));
    
    result.rows.forEach(row => {
      console.log(`${row.id} | ${row.name.padEnd(30)} | ${(row.organization_zone || '').padEnd(15)} | ${row.note_risque_financier.toString().padEnd(14)} | ${row.note_de_conformite.toString().padEnd(15)} | ${row.extrait_detail.replace(/\n/g, ' ')}...`);
    });

    // Afficher quelques statistiques
    const statsQuery = `
      SELECT 
        COUNT(*) as total,
        AVG(note_risque_financier) as moy_risque_financier,
        AVG(note_de_conformite) as moy_conformite,
        MAX(note_risque_financier) as max_risque_financier,
        MAX(note_de_conformite) as max_conformite
      FROM risque;
    `;

    const stats = await pool.query(statsQuery);
    const statsRow = stats.rows[0];

    console.log('\nStatistiques globales :');
    console.log('-'.repeat(50));
    console.log(`Nombre total d'entrées : ${statsRow.total}`);
    console.log(`Moyenne risque financier : ${parseFloat(statsRow.moy_risque_financier).toFixed(2)}`);
    console.log(`Moyenne conformité : ${parseFloat(statsRow.moy_conformite).toFixed(2)}`);
    console.log(`Max risque financier : ${statsRow.max_risque_financier}`);
    console.log(`Max conformité : ${statsRow.max_conformite}`);

  } catch (error) {
    console.error('Erreur lors de l\'affichage de la table risque:', error);
  } finally {
    await pool.end();
  }
}

displayRisqueTable();
