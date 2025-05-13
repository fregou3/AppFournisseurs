const express = require('express');
const router = express.Router();
const pool = require('../db');
const ExcelJS = require('exceljs');
const { Parser } = require('json2csv');

// Fonction utilitaire pour échapper les noms de colonnes SQL
function escapeColumnName(columnName) {
  return `"${String(columnName).replace(/"/g, '""')}"`;
}


// Créer un nouveau groupe
router.post('/', async (req, res) => {
  const { name, tableName } = req.body;
  let { filters, visibleColumns } = req.body;
  
  console.log('Création de groupe avec:', { 
    name, 
    tableName,
    filtersKeys: filters ? Object.keys(filters) : [],
    visibleColumnsLength: visibleColumns ? visibleColumns.length : 0
  });

  if (!name) {
    return res.status(400).json({ error: 'Le nom du groupe est requis' });
  }
  
  if (!tableName) {
    return res.status(400).json({ error: 'Le nom de la table est requis' });
  }

  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // Vérifier si le groupe existe déjà (table ou métadonnées)
    const groupName = `group_${name.toLowerCase().replace(/[^a-z0-9_]/g, '_')}`;
    
    // Vérifier si la table existe
    const tableExists = await client.query(
      `SELECT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = $1
      )`,
      [groupName]
    );
    
    // Vérifier si les métadonnées existent
    const metadataExists = await client.query(
      `SELECT EXISTS (
        SELECT 1 FROM system_group_metadata
        WHERE group_name = $1
      )`,
      [groupName]
    );
    
    if (tableExists.rows[0].exists || metadataExists.rows[0].exists) {
      // Si la table ou les métadonnées existent, nettoyer les deux avant de continuer
      try {
        if (tableExists.rows[0].exists) {
          await client.query(`DROP TABLE IF EXISTS "${groupName}"`); 
          console.log(`Table ${groupName} supprimée.`);
        }
        
        if (metadataExists.rows[0].exists) {
          await client.query(`DELETE FROM system_group_metadata WHERE group_name = $1`, [groupName]);
          console.log(`Métadonnées pour ${groupName} supprimées.`);
        }
      } catch (cleanupError) {
        console.error('Erreur lors du nettoyage du groupe existant:', cleanupError);
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Un groupe avec ce nom existe déjà et ne peut pas être remplacé' });
      }
    }

    // Créer la table de métadonnées si elle n'existe pas
    await client.query(`
      CREATE TABLE IF NOT EXISTS system_group_metadata (
        group_name TEXT PRIMARY KEY,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        filters JSONB,
        visible_columns JSONB,
        table_name TEXT,
        original_column_names JSONB
      )
    `);
    
    // Vérifier si la table source existe
    const sourceTableExists = await client.query(
      `SELECT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = $1
      )`,
      [tableName]
    );
    
    if (!sourceTableExists.rows[0].exists) {
      await client.query('ROLLBACK');
      return res.status(400).json({ 
        error: `La table '${tableName}' n'existe pas` 
      });
    }
    
    // Construire la requête de création du groupe
    let sql = `CREATE TABLE "${groupName}" AS SELECT * FROM "${tableName}"`;
    
    // Ajouter les filtres si présents
    if (filters && Object.keys(filters).length > 0) {
      const conditions = [];
      
      for (const [column, values] of Object.entries(filters)) {
        // Ignorer les colonnes avec un nom vide
        if (!column || column.trim() === '') {
          console.log('Ignorer une colonne avec un nom vide dans les filtres');
          continue;
        }
        
        if (values && Array.isArray(values) && values.length > 0) {
          // Gérer les valeurs NULL et les chaînes vides séparément
          const nullValues = values.filter(v => v === null || v === 'null');
          const nonNullValues = values.filter(v => v !== null && v !== 'null');
          
          // Créer des conditions séparées pour les valeurs non-NULL et NULL
          const columnConditions = [];
          
          // Ajouter la condition IN pour les valeurs non-NULL
          if (nonNullValues.length > 0) {
            const valueList = nonNullValues.map(v => {
              // Gérer les chaînes vides spécialement
              if (v === '') {
                return "''";
              }
              return `'${String(v).replace(/'/g, "''")}'`;
            });
            columnConditions.push(`${escapeColumnName(column)} IN (${valueList.join(',')})`);
            
            // Ajouter une condition spéciale pour les chaînes vides
            if (nonNullValues.includes('')) {
              columnConditions.push(`${escapeColumnName(column)} = ''`);
              // Ajouter aussi une condition pour les valeurs NULL si on cherche des valeurs vides
              // car souvent les valeurs vides et NULL sont traitées de façon similaire
              columnConditions.push(`${escapeColumnName(column)} IS NULL`);
            }
          }
          
          // Ajouter une condition IS NULL si nécessaire
          if (nullValues.length > 0) {
            columnConditions.push(`${escapeColumnName(column)} IS NULL`);
          }
          
          // Combiner les conditions avec OR
          if (columnConditions.length > 0) {
            conditions.push(`(${columnConditions.join(' OR ')})`);
          }
        }
      }

      if (conditions.length > 0) {
        sql += ' WHERE ' + conditions.join(' AND ');
      }
    }

    console.log('REQUÊTE SQL GÉNÉRÉE POUR CRÉATION DE GROUPE :', sql);
    
    try {
      await client.query(sql);
    } catch (sqlError) {
      console.error('Erreur SQL lors de la création du groupe:', sqlError);
      await client.query('ROLLBACK');
      return res.status(500).json({ 
        error: 'Erreur lors de la création du groupe',
        details: sqlError.message
      });
    }

    // Sauvegarder les métadonnées
    try {
      await client.query(
        `INSERT INTO system_group_metadata (group_name, filters, visible_columns, table_name)
         VALUES ($1, $2, $3, $4)`,
        [
          groupName, 
          JSON.stringify(filters || {}), 
          JSON.stringify(visibleColumns || []), 
          tableName
        ]
      );
    } catch (metadataError) {
      console.error('Erreur lors de la sauvegarde des métadonnées:', metadataError);
      await client.query('ROLLBACK');
      return res.status(500).json({ 
        error: 'Erreur lors de la sauvegarde des métadonnées',
        details: metadataError.message
      });
    }

    await client.query('COMMIT');
    
    res.status(201).json({ 
      message: 'Groupe créé avec succès',
      groupName: groupName
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erreur lors de la création du groupe:', error);
    
    res.status(500).json({ 
      error: 'Erreur interne du serveur',
      details: error.message 
    });
  } finally {
    client.release();
  }
});

// Récupérer la liste des regroupements
router.get('/', async (req, res) => {
  const client = await pool.connect();
  try {
    // Récupérer toutes les tables qui commencent par 'group_' sauf les tables système
    const tablesResult = await client.query(`
      SELECT tablename
      FROM pg_tables
      WHERE schemaname = 'public'
      AND tablename LIKE 'group_%'
      AND tablename NOT LIKE 'group_temp%'
      ORDER BY tablename
    `);
    
    // Récupérer les métadonnées pour chaque groupe
    const groups = [];
    for (const row of tablesResult.rows) {
      const groupName = row.tablename;
      
      // Récupérer les métadonnées
      const metadataResult = await client.query(
        `SELECT * FROM system_group_metadata WHERE group_name = $1`,
        [groupName]
      );
      
      // Compter le nombre d'enregistrements
      const countResult = await client.query(
        `SELECT COUNT(*) FROM "${groupName}"`
      );
      
      // Formater les données
      const metadata = metadataResult.rows[0] || {};
      groups.push({
        name: groupName,
        record_count: parseInt(countResult.rows[0].count, 10),
        created_at: metadata.created_at,
        filters: metadata.filters,
        visible_columns: metadata.visible_columns,
        table_name: metadata.table_name
      });
    }
    
    res.json(groups);
  } catch (error) {
    console.error('Erreur lors de la récupération des regroupements:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des regroupements' });
  } finally {
    client.release();
  }
});

// Récupérer les données d'un regroupement
router.get('/:groupName', async (req, res) => {
  const { groupName } = req.params;
  const client = await pool.connect();
  
  try {
    // Vérifier si le groupe existe
    const tableExists = await client.query(
      `SELECT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = $1
      )`,
      [groupName]
    );
    
    if (!tableExists.rows[0].exists) {
      return res.status(404).json({ error: `Le groupe ${groupName} n'existe pas` });
    }
    
    // Récupérer les métadonnées
    const metadataResult = await client.query(
      `SELECT * FROM system_group_metadata WHERE group_name = $1`,
      [groupName]
    );
    
    const metadata = metadataResult.rows[0] || {};
    
    // Récupérer les données
    const dataResult = await client.query(`SELECT * FROM "${groupName}"`);
    
    res.json({
      data: dataResult.rows,
      filters: metadata.filters,
      visibleColumns: metadata.visible_columns,
      table_name: metadata.table_name
    });
  } catch (error) {
    console.error(`Erreur lors de la récupération des données du groupe ${groupName}:`, error);
    res.status(500).json({ error: 'Erreur lors de la récupération des données du groupe' });
  } finally {
    client.release();
  }
});

// Supprimer un regroupement
router.delete('/:groupName', async (req, res) => {
  const { groupName } = req.params;
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Vérifier si le groupe existe
    const tableExists = await client.query(
      `SELECT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = $1
      )`,
      [groupName]
    );
    
    if (!tableExists.rows[0].exists) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: `Le groupe ${groupName} n'existe pas` });
    }
    
    // Supprimer la table
    await client.query(`DROP TABLE IF EXISTS "${groupName}"`);
    
    // Supprimer les métadonnées
    await client.query(
      `DELETE FROM system_group_metadata WHERE group_name = $1`,
      [groupName]
    );
    
    await client.query('COMMIT');
    
    res.json({ message: 'Groupe supprimé avec succès' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(`Erreur lors de la suppression du groupe ${groupName}:`, error);
    res.status(500).json({ error: 'Erreur lors de la suppression du groupe' });
  } finally {
    client.release();
  }
});

// Exporter un groupe au format Excel ou CSV
router.post('/export/:format', async (req, res) => {
  const { format } = req.params;
  const { groupName } = req.body;
  
  if (!groupName) {
    return res.status(400).json({ error: 'Le nom du groupe est requis' });
  }
  
  if (format !== 'excel' && format !== 'csv') {
    return res.status(400).json({ error: 'Format non supporté. Utilisez "excel" ou "csv".' });
  }
  
  const client = await pool.connect();
  
  try {
    // Vérifier si le groupe existe
    const tableExists = await client.query(
      `SELECT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = $1
      )`,
      [groupName]
    );
    
    if (!tableExists.rows[0].exists) {
      return res.status(404).json({ error: `Le groupe ${groupName} n'existe pas` });
    }
    
    // Récupérer les données
    const dataResult = await client.query(`SELECT * FROM "${groupName}"`);
    const data = dataResult.rows;
    
    if (format === 'excel') {
      // Créer un classeur Excel
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet(groupName);
      
      // Ajouter les en-têtes
      if (data.length > 0) {
        const headers = Object.keys(data[0]);
        worksheet.addRow(headers);
      }
      
      // Ajouter les données
      data.forEach(row => {
        const values = Object.values(row);
        worksheet.addRow(values);
      });
      
      // Générer le fichier Excel
      const buffer = await workbook.xlsx.writeBuffer();
      
      // Envoyer le fichier
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${groupName}.xlsx"`);
      res.send(buffer);
    } else if (format === 'csv') {
      // Créer un CSV
      const parser = new Parser();
      const csv = parser.parse(data);
      
      // Envoyer le fichier
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${groupName}.csv"`);
      res.send(csv);
    }
  } catch (error) {
    console.error(`Erreur lors de l'export du groupe ${groupName}:`, error);
    res.status(500).json({ error: `Erreur lors de l'export du groupe: ${error.message}` });
  } finally {
    client.release();
  }
});

module.exports = router;
