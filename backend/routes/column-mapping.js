const express = require('express');
const router = express.Router();
const pool = require('../db');

// Récupérer le mapping des colonnes
router.get('/', async (req, res) => {
  const client = await pool.connect();
  try {
    // Vérifier si la table de mapping existe
    const tableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'column_mapping'
      );
    `);
    
    if (!tableExists.rows[0].exists) {
      // Si la table n'existe pas, créer un mapping par défaut
      const defaultMapping = {
        "evaluated___not_evaluated": "evaluated_not_evaluated",
        "annual_spend_k__a_2023": "annual_spend_k_euros_a_2023",
        "sant__financi_re": "score",
        "adresse_fournisseur": "adresse",
        "nature_du_tiers": "nature_tiers",
        "r_gion_d_intervention": "region_intervention",
        "pays_d_intervention": "pays_intervention",
        "Score": "score"
      };
      
      return res.json(defaultMapping);
    }
    
    // Récupérer le mapping depuis la base de données
    const mappingResult = await client.query(`
      SELECT frontend_column, backend_column 
      FROM column_mapping 
      WHERE backend_column IS NOT NULL
    `);
    
    const mapping = {};
    mappingResult.rows.forEach(row => {
      mapping[row.frontend_column] = row.backend_column;
    });
    
    res.json(mapping);
  } catch (error) {
    console.error('Erreur lors de la récupération du mapping des colonnes:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  } finally {
    client.release();
  }
});

// Récupérer la liste des colonnes inexistantes
router.get('/missing', async (req, res) => {
  const client = await pool.connect();
  try {
    // Vérifier si la table de mapping existe
    const tableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'column_mapping'
      );
    `);
    
    if (!tableExists.rows[0].exists) {
      // Si la table n'existe pas, retourner une liste par défaut
      const defaultMissing = [
        "organization_3",
        "organization_zone",
        "notation_esg",
        "risques_compliance",
        "calcul_m_thode_ademe",
        "scope_1",
        "scope_2",
        "scope_3",
        "vision_gloable",
        "comments",
        "analyse_des_risques_loi_sapin_ii"
      ];
      
      return res.json(defaultMissing);
    }
    
    // Récupérer les colonnes inexistantes depuis la base de données
    const missingResult = await client.query(`
      SELECT frontend_column 
      FROM column_mapping 
      WHERE backend_column IS NULL
    `);
    
    const missingColumns = missingResult.rows.map(row => row.frontend_column);
    
    res.json(missingColumns);
  } catch (error) {
    console.error('Erreur lors de la récupération des colonnes inexistantes:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  } finally {
    client.release();
  }
});

// Récupérer la structure d'une table
router.get('/table-structure/:table', async (req, res) => {
  const { table } = req.params;
  const client = await pool.connect();
  
  try {
    // Vérifier si la table existe
    const tableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = $1
      );
    `, [table]);
    
    if (!tableExists.rows[0].exists) {
      return res.status(404).json({ error: `La table ${table} n'existe pas` });
    }
    
    // Récupérer la structure de la table
    const columnsResult = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = $1
      ORDER BY ordinal_position;
    `, [table]);
    
    const columns = columnsResult.rows.map(row => ({
      name: row.column_name,
      type: row.data_type,
      nullable: row.is_nullable === 'YES'
    }));
    
    res.json(columns);
  } catch (error) {
    console.error(`Erreur lors de la récupération de la structure de la table ${table}:`, error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  } finally {
    client.release();
  }
});

module.exports = router;
