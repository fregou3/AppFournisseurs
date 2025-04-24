const pool = require('./db');

async function addEvaluatedColumn() {
  const client = await pool.connect();
  try {
    console.log('Ajout de la colonne evaluated_not_evaluated à la table fournisseurs...');
    
    // Vérifier si la colonne existe déjà
    const checkQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'fournisseurs' 
      AND column_name = 'evaluated_not_evaluated'
    `;
    
    const checkResult = await client.query(checkQuery);
    
    if (checkResult.rows.length === 0) {
      // La colonne n'existe pas, on l'ajoute
      const addColumnQuery = `
        ALTER TABLE fournisseurs 
        ADD COLUMN evaluated_not_evaluated VARCHAR(20)
      `;
      
      await client.query(addColumnQuery);
      console.log('Colonne evaluated_not_evaluated ajoutée avec succès.');
      
      // Mettre à jour les valeurs existantes en fonction de moodies_report
      const updateQuery = `
        UPDATE fournisseurs 
        SET evaluated_not_evaluated = CASE 
          WHEN moodies_report IS NOT NULL AND moodies_report != '' THEN 'Evaluated' 
          ELSE 'Not Evaluated' 
        END
      `;
      
      await client.query(updateQuery);
      console.log('Valeurs de evaluated_not_evaluated mises à jour avec succès.');
    } else {
      console.log('La colonne evaluated_not_evaluated existe déjà.');
    }
    
  } catch (error) {
    console.error('Erreur lors de l\'ajout de la colonne:', error);
  } finally {
    client.release();
    pool.end();
  }
}

// Exécuter la fonction
addEvaluatedColumn();
