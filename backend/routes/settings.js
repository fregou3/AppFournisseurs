const express = require('express');
const router = express.Router();
const pool = require('../db');

// Créer la table des paramètres si elle n'existe pas
const createSettingsTable = async (client) => {
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS system_settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Table system_settings vérifiée/créée avec succès');
  } catch (error) {
    console.error('Erreur lors de la création de la table system_settings:', error);
    throw error;
  }
};

// Route pour définir la table par défaut
router.post('/default-table', async (req, res) => {
  const { tableName } = req.body;
  
  if (!tableName) {
    return res.status(400).json({ error: 'Nom de table requis' });
  }
  
  const client = await pool.connect();
  
  try {
    // Créer la table des paramètres si elle n'existe pas
    await createSettingsTable(client);
    
    // Vérifier si la table existe dans la base de données
    const tableExists = await client.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = $1
      )
    `, [tableName]);
    
    if (!tableExists.rows[0].exists) {
      return res.status(404).json({ error: `La table ${tableName} n'existe pas` });
    }
    
    // Insérer ou mettre à jour le paramètre de table par défaut
    await client.query(`
      INSERT INTO system_settings (key, value, updated_at)
      VALUES ('default_table', $1, CURRENT_TIMESTAMP)
      ON CONFLICT (key) 
      DO UPDATE SET value = $1, updated_at = CURRENT_TIMESTAMP
    `, [tableName]);
    
    res.status(200).json({ 
      message: `Table ${tableName} définie comme table par défaut`,
      defaultTable: tableName
    });
  } catch (error) {
    console.error('Erreur lors de la définition de la table par défaut:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la définition de la table par défaut',
      details: error.message
    });
  } finally {
    client.release();
  }
});

// Route pour récupérer la table par défaut
router.get('/default-table', async (req, res) => {
  const client = await pool.connect();
  
  try {
    // Créer la table des paramètres si elle n'existe pas
    await createSettingsTable(client);
    
    // Récupérer le paramètre de table par défaut
    const result = await client.query(`
      SELECT value FROM system_settings WHERE key = 'default_table'
    `);
    
    if (result.rows.length > 0) {
      res.status(200).json({ defaultTable: result.rows[0].value });
    } else {
      res.status(200).json({ defaultTable: null });
    }
  } catch (error) {
    console.error('Erreur lors de la récupération de la table par défaut:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la récupération de la table par défaut',
      details: error.message
    });
  } finally {
    client.release();
  }
});

module.exports = router;
