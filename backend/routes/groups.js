const express = require('express');
const router = express.Router();
const pool = require('../db');
const ExcelJS = require('exceljs');
const { Parser } = require('json2csv');

// Fonction utilitaire pour échapper les noms de colonnes SQL
function escapeColumnName(columnName) {
  // Retourne le nom de colonne entouré de guillemets doubles pour préserver les accents et espaces
  return `"${columnName.replace(/"/g, '""')}"`;
}

// Créer un nouveau groupe
router.post('/', async (req, res) => {
  const { name, tableName } = req.body;
  let { filters, visibleColumns } = req.body;
  console.log('Création de groupe avec:', { name, filters, visibleColumns, tableName });

  if (!name) {
    return res.status(400).json({ error: 'Le nom du groupe est requis' });
  }
  
  if (!tableName) {
    return res.status(400).json({ error: 'Le nom de la table est requis' });
  }

  const client = await pool.connect();
  
  try {
    // Validation supplémentaire des données d'entrée
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return res.status(400).json({ error: 'Le nom du groupe est invalide ou manquant' });
    }
    
    // S'assurer que filters est un objet
    if (filters && typeof filters !== 'object') {
      return res.status(400).json({ error: 'Les filtres doivent être un objet' });
    }
    
    // S'assurer que visibleColumns est un tableau
    if (visibleColumns && !Array.isArray(visibleColumns)) {
      return res.status(400).json({ error: 'Les colonnes visibles doivent être un tableau' });
    }
    
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
    
    // Pas besoin de stocker des noms de colonnes originaux car on utilise directement les noms réels

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
    
    // Vérifier si les colonnes table_name et original_column_names existent dans la table system_group_metadata
    const columnsExistQuery = `
      SELECT 
        EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'system_group_metadata' AND column_name = 'table_name') as table_name_exists,
        EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'system_group_metadata' AND column_name = 'original_column_names') as original_column_names_exists
    `;
    
    const columnsExistResult = await client.query(columnsExistQuery);
    const tableNameColumnExists = columnsExistResult.rows[0].table_name_exists;
    const originalColumnNamesExists = columnsExistResult.rows[0].original_column_names_exists;
    
    // Si la colonne table_name n'existe pas, l'ajouter
    if (!tableNameColumnExists) {
      console.log('La colonne table_name n\'existe pas dans system_group_metadata, ajout de la colonne...');
      await client.query(`ALTER TABLE system_group_metadata ADD COLUMN table_name TEXT`);
      console.log('Colonne table_name ajoutée avec succès');
    }
    
    // Si la colonne original_column_names n'existe pas, l'ajouter
    if (!originalColumnNamesExists) {
      console.log('La colonne original_column_names n\'existe pas dans system_group_metadata, ajout de la colonne...');
      await client.query(`ALTER TABLE system_group_metadata ADD COLUMN original_column_names JSONB`);
      console.log('Colonne original_column_names ajoutée avec succès');
    }

    // Vérifier d'abord si la table source spécifiée existe
    const sourceTableExistsQuery = `
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = $1
      )
    `;
    
    const sourceTableResult = await client.query(sourceTableExistsQuery, [tableName]);
    const sourceTableExists = sourceTableResult.rows[0].exists;
    
    // Si la table source spécifiée n'existe pas, on ne peut pas continuer
    if (!sourceTableExists) {
      await client.query('ROLLBACK');
      return res.status(400).json({ 
        error: `La table '${tableName}' n'existe pas` 
      });
    }
    
    // Récupérer les colonnes de la table spécifiée
    let existingColumns = [];
    const columnsQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = $1
    `;
      
    const columnsResult = await client.query(columnsQuery, [tableName]);
    existingColumns = columnsResult.rows.map(row => row.column_name);
      
    // Vérifier si les colonnes visibles existent
    let invalidVisibleColumns = [];
    if (visibleColumns && visibleColumns.length > 0) {
      invalidVisibleColumns = visibleColumns.filter(col => !existingColumns.includes(col));
      if (invalidVisibleColumns.length > 0) {
        console.warn(`Attention: Les colonnes suivantes n'existent pas: ${invalidVisibleColumns.join(', ')}`);
        // Ne pas filtrer les colonnes invalides pour conserver toutes les colonnes sélectionnées
      }
    }

    // Vérifier si les colonnes de filtrage existent
    if (filters && Object.keys(filters).length > 0) {
      const invalidFilterColumns = Object.keys(filters).filter(col => !existingColumns.includes(col));
      if (invalidFilterColumns.length > 0) {
        console.warn(`Attention: Les colonnes de filtrage suivantes n'existent pas: ${invalidFilterColumns.join(', ')}`);
        // On ne bloque pas la création, on filtre simplement les colonnes de filtrage invalides
        const validFilters = {};
        Object.keys(filters).forEach(key => {
          if (existingColumns.includes(key)) {
            validFilters[key] = filters[key];
          }
        });
        filters = validFilters;
      }
    }


    // Construire la requête de création du groupe
    let sql;
    
    // Sélectionner toutes les colonnes ou seulement celles spécifiées
    if (visibleColumns && visibleColumns.length > 0) {
      // Déduplicater les colonnes pour éviter l'erreur "column specified more than once"
      const uniqueColumns = [...new Set(visibleColumns)];
      
      // Vérifier si toutes les colonnes existent dans la table source
      const invalidColumns = uniqueColumns.filter(col => !existingColumns.includes(col));
      
      if (invalidColumns.length === 0) {
        // Toutes les colonnes existent, on peut utiliser une simple requête SELECT
        sql = `CREATE TABLE "${groupName}" AS SELECT `;
        sql += uniqueColumns.map(col => `"${col}"`).join(', ');
        sql += ` FROM "${tableName}"`;
      } else {
        // Certaines colonnes n'existent pas, on doit créer une table avec toutes les colonnes demandées
        console.log(`Création d'une table avec des colonnes personnalisées, dont ${invalidColumns.length} n'existent pas dans la source`);
        
        // 1. Créer la table avec toutes les colonnes demandées
        sql = `CREATE TABLE "${groupName}" (group_id SERIAL PRIMARY KEY`;
        
        // Ajouter toutes les colonnes demandées
        uniqueColumns.forEach(col => {
          // Éviter de dupliquer la colonne id si elle existe déjà dans les colonnes demandées
          if (col.toLowerCase() !== 'id') {
            // Utiliser le nom de colonne original avec échappement correct
            sql += `, ${escapeColumnName(col)} TEXT`;
          }
        });
        
        sql += `)`;
        
        console.log('Création de la table avec la structure:', sql);
        await client.query(sql);
        
        // 2. Insérer les données pour les colonnes qui existent
        const existingVisibleColumns = uniqueColumns.filter(col => existingColumns.includes(col));
        
        if (existingVisibleColumns.length > 0) {
          // Construire la requête d'insertion
          let insertSql = `INSERT INTO "${groupName}" (`;
          
          // Colonnes cibles - Exclure la colonne 'id' car elle a été remplacée par 'group_id'
          const columnsWithoutId = existingVisibleColumns.filter(col => col.toLowerCase() !== 'id');
          
          if (columnsWithoutId.length === 0) {
            console.log('Aucune colonne valide à insérer après exclusion de "id"');
            // Ne pas exécuter la requête d'insertion s'il n'y a pas de colonnes valides
            return;
          }
          
          // Utiliser les noms de colonnes originaux avec échappement correct
          insertSql += columnsWithoutId.map(col => escapeColumnName(col)).join(', ');
          
          insertSql += `) SELECT `;
          
          // Colonnes sources - Utiliser les mêmes noms avec échappement correct
          insertSql += columnsWithoutId.map(col => escapeColumnName(col)).join(', ');
          
          insertSql += ` FROM "${tableName}"`;
          
          // Ajouter les filtres si présents
          if (filters && Object.keys(filters).length > 0) {
            const conditions = [];
            
            Object.entries(filters).forEach(([column, values]) => {
              if (values && values.length > 0 && existingColumns.includes(column)) {
                const valueList = values.map(v => `'${v.replace(/'/g, "''")}'`).join(',');
                conditions.push(`${escapeColumnName(column)} IN (${valueList})`);
              }
            });

            if (conditions.length > 0) {
              insertSql += ' WHERE ' + conditions.join(' AND ');
            }
          }
          
          console.log('Insertion des données avec la requête:', insertSql);
          await client.query(insertSql);
        }
        
        // Ne pas exécuter la requête CREATE TABLE AS SELECT ci-dessous
        sql = null;
      }
    } else {
      // Aucune colonne spécifiée, sélectionner toutes les colonnes
      sql = `CREATE TABLE "${groupName}" AS SELECT * FROM "${tableName}"`;
    }

    // Ajouter les filtres si présents
    if (filters && Object.keys(filters).length > 0) {
      const conditions = [];
      
      Object.entries(filters).forEach(([column, values]) => {
        if (values && values.length > 0) {
          const valueList = values.map(v => `'${v.replace(/'/g, "''")}'`).join(',');
          // Utiliser escapeColumnName pour préserver les accents et espaces
          conditions.push(`${escapeColumnName(column)} IN (${valueList})`);
        }
      });

      if (conditions.length > 0) {
        sql += ' WHERE ' + conditions.join(' AND ');
      }
    }

    console.log('Création du groupe avec la requête:', sql);

    // Créer la table du groupe si ce n'est pas déjà fait
    if (sql) {
      await client.query(sql);
    }

    // Sauvegarder les métadonnées
    // S'assurer que les données sont valides pour JSON
    let filtersJson;
    let visibleColumnsJson;
    
    try {
      filtersJson = JSON.stringify(filters || {});
      visibleColumnsJson = JSON.stringify(visibleColumns || []);
    } catch (jsonError) {
      await client.query('ROLLBACK');
      console.error('Erreur lors de la conversion en JSON:', jsonError);
      return res.status(400).json({ 
        error: 'Format de données invalide', 
        details: jsonError.message 
      });
    }
    
    // Enregistrer les métadonnées du groupe et récupérer la date de création
    const metadataResult = await client.query(
      `INSERT INTO system_group_metadata (group_name, filters, visible_columns, table_name) 
       VALUES ($1, $2, $3, $4)
       RETURNING created_at`,
      [groupName, filtersJson, visibleColumnsJson, tableName]
    );
    
    console.log('Métadonnées du groupe enregistrées avec les noms réels des colonnes');

    // Compter le nombre de lignes
    const countResult = await client.query(`SELECT COUNT(*) FROM "${groupName}"`);
    const rowCount = parseInt(countResult.rows[0].count);

    await client.query('COMMIT');

    const response = {
      message: 'Groupe créé avec succès',
      name: name,
      record_count: rowCount,
      created_at: metadataResult.rows[0].created_at
    };

    console.log('Réponse:', response);
    res.status(201).json(response);

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erreur lors de la création du groupe:', error);
    
    // Gestion spécifique des erreurs selon leur code
    switch (error.code) {
      case '42703': // Colonne inexistante
        return res.status(400).json({
          error: `Erreur de colonne: ${error.message}`,
          details: error.hint || error.message
        });
      case '42P01': // Table inexistante
        return res.status(400).json({
          error: `Erreur de table: ${error.message}`,
          details: error.hint || error.message
        });
      case '22P02': // Format de données invalide
        return res.status(400).json({
          error: `Format de données invalide: ${error.message}`,
          details: error.hint || error.message
        });
      case '23505': // Violation de contrainte d'unicité
        return res.status(400).json({
          error: `Conflit de données: ${error.message}`,
          details: error.hint || error.message
        });
      default:
        return res.status(500).json({ 
          error: 'Erreur interne du serveur',
          details: error.message 
        });
    }
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
      FROM pg_tables t
      WHERE 
        t.schemaname = 'public' 
        AND t.tablename LIKE 'group_%'
        AND t.tablename NOT LIKE 'system_%'
        AND t.tablename != 'group_metadata'
        AND t.tablename != 'metadata'
        AND t.tablename NOT LIKE '%metadata%'
    `);

    // Récupérer les informations pour chaque table de manière sécurisée
    const groupPromises = tablesResult.rows
      .filter(row => !row.tablename.includes('metadata'))  // Filtre supplémentaire en JavaScript
      .map(async (row) => {
        const tableName = row.tablename;
        const countResult = await client.query(`SELECT COUNT(*) FROM "${tableName}"`);
        const metadataResult = await client.query(
          'SELECT created_at FROM system_group_metadata WHERE group_name = $1',
          [tableName]
        );

        return {
          tablename: tableName,
          record_count: parseInt(countResult.rows[0].count),
          created_at: metadataResult.rows[0]?.created_at || new Date()
        };
      });

    const groups = await Promise.all(groupPromises);
    groups.sort((a, b) => b.created_at - a.created_at);

    // Formater les noms des groupes (enlever le préfixe 'group_')
    const formattedGroups = groups
      .filter(group => !group.tablename.includes('metadata'))  // Filtre final pour plus de sécurité
      .map(group => ({
        name: group.tablename.replace('group_', ''),
        record_count: group.record_count,
        created_at: group.created_at
      }));

    console.log('Groupes trouvés:', formattedGroups);

    res.json(formattedGroups);
  } catch (error) {
    console.error('Erreur lors de la récupération des regroupements:', error);
    res.status(500).json({ 
      error: 'Erreur interne du serveur',
      details: error.message 
    });
  } finally {
    client.release();
  }
});

// Récupérer les données d'un groupe spécifique
router.get('/:name', async (req, res) => {
  const { name } = req.params;
  const client = await pool.connect();
  
  try {
    const groupName = `group_${name.toLowerCase()}`;
    console.log('Récupération des données pour le groupe:', groupName);
    
    // Vérifier si le groupe existe
    const exists = await client.query(`
      SELECT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = $1
      )
    `, [groupName]);

    if (!exists.rows[0].exists) {
      return res.status(404).json({ error: 'Groupe non trouvé' });
    }

    // Récupérer les colonnes de la table
    const columnsQuery = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = $1
      ORDER BY ordinal_position
    `, [groupName]);
    
    console.log('Colonnes trouvées:', columnsQuery.rows);

    // Récupérer les données du groupe
    const dataQuery = await client.query(`SELECT * FROM "${groupName}"`);
    console.log('Nombre de lignes trouvées:', dataQuery.rows.length);

    // Récupérer les métadonnées pour les filtres, colonnes visibles et table source
    const metadataQuery = await client.query(`
      SELECT filters, visible_columns, table_name FROM system_group_metadata 
      WHERE group_name = $1
    `, [groupName]);

    // Récupérer la table source
    const tableName = metadataQuery.rows[0]?.table_name;
    
    console.log('Table source:', tableName);
    
    const response = {
      name: name,
      columns: columnsQuery.rows.map(col => {
        // Utiliser directement le nom de la colonne tel qu'il est dans la base de données
        return {
          name: col.column_name,
          type: col.data_type
        };
      }),
      data: dataQuery.rows,
      record_count: dataQuery.rows.length,
      created_at: metadataQuery.rows[0]?.created_at,
      table_name: tableName
    };

    // Ajouter les filtres et colonnes visibles si présents
    if (metadataQuery.rows[0]) {
      response.filters = metadataQuery.rows[0].filters;
      response.visibleColumns = metadataQuery.rows[0].visible_columns;
    }

    console.log('Réponse envoyée:', {
      name: response.name,
      columnCount: response.columns.length,
      recordCount: response.record_count,
      createdAt: response.created_at
    });

    res.json(response);

  } catch (error) {
    console.error('Erreur lors de la récupération du groupe:', error);
    res.status(500).json({ 
      error: 'Erreur interne du serveur',
      details: error.message 
    });
  } finally {
    client.release();
  }
});

// Export d'un groupe (Excel ou CSV)
router.post('/export/:format', async (req, res) => {
  console.log('=== Export Groupe ===');
  console.log('URL:', req.url);
  console.log('Format:', req.params.format);
  console.log('Headers:', req.headers);
  console.log('Body:', req.body);
  
  if (!req.body || !req.body.groupName) {
    console.error('Nom du groupe manquant dans la requête');
    return res.status(400).json({ error: 'Le nom du groupe est requis' });
  }

  const { groupName } = req.body;
  const format = req.params.format.toLowerCase();
  
  if (!['excel', 'csv'].includes(format)) {
    return res.status(400).json({ error: 'Format non supporté. Utilisez excel ou csv.' });
  }

  console.log('Nom du groupe à exporter:', groupName);
  console.log('Format d\'export:', format);
  
  const client = await pool.connect();

  try {
    // Vérifier si le groupe existe
    const tableName = `group_${groupName.toLowerCase()}`;
    const exists = await client.query(`
      SELECT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = $1
      )
    `, [tableName]);

    if (!exists.rows[0].exists) {
      return res.status(404).json({ error: 'Groupe non trouvé' });
    }

    // Récupérer les données du groupe
    const result = await client.query(`SELECT * FROM "${tableName}"`);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Aucune donnée trouvée dans le groupe' });
    }

    if (format === 'csv') {
      // Export CSV
      const json2csvParser = new Parser();
      const csv = json2csvParser.parse(result.rows);

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${groupName}_${new Date().toISOString().split('T')[0]}.csv"`
      );

      res.send(csv);
    } else {
      // Export Excel
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet(groupName);

      // Ajouter les en-têtes
      if (result.rows.length > 0) {
        worksheet.columns = Object.keys(result.rows[0]).map(key => ({
          header: key,
          key: key,
          width: 15
        }));
      }

      // Ajouter les données
      worksheet.addRows(result.rows);

      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${groupName}_${new Date().toISOString().split('T')[0]}.xlsx"`
      );

      await workbook.xlsx.write(res);
      res.end();
    }

  } catch (error) {
    console.error(`Erreur lors de l'export ${format}:`, error);
    res.status(500).json({ error: `Erreur lors de l'export ${format}` });
  } finally {
    client.release();
  }
});

// Supprimer un groupe
router.delete('/:name', async (req, res) => {
  const { name } = req.params;
  const client = await pool.connect();

  try {
    const groupName = `group_${name.toLowerCase()}`;
    
    await client.query('BEGIN');
    
    // Vérifier si le groupe existe
    const exists = await client.query(`
      SELECT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = '${groupName}'
      )
    `);

    if (!exists.rows[0].exists) {
      return res.status(404).json({ error: 'Groupe non trouvé' });
    }

    // Supprimer les métadonnées et la table
    await client.query('DELETE FROM system_group_metadata WHERE group_name = $1', [groupName]);
    await client.query(`DROP TABLE "${groupName}" CASCADE`);
    
    await client.query('COMMIT');
    
    res.json({ 
      message: 'Groupe supprimé avec succès',
      name: name
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erreur lors de la suppression du groupe:', error);
    res.status(500).json({ 
      error: 'Erreur interne du serveur',
      details: error.message 
    });
  } finally {
    client.release();
  }
});

module.exports = router;
