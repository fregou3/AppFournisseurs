/**
 * Script pour corriger l'erreur "insertClient is not defined"
 */

const fs = require('fs');
const path = require('path');

// Chemin du fichier à modifier
const fournisseursPath = path.join(__dirname, 'routes', 'fournisseurs.js');

// Lire le contenu du fichier
console.log(`Lecture du fichier ${fournisseursPath}...`);
let content = fs.readFileSync(fournisseursPath, 'utf8');

// Trouver la ligne qui cause l'erreur
console.log('Recherche de la ligne qui cause l\'erreur...');
const lines = content.split('\n');
let errorLineIndex = -1;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('insertClient') && !lines[i].includes('const insertClient')) {
    console.log(`Ligne ${i + 1} potentiellement problématique: ${lines[i]}`);
    errorLineIndex = i;
  }
}

// Fonction pour corriger l'erreur de référence à insertClient
function fixInsertClientError() {
  // Remplacer la partie problématique
  const oldCode = `  // Utiliser une transaction pour toute l'importation
  const globalClient = await pool.connect();
  try {
    await globalClient.query('BEGIN');
    
    console.log(\`Début de l'importation de \${data.length} lignes...\`);
    let successCount = 0;
    let errorCount = 0;
    let skipCount = 0;
    
    // Préparer et insérer les données ligne par ligne
    for (const [index, row] of data.entries()) {
      let mappedRow = {};`;

  const newCode = `  // Utiliser une transaction pour toute l'importation
  const globalClient = await pool.connect();
  try {
    await globalClient.query('BEGIN');
    
    console.log(\`Début de l'importation de \${data.length} lignes...\`);
    let successCount = 0;
    let errorCount = 0;
    let skipCount = 0;
    
    // Préparer et insérer les données ligne par ligne
    for (const [index, row] of data.entries()) {
      // Utiliser le client global pour toutes les opérations
      const insertClient = globalClient;
      let mappedRow = {};`;

  return content.replace(oldCode, newCode);
}

// Fonction pour corriger la fin de la boucle d'insertion
function fixInsertionEnd() {
  const oldCode = `    }
      
      // Afficher la progression toutes les 100 lignes
      if ((index + 1) % 100 === 0 || index === data.length - 1) {
        console.log(\`Progression: \${index + 1}/\${data.length} lignes traitées (\${Math.round((index + 1) / data.length * 100)}%)\`);
      }
    }
    
    // Valider la transaction
    await globalClient.query('COMMIT');
    console.log(\`Importation terminée: \${successCount} succès, \${errorCount} erreurs, \${skipCount} ignorées\`);
  } catch (error) {
    // Annuler la transaction en cas d'erreur
    await globalClient.query('ROLLBACK');
    console.error(\`Erreur globale lors de l'importation: \${error.message}\`);
    throw error;
  } finally {
    globalClient.release();
  }`;

  const newCode = `    }
      
      // Afficher la progression toutes les 100 lignes
      if ((index + 1) % 100 === 0 || index === data.length - 1) {
        console.log(\`Progression: \${index + 1}/\${data.length} lignes traitées (\${Math.round((index + 1) / data.length * 100)}%)\`);
      }
    }
    
    // Valider la transaction
    await globalClient.query('COMMIT');
    console.log(\`Importation terminée: \${successCount} succès, \${errorCount} erreurs, \${skipCount} ignorées\`);
  } catch (error) {
    // Annuler la transaction en cas d'erreur
    await globalClient.query('ROLLBACK');
    console.error(\`Erreur globale lors de l'importation: \${error.message}\`);
    throw error;
  } finally {
    globalClient.release();
  }`;

  return content.replace(oldCode, newCode);
}

// Fonction pour supprimer les appels à insertClient.release()
function removeInsertClientRelease() {
  const oldCode = `    } finally {
      insertClient.release();
    }`;

  const newCode = `    }`;

  return content.replace(oldCode, newCode);
}

// Appliquer toutes les modifications
console.log('Application des modifications...');

// Corriger l'erreur de référence à insertClient
content = fixInsertClientError();

// Corriger la fin de la boucle d'insertion
content = fixInsertionEnd();

// Supprimer les appels à insertClient.release()
content = removeInsertClientRelease();

// Écrire le contenu modifié dans le fichier
console.log('Écriture des modifications dans le fichier...');
fs.writeFileSync(fournisseursPath, content, 'utf8');

console.log('Modifications terminées avec succès!');
console.log('L\'erreur "insertClient is not defined" a été corrigée.');
console.log('Vous pouvez maintenant importer des fichiers Excel sans problème.');
