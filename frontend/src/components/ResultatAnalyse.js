import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Checkbox,
  FormControlLabel,
  Button
} from '@mui/material';

const calculateResults = (answers) => {
  // Calcul du score total
  let totalScore = 0;

  // Liste de tous les champs avec rating
  const ratingFields = [
    'localisation_rating',
    'region_intervention_rating',
    'pays_intervention_rating',
    'qualification_tiers_rating',
    'nature_tiers_rating',
    'categorisation_tiers_rating',
    'intervention_autre_partie_rating',
    'evaluation_risque_rating',
    'interaction_tiers_autorite_rating',
    'encadrement_relation_rating',
    'flux_financier_rating',
    'modalites_paiement_rating',
    'niveau_dependance_rating',
    'niveau_dependance_clarins_rating',
    'modalites_renouvellement_rating',
    'antecedents_rating',
    'duree_envisagee_rating'
  ];

  // Additionner tous les ratings
  ratingFields.forEach(field => {
    const rating = answers[field];
    if (typeof rating === 'number') {
      totalScore += rating;
      console.log(`Ajout du rating pour ${field}:`, rating);
    }
  });

  console.log('Score total calculé:', totalScore);

  // Vérifier si une réponse critique est présente (rating = 3)
  const hasCriticalRating = ratingFields.some(field => answers[field] === 3);

  // Détermination du résultat selon le score total
  let resultatAnalyse;
  if (hasCriticalRating) {
    resultatAnalyse = "Niveau de risque élevé (réponse critique)";
  } else if (totalScore >= 0 && totalScore <= 1) {
    resultatAnalyse = "Niveau de risque très faible";
  } else if (totalScore >= 2 && totalScore <= 4) {
    resultatAnalyse = "Niveau de risque faible";
  } else if (totalScore >= 5 && totalScore <= 7) {
    resultatAnalyse = "Niveau de risque modéré";
  } else {
    resultatAnalyse = "Niveau de risque élevé";
  }

  // Détermination de la catégorisation et des prochaines étapes
  let categorisation, prochaines_etapes;
  
  if (resultatAnalyse === "Niveau de risque très faible") {
    categorisation = "Tiers de catégorie 1";
    prochaines_etapes = "Aucune action supplémentaire n'est requise. Le tiers peut être engagé selon les procédures standard.";
  } else if (resultatAnalyse === "Niveau de risque faible") {
    categorisation = "Tiers de catégorie 2";
    prochaines_etapes = "Vérifications de base recommandées. Le tiers peut être engagé après validation par le responsable du département.";
  } else if (resultatAnalyse === "Niveau de risque modéré") {
    categorisation = "Tiers de catégorie 3";
    prochaines_etapes = "Envoyer les résultats de l'évaluation de second niveau au représentant compliance de l'entité. " +
                       "Les mesures suivantes seront mises en place : due diligence et décision par le Management de l'entité.";
  } else {
    categorisation = "Tiers de catégorie 4";
    prochaines_etapes = "Envoyer les résultats de l'évaluation de second niveau au représentant compliance de l'entité. " +
                       "Les mesures suivantes seront mises en place : questionnaire compliance, due diligence approfondie et décision " +
                       "par le Management du groupe";
  }

  return {
    resultatAnalyse,
    categorisation,
    prochaines_etapes,
    totalScore
  };
};

const ResultatAnalyse = ({ answers = {}, certificationChecked = false, onCertificationChange = () => {} }) => {
  const [displayScore, setDisplayScore] = useState(0);
  const [results, setResults] = useState({
    resultatAnalyse: '',
    categorisation: '',
    prochaines_etapes: ''
  });

  // Fonction pour calculer le score et les résultats
  const calculateResults = useCallback(() => {
    // Vérifier si toutes les listes sont vides
    const hasAnyAnswer = Object.entries(answers).some(([key, value]) => {
      return !key.endsWith('_rating') && value !== '' && value !== undefined;
    });

    if (!hasAnyAnswer) {
      return {
        score: 0,
        resultatAnalyse: "Pas d'évaluation",
        categorisation: "Pas d'évaluation",
        prochaines_etapes: "Pas d'évaluation"
      };
    }

    // Calculer le score total
    let newScore = 0;
    const ratingFields = [
      'localisation_rating',
      'region_intervention_rating',
      'pays_intervention_rating',
      'qualification_tiers_rating',
      'nature_tiers_rating',
      'categorisation_tiers_rating',
      'intervention_autre_partie_rating',
      'evaluation_risque_rating',
      'interaction_tiers_autorite_rating',
      'encadrement_relation_rating',
      'flux_financier_rating',
      'modalites_paiement_rating',
      'niveau_dependance_rating',
      'niveau_dependance_clarins_rating',
      'modalites_renouvellement_rating',
      'antecedents_rating',
      'duree_envisagee_rating'
    ];

    ratingFields.forEach(field => {
      const rating = answers[field];
      if (typeof rating === 'number') {
        newScore += rating;
      }
    });

    // Vérifier s'il y a une réponse critique (rating = 3)
    const hasCriticalRating = ratingFields.some(field => answers[field] === 3);

    // Déterminer le résultat de l'analyse
    let newResultatAnalyse;
    if (hasCriticalRating) {
      newResultatAnalyse = "Niveau de risque élevé (réponse critique)";
    } else if (newScore >= 0 && newScore <= 1) {
      newResultatAnalyse = "Niveau de risque très faible";
    } else if (newScore >= 2 && newScore <= 4) {
      newResultatAnalyse = "Niveau de risque faible";
    } else if (newScore >= 5 && newScore <= 7) {
      newResultatAnalyse = "Niveau de risque modéré";
    } else {
      newResultatAnalyse = "Niveau de risque élevé";
    }

    // Déterminer la catégorisation et les prochaines étapes
    let newCategorisation, newProchaines_etapes;
    if (newResultatAnalyse === "Niveau de risque très faible") {
      newCategorisation = "Tiers de catégorie 1";
      newProchaines_etapes = "Aucune action supplémentaire n'est requise. Le tiers peut être engagé selon les procédures standard.";
    } else if (newResultatAnalyse === "Niveau de risque faible") {
      newCategorisation = "Tiers de catégorie 2";
      newProchaines_etapes = "Vérifications de base recommandées. Le tiers peut être engagé après validation par le responsable du département.";
    } else if (newResultatAnalyse === "Niveau de risque modéré") {
      newCategorisation = "Tiers de catégorie 3";
      newProchaines_etapes = "Envoyer les résultats de l'évaluation de second niveau au représentant compliance de l'entité. " +
                       "Les mesures suivantes seront mises en place : due diligence et décision par le Management de l'entité.";
    } else {
      newCategorisation = "Tiers de catégorie 4";
      newProchaines_etapes = "Envoyer les résultats de l'évaluation de second niveau au représentant compliance de l'entité. " +
                       "Les mesures suivantes seront mises en place : questionnaire compliance, due diligence approfondie et décision " +
                       "par le Management du groupe";
    }

    return {
      score: newScore,
      resultatAnalyse: newResultatAnalyse,
      categorisation: newCategorisation,
      prochaines_etapes: newProchaines_etapes
    };
  }, [answers]);

  // Mettre à jour les résultats automatiquement quand les réponses changent
  useEffect(() => {
    const newResults = calculateResults();
    setDisplayScore(newResults.score);
    setResults({
      resultatAnalyse: newResults.resultatAnalyse,
      categorisation: newResults.categorisation,
      prochaines_etapes: newResults.prochaines_etapes
    });
  }, [calculateResults]);

  return (
    <Box sx={{ mt: 3 }}>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'flex-end',
        alignItems: 'center',
        mb: 2 
      }}>
        <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
          Score total : {displayScore}
        </Typography>
      </Box>

      <TableContainer component={Paper} sx={{ mb: 3 }}>
        <Table>
          <TableBody>
            {/* Catégorisation */}
            <TableRow>
              <TableCell 
                sx={{ 
                  width: '30%', 
                  backgroundColor: '#f5f5f5',
                  fontWeight: 'bold',
                  textAlign: 'center'
                }}
              >
                Catégorisation
              </TableCell>
              <TableCell
                sx={{ 
                  backgroundColor: results.resultatAnalyse === "Niveau de risque modéré" 
                    ? '#FFA500' 
                    : results.resultatAnalyse === "Niveau de risque élevé" || results.resultatAnalyse === "Niveau de risque élevé (réponse critique)"
                    ? '#FF0000'
                    : '#FFFFFF'
                }}
              >
                {results.categorisation || "Pas d'évaluation"}
              </TableCell>
            </TableRow>

            {/* Résultat de l'analyse de risque */}
            <TableRow>
              <TableCell 
                sx={{ 
                  backgroundColor: '#f5f5f5',
                  fontWeight: 'bold',
                  textAlign: 'center'
                }}
              >
                Résultat de l'analyse de risque
              </TableCell>
              <TableCell
                sx={{ 
                  backgroundColor: results.resultatAnalyse === "Niveau de risque modéré" 
                    ? '#FFA500' 
                    : results.resultatAnalyse === "Niveau de risque élevé" || results.resultatAnalyse === "Niveau de risque élevé (réponse critique)"
                    ? '#FF0000'
                    : '#FFFFFF'
                }}
              >
                {results.resultatAnalyse || "Pas d'évaluation"}
              </TableCell>
            </TableRow>

            {/* Prochaines étapes */}
            <TableRow>
              <TableCell 
                sx={{ 
                  backgroundColor: '#f5f5f5',
                  fontWeight: 'bold',
                  textAlign: 'center'
                }}
              >
                Prochaines étapes
              </TableCell>
              <TableCell
                sx={{ 
                  backgroundColor: results.resultatAnalyse === "Niveau de risque modéré" 
                    ? '#FFA500' 
                    : results.resultatAnalyse === "Niveau de risque élevé" || results.resultatAnalyse === "Niveau de risque élevé (réponse critique)"
                    ? '#FF0000'
                    : '#FFFFFF'
                }}
              >
                {results.prochaines_etapes || "Pas d'évaluation"}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>

      {/* Section du bas avec checkbox et visa */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        mt: 2
      }}>
        {/* Checkbox de certification */}
        <FormControlLabel
          control={
            <Checkbox
              checked={certificationChecked}
              onChange={(e) => onCertificationChange(e.target.checked)}
              color="primary"
              disabled={displayScore === 0}
            />
          }
          label="Je certifie avoir répondu de bonne foi à l'ensemble des questions ci-dessus."
        />

        {/* Visa du demandeur */}
        <Box 
          sx={{ 
            border: '1px solid #ccc',
            p: 2,
            width: '200px',
            height: '100px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Typography variant="body2" color="textSecondary">
            Visa du demandeur
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default ResultatAnalyse;
