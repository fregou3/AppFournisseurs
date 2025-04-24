import React, { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  MenuItem,
  FormControl,
  Typography,
  Box
} from '@mui/material';
import axios from 'axios';
import config from '../config';

const IdentiteTiers = ({ tiers, setTiers }) => {
  const [raisonsRelation, setRaisonsRelation] = useState([]);
  const [criteresSelectionList, setCriteresSelectionList] = useState([]);
  const [ratings, setRatings] = useState({
    nom: 0,
    raison_relation: 0,
    critere_selection: 0
  });

  // Charger les raisons de relation et leurs poids
  useEffect(() => {
    const fetchRaisons = async () => {
      try {
        console.log('=== Debug Configuration ===');
        const apiUrl = `${config.apiUrl}/api/evaluation2/raisons`;
        console.log('URL de l\'API:', apiUrl);

        console.log('=== Début appel API ===');
        const response = await axios.get(apiUrl);
        console.log('=== Réponse reçue ===');
        console.log('Status:', response.status);
        console.log('Data:', response.data);
        
        if (response.data && Array.isArray(response.data)) {
          console.log('=== Mise à jour des données ===');
          setRaisonsRelation(response.data);
          
          // Si une raison est déjà sélectionnée, mettre à jour son rating
          if (tiers.raison_relation) {
            const selectedRaison = response.data.find(r => r.description === tiers.raison_relation);
            if (selectedRaison) {
              setRatings(prev => ({
                ...prev,
                raison_relation: selectedRaison.poids
              }));
            }
          }
        } else {
          console.error('Format de données invalide:', response.data);
        }
      } catch (error) {
        console.error('=== Erreur lors du chargement des raisons ===');
        console.error('Message:', error.message);
        console.error('URL appelée:', error.config?.url);
        console.error('Status:', error.response?.status);
        console.error('Réponse:', error.response?.data);
      }
    };
    fetchRaisons();
  }, [tiers]);

  // Charger les critères de sélection
  useEffect(() => {
    const fetchCriteres = async () => {
      try {
        console.log('=== Debug Critères ===');
        const apiUrl = `${config.apiUrl}/api/evaluation2/criteres-selection`;
        console.log('URL de l\'API critères:', apiUrl);

        console.log('=== Début appel API critères ===');
        const response = await axios.get(apiUrl);
        console.log('=== Réponse reçue critères ===');
        console.log('Status:', response.status);
        console.log('Data:', response.data);
        
        if (response.data && Array.isArray(response.data)) {
          console.log('=== Mise à jour des critères ===');
          setCriteresSelectionList(response.data);
          
          // Si un critère est déjà sélectionné, mettre à jour son rating
          if (tiers.critere_selection) {
            const selectedCritere = response.data.find(c => c.description === tiers.critere_selection);
            if (selectedCritere) {
              setRatings(prev => ({
                ...prev,
                critere_selection: selectedCritere.poids
              }));
            }
          }
        } else {
          console.error('Format de données invalide pour les critères:', response.data);
        }
      } catch (error) {
        console.error('=== Erreur lors du chargement des critères ===');
        console.error('Message:', error.message);
        console.error('URL appelée:', error.config?.url);
        console.error('Status:', error.response?.status);
        console.error('Réponse:', error.response?.data);
      }
    };
    fetchCriteres();
  }, [tiers]);

  const handleChange = (field, value) => {
    console.log('=== handleChange ===');
    console.log('Champ:', field);
    console.log('Valeur:', value);
    
    // Mise à jour du tiers
    setTiers(prev => ({
      ...prev,
      [field]: value
    }));

    // Mise à jour du rating pour les raisons de relation
    if (field === 'raison_relation') {
      console.log('Recherche de la raison dans:', raisonsRelation);
      const selectedRaison = raisonsRelation.find(r => r.description === value);
      console.log('Raison trouvée:', selectedRaison);
      setRatings(prev => ({
        ...prev,
        raison_relation: selectedRaison ? selectedRaison.poids : 0
      }));
    }
    
    // Mise à jour du rating pour les critères de sélection
    if (field === 'critere_selection') {
      console.log('Recherche du critère dans:', criteresSelectionList);
      const selectedCritere = criteresSelectionList.find(c => c.description === value);
      console.log('Critère trouvé:', selectedCritere);
      setRatings(prev => ({
        ...prev,
        critere_selection: selectedCritere ? selectedCritere.poids : 0
      }));
    }
  };

  return (
    <TableContainer component={Paper} sx={{ mb: 3 }}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell width="30%" sx={{ backgroundColor: '#f5f5f5', fontWeight: 'bold' }}>
              Informations demandées
            </TableCell>
            <TableCell width="35%" sx={{ backgroundColor: '#f5f5f5', fontWeight: 'bold' }}>
              Clarifications
            </TableCell>
            <TableCell width="25%" sx={{ backgroundColor: '#f5f5f5', fontWeight: 'bold' }}>
              Réponses
            </TableCell>
            <TableCell width="10%" sx={{ backgroundColor: '#f5f5f5', fontWeight: 'bold' }}>
              Rating
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {/* Nom */}
          <TableRow>
            <TableCell>Nom</TableCell>
            <TableCell>Raison sociale du tiers et nom courant de la société</TableCell>
            <TableCell>
              <TextField
                fullWidth
                size="small"
                value={tiers.nom || ''}
                onChange={(e) => handleChange('nom', e.target.value)}
                placeholder="A compléter..."
              />
            </TableCell>
            <TableCell align="center">{ratings.nom}</TableCell>
          </TableRow>

          {/* Raisons d'entrer en relation */}
          <TableRow>
            <TableCell>Raisons d'entrer en relation avec ce tiers</TableCell>
            <TableCell>Contexte et objectifs de la relation</TableCell>
            <TableCell>
              <TextField
                fullWidth
                size="small"
                select
                value={tiers.raison_relation || ''}
                onChange={(e) => {
                  console.log('Sélection changée:', e.target.value);
                  handleChange('raison_relation', e.target.value);
                }}
                placeholder="Choix de la réponse..."
              >
                <MenuItem value="">---Choix de la réponse---</MenuItem>
                {raisonsRelation && raisonsRelation.length > 0 ? (
                  raisonsRelation.map((raison) => (
                    <MenuItem key={raison.id} value={raison.description}>
                      {raison.description}
                    </MenuItem>
                  ))
                ) : (
                  <MenuItem value="" disabled>Chargement des raisons...</MenuItem>
                )}
              </TextField>
            </TableCell>
            <TableCell 
              align="center"
              sx={{ 
                fontWeight: 'bold',
                color: ratings.raison_relation > 0 ? '#000' : '#666'
              }}
            >
              {ratings.raison_relation}
            </TableCell>
          </TableRow>

          {/* Critères de sélection */}
          <TableRow>
            <TableCell>Critères de sélection de ce tiers</TableCell>
            <TableCell>N/A</TableCell>
            <TableCell>
              <TextField
                fullWidth
                size="small"
                select
                value={tiers.critere_selection || ''}
                onChange={(e) => handleChange('critere_selection', e.target.value)}
                placeholder="Choix de la réponse..."
              >
                <MenuItem value="">---Choix de la réponse---</MenuItem>
                {criteresSelectionList.map((critere) => (
                  <MenuItem key={critere.id} value={critere.description}>
                    {critere.description}
                  </MenuItem>
                ))}
              </TextField>
            </TableCell>
            <TableCell align="center">{ratings.critere_selection}</TableCell>
          </TableRow>

          {/* Commentaires */}
          <TableRow>
            <TableCell>Commentaires (si nécessaire)</TableCell>
            <TableCell>
              Tout autre élément permettant de caractériser le tiers (identification de la maison mère si celle-ci se situe dans un pays sous sanction, etc.)
            </TableCell>
            <TableCell>
              <TextField
                fullWidth
                size="small"
                multiline
                rows={2}
                value={tiers.commentaires || ''}
                onChange={(e) => handleChange('commentaires', e.target.value)}
                placeholder="A compléter... (si nécessaire)"
              />
            </TableCell>
            <TableCell align="center">
              <Box sx={{ 
                backgroundColor: '#fff3e0', 
                p: 1, 
                borderRadius: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center'
              }}>
                <Typography variant="caption" sx={{ mb: 0.5 }}>
                  💡 Un score
                </Typography>
                <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                  intermédiaire
                </Typography>
                <Typography variant="caption">
                  est automatiquement généré.
                </Typography>
              </Box>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default IdentiteTiers;
