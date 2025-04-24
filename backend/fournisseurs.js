const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const ExcelJS = require('exceljs');
const { parse } = require('json2csv');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { v4: uuidv4 } = require('uuid');

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// Mapping des noms de colonnes
const columnMapping = {
  'Supplier_ID': 'supplier_id',
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
  'Comments': 'comments',
  'Adresse fournisseur': 'adresse',
  'Analyse des risques Loi Sapin II': 'analyse_des_risques_loi_sapin_ii',
  'Region d\'intervention': 'region_intervention',
  'Pays d\'intervention': 'pays_intervention',
  'Localisation': 'localisation',
  'Nature de Tier': 'nature_tier',
  'Note Risque Financier': 'note_risque_financier',
  'Note de Conformité': 'note_de_conformite'
};

// Fonction utilitaire pour créer un fichier temporaire
const createTempFile = (extension) => {
  const tempDir = os.tmpdir();
  const fileName = `${uuidv4()}${extension}`;
  return path.join(tempDir, fileName);
};

// Fonction pour convertir la date Excel en format ISO
const excelDateToISO = (excelDate) => {
  if (!excelDate) return null;
  
  // Vérifier si c'est déjà une date valide
  if (excelDate instanceof Date && !isNaN(excelDate)) {
    return excelDate.toISOString().split('T')[0];
  }

  // Si c'est une chaîne qui ressemble à une date
  if (typeof excelDate === 'string' && excelDate.includes('-')) {
    return excelDate;
  }

  // Convertir le nombre Excel en date
  try {
    const numericDate = parseInt(excelDate);
    if (isNaN(numericDate)) return null;

    // Excel commence à compter à partir du 1er janvier 1900
    const date = new Date((numericDate - 25569) * 86400 * 1000);
    return date.toISOString().split('T')[0];
  } catch (error) {
    console.error('Erreur de conversion de date:', error);
    return null;
  }
};

// Récupérer tous les fournisseurs
router.get('/', async (req, res) => {
  try {
    const query = `
      SELECT 
        f.id,
        f.supplier_id,
        f.procurement_orga,
        f.huyi_modification,
        f.partners_group,
        f.partners_traduction,
        f.evaluated_not_evaluated,
        f.activity_area,
        f.ecovadis_name,
        f.ecovadis_score,
        f.date,
        f.ecovadis_id,
        f.notation_esg,
        f.sante_financiere,
        f.risques_compliance,
        f.calcul_methode_ademe,
        f.scope_1,
        f.scope_2,
        f.scope_3,
        f.vision_globale,
        f.organization_1,
        f.organization_2,
        f.organization_3,
        f.organization_zone,
        f.organization_country,
        f.subsidiary,
        f.original_name_partner,
        f.country_of_supplier_contact,
        f.vat_number,
        f.activity_area_1,
        f.annual_spend_k_euros_a_2023,
        f.supplier_contact_first_name,
        f.supplier_contact_last_name,
        f.supplier_contact_email,
        f.supplier_contact_phone,
        f.comments,
        f.adresse,
        f.analyse_des_risques_loi_sapin_ii,
        f.region_intervention,
        f.pays_intervention,
        f.localisation,
        f.nature_tier,
        f.score,
        r.note_risque_financier as "Note Risque Financier",
        r.note_de_conformite as "Note de Conformité",
        d.details
      FROM fournisseurs f
      LEFT JOIN risque r ON f.id = r.id
      LEFT JOIN details d ON f.id = d.id
      ORDER BY f.id ASC
    `;
    
    const result = await pool.query(query);
    if (result.rows.length > 0) {
      console.log('Colonnes dans la base de données:', Object.keys(result.rows[0]));
    }
    console.log(`Nombre de lignes récupérées: ${result.rows.length}`);
    
    const formattedResults = result.rows.map(row => {
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
    
    res.json(formattedResults);
  } catch (err) {
    console.error('Erreur lors de la récupération des fournisseurs:', err);
    res.status(500).json({ error: 'Erreur lors de la récupération des fournisseurs' });
  }
});

// Upload des données Excel
router.post('/upload', async (req, res) => {
  const client = await pool.connect();
  try {
    const { data } = req.body;
    
    if (!Array.isArray(data) || data.length === 0) {
      return res.status(400).json({ error: 'Les données sont invalides ou vides' });
    }

    await client.query('BEGIN');

    // Désactiver les contraintes de clé étrangère
    await client.query('ALTER TABLE risque DROP CONSTRAINT IF EXISTS risque_id_fkey');
    await client.query('ALTER TABLE details DROP CONSTRAINT IF EXISTS details_id_fkey');
    
    // Vider toutes les tables liées
    await client.query('TRUNCATE TABLE risque, details, fournisseurs RESTART IDENTITY');

    // Log des données reçues
    console.log('Structure de la première ligne:', JSON.stringify(data[0], null, 2));
    console.log('Colonnes dans le fichier Excel:', Object.keys(data[0]));
    console.log('Mapping des colonnes disponible:', Object.keys(columnMapping));

    // Insérer les données en utilisant le mapping
    let insertedCount = 0;
    let unmappedColumns = new Set();

    for (const row of data) {
      // Créer un objet avec les colonnes mappées
      const mappedData = {};
      for (const [originalCol, value] of Object.entries(row)) {
        const mappedCol = columnMapping[originalCol];
        if (mappedCol) {
          // Traitement spécial pour la colonne date
          if (mappedCol === 'date') {
            mappedData[mappedCol] = excelDateToISO(value);
          } else {
            mappedData[mappedCol] = value?.toString() || null;
          }
        } else {
          unmappedColumns.add(originalCol);
        }
      }

      if (Object.keys(mappedData).length === 0) {
        console.error('Aucune colonne mappée pour cette ligne:', row);
        continue;
      }

      // Construire la requête d'insertion
      const columns = Object.keys(mappedData);
      const values = columns.map(col => mappedData[col]);
      const placeholders = values.map((_, i) => `$${i + 1}`);

      const query = `
        INSERT INTO fournisseurs (${columns.join(', ')})
        VALUES (${placeholders.join(', ')})
        RETURNING id
      `;

      try {
        const result = await client.query(query, values);
        insertedCount++;

        // Insérer les données liées si nécessaire
        const fournisseurId = result.rows[0].id;
        
        // Insérer dans la table risque
        if (mappedData.note_risque_financier || mappedData.note_de_conformite) {
          await client.query(
            'INSERT INTO risque (id, note_risque_financier, note_de_conformite) VALUES ($1, $2, $3)',
            [fournisseurId, 
             mappedData.note_risque_financier ? parseInt(mappedData.note_risque_financier) : null,
             mappedData.note_de_conformite ? parseInt(mappedData.note_de_conformite) : null
            ]
          );
        }

        // Insérer dans la table details si des détails sont présents
        if (mappedData.details) {
          await client.query(
            'INSERT INTO details (id, details) VALUES ($1, $2)',
            [fournisseurId, mappedData.details]
          );
        }
      } catch (err) {
        console.error('Erreur lors de l\'insertion:', err);
        console.error('Données problématiques:', mappedData);
        throw err;
      }
    }

    // Réactiver les contraintes de clé étrangère
    await client.query('ALTER TABLE risque ADD CONSTRAINT risque_id_fkey FOREIGN KEY (id) REFERENCES fournisseurs(id) ON DELETE CASCADE');
    await client.query('ALTER TABLE details ADD CONSTRAINT details_id_fkey FOREIGN KEY (id) REFERENCES fournisseurs(id) ON DELETE CASCADE');

    await client.query('COMMIT');

    if (unmappedColumns.size > 0) {
      console.log('Colonnes non mappées:', Array.from(unmappedColumns));
    }

    res.json({ 
      message: 'Import réussi', 
      count: insertedCount,
      unmappedColumns: Array.from(unmappedColumns)
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Erreur lors de l\'import:', err);
    res.status(500).json({ 
      error: 'Erreur lors de l\'import',
      details: err.message,
      unmappedColumns: Array.from(unmappedColumns || [])
    });
  } finally {
    client.release();
  }
});

// Route pour vider la table fournisseurs
router.delete('/clear', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Désactiver les contraintes de clé étrangère
    await client.query('ALTER TABLE risque DROP CONSTRAINT IF EXISTS risque_id_fkey');
    await client.query('ALTER TABLE details DROP CONSTRAINT IF EXISTS details_id_fkey');
    
    // Vider toutes les tables liées
    await client.query('TRUNCATE TABLE risque, details, fournisseurs RESTART IDENTITY');
    
    // Recréer les contraintes de clé étrangère
    await client.query(`
      ALTER TABLE risque 
      ADD CONSTRAINT risque_id_fkey 
      FOREIGN KEY (id) 
      REFERENCES fournisseurs(id) 
      ON DELETE CASCADE
    `);
    
    await client.query(`
      ALTER TABLE details 
      ADD CONSTRAINT details_id_fkey 
      FOREIGN KEY (id) 
      REFERENCES fournisseurs(id) 
      ON DELETE CASCADE
    `);
    
    await client.query('COMMIT');
    res.json({ message: 'Tables vidées avec succès' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erreur détaillée lors du vidage des tables:', error);
    res.status(500).json({ 
      error: 'Erreur lors du vidage des tables',
      details: error.message,
      stack: error.stack 
    });
  } finally {
    client.release();
  }
});

// Créer un groupe et importer des données
router.post('/createGroup', async (req, res) => {
  const { groupName, data, columns } = req.body;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Créer la table avec les colonnes visibles
    const createTableQuery = `
      CREATE TABLE "${groupName}" (
        ${columns.map(col => `"${col}" TEXT`).join(', ')}
      )
    `;
    await client.query(createTableQuery);

    // Insérer les données filtrées
    if (data.length > 0) {
      // Préparer la requête d'insertion par lots de 1000 lignes
      const batchSize = 1000;
      for (let i = 0; i < data.length; i += batchSize) {
        const batch = data.slice(i, i + batchSize);
        
        const values = [];
        const placeholders = [];
        let paramCounter = 1;

        batch.forEach((row) => {
          const rowValues = columns.map(col => row[col] || null);
          values.push(...rowValues);
          const rowPlaceholders = columns.map(() => `$${paramCounter++}`);
          placeholders.push(`(${rowPlaceholders.join(', ')})`);
        });

        const insertQuery = `
          INSERT INTO "${groupName}" (${columns.map(col => `"${col}"`).join(', ')})
          VALUES ${placeholders.join(', ')}
        `;

        await client.query(insertQuery, values);
      }
    }

    await client.query('COMMIT');
    res.json({ success: true, message: 'Groupe créé avec succès' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erreur lors de la création du groupe:', error);
    res.status(500).json({ 
      success: false, 
      message: error.code === '42P07' ? 'Un groupe avec ce nom existe déjà' : 'Erreur lors de la création du groupe',
      details: error.message
    });
  } finally {
    client.release();
  }
});

// Récupérer la liste des groupes
router.get('/groups', async (req, res) => {
  const client = await pool.connect();
  try {
    // D'abord, récupérer la liste des tables
    const tablesResult = await client.query(`
      SELECT table_name
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name != 'fournisseurs'
      AND table_type = 'BASE TABLE'
      AND table_name NOT IN ('pg_stat_statements', 'pg_stat_statements_info')
    `);

    // Ensuite, pour chaque table, récupérer le nombre d'enregistrements
    const groups = [];
    for (const row of tablesResult.rows) {
      try {
        const countResult = await client.query(`
          SELECT COUNT(*) as count 
          FROM "${row.table_name}"
        `);
        
        groups.push({
          name: row.table_name,
          record_count: parseInt(countResult.rows[0].count),
          created_at: new Date().toISOString() // Pour l'instant, on utilise la date actuelle
        });
      } catch (err) {
        console.error(`Erreur lors du comptage pour la table ${row.table_name}:`, err);
        // On continue avec la table suivante
      }
    }
    
    res.json(groups);
  } catch (error) {
    console.error('Erreur lors de la récupération des groupes:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la récupération des groupes',
      details: error.message 
    });
  } finally {
    client.release();
  }
});

// Récupérer les données d'un groupe spécifique
router.get('/groups/:name', async (req, res) => {
  const { name } = req.params;
  const client = await pool.connect();
  try {
    const result = await client.query(`SELECT * FROM "${name}"`);
    res.json(result.rows);
  } catch (error) {
    console.error('Erreur lors de la récupération des données du groupe:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des données du groupe' });
  } finally {
    client.release();
  }
});

// Supprimer un groupe
router.delete('/groups/:name', async (req, res) => {
  const { name } = req.params;
  const client = await pool.connect();
  try {
    await client.query(`DROP TABLE IF EXISTS "${name}"`);
    res.json({ success: true, message: 'Groupe supprimé avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression du groupe:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression du groupe' });
  } finally {
    client.release();
  }
});

// Route pour exporter un groupe en Excel
router.post('/groups/export/excel', async (req, res) => {
  const { groupName } = req.body;
  const client = await pool.connect();
  
  try {
    console.log('Début export Excel pour le groupe:', groupName);

    // Colonnes à cacher
    const hiddenColumns = [
      'details', 
      'Note Risque Financier', 
      'Note de Conformité', 
      'risque_detaille',
      'HUYI MODIFICATION',
      'PARTNERS TRADUCTION',
      'Activity Area',
      'Notation ESG',
      'Santé financière',
      'Risques compliance',
      'Calcul méthode ADEME',
      'Scope 1',
      'Scope 2',
      'Scope 3',
      'Vision gloable',
      'ORGANIZATION 3',
      'ORGANIZATION ZONE',
      'Comments',
      'Adresse fournisseur',
      'Analyse des risques Loi Sapin II'
    ];

    // Récupérer les données du groupe
    const result = await client.query(`SELECT * FROM "${groupName}"`);
    const data = result.rows;
    
    console.log('Nombre de lignes récupérées:', data.length);
    
    if (data.length === 0) {
      throw new Error('Aucune donnée à exporter');
    }

    // Créer un nouveau workbook Excel
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'AppGestionFournisseurs';
    workbook.created = new Date();
    
    const worksheet = workbook.addWorksheet(groupName);

    // Filtrer les colonnes cachées
    const columns = Object.keys(data[0]).filter(col => !hiddenColumns.includes(col));
    console.log('Colonnes détectées (après filtrage):', columns);
    
    worksheet.columns = columns.map(col => ({ 
      header: col, 
      key: col, 
      width: 20,
      style: { font: { bold: true } }
    }));

    // Formater les données pour Excel en excluant les colonnes cachées
    const formattedData = data.map(row => {
      const newRow = {};
      columns.forEach(col => {
        // Convertir les dates en format lisible
        if (row[col] instanceof Date) {
          newRow[col] = row[col].toLocaleString('fr-FR');
        } else {
          newRow[col] = row[col];
        }
      });
      return newRow;
    });

    // Ajouter les données
    worksheet.addRows(formattedData);

    // Appliquer un style aux cellules
    worksheet.eachRow((row, rowNumber) => {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
        cell.alignment = { vertical: 'middle', horizontal: 'left' };
      });
    });

    console.log('Génération du buffer Excel...');
    const buffer = await workbook.xlsx.writeBuffer();
    console.log('Taille du buffer:', buffer.length);

    // Envoyer le fichier
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${groupName}.xlsx"`);
    res.send(buffer);
    console.log('Export Excel terminé avec succès');

  } catch (error) {
    console.error('Erreur lors de l\'export Excel:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de l\'export Excel',
      error: error.message 
    });
  } finally {
    client.release();
  }
});

// Route pour exporter un groupe en CSV
router.post('/groups/export/csv', async (req, res) => {
  const { groupName } = req.body;
  const client = await pool.connect();
  
  try {
    console.log('Début export CSV pour le groupe:', groupName);

    // Colonnes à cacher
    const hiddenColumns = [
      'details', 
      'Note Risque Financier', 
      'Note de Conformité', 
      'risque_detaille',
      'HUYI MODIFICATION',
      'PARTNERS TRADUCTION',
      'Activity Area',
      'Notation ESG',
      'Santé financière',
      'Risques compliance',
      'Calcul méthode ADEME',
      'Scope 1',
      'Scope 2',
      'Scope 3',
      'Vision gloable',
      'ORGANIZATION 3',
      'ORGANIZATION ZONE',
      'Comments',
      'Adresse fournisseur',
      'Analyse des risques Loi Sapin II'
    ];

    // Récupérer les données du groupe
    const result = await client.query(`SELECT * FROM "${groupName}"`);
    const data = result.rows;
    
    console.log('Nombre de lignes récupérées:', data.length);
    
    if (data.length === 0) {
      throw new Error('Aucune donnée à exporter');
    }

    // Formater les données pour CSV en excluant les colonnes cachées
    const formattedData = data.map(row => {
      const newRow = {};
      Object.keys(row).forEach(key => {
        if (!hiddenColumns.includes(key)) {
          if (row[key] instanceof Date) {
            newRow[key] = row[key].toLocaleString('fr-FR');
          } else {
            newRow[key] = row[key];
          }
        }
      });
      return newRow;
    });

    // Options pour la conversion CSV
    const csvOptions = {
      fields: Object.keys(data[0]).filter(col => !hiddenColumns.includes(col)),
      delimiter: ';',  // Utiliser ; comme séparateur pour meilleure compatibilité avec Excel
      quote: '"',      // Utiliser les guillemets doubles pour les champs
      escapedQuote: '""', // Échapper les guillemets dans les champs
      header: true     // Inclure les en-têtes
    };

    console.log('Conversion en CSV...');
    // Convertir en CSV
    const csv = parse(formattedData, csvOptions);
    console.log('Taille du CSV:', csv.length);

    // Ajouter BOM pour Excel
    const csvWithBOM = '\ufeff' + csv;

    // Envoyer le fichier
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${groupName}.csv"`);
    res.send(csvWithBOM);
    console.log('Export CSV terminé avec succès');

  } catch (error) {
    console.error('Erreur lors de l\'export CSV:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de l\'export CSV',
      error: error.message 
    });
  } finally {
    client.release();
  }
});

// Route pour télécharger un fichier temporaire
router.get('/download/:filename', (req, res) => {
  const { filename } = req.params;
  const filePath = path.join(os.tmpdir(), filename);

  res.download(filePath, (err) => {
    if (err) {
      console.error('Erreur lors du téléchargement:', err);
    }
    // Supprimer le fichier temporaire après le téléchargement
    fs.unlink(filePath, (unlinkErr) => {
      if (unlinkErr) {
        console.error('Erreur lors de la suppression du fichier temporaire:', unlinkErr);
      }
    });
  });
});

module.exports = router;
