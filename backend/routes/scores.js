const express = require('express');
const router = express.Router();
const { exec } = require('child_process');
const path = require('path');

// Endpoint pour calculer les scores d'une table
router.post('/calculate/:tableName', (req, res) => {
  const { tableName } = req.params;
  
  if (!tableName) {
    return res.status(400).json({ error: 'Nom de table requis' });
  }
  
  console.log(`Demande de calcul des scores pour la table: ${tableName}`);
  
  // Chemin vers le script de calcul des scores
  const scriptPath = path.join(__dirname, '..', 'calculate_scores.js');
  
  // Exécuter le script avec le nom de la table en paramètre
  const process = exec(`node "${scriptPath}" ${tableName}`, (error, stdout, stderr) => {
    if (error) {
      console.error(`Erreur lors de l'exécution du script: ${error.message}`);
      return res.status(500).json({ 
        error: 'Erreur lors du calcul des scores', 
        details: error.message,
        stderr: stderr
      });
    }
    
    if (stderr) {
      console.warn(`Avertissements lors de l'exécution du script: ${stderr}`);
    }
    
    console.log(`Résultat du calcul des scores: ${stdout}`);
    
    // Extraire les statistiques du résultat
    const updatedMatch = stdout.match(/Scores mis à jour : (\d+)/);
    const unchangedMatch = stdout.match(/Scores inchangés : (\d+)/);
    const errorMatch = stdout.match(/Erreurs : (\d+)/);
    const totalMatch = stdout.match(/Total traité : (\d+)/);
    
    const stats = {
      updated: updatedMatch ? parseInt(updatedMatch[1]) : 0,
      unchanged: unchangedMatch ? parseInt(unchangedMatch[1]) : 0,
      errors: errorMatch ? parseInt(errorMatch[1]) : 0,
      total: totalMatch ? parseInt(totalMatch[1]) : 0
    };
    
    res.json({ 
      success: true, 
      message: `Calcul des scores terminé pour la table ${tableName}`,
      stats,
      logs: stdout
    });
  });
  
  // Gérer les erreurs de démarrage du processus
  process.on('error', (error) => {
    console.error(`Erreur lors du démarrage du processus: ${error.message}`);
    res.status(500).json({ 
      error: 'Erreur lors du démarrage du calcul des scores', 
      details: error.message 
    });
  });
});

module.exports = router;
