/**
 * Script pour extraire la structure exacte d'une table de la base de données locale
 * et générer un script SQL pour la recréer à l'identique
 * 
 * Usage: node extract_table_structure_simple.js <table_name> [output_file]
 * Exemple: node extract_table_structure_simple.js system_group_metadata create_group_metadata_table.sql
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Récupérer le nom de la table depuis les arguments de la ligne de commande
const tableName = process.argv[2];
const outputFile = process.argv[3] || `create_${tableName}_table.sql`;

if (!tableName) {
  console.error('Veuillez spécifier un nom de table');
  console.error('Usage: node extract_table_structure_simple.js <table_name> [output_file]');
  process.exit(1);
}

// Configuration de la connexion à la base de données
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 5432,
});

async function extractTableStructure(tableName) {
  const client = await pool.connect();
  try {
    console.log(`Connexion à la base de données établie`);
    
    // Vérifier si la table existe
    const checkTableQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = $1
      );
    `;
    
    const tableExists = await client.query(checkTableQuery, [tableName]);
    
    if (!tableExists.rows[0].exists) {
      console.error(`La table "${tableName}" n'existe pas dans la base de données.`);
      return;
    }
    
    // Récupérer la structure des colonnes
    const columnsQuery = `
      SELECT 
        column_name, 
        data_type,
        character_maximum_length,
        column_default,
        is_nullable,
        pg_catalog.col_description(
          ('"' || table_name || '"')::regclass::oid, 
          ordinal_position
        ) as column_description
      FROM 
        information_schema.columns
      WHERE 
        table_name = $1
      ORDER BY 
        ordinal_position;
    `;
    
    const columnsResult = await client.query(columnsQuery, [tableName]);
    
    // Récupérer les contraintes
    const constraintsQuery = `
      SELECT
        tc.constraint_name,
        tc.constraint_type,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM
        information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        LEFT JOIN information_schema.constraint_column_usage ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
      WHERE
        tc.table_name = $1
      ORDER BY
        tc.constraint_name,
        kcu.column_name;
    `;
    
    const constraintsResult = await client.query(constraintsQuery, [tableName]);
    
    // Récupérer les index
    const indexesQuery = `
      SELECT
        indexname,
        indexdef
      FROM
        pg_indexes
      WHERE
        tablename = $1
      ORDER BY
        indexname;
    `;
    
    const indexesResult = await client.query(indexesQuery, [tableName]);
    
    // Récupérer le commentaire de la table
    const tableCommentQuery = `
      SELECT
        obj_description(('"' || $1 || '"')::regclass::oid) as table_comment;
    `;
    
    const tableCommentResult = await client.query(tableCommentQuery, [tableName]);
    
    // Construire le script SQL
    let sqlScript = `-- Script pour recréer la table ${tableName} à l'identique de la table locale
-- Généré automatiquement le ${new Date().toISOString()}

-- Supprimer la table et ses dépendances si elle existe
DROP TABLE IF EXISTS ${tableName} CASCADE;

-- Recréer la table avec la définition complète
CREATE TABLE ${tableName} (
`;
    
    // Ajouter les colonnes
    columnsResult.rows.forEach((column, index) => {
      let columnDef = `  ${column.column_name} ${column.data_type}`;
      
      // Ajouter la longueur pour les types character varying
      if (column.character_maximum_length) {
        columnDef += `(${column.character_maximum_length})`;
      }
      
      // Ajouter la valeur par défaut
      if (column.column_default) {
        columnDef += ` DEFAULT ${column.column_default}`;
      }
      
      // Ajouter la contrainte NOT NULL
      if (column.is_nullable === 'NO') {
        columnDef += ' NOT NULL';
      }
      
      // Ajouter une virgule si ce n'est pas la dernière colonne
      if (index < columnsResult.rows.length - 1) {
        columnDef += ',';
      }
      
      sqlScript += columnDef + '\n';
    });
    
    // Ajouter les contraintes de clé primaire
    const primaryKeyConstraints = constraintsResult.rows.filter(constraint => constraint.constraint_type === 'PRIMARY KEY');
    if (primaryKeyConstraints.length > 0) {
      // Regrouper les colonnes par contrainte
      const primaryKeyColumns = {};
      primaryKeyConstraints.forEach(constraint => {
        if (!primaryKeyColumns[constraint.constraint_name]) {
          primaryKeyColumns[constraint.constraint_name] = [];
        }
        primaryKeyColumns[constraint.constraint_name].push(constraint.column_name);
      });
      
      // Ajouter chaque contrainte de clé primaire
      Object.entries(primaryKeyColumns).forEach(([constraintName, columns]) => {
        sqlScript += `,\n  CONSTRAINT ${constraintName} PRIMARY KEY (${columns.join(', ')})`;
      });
    }
    
    // Fermer la définition de la table
    sqlScript += '\n);\n\n';
    
    // Ajouter les index
    indexesResult.rows.forEach(index => {
      // Ne pas ajouter les index de clé primaire qui sont déjà créés avec la table
      if (!index.indexname.endsWith('_pkey')) {
        sqlScript += `${index.indexdef};\n`;
      }
    });
    
    // Ajouter le commentaire de la table
    if (tableCommentResult.rows[0].table_comment) {
      sqlScript += `\n-- Commentaire sur la table\nCOMMENT ON TABLE ${tableName} IS '${tableCommentResult.rows[0].table_comment.replace(/'/g, "''")}';\n`;
    }
    
    // Ajouter les commentaires sur les colonnes
    sqlScript += '\n-- Commentaires sur les colonnes\n';
    columnsResult.rows.forEach(column => {
      if (column.column_description) {
        sqlScript += `COMMENT ON COLUMN ${tableName}.${column.column_name} IS '${column.column_description.replace(/'/g, "''")}';\n`;
      }
    });
    
    // Récupérer les données de la table
    const dataQuery = `
      SELECT * FROM ${tableName};
    `;
    
    const dataResult = await client.query(dataQuery);
    
    // Ajouter les données
    if (dataResult.rows.length > 0) {
      sqlScript += '\n-- Données de la table\n';
      
      dataResult.rows.forEach(row => {
        const columns = Object.keys(row);
        const values = columns.map(column => {
          const value = row[column];
          if (value === null) return 'NULL';
          if (typeof value === 'string') return `'${value.replace(/'/g, "''")}'`;
          if (typeof value === 'object') return `'${JSON.stringify(value).replace(/'/g, "''")}'`;
          return value;
        });
        
        sqlScript += `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${values.join(', ')});\n`;
      });
    }
    
    // Ajouter un message de confirmation
    sqlScript += `
-- Afficher un message de confirmation
DO $$
BEGIN
    RAISE NOTICE 'Table ${tableName} supprimée et recréée avec succès.';
END $$;
`;
    
    // Écrire le script SQL dans un fichier
    fs.writeFileSync(outputFile, sqlScript);
    
    console.log(`Script SQL généré avec succès dans le fichier "${outputFile}".`);
    console.log(`Ce script va créer une table ${tableName} identique à celle de votre base de données locale.`);
    
  } catch (error) {
    console.error('Erreur lors de l\'extraction de la structure de la table:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

// Exécuter la fonction principale
extractTableStructure(tableName).catch(err => {
  console.error('Erreur non gérée:', err);
  process.exit(1);
});
