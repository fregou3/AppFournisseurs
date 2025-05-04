const pool = require('./db');

async function checkScores() {
  const client = await pool.connect();
  try {
    console.log('Vérification des scores dans la table fournisseurs_2023_sup_5000_add_2024...');
    
    // Vérifier un échantillon de données
    const sampleQuery = `
      SELECT id, "Supplier_ID", "Score" 
      FROM fournisseurs_2023_sup_5000_add_2024
      LIMIT 10;
    `;
    const sampleResult = await client.query(sampleQuery);
    console.log('Échantillon de données:');
    sampleResult.rows.forEach((row, index) => {
      console.log(`Fournisseur ${index + 1}: ID=${row.id}, Supplier_ID=${row.Supplier_ID}, Score=${row.Score}`);
    });
  } catch (error) {
    console.error('Erreur lors de la vérification des scores:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

checkScores().catch(err => {
  console.error('Erreur non gérée:', err);
  process.exit(1);
});
