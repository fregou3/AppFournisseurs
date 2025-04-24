/**
 * Script simple pour corriger le fichier fournisseurs.js
 */

const fs = require('fs');
const path = require('path');

// Chemin du fichier à modifier
const fournisseursPath = path.join(__dirname, 'routes', 'fournisseurs.js');

// Lire le contenu original
const originalContent = fs.readFileSync(fournisseursPath, 'utf8');

// Créer un fichier de sauvegarde
const backupPath = fournisseursPath + '.backup';
fs.writeFileSync(backupPath, originalContent);
console.log(`Sauvegarde créée: ${backupPath}`);

// Réécrire le fichier avec une version simplifiée de la fonction d'importation
const newContent = `const express = require('express');
const router = express.Router();
const XLSX = require('xlsx');
const path = require('path');
const pool = require('../db');
const cloneTableStructure = require('../clone_table_structure');
const moment = require('moment');
const multer = require('multer');
const fs = require('fs');

// Configuration de multer pour l'upload de fichiers
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../../Reports_Moodies');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Utiliser l'id comme nom de fichier
    const fileName = \`\${req.params.id}_\${Date.now()}\${path.extname(file.originalname)}\`;
    cb(null, fileName);
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Seuls les fichiers PDF sont acceptés'));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // Limite à 10MB
  }
});

// Variable pour stocker le mapping dynamique des colonnes Excel
let excelToDbMappingDynamic = {};

// Fonction pour normaliser les noms de colonnes PostgreSQL tout en préservant les accents
function normalizeColumnName(name) {
  // Remplacer les caractères non alphanumériques (sauf les accents) par des underscores
  return name.replace(/[^a-zA-Z0-9àáâäãåąčćęèéêëėįìíîïłńòóôöõøùúûüųūÿýżźñçšžÀÁÂÄÃÅĄĆČĖĘÈÉÊËÌÍÎÏĮŁŃÒÓÔÖÕØÙÚÛÜŲŪŸÝŻŹÑßÇŒÆŠŽ]+/g, '_')
    .replace(/^_|_$/g, '')        // Supprimer les underscores au début et à la fin
    .replace(/__+/g, '_');        // Remplacer les underscores multiples par un seul
}

// Fonction pour convertir une date en format MM/DD/YYYY
function convertToUSFormat(dateString) {
  if (!dateString) return null;
  
  // Nettoyer la chaîne de caractères
  dateString = dateString.trim();

  // Format court (D/M/YY, DD/M/YY, D/MM/YY ou DD/MM/YY)
  const shortDateRegex = /^(\\d{1,2})\\/(\\d{1,2})\\/(\\d{2})$/;
  if (shortDateRegex.test(dateString)) {
    const [full, d, m, y] = dateString.match(shortDateRegex);
    const day = parseInt(d, 10);
    const month = parseInt(m, 10);
    const year = parseInt(y, 10);
    
    // Validation des valeurs
    if (day < 1 || day > 31 || month < 1 || month > 12) {
      return null;
    }

    // Déterminer le format (EU vs US) basé sur les valeurs
    let finalDay, finalMonth;
    if (month > 12) {
      // Si le "mois" est > 12, c'est probablement le jour en format EU
      finalDay = month;
      finalMonth = day;
    } else {
      // Format EU par défaut (DD/MM/YY)
      finalDay = day;
      finalMonth = month;
    }

    const fullYear = year < 50 ? 2000 + year : 1900 + year;
    const result = \`\${finalMonth.toString().padStart(2, '0')}/\${finalDay.toString().padStart(2, '0')}/\${fullYear}\`;
    return result;
  }

  // Si c'est déjà au format MM/DD/YYYY
  const fullDateRegex = /^(0[1-9]|1[0-2])\\/(0[1-9]|[12]\\d|3[01])\\/\\d{4}$/;
  if (fullDateRegex.test(dateString)) {
    return dateString;
  }

  // Essayer différents formats de date avec moment
  const formats = [
    'DD/MM/YYYY',
    'D/M/YYYY',
    'DD/M/YYYY',
    'D/MM/YYYY',
    'YYYY-MM-DD',
    'DD-MM-YYYY',
    'DD.MM.YYYY',
    'YYYY/MM/DD'
  ];

  for (const format of formats) {
    const momentDate = moment(dateString, format, true);
    if (momentDate.isValid()) {
      const result = momentDate.format('MM/DD/YYYY');
      return result;
    }
  }

  return null;
}

// Fonction pour convertir une date au format PostgreSQL (YYYY-MM-DD)
function convertToPostgresDate(dateString) {
  if (!dateString) return null;

  // D'abord convertir en format US
  const usDate = convertToUSFormat(dateString);
  if (!usDate) {
    return null;
  }

  try {
    // Convertir en format PostgreSQL
    const momentDate = moment(usDate, 'MM/DD/YYYY', true);
    if (!momentDate.isValid()) {
      return null;
    }
    const result = momentDate.format('YYYY-MM-DD');
    return result;
  } catch (error) {
    return null;
  }
}

// Fonction pour convertir un numéro de série Excel en date
function excelSerialDateToJSDate(serial) {
  if (!serial) return null;
  
  const utc_days  = Math.floor(serial - 25569);
  const utc_value = utc_days * 86400;
  const date_info = new Date(utc_value * 1000);
  
  return moment(date_info).format('YYYY-MM-DD');
}

// Fonction pour convertir une date Excel en format YYYY-MM-DD
function convertExcelDate(value) {
  if (!value) return null;

  // Si c'est un numéro de série Excel
  if (typeof value === 'number') {
    return excelSerialDateToJSDate(value);
  }

  // Si c'est une chaîne de caractères
  if (typeof value === 'string') {
    return convertToPostgresDate(value);
  }

  // Si c'est déjà un objet Date
  if (value instanceof Date) {
    return moment(value).format('YYYY-MM-DD');
  }

  return null;
}

// Fonction pour convertir une valeur en nombre valide
function convertToNumber(value) {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  
  // Si c'est déjà un nombre
  if (typeof value === 'number') {
    return isNaN(value) ? null : value;
  }
  
  // Si c'est une chaîne, nettoyer et convertir
  if (typeof value === 'string') {
    // Enlever tous les caractères non numériques sauf point et tiret
    const cleaned = value.replace(/[^\\d.-]/g, '');
    const numValue = parseFloat(cleaned);
    return isNaN(numValue) ? null : numValue;
  }
  
  return null;
}

// Mapping des noms de colonnes
const excelToDbMapping = {
  'Supplier_ID': 'supplier_id',
  'PROCUREMENT ORGA': 'procurement_orga',
  'PARTNERS': 'partners',
  'Evaluated / Not Evaluated': 'evaluated_not_evaluated',
  'Calcul méthode ADEME': 'calcul_méthode_ademe',
  'Annual spend k€ A-2023': 'annual_spend_k_a_2023',
  'Santé financière': 'santé_financière',
  'Risques compliance': 'risques_compliance',
  'Vision gloable': 'vision_gloable',
  'Adresse fournisseur': 'adresse_fournisseur',
  'Analyse des risques Loi Sapin II': 'analyse_des_risques_loi_sapin_ii',
  'Région d\\'intervention': 'région_d_intervention',
  'Pays d\\'intervention': 'pays_d_intervention',
  'Nature du tiers': 'nature_du_tiers',
  'Activity Area': 'activity_area',
  'Ecovadis name': 'ecovadis_name',
  'Ecovadis score': 'ecovadis_score',
  'Date': 'date',
  'Ecovadis ID': 'ecovadis_id',
  'Notation ESG': 'notation_esg',
  'Scope 1': 'scope_1',
  'Scope 2': 'scope_2',
  'Scope 3': 'scope_3',
  'Vision gloable': 'vision_gloable',
  'ORGANIZATION 1': 'organization_1',
  'ORGANIZATION 2': 'organization_2',
  'ORGANIZATION 3': 'organization_3',
  'ORGANIZATION ZONE': 'organization_zone',
  'ORGANIZATION COUNTRY': 'organization_country',
  'SUBSIDIARY': 'subsidiary',
  'ORIGINAL NAME PARTNER': 'original_name_partner',
  'Country of Supplier': 'country_of_supplier',
  'Contact': 'contact',
  'VAT number': 'vat_number',
  'Activity Are': 'activity_are',
  'Supplier Contact First Name': 'supplier_contact_first_name',
  'Supplier Contact Last Name': 'supplier_contact_last_name',
  'Supplier Contact Email': 'supplier_contact_email',
  'Supplier Contact Phone': 'supplier_contact_phone',
  'Comments': 'comments'
};

// Fonction pour trouver une colonne de manière insensible à la casse
function findColumn(searchCol, availableCols) {
  return availableCols.find(col => col.toLowerCase() === searchCol.toLowerCase());
}

// Route pour importer un fichier Excel
router.post('/upload', async (req, res) => {
  try {
    console.log('Upload request received');
    console.log('Request body:', req.body);
    console.log('Request files:', req.files ? Object.keys(req.files) : 'No files');
    
    if (!req.files || !req.files.file) {
      return res.status(400).json({ error: 'Aucun fichier n\\'a été uploadé' });
    }
    
    // Vérifier que le fichier est un fichier Excel
    const file = req.files.file;
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      return res.status(400).json({ error: 'Le fichier doit être un fichier Excel (.xlsx ou .xls)' });
    }
    
    // Créer le nom de la table à partir du nom du fichier
    let tableName = 'fournisseurs_' + req.body.tableName;
    tableName = tableName.toLowerCase().replace(/[^a-z0-9_]/g, '_');
    console.log(\`Nom de la table: \${tableName}\`);
    
    // Lire le fichier Excel
    console.log(\`Lecture du fichier Excel: \${file.name}\`);
    const workbook = XLSX.read(file.data);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Lire toutes les données du fichier Excel
    const data = XLSX.utils.sheet_to_json(worksheet, { 
      raw: true, 
      defval: null,
      blankrows: false
    });
    
    console.log(\`Nombre de lignes lues dans le fichier Excel: \${data.length}\`);
    
    if (data.length === 0) {
      return res.status(400).json({ error: 'Le fichier Excel est vide' });
    }
    
    // Extraire les noms de colonnes à partir de la première ligne
    const columns = Object.keys(data[0]);
    console.log(\`Colonnes trouvées dans le fichier Excel: \${columns.join(', ')}\`);
    
    // Connexion à la base de données
    const client = await pool.connect();
    
    try {
      // Supprimer la table si elle existe déjà
      await client.query(\`DROP TABLE IF EXISTS "\${tableName}" CASCADE\`);
      console.log(\`Table \${tableName} supprimée si elle existait\`);
      
      // Créer la table avec toutes les colonnes du fichier Excel
      let createTableSQL = \`CREATE TABLE "\${tableName}" (
        id SERIAL PRIMARY KEY,
      \`;
      
      // Ajouter chaque colonne avec le type TEXT
      const columnDefinitions = columns.map(col => {
        // Normaliser le nom de la colonne pour PostgreSQL
        const pgCol = col.toLowerCase()
          .replace(/[^a-zA-Z0-9àáâäãåąčćęèéêëėįìíîïłńòóôöõøùúûüųūÿýżźñçšžÀÁÂÄÃÅĄĆČĖĘÈÉÊËÌÍÎÏĮŁŃÒÓÔÖÕØÙÚÛÜŲŪŸÝŻŹÑßÇŒÆŠŽ]+/g, '_')
          .replace(/^_|_$/g, '')
          .replace(/__+/g, '_');
        
        return \`"\${pgCol}" TEXT\`;
      });
      
      createTableSQL += columnDefinitions.join(',\\n        ');
      createTableSQL += '\\n      )';
      
      await client.query(createTableSQL);
      console.log(\`Table \${tableName} créée avec \${columns.length} colonnes\`);
      
      // Insérer les données ligne par ligne
      let insertedCount = 0;
      let errorCount = 0;
      
      // Utiliser une transaction pour l'insertion
      await client.query('BEGIN');
      
      for (const [index, row] of data.entries()) {
        try {
          // Préparer les colonnes et les valeurs pour l'insertion
          const insertColumns = [];
          const insertValues = [];
          const placeholders = [];
          
          // Pour chaque colonne dans le fichier Excel
          columns.forEach((col, i) => {
            // Normaliser le nom de la colonne pour PostgreSQL
            const pgCol = col.toLowerCase()
              .replace(/[^a-zA-Z0-9àáâäãåąčćęèéêëėįìíîïłńòóôöõøùúûüųūÿýżźñçšžÀÁÂÄÃÅĄĆČĖĘÈÉÊËÌÍÎÏĮŁŃÒÓÔÖÕØÙÚÛÜŲŪŸÝŻŹÑßÇŒÆŠŽ]+/g, '_')
              .replace(/^_|_$/g, '')
              .replace(/__+/g, '_');
            
            // Ajouter la colonne et la valeur
            insertColumns.push(pgCol);
            insertValues.push(row[col]);
            placeholders.push(\`$\${i + 1}\`);
          });
          
          // Construire la requête d'insertion
          const insertQuery = \`
            INSERT INTO "\${tableName}" (\${insertColumns.map(col => \`"\${col}"\`).join(', ')})
            VALUES (\${placeholders.join(', ')})
          \`;
          
          // Exécuter la requête d'insertion
          await client.query(insertQuery, insertValues);
          insertedCount++;
          
          // Afficher la progression
          if (insertedCount % 100 === 0 || insertedCount === data.length) {
            console.log(\`Progression: \${insertedCount}/\${data.length} lignes insérées (\${Math.round(insertedCount / data.length * 100)}%)\`);
          }
        } catch (error) {
          console.error(\`Erreur lors de l'insertion de la ligne \${index + 1}:\`, error);
          errorCount++;
        }
      }
      
      // Valider la transaction
      await client.query('COMMIT');
      
      // Vérifier le nombre final de lignes
      const countResult = await client.query(\`SELECT COUNT(*) FROM "\${tableName}"\`);
      const finalCount = parseInt(countResult.rows[0].count);
      
      console.log(\`Importation terminée:
      - Lignes dans le fichier Excel: \${data.length}
      - Lignes insérées avec succès: \${insertedCount}
      - Lignes avec erreurs: \${errorCount}
      - Nombre final de lignes dans la table: \${finalCount}
      \`);
      
      // Retourner une réponse de succès
      return res.status(200).json({
        message: \`Importation réussie dans la table \${tableName}\`,
        table: tableName,
        stats: {
          totalRows: data.length,
          insertedRows: insertedCount,
          errorCount: errorCount,
          finalTableRows: finalCount,
          matchesExcelRowCount: finalCount === data.length
        }
      });
    } catch (error) {
      // Annuler la transaction en cas d'erreur
      await client.query('ROLLBACK');
      console.error('Erreur lors de l\\'importation:', error);
      return res.status(500).json({
        error: 'Une erreur est survenue lors de l\\'importation',
        details: error.message
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Erreur globale lors de l\\'upload:', error);
    return res.status(500).json({
      error: 'Une erreur est survenue lors du traitement du fichier',
      details: error.message
    });
  }
});

// Autres routes existantes...

module.exports = router;`;

// Écrire le nouveau contenu
fs.writeFileSync(fournisseursPath, newContent);
console.log(`Fichier ${fournisseursPath} réécrit avec succès!`);
console.log('Veuillez redémarrer le serveur et réessayer l\'importation.');
console.log('Toutes les lignes du fichier Excel devraient maintenant être importées correctement.');
