import React, { useState, useEffect } from 'react';
import axios from 'axios';
import config from '../config';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableFooter,
  Paper,
  TextField,
  MenuItem,
  Button,
  Typography,
  Box
} from '@mui/material';
import ResultatAnalyse from './ResultatAnalyse';

const QualificationTable = ({ 
  environnement, 
  setEnvironnement,
  choixTiers,
  setChoixTiers,
  relationContractuelle,
  setRelationContractuelle,
  handleReset
}) => {
  const [localisations, setLocalisations] = useState([]);
  const [regionsIntervention, setRegionsIntervention] = useState([]);
  const [paysIntervention, setPaysIntervention] = useState([]);
  const [qualificationsTiers, setQualificationsTiers] = useState([]);
  const [naturesTiers, setNaturesTiers] = useState([]);
  const [eval2CategorisationsTiers, setEval2CategorisationsTiers] = useState([]);
  const [eval2NaturesTiers, setEval2NaturesTiers] = useState([]);
  const [eval2InterventionAutrePartie, setEval2InterventionAutrePartie] = useState([]);
  const [eval2EvaluationRisque, setEval2EvaluationRisque] = useState([]);
  const [eval2InteractionTiersAutrePartie, setEval2InteractionTiersAutrePartie] = useState([]);
  const [eval2EncadrementRelation, setEval2EncadrementRelation] = useState([]);
  const [eval2FluxFinancier, setEval2FluxFinancier] = useState([]);
  const [eval2ModalitesPaiement, setEval2ModalitesPaiement] = useState([]);
  const [eval2NiveauDependance, setEval2NiveauDependance] = useState([]);
  const [eval2NiveauDependanceClarins, setEval2NiveauDependanceClarins] = useState([]);
  const [eval2ModalitesRenouvellement, setEval2ModalitesRenouvellement] = useState([]);
  const [eval2Antecedents, setEval2Antecedents] = useState([]);
  const [eval2DureeEnvisagee, setEval2DureeEnvisagee] = useState([]);
  const [isAllFieldsFilled, setIsAllFieldsFilled] = useState(false);
  const [certificationChecked, setCertificationChecked] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('Chargement des données...');
        const [locResponse, regResponse, paysResponse, qualifResponse, natureResponse, eval2CategResponse, eval2NatureResponse, eval2InterventionResponse, eval2RisqueResponse, eval2InteractionResponse, eval2EncadrementResponse, eval2FluxResponse, eval2ModalitesResponse, eval2DependanceResponse, eval2DependanceClarinsResponse, eval2RenouvellementResponse, eval2AntecedentsResponse, eval2DureeResponse] = await Promise.all([
          axios.get(`${config.apiUrl}/api/evaluation2/localisations`),
          axios.get(`${config.apiUrl}/api/evaluation2/regions-intervention`),
          axios.get(`${config.apiUrl}/api/evaluation2/pays-intervention`),
          axios.get(`${config.apiUrl}/api/evaluation2/qualifications-tiers`),
          axios.get(`${config.apiUrl}/api/evaluation2/natures-tiers`),
          axios.get(`${config.apiUrl}/api/evaluation2/eval2_categorisation_tiers`),
          axios.get(`${config.apiUrl}/api/evaluation2/eval2_nature_tiers`),
          axios.get(`${config.apiUrl}/api/evaluation2/eval2_intervention_autre_partie`),
          axios.get(`${config.apiUrl}/api/evaluation2/eval2_evaluation_risque`),
          axios.get(`${config.apiUrl}/api/evaluation2/eval2_interaction_tiers_autre_partie`),
          axios.get(`${config.apiUrl}/api/evaluation2/eval2_encadrement_relation`),
          axios.get(`${config.apiUrl}/api/evaluation2/eval2_flux_financier`),
          axios.get(`${config.apiUrl}/api/evaluation2/eval2_modalites_paiement_reglement`),
          axios.get(`${config.apiUrl}/api/evaluation2/eval2_niveau_dependance_tiers_vs_clarins`),
          axios.get(`${config.apiUrl}/api/evaluation2/eval2_niveau_dependance_clarins_vs_tiers`),
          axios.get(`${config.apiUrl}/api/evaluation2/eval2_modalites_de_renouvellement_contrat`),
          axios.get(`${config.apiUrl}/api/evaluation2/eval2_antecedents_avec_le_tiers`),
          axios.get(`${config.apiUrl}/api/evaluation2/eval2_duree_envisagee_de_la_relation_contractuelle`)
        ]);
        console.log('Localisations reçues:', locResponse.data);
        console.log('Régions reçues:', regResponse.data);
        console.log('Pays reçus:', paysResponse.data);
        console.log('Qualifications reçues:', qualifResponse.data);
        console.log('Natures reçues:', natureResponse.data);
        console.log('Eval2 Catégorisations Tiers reçues:', eval2CategResponse.data);
        console.log('Eval2 Natures Tiers reçues:', eval2NatureResponse.data);
        console.log('Eval2 Intervention Autre Partie reçues:', eval2InterventionResponse.data);
        console.log('Eval2 Evaluation Risque reçues:', eval2RisqueResponse.data);
        console.log('Eval2 Interaction Tiers Autre Partie reçues:', eval2InteractionResponse.data);
        console.log('Eval2 Encadrement Relation reçues:', eval2EncadrementResponse.data);
        console.log('Eval2 Flux Financier reçues:', eval2FluxResponse.data);
        console.log('Eval2 Modalités Paiement reçues:', eval2ModalitesResponse.data);
        console.log('Eval2 Niveau Dépendance reçues:', eval2DependanceResponse.data);
        console.log('Eval2 Niveau Dépendance Clarins reçues:', eval2DependanceClarinsResponse.data);
        console.log('Eval2 Modalités Renouvellement reçues:', eval2RenouvellementResponse.data);
        console.log('Eval2 Antécédents reçus:', eval2AntecedentsResponse.data);
        console.log('Eval2 Durée Envisagée reçue:', eval2DureeResponse.data);
        setLocalisations(locResponse.data);
        setRegionsIntervention(regResponse.data);
        setPaysIntervention(paysResponse.data);
        setQualificationsTiers(qualifResponse.data);
        setNaturesTiers(natureResponse.data);
        setEval2CategorisationsTiers(eval2CategResponse.data);
        setEval2NaturesTiers(eval2NatureResponse.data);
        setEval2InterventionAutrePartie(eval2InterventionResponse.data);
        setEval2EvaluationRisque(eval2RisqueResponse.data);
        setEval2InteractionTiersAutrePartie(eval2InteractionResponse.data);
        setEval2EncadrementRelation(eval2EncadrementResponse.data);
        setEval2FluxFinancier(eval2FluxResponse.data);
        setEval2ModalitesPaiement(eval2ModalitesResponse.data);
        setEval2NiveauDependance(eval2DependanceResponse.data);
        setEval2NiveauDependanceClarins(eval2DependanceClarinsResponse.data);
        setEval2ModalitesRenouvellement(eval2RenouvellementResponse.data);
        setEval2Antecedents(eval2AntecedentsResponse.data);
        setEval2DureeEnvisagee(eval2DureeResponse.data);
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const requiredFields = [
      'localisation',
      'region_intervention',
      'pays_intervention',
      'qualification_tiers',
      'nature_tiers',
      'categorisation_tiers',
      'intervention_autre_partie',
      'evaluation_risque',
      'interaction_tiers_autre_partie',
      'encadrement_relation',
      'flux_financier',
      'modalites_paiement',
      'niveau_dependance',
      'niveau_dependance_clarins',
      'modalites_renouvellement',
      'antecedents',
      'duree_envisagee'
    ];

    const allFieldsFilled = requiredFields.every(field => {
      const value = environnement[field] || choixTiers[field] || relationContractuelle[field];
      return value && value !== '' && value !== '---Choix de la réponse---';
    });

    setIsAllFieldsFilled(allFieldsFilled);
  }, [environnement, choixTiers, relationContractuelle]);

  // Style pour les cellules d'en-tête de section
  const sectionHeaderStyle = {
    backgroundColor: '#9e0000',
    color: 'white',
    fontWeight: 'bold',
    padding: '10px',
    textAlign: 'center'
  };

  // Style pour les cellules d'en-tête
  const headerStyle = {
    backgroundColor: '#f5f5f5',
    fontWeight: 'bold'
  };

  return (
    <Box>
      <TableContainer component={Paper} sx={{ mb: 3 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell width="5%" sx={headerStyle}>N°</TableCell>
              <TableCell width="25%" sx={headerStyle}>Critère</TableCell>
              <TableCell width="40%" sx={headerStyle}>Clarifications</TableCell>
              <TableCell width="20%" sx={headerStyle}>Réponses</TableCell>
              <TableCell width="10%" sx={headerStyle}>Rating</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {/* Section III.1. Environnement */}
            <TableRow>
              <TableCell colSpan={5} sx={sectionHeaderStyle}>
                III.1. Environnement
              </TableCell>
            </TableRow>

            <TableRow>
              <TableCell>1</TableCell>
              <TableCell>Localisation</TableCell>
              <TableCell>Pays d'enregistrement de l'entité légale du tiers</TableCell>
              <TableCell>
                <TextField
                  select
                  fullWidth
                  size="small"
                  value={environnement.localisation || ''}
                  onChange={(e) => {
                    const selectedLoc = e.target.value;
                    const selectedLocData = localisations.find(l => l.pays === selectedLoc);
                    setEnvironnement({
                      ...environnement,
                      localisation: selectedLoc,
                      localisation_rating: selectedLocData ? selectedLocData.poids : 0
                    });
                  }}
                >
                  <MenuItem value="">---Choix de la réponse---</MenuItem>
                  {localisations.map((loc) => (
                    <MenuItem key={loc.id} value={loc.pays}>{loc.pays}</MenuItem>
                  ))}
                </TextField>
              </TableCell>
              <TableCell align="center">{environnement.localisation_rating || 0}</TableCell>
            </TableRow>

            <TableRow>
              <TableCell>2</TableCell>
              <TableCell>Région d'intervention</TableCell>
              <TableCell>Région Clarins dans laquelle le tiers intervient</TableCell>
              <TableCell>
                <TextField
                  select
                  fullWidth
                  size="small"
                  value={environnement.region_intervention || ''}
                  onChange={(e) => {
                    const selectedRegion = e.target.value;
                    const selectedRegionData = regionsIntervention.find(r => r.region === selectedRegion);
                    setEnvironnement({
                      ...environnement,
                      region_intervention: selectedRegion,
                      region_intervention_rating: selectedRegionData ? selectedRegionData.poids : 0
                    });
                  }}
                >
                  <MenuItem value="">---Choix de la réponse---</MenuItem>
                  {regionsIntervention.map((region) => (
                    <MenuItem key={region.id} value={region.region}>{region.region}</MenuItem>
                  ))}
                </TextField>
              </TableCell>
              <TableCell align="center">{environnement.region_intervention_rating || 0}</TableCell>
            </TableRow>

            <TableRow>
              <TableCell>3</TableCell>
              <TableCell>Pays d'intervention</TableCell>
              <TableCell>Pays ou zone géographique d'intervention du tiers</TableCell>
              <TableCell>
                <TextField
                  select
                  fullWidth
                  size="small"
                  value={environnement.pays_intervention || ''}
                  onChange={(e) => {
                    const selectedPays = e.target.value;
                    const selectedPaysData = paysIntervention.find(p => p.pays === selectedPays);
                    setEnvironnement({
                      ...environnement,
                      pays_intervention: selectedPays,
                      pays_intervention_rating: selectedPaysData ? selectedPaysData.poids : 0
                    });
                  }}
                >
                  <MenuItem value="">---Choix de la réponse---</MenuItem>
                  {paysIntervention.map((pays) => (
                    <MenuItem key={pays.id} value={pays.pays}>{pays.pays}</MenuItem>
                  ))}
                </TextField>
              </TableCell>
              <TableCell align="center">{environnement.pays_intervention_rating || 0}</TableCell>
            </TableRow>

            <TableRow>
              <TableCell>4</TableCell>
              <TableCell>Qualification du tiers</TableCell>
              <TableCell>Entité publique ou privée</TableCell>
              <TableCell>
                <TextField
                  select
                  fullWidth
                  size="small"
                  value={environnement.qualification_tiers || ''}
                  onChange={(e) => {
                    const selectedQualif = e.target.value;
                    const selectedQualifData = qualificationsTiers.find(q => q.qualification === selectedQualif);
                    setEnvironnement({
                      ...environnement,
                      qualification_tiers: selectedQualif,
                      qualification_tiers_rating: selectedQualifData ? selectedQualifData.poids : 0
                    });
                  }}
                >
                  <MenuItem value="">Choix de la réponse...</MenuItem>
                  {qualificationsTiers.map((qualif) => (
                    <MenuItem key={qualif.id} value={qualif.qualification}>{qualif.qualification}</MenuItem>
                  ))}
                </TextField>
              </TableCell>
              <TableCell align="center">{environnement.qualification_tiers_rating || 0}</TableCell>
            </TableRow>

            {/* Section III.2. Choix du tiers */}
            <TableRow>
              <TableCell colSpan={5} sx={sectionHeaderStyle}>
                III.2. Choix du tiers
              </TableCell>
            </TableRow>

            <TableRow>
              <TableCell>5</TableCell>
              <TableCell>Nature du tiers</TableCell>
              <TableCell>Typologie principale du tiers dans le cadre du projet</TableCell>
              <TableCell>
                <TextField
                  select
                  fullWidth
                  size="small"
                  value={choixTiers.nature_tiers || ''}
                  onChange={(e) => {
                    const selectedNature = e.target.value;
                    const selectedNatureData = eval2NaturesTiers.find(n => n.nature === selectedNature);
                    setChoixTiers({
                      ...choixTiers,
                      nature_tiers: selectedNature,
                      nature_tiers_rating: selectedNatureData ? selectedNatureData.poids : 0
                    });
                  }}
                >
                  <MenuItem value="">---Choix de la réponse---</MenuItem>
                  {eval2NaturesTiers.map((nature) => (
                    <MenuItem key={nature.id} value={nature.nature}>{nature.nature}</MenuItem>
                  ))}
                </TextField>
              </TableCell>
              <TableCell align="center">{choixTiers.nature_tiers_rating || 0}</TableCell>
            </TableRow>

            <TableRow>
              <TableCell>6</TableCell>
              <TableCell>Catégorisation du tiers</TableCell>
              <TableCell>Personne privée ou société</TableCell>
              <TableCell>
                <TextField
                  select
                  fullWidth
                  size="small"
                  value={choixTiers.categorisation_tiers || ''}
                  onChange={(e) => {
                    const selectedCateg = e.target.value;
                    const selectedCategData = eval2CategorisationsTiers.find(c => c.categorisation === selectedCateg);
                    setChoixTiers({
                      ...choixTiers,
                      categorisation_tiers: selectedCateg,
                      categorisation_tiers_rating: selectedCategData ? selectedCategData.poids : 0
                    });
                  }}
                >
                  <MenuItem value="">---Choix de la réponse---</MenuItem>
                  {eval2CategorisationsTiers.map((categ) => (
                    <MenuItem key={categ.id} value={categ.categorisation}>{categ.categorisation}</MenuItem>
                  ))}
                </TextField>
              </TableCell>
              <TableCell align="center">{choixTiers.categorisation_tiers_rating || 0}</TableCell>
            </TableRow>

            <TableRow>
              <TableCell>7</TableCell>
              <TableCell>Intervention d'une autre partie dans le choix du tiers</TableCell>
              <TableCell>Intervention d'une partie tierce dans le choix du tiers</TableCell>
              <TableCell>
                <TextField
                  select
                  fullWidth
                  size="small"
                  value={choixTiers.intervention_autre_partie || ''}
                  onChange={(e) => {
                    const selectedIntervention = e.target.value;
                    const selectedInterventionData = eval2InterventionAutrePartie.find(i => i.intervention === selectedIntervention);
                    setChoixTiers({
                      ...choixTiers,
                      intervention_autre_partie: selectedIntervention,
                      intervention_autre_partie_rating: selectedInterventionData ? selectedInterventionData.poids : 0
                    });
                  }}
                >
                  <MenuItem value="">---Choix de la réponse---</MenuItem>
                  {eval2InterventionAutrePartie.map((intervention) => (
                    <MenuItem key={intervention.id} value={intervention.intervention}>{intervention.intervention}</MenuItem>
                  ))}
                </TextField>
              </TableCell>
              <TableCell align="center">{choixTiers.intervention_autre_partie_rating || 0}</TableCell>
            </TableRow>

            <TableRow>
              <TableCell>8</TableCell>
              <TableCell>Evaluation du risque de conflit d'intérêts</TableCell>
              <TableCell>Existence d'un conflit d'intérêts potentiel</TableCell>
              <TableCell>
                <TextField
                  select
                  fullWidth
                  size="small"
                  value={choixTiers.evaluation_risque || ''}
                  onChange={(e) => {
                    const selectedRisque = e.target.value;
                    const selectedRisqueData = eval2EvaluationRisque.find(r => r.risque === selectedRisque);
                    setChoixTiers({
                      ...choixTiers,
                      evaluation_risque: selectedRisque,
                      evaluation_risque_rating: selectedRisqueData ? selectedRisqueData.poids : 0
                    });
                  }}
                >
                  <MenuItem value="">---Choix de la réponse---</MenuItem>
                  {eval2EvaluationRisque.map((risque) => (
                    <MenuItem key={risque.id} value={risque.risque}>{risque.risque}</MenuItem>
                  ))}
                </TextField>
              </TableCell>
              <TableCell align="center">{choixTiers.evaluation_risque_rating || 0}</TableCell>
            </TableRow>

            <TableRow>
              <TableCell>9</TableCell>
              <TableCell>Interaction du tiers avec des autorités publiques</TableCell>
              <TableCell>Le tiers est-il amené à interagir avec des autorités publiques dans le cadre de sa mission ?</TableCell>
              <TableCell>
                <TextField
                  select
                  fullWidth
                  size="small"
                  value={choixTiers.interaction_tiers_autorite || ''}
                  onChange={(e) => {
                    const selectedInteraction = e.target.value;
                    const selectedInteractionData = eval2InteractionTiersAutrePartie.find(i => i.interaction === selectedInteraction);
                    setChoixTiers({
                      ...choixTiers,
                      interaction_tiers_autorite: selectedInteraction,
                      interaction_tiers_autorite_rating: selectedInteractionData ? selectedInteractionData.poids : 0
                    });
                  }}
                >
                  <MenuItem value="">---Choix de la réponse---</MenuItem>
                  {eval2InteractionTiersAutrePartie.map((interaction) => (
                    <MenuItem key={interaction.id} value={interaction.interaction}>{interaction.interaction}</MenuItem>
                  ))}
                </TextField>
              </TableCell>
              <TableCell align="center">{choixTiers.interaction_tiers_autorite_rating || 0}</TableCell>
            </TableRow>

            {/* Section III.3. Relation contractuelle */}
            <TableRow>
              <TableCell colSpan={5} sx={sectionHeaderStyle}>
                III.3. Relation contractuelle
              </TableCell>
            </TableRow>

            <TableRow>
              <TableCell>10</TableCell>
              <TableCell>Encadrement de la relation</TableCell>
              <TableCell>Type d'encadrement de la relation avec le tiers</TableCell>
              <TableCell>
                <TextField
                  select
                  fullWidth
                  size="small"
                  value={relationContractuelle.encadrement_relation || ''}
                  onChange={(e) => {
                    const selectedEncadrement = e.target.value;
                    const selectedEncadrementData = eval2EncadrementRelation.find(e => e.encadrement === selectedEncadrement);
                    setRelationContractuelle({
                      ...relationContractuelle,
                      encadrement_relation: selectedEncadrement,
                      encadrement_relation_rating: selectedEncadrementData ? selectedEncadrementData.poids : 0
                    });
                  }}
                >
                  <MenuItem value="">---Choix de la réponse---</MenuItem>
                  {eval2EncadrementRelation.map((encadrement) => (
                    <MenuItem key={encadrement.id} value={encadrement.encadrement}>{encadrement.encadrement}</MenuItem>
                  ))}
                </TextField>
              </TableCell>
              <TableCell align="center">{relationContractuelle.encadrement_relation_rating || 0}</TableCell>
            </TableRow>

            <TableRow>
              <TableCell>11</TableCell>
              <TableCell>Flux financier</TableCell>
              <TableCell>Montant annuel des flux financiers</TableCell>
              <TableCell>
                <TextField
                  select
                  fullWidth
                  size="small"
                  value={relationContractuelle.flux_financier || ''}
                  onChange={(e) => {
                    const selectedFlux = e.target.value;
                    const selectedFluxData = eval2FluxFinancier.find(f => f.montant === selectedFlux);
                    setRelationContractuelle({
                      ...relationContractuelle,
                      flux_financier: selectedFlux,
                      flux_financier_rating: selectedFluxData ? selectedFluxData.poids : 0
                    });
                  }}
                >
                  <MenuItem value="">---Choix de la réponse---</MenuItem>
                  {eval2FluxFinancier.map((flux) => (
                    <MenuItem key={flux.id} value={flux.montant}>{flux.montant}</MenuItem>
                  ))}
                </TextField>
              </TableCell>
              <TableCell align="center">{relationContractuelle.flux_financier_rating || 0}</TableCell>
            </TableRow>

            <TableRow>
              <TableCell>12</TableCell>
              <TableCell>Modalités de paiement / règlement</TableCell>
              <TableCell>Mode de paiement prévu</TableCell>
              <TableCell>
                <TextField
                  select
                  fullWidth
                  size="small"
                  value={relationContractuelle.modalites_paiement || ''}
                  onChange={(e) => {
                    const selectedModalite = e.target.value;
                    const selectedModaliteData = eval2ModalitesPaiement.find(m => m.modalite === selectedModalite);
                    setRelationContractuelle({
                      ...relationContractuelle,
                      modalites_paiement: selectedModalite,
                      modalites_paiement_rating: selectedModaliteData ? selectedModaliteData.poids : 0
                    });
                  }}
                >
                  <MenuItem value="">---Choix de la réponse---</MenuItem>
                  {eval2ModalitesPaiement.map((modalite) => (
                    <MenuItem key={modalite.id} value={modalite.modalite}>{modalite.modalite}</MenuItem>
                  ))}
                </TextField>
              </TableCell>
              <TableCell align="center">{relationContractuelle.modalites_paiement_rating || 0}</TableCell>
            </TableRow>

            <TableRow>
              <TableCell>13</TableCell>
              <TableCell>Niveau de dépendance du tiers vis-à-vis de Clarins</TableCell>
              <TableCell>Part du chiffre d'affaires du tiers réalisé avec Clarins</TableCell>
              <TableCell>
                <TextField
                  select
                  fullWidth
                  size="small"
                  value={relationContractuelle.niveau_dependance || ''}
                  onChange={(e) => {
                    const selectedNiveau = e.target.value;
                    const selectedNiveauData = eval2NiveauDependance.find(n => n.niveau === selectedNiveau);
                    setRelationContractuelle({
                      ...relationContractuelle,
                      niveau_dependance: selectedNiveau,
                      niveau_dependance_rating: selectedNiveauData ? selectedNiveauData.poids : 0
                    });
                  }}
                >
                  <MenuItem value="">---Choix de la réponse---</MenuItem>
                  {eval2NiveauDependance.map((niveau) => (
                    <MenuItem key={niveau.id} value={niveau.niveau}>{niveau.niveau}</MenuItem>
                  ))}
                </TextField>
              </TableCell>
              <TableCell align="center">{relationContractuelle.niveau_dependance_rating || 0}</TableCell>
            </TableRow>

            <TableRow>
              <TableCell>14</TableCell>
              <TableCell>Niveau de dépendance de Clarins vis-à-vis du tiers</TableCell>
              <TableCell>Part du tiers dans les achats de Clarins</TableCell>
              <TableCell>
                <TextField
                  select
                  fullWidth
                  size="small"
                  value={relationContractuelle.niveau_dependance_clarins || ''}
                  onChange={(e) => {
                    const selectedNiveau = e.target.value;
                    const selectedNiveauData = eval2NiveauDependanceClarins.find(n => n.niveau === selectedNiveau);
                    setRelationContractuelle({
                      ...relationContractuelle,
                      niveau_dependance_clarins: selectedNiveau,
                      niveau_dependance_clarins_rating: selectedNiveauData ? selectedNiveauData.poids : 0
                    });
                  }}
                >
                  <MenuItem value="">---Choix de la réponse---</MenuItem>
                  {eval2NiveauDependanceClarins.map((niveau) => (
                    <MenuItem key={niveau.id} value={niveau.niveau}>{niveau.niveau}</MenuItem>
                  ))}
                </TextField>
              </TableCell>
              <TableCell align="center">{relationContractuelle.niveau_dependance_clarins_rating || 0}</TableCell>
            </TableRow>

            <TableRow>
              <TableCell>15</TableCell>
              <TableCell>Modalités de renouvellement du contrat</TableCell>
              <TableCell>Type de renouvellement prévu au contrat</TableCell>
              <TableCell>
                <TextField
                  select
                  fullWidth
                  size="small"
                  value={relationContractuelle.modalites_renouvellement || ''}
                  onChange={(e) => {
                    const selectedModalite = e.target.value;
                    const selectedModaliteData = eval2ModalitesRenouvellement.find(m => m.modalite === selectedModalite);
                    setRelationContractuelle({
                      ...relationContractuelle,
                      modalites_renouvellement: selectedModalite,
                      modalites_renouvellement_rating: selectedModaliteData ? selectedModaliteData.poids : 0
                    });
                  }}
                >
                  <MenuItem value="">---Choix de la réponse---</MenuItem>
                  {eval2ModalitesRenouvellement.map((modalite) => (
                    <MenuItem key={modalite.id} value={modalite.modalite}>{modalite.modalite}</MenuItem>
                  ))}
                </TextField>
              </TableCell>
              <TableCell align="center">{relationContractuelle.modalites_renouvellement_rating || 0}</TableCell>
            </TableRow>

            <TableRow>
              <TableCell>16</TableCell>
              <TableCell>Antécédents avec le tiers</TableCell>
              <TableCell>Existence d'incidents passés avec le tiers</TableCell>
              <TableCell>
                <TextField
                  select
                  fullWidth
                  size="small"
                  value={relationContractuelle.antecedents || ''}
                  onChange={(e) => {
                    const selectedReponse = e.target.value;
                    const selectedReponseData = eval2Antecedents.find(r => r.reponse === selectedReponse);
                    setRelationContractuelle({
                      ...relationContractuelle,
                      antecedents: selectedReponse,
                      antecedents_rating: selectedReponseData ? selectedReponseData.poids : 0
                    });
                  }}
                >
                  <MenuItem value="">---Choix de la réponse---</MenuItem>
                  {eval2Antecedents.map((reponse) => (
                    <MenuItem key={reponse.id} value={reponse.reponse}>{reponse.reponse}</MenuItem>
                  ))}
                </TextField>
              </TableCell>
              <TableCell align="center">{relationContractuelle.antecedents_rating || 0}</TableCell>
            </TableRow>

            <TableRow>
              <TableCell>17</TableCell>
              <TableCell>Durée envisagée de la relation contractuelle</TableCell>
              <TableCell>Durée prévue de la relation contractuelle</TableCell>
              <TableCell>
                <TextField
                  select
                  fullWidth
                  size="small"
                  value={relationContractuelle.duree_envisagee || ''}
                  onChange={(e) => {
                    const selectedDuree = e.target.value;
                    const selectedDureeData = eval2DureeEnvisagee.find(d => d.duree === selectedDuree);
                    setRelationContractuelle({
                      ...relationContractuelle,
                      duree_envisagee: selectedDuree,
                      duree_envisagee_rating: selectedDureeData ? selectedDureeData.poids : 0
                    });
                  }}
                >
                  <MenuItem value="">---Choix de la réponse---</MenuItem>
                  {eval2DureeEnvisagee.map((duree) => (
                    <MenuItem key={duree.id} value={duree.duree}>{duree.duree}</MenuItem>
                  ))}
                </TextField>
              </TableCell>
              <TableCell align="center">{relationContractuelle.duree_envisagee_rating || 0}</TableCell>
            </TableRow>
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell colSpan={5} align="right" sx={{ border: 'none', p: 2 }}>
                <Button 
                  variant="outlined" 
                  onClick={handleReset}
                  sx={{ minWidth: 120 }}
                >
                  Réinitialiser
                </Button>
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </TableContainer>

      <ResultatAnalyse 
        answers={{
          localisation: environnement.localisation,
          region_intervention: environnement.region_intervention,
          pays_intervention: environnement.pays_intervention,
          qualification_tiers: environnement.qualification_tiers,
          nature_tiers: choixTiers.nature_tiers,
          categorisation_tiers: choixTiers.categorisation_tiers,
          intervention_autre_partie: choixTiers.intervention_autre_partie,
          evaluation_risque: choixTiers.evaluation_risque,
          interaction_tiers_autorite: choixTiers.interaction_tiers_autorite,
          encadrement_relation: relationContractuelle.encadrement_relation,
          flux_financier: relationContractuelle.flux_financier,
          modalites_paiement: relationContractuelle.modalites_paiement,
          niveau_dependance: relationContractuelle.niveau_dependance,
          niveau_dependance_clarins: relationContractuelle.niveau_dependance_clarins,
          modalites_renouvellement: relationContractuelle.modalites_renouvellement,
          antecedents: relationContractuelle.antecedents,
          duree_envisagee: relationContractuelle.duree_envisagee,
          localisation_rating: environnement.localisation_rating || 0,
          region_intervention_rating: environnement.region_intervention_rating || 0,
          pays_intervention_rating: environnement.pays_intervention_rating || 0,
          qualification_tiers_rating: environnement.qualification_tiers_rating || 0,
          nature_tiers_rating: choixTiers.nature_tiers_rating || 0,
          categorisation_tiers_rating: choixTiers.categorisation_tiers_rating || 0,
          intervention_autre_partie_rating: choixTiers.intervention_autre_partie_rating || 0,
          evaluation_risque_rating: choixTiers.evaluation_risque_rating || 0,
          interaction_tiers_autorite_rating: choixTiers.interaction_tiers_autorite_rating || 0,
          encadrement_relation_rating: relationContractuelle.encadrement_relation_rating || 0,
          flux_financier_rating: relationContractuelle.flux_financier_rating || 0,
          modalites_paiement_rating: relationContractuelle.modalites_paiement_rating || 0,
          niveau_dependance_rating: relationContractuelle.niveau_dependance_rating || 0,
          niveau_dependance_clarins_rating: relationContractuelle.niveau_dependance_clarins_rating || 0,
          modalites_renouvellement_rating: relationContractuelle.modalites_renouvellement_rating || 0,
          antecedents_rating: relationContractuelle.antecedents_rating || 0,
          duree_envisagee_rating: relationContractuelle.duree_envisagee_rating || 0
        }}
        certificationChecked={certificationChecked}
        onCertificationChange={setCertificationChecked}
      />
    </Box>
  );
};

export default QualificationTable;
