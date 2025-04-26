const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

// Configuration de la connexion à la base de données
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function fixDuplicateColumns() {
  const client = await pool.connect();
  try {
    console.log('Vérification et correction des colonnes dupliquées...');
    
    // Récupérer les colonnes de la table fournisseurs
    const columnsResult = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'fournisseurs'
      ORDER BY ordinal_position;
    `);
    
    const columns = columnsResult.rows.map(row => row.column_name);
    console.log('Colonnes dans la table fournisseurs:');
    console.log(columns);
    
    // Vérifier les colonnes dupliquées dans le mapping
    console.log('\nVérification des colonnes dupliquées dans le mapping...');
    
    // Vérifier si la table column_mapping existe
    const mappingTableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'column_mapping'
      );
    `);
    
    if (mappingTableExists.rows[0].exists) {
      const mappingResult = await client.query(`
        SELECT frontend_column, backend_column 
        FROM column_mapping 
        WHERE backend_column IS NOT NULL
      `);
      
      // Créer un dictionnaire inversé pour trouver les doublons
      const backendToFrontend = {};
      const duplicates = [];
      
      mappingResult.rows.forEach(row => {
        const backend = row.backend_column;
        if (backendToFrontend[backend]) {
          backendToFrontend[backend].push(row.frontend_column);
          duplicates.push(backend);
        } else {
          backendToFrontend[backend] = [row.frontend_column];
        }
      });
      
      // Afficher les colonnes dupliquées
      const uniqueDuplicates = [...new Set(duplicates)];
      if (uniqueDuplicates.length > 0) {
        console.log('Colonnes backend dupliquées trouvées:');
        uniqueDuplicates.forEach(backend => {
          console.log(`- ${backend} est mappé depuis: ${backendToFrontend[backend].join(', ')}`);
        });
      } else {
        console.log('Aucune colonne dupliquée trouvée dans le mapping.');
      }
    } else {
      console.log('La table column_mapping n\'existe pas.');
    }
    
    // Créer une fonction pour déduplicater les colonnes
    console.log('\nCréation d\'une fonction pour déduplicater les colonnes...');
    
    await client.query(`
      CREATE OR REPLACE FUNCTION public.deduplicate_columns(columns text[])
      RETURNS text[] AS $$
      DECLARE
        result text[] := '{}';
        seen text[] := '{}';
        col text;
      BEGIN
        FOREACH col IN ARRAY columns
        LOOP
          IF NOT col = ANY(seen) THEN
            result := array_append(result, col);
            seen := array_append(seen, col);
          END IF;
        END LOOP;
        RETURN result;
      END;
      $$ LANGUAGE plpgsql;
    `);
    
    console.log('Fonction deduplicate_columns créée avec succès.');
    
    // Mettre à jour le fichier utils/column-mapper.js dans le frontend
    console.log('\nMise à jour du fichier column-mapper.js dans le frontend...');
    
    const fs = require('fs');
    const columnMapperPath = path.join(__dirname, '..', 'frontend', 'src', 'utils', 'column-mapper.js');
    
    if (fs.existsSync(columnMapperPath)) {
      // Lire le fichier existant
      let content = fs.readFileSync(columnMapperPath, 'utf8');
      
      // Ajouter une fonction pour déduplicater les colonnes
      const deduplicateFunction = `
// Fonction pour déduplicater les colonnes
function deduplicateColumns(columns) {
  if (!columns || !Array.isArray(columns)) return columns;
  
  const seen = new Set();
  return columns.filter(col => {
    // Si la colonne a déjà été vue, la filtrer
    if (seen.has(col.toLowerCase())) {
      console.warn(\`Colonne dupliquée ignorée: \${col}\`);
      return false;
    }
    
    // Sinon, l'ajouter à l'ensemble des colonnes vues
    seen.add(col.toLowerCase());
    return true;
  });
}
`;
      
      // Ajouter la fonction avant l'export
      const exportLine = '// Exporter les fonctions\nexport { correctColumnNames, correctFilters };';
      const newExportLine = '// Exporter les fonctions\nexport { correctColumnNames, correctFilters, deduplicateColumns };';
      
      content = content.replace(exportLine, `${deduplicateFunction}\n${newExportLine}`);
      
      // Mettre à jour la fonction correctColumnNames pour utiliser deduplicateColumns
      const correctColumnNamesFunction = `// Fonction pour corriger les noms de colonnes dans les requêtes
function correctColumnNames(columns) {
  if (!columns || !Array.isArray(columns)) return columns;
  
  return columns.filter(col => {
    // Si la colonne est dans le mapping et a une valeur null, elle n'existe pas
    if (columnMapping[col] === null) {
      console.warn(\`La colonne \${col} n'existe pas dans la base de données et sera ignorée\`);
      return false;
    }
    return true;
  }).map(col => {
    // Si la colonne est dans le mapping, utiliser le nom correct
    if (columnMapping[col]) {
      console.log(\`Correction du nom de colonne: \${col} -> \${columnMapping[col]}\`);
      return columnMapping[col];
    }
    return col;
  });
}`;
      
      const newCorrectColumnNamesFunction = `// Fonction pour corriger les noms de colonnes dans les requêtes
function correctColumnNames(columns) {
  if (!columns || !Array.isArray(columns)) return columns;
  
  // Étape 1: Filtrer les colonnes inexistantes
  const filteredColumns = columns.filter(col => {
    // Si la colonne est dans le mapping et a une valeur null, elle n'existe pas
    if (columnMapping[col] === null) {
      console.warn(\`La colonne \${col} n'existe pas dans la base de données et sera ignorée\`);
      return false;
    }
    return true;
  });
  
  // Étape 2: Corriger les noms de colonnes
  const correctedColumns = filteredColumns.map(col => {
    // Si la colonne est dans le mapping, utiliser le nom correct
    if (columnMapping[col]) {
      console.log(\`Correction du nom de colonne: \${col} -> \${columnMapping[col]}\`);
      return columnMapping[col];
    }
    return col;
  });
  
  // Étape 3: Déduplicater les colonnes
  return deduplicateColumns(correctedColumns);
}`;
      
      content = content.replace(correctColumnNamesFunction, newCorrectColumnNamesFunction);
      
      // Écrire le fichier mis à jour
      fs.writeFileSync(columnMapperPath, content);
      console.log('Fichier column-mapper.js mis à jour avec succès.');
    } else {
      console.log('Le fichier column-mapper.js n\'existe pas.');
    }
    
    // Mettre à jour le fichier routes/groups.js dans le backend
    console.log('\nMise à jour du fichier routes/groups.js dans le backend...');
    
    const groupsPath = path.join(__dirname, 'routes', 'groups.js');
    
    if (fs.existsSync(groupsPath)) {
      // Lire le fichier existant
      let content = fs.readFileSync(groupsPath, 'utf8');
      
      // Mettre à jour la construction de la requête SQL pour déduplicater les colonnes
      const sqlConstruction = `    // Sélectionner toutes les colonnes ou seulement celles spécifiées
    if (visibleColumns && visibleColumns.length > 0) {
      sql += visibleColumns.map(col => \`"\${col}"\`).join(', ');
    } else {
      sql += '*';
    }`;
      
      const newSqlConstruction = `    // Sélectionner toutes les colonnes ou seulement celles spécifiées
    if (visibleColumns && visibleColumns.length > 0) {
      // Déduplicater les colonnes pour éviter l'erreur "column specified more than once"
      const uniqueColumns = [...new Set(visibleColumns)];
      sql += uniqueColumns.map(col => \`"\${col}"\`).join(', ');
    } else {
      sql += '*';
    }`;
      
      content = content.replace(sqlConstruction, newSqlConstruction);
      
      // Écrire le fichier mis à jour
      fs.writeFileSync(groupsPath, content);
      console.log('Fichier routes/groups.js mis à jour avec succès.');
    } else {
      console.log('Le fichier routes/groups.js n\'existe pas.');
    }
    
    console.log('\nVérification et correction terminées avec succès.');
    
  } catch (err) {
    console.error('Erreur lors de la correction des colonnes dupliquées:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

fixDuplicateColumns();
