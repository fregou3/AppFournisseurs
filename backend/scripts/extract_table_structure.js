/**
 * Script pour extraire la structure exacte d'une table de la base de données locale
 * et générer un script SQL pour la recréer à l'identique
 * 
 * Usage: node extract_table_structure.js <table_name> [output_file]
 * Exemple: node extract_table_structure.js system_group_metadata create_group_metadata_table.sql
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
  console.error('Usage: node extract_table_structure.js <table_name> [output_file]');
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
    
    // Récupérer la définition de la table
    const tableDefQuery = `
      SELECT 
        pg_get_tabledef($1) as table_def;
    `;
    
    // Créer la fonction pg_get_tabledef si elle n'existe pas
    await client.query(`
      CREATE OR REPLACE FUNCTION pg_get_tabledef(p_table_name varchar)
      RETURNS text AS
      $BODY$
      DECLARE
        v_table_ddl   text;
        column_record record;
        table_rec     record;
        constraint_rec record;
        firstrec      boolean;
      BEGIN
        FOR table_rec IN
          SELECT c.relname as table_name,
                 n.nspname as schema_name
          FROM pg_catalog.pg_class c
          LEFT JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
          WHERE relkind = 'r'
            AND relname = p_table_name
            AND n.nspname NOT IN ('pg_catalog', 'information_schema')
        LOOP
          v_table_ddl:= 'DROP TABLE IF EXISTS ' || table_rec.schema_name || '.' || table_rec.table_name || ' CASCADE;'
                     || chr(10) || chr(10)
                     || 'CREATE TABLE ' || table_rec.schema_name || '.' || table_rec.table_name || ' (' || chr(10);
          
          firstrec := true;
          
          -- Colonnes
          FOR column_record IN
            SELECT a.attname as column_name,
                   pg_catalog.format_type(a.atttypid, a.atttypmod) as data_type,
                   CASE WHEN a.attnotnull = true THEN 'NOT NULL' ELSE 'NULL' END as nullable,
                   CASE WHEN adef.adsrc IS NOT NULL THEN 'DEFAULT ' || adef.adsrc ELSE '' END as default_value
            FROM pg_catalog.pg_attribute a
            LEFT JOIN pg_catalog.pg_attrdef adef ON a.attrelid = adef.adrelid AND a.attnum = adef.adnum
            WHERE a.attrelid = (table_rec.schema_name || '.' || table_rec.table_name)::regclass
              AND a.attnum > 0
              AND NOT a.attisdropped
            ORDER BY a.attnum
          LOOP
            IF NOT firstrec THEN
              v_table_ddl:= v_table_ddl || ',' || chr(10);
            END IF;
            firstrec := false;
            
            v_table_ddl:= v_table_ddl || '  ' || column_record.column_name || ' ' || column_record.data_type || ' ' || column_record.nullable || ' ' || column_record.default_value;
          END LOOP;
          
          -- Contraintes de clé primaire
          FOR constraint_rec IN
            SELECT conname as constraint_name,
                   pg_catalog.pg_get_constraintdef(r.oid, true) as constraint_def
            FROM pg_catalog.pg_constraint r
            WHERE r.conrelid = (table_rec.schema_name || '.' || table_rec.table_name)::regclass
              AND r.contype = 'p'
          LOOP
            v_table_ddl:= v_table_ddl || ',' || chr(10) || '  CONSTRAINT ' || constraint_rec.constraint_name || ' ' || constraint_rec.constraint_def;
          END LOOP;
          
          v_table_ddl:= v_table_ddl || chr(10) || ');' || chr(10);
          
          -- Index
          FOR constraint_rec IN
            SELECT indexrelid::regclass as index_name,
                   pg_catalog.pg_get_indexdef(indexrelid) as index_def
            FROM pg_catalog.pg_index
            WHERE indrelid = (table_rec.schema_name || '.' || table_rec.table_name)::regclass
              AND indisprimary = false
          LOOP
            v_table_ddl:= v_table_ddl || chr(10) || constraint_rec.index_def || ';';
          END LOOP;
          
          -- Commentaires sur la table
          FOR constraint_rec IN
            SELECT pg_catalog.obj_description(c.oid) as table_comment
            FROM pg_catalog.pg_class c
            WHERE c.relname = table_rec.table_name
              AND c.relkind = 'r'
              AND pg_catalog.obj_description(c.oid) IS NOT NULL
          LOOP
            v_table_ddl:= v_table_ddl || chr(10) || chr(10) || 'COMMENT ON TABLE ' || table_rec.schema_name || '.' || table_rec.table_name || ' IS ' || quote_literal(constraint_rec.table_comment) || ';';
          END LOOP;
          
          -- Commentaires sur les colonnes
          FOR constraint_rec IN
            SELECT a.attname as column_name,
                   pg_catalog.col_description(a.attrelid, a.attnum) as column_comment
            FROM pg_catalog.pg_attribute a
            WHERE a.attrelid = (table_rec.schema_name || '.' || table_rec.table_name)::regclass
              AND a.attnum > 0
              AND NOT a.attisdropped
              AND pg_catalog.col_description(a.attrelid, a.attnum) IS NOT NULL
          LOOP
            v_table_ddl:= v_table_ddl || chr(10) || 'COMMENT ON COLUMN ' || table_rec.schema_name || '.' || table_rec.table_name || '.' || constraint_rec.column_name || ' IS ' || quote_literal(constraint_rec.column_comment) || ';';
          END LOOP;
          
        END LOOP;
        
        RETURN v_table_ddl;
      END;
      $BODY$
      LANGUAGE plpgsql VOLATILE;
    `);
    
    // Récupérer la définition de la table
    const tableDef = await client.query(tableDefQuery, [tableName]);
    
    if (!tableDef.rows[0] || !tableDef.rows[0].table_def) {
      console.error(`Impossible de récupérer la définition de la table "${tableName}".`);
      return;
    }
    
    // Récupérer les données de la table
    const dataQuery = `
      SELECT * FROM ${tableName};
    `;
    
    const data = await client.query(dataQuery);
    
    // Générer les instructions INSERT
    let insertStatements = '';
    if (data.rows.length > 0) {
      insertStatements = '\n\n-- Données de la table\n';
      
      for (const row of data.rows) {
        const columns = Object.keys(row).join(', ');
        const values = Object.values(row).map(value => {
          if (value === null) return 'NULL';
          if (typeof value === 'string') return `'${value.replace(/'/g, "''")}'`;
          if (typeof value === 'object') return `'${JSON.stringify(value).replace(/'/g, "''")}'`;
          return value;
        }).join(', ');
        
        insertStatements += `INSERT INTO ${tableName} (${columns}) VALUES (${values});\n`;
      }
    }
    
    // Construire le script SQL complet
    const sqlScript = `-- Script pour recréer la table ${tableName} à l'identique de la table locale
-- Généré automatiquement le ${new Date().toISOString()}

${tableDef.rows[0].table_def}
${insertStatements}
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
