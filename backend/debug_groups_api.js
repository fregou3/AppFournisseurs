const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const pool = require('./db');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Middleware de journalisation pour toutes les requêtes
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  console.log('Headers:', req.headers);
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('Body:', JSON.stringify(req.body, null, 2));
  }
  next();
});

// Route de test pour la création de groupe
app.post('/api/test-group', async (req, res) => {
  const { name, filters, visibleColumns } = req.body;
  console.log('Données reçues:', { name, filters, visibleColumns });

  if (!name) {
    console.log('Erreur: Nom de groupe manquant');
    return res.status(400).json({ error: 'Le nom du groupe est requis' });
  }

  // Vérifier la structure des filtres
  if (filters) {
    console.log('Structure des filtres:', JSON.stringify(filters, null, 2));
    
    // Vérifier si les filtres sont correctement formatés
    if (typeof filters !== 'object') {
      console.log('Erreur: Les filtres doivent être un objet');
      return res.status(400).json({ error: 'Les filtres doivent être un objet' });
    }
    
    // Vérifier chaque filtre
    for (const [key, value] of Object.entries(filters)) {
      if (!Array.isArray(value)) {
        console.log(`Erreur: Le filtre '${key}' doit être un tableau`);
        return res.status(400).json({ error: `Le filtre '${key}' doit être un tableau` });
      }
    }
  }

  // Vérifier la structure des colonnes visibles
  if (visibleColumns) {
    console.log('Structure des colonnes visibles:', JSON.stringify(visibleColumns, null, 2));
    
    if (!Array.isArray(visibleColumns)) {
      console.log('Erreur: visibleColumns doit être un tableau');
      return res.status(400).json({ error: 'visibleColumns doit être un tableau' });
    }
  }

  // Simuler la vérification de l'existence du groupe
  const groupName = `group_${name.toLowerCase()}`;
  console.log(`Vérification de l'existence du groupe: ${groupName}`);

  const client = await pool.connect();
  try {
    const exists = await client.query(`
      SELECT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = $1
      )
    `, [groupName]);

    if (exists.rows[0].exists) {
      console.log(`Erreur: Le groupe '${groupName}' existe déjà`);
      return res.status(400).json({ error: 'Un groupe avec ce nom existe déjà' });
    }

    // Simuler la construction de la requête SQL
    let sql = `CREATE TABLE "${groupName}" AS SELECT `;

    if (visibleColumns && visibleColumns.length > 0) {
      sql += visibleColumns.map(col => `"${col}"`).join(', ');
    } else {
      sql += '*';
    }

    sql += ' FROM fournisseurs';

    if (filters && Object.keys(filters).length > 0) {
      const conditions = [];
      
      Object.entries(filters).forEach(([column, values]) => {
        if (values && values.length > 0) {
          const valueList = values.map(v => `'${v.replace(/'/g, "''")}'`).join(',');
          conditions.push(`"${column}" IN (${valueList})`);
        }
      });

      if (conditions.length > 0) {
        sql += ' WHERE ' + conditions.join(' AND ');
      }
    }

    console.log('Requête SQL générée:', sql);

    // Vérifier si les colonnes existent
    if (visibleColumns && visibleColumns.length > 0) {
      const columnsQuery = `
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'fournisseurs'
      `;
      
      const columnsResult = await client.query(columnsQuery);
      const existingColumns = columnsResult.rows.map(row => row.column_name);
      
      console.log('Colonnes existantes dans la table fournisseurs:', existingColumns);
      
      const invalidColumns = visibleColumns.filter(col => !existingColumns.includes(col));
      if (invalidColumns.length > 0) {
        console.log(`Erreur: Colonnes invalides: ${invalidColumns.join(', ')}`);
        return res.status(400).json({ 
          error: `Les colonnes suivantes n'existent pas: ${invalidColumns.join(', ')}` 
        });
      }
    }

    // Vérifier si les colonnes de filtrage existent
    if (filters && Object.keys(filters).length > 0) {
      const columnsQuery = `
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'fournisseurs'
      `;
      
      const columnsResult = await client.query(columnsQuery);
      const existingColumns = columnsResult.rows.map(row => row.column_name);
      
      const invalidFilterColumns = Object.keys(filters).filter(col => !existingColumns.includes(col));
      if (invalidFilterColumns.length > 0) {
        console.log(`Erreur: Colonnes de filtrage invalides: ${invalidFilterColumns.join(', ')}`);
        return res.status(400).json({ 
          error: `Les colonnes de filtrage suivantes n'existent pas: ${invalidFilterColumns.join(', ')}` 
        });
      }
    }

    // Simuler une réponse réussie
    console.log('Simulation de création de groupe réussie');
    res.status(201).json({
      message: 'Simulation de création de groupe réussie',
      name: name,
      record_count: 0,
      created_at: new Date()
    });

  } catch (error) {
    console.error('Erreur lors de la simulation:', error);
    res.status(500).json({ 
      error: 'Erreur interne du serveur',
      details: error.message 
    });
  } finally {
    client.release();
  }
});

// Démarrer le serveur
app.listen(PORT, () => {
  console.log(`Serveur de débogage démarré sur le port ${PORT}`);
  console.log(`Testez la création de groupe avec: POST http://localhost:${PORT}/api/test-group`);
});
