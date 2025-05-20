import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Paper, Grid, CircularProgress, Tab, Tabs,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Button, TablePagination, TableSortLabel
} from '@mui/material';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ScatterChart, Scatter, ZAxis, ComposedChart, Area
} from 'recharts';
import axios from 'axios';
import config from '../config';
// Import des données fictives pour enrichir les visualisations
import {
  fictiveHighRiskSuppliers,
  fictiveGeographicDistribution,
  fictiveGeographicStats,
  fictiveZoneScores,
  generateEnhancedStats,
  generateRiskEvolution
} from './mock-data';

const Analyse = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [orderBy, setOrderBy] = useState('score');
  const [order, setOrder] = useState('desc');
  const [stats, setStats] = useState({
    totalFournisseurs: 0,
    risqueTresFaible: 0,
    risqueFaible: 0,
    risqueMoyen: 0,
    risqueEleve: 0,
    nonEvalues: 0
  });
  const [scoreFilter, setScoreFilter] = useState(7);
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState('fournisseurs');
  const [loadingTables, setLoadingTables] = useState(false);

  // Couleurs pour les niveaux de risque : Très Faible, Faible, Modéré, Élevé, Non Évalués
  const COLORS = ['#90EE90', '#FFFF00', '#FFA500', '#FF0000', '#2196f3'];

  // Fonction pour récupérer la table par défaut
  const fetchDefaultTable = async () => {
    try {
      const response = await axios.get(`${config.apiUrl}/settings/default-table`);
      if (response.data.defaultTable) {
        console.log(`Table par défaut récupérée: ${response.data.defaultTable}`);
        return response.data.defaultTable;
      }
      return null;
    } catch (error) {
      console.error('Erreur lors de la récupération de la table par défaut:', error);
      return null;
    }
  };

  useEffect(() => {
    // Charger la liste des tables au chargement du composant
    fetchTables();
  }, []);
  
  useEffect(() => {
    if (selectedTable) {
      fetchData(selectedTable);
    }
  }, [selectedTable]);
  
  // Réinitialiser la page lorsque le filtre de score change
  useEffect(() => {
    setPage(0);
    // Pas besoin de recharger les données, juste de réinitialiser la pagination
    console.log(`Filtre de score changé à: ${scoreFilter}`);
  }, [scoreFilter]);

  const fetchTables = async () => {
    try {
      setLoadingTables(true);
      
      // Récupérer la liste des tables
      const response = await axios.get(`${config.apiUrl}/fournisseurs/tables`);
      const tablesList = response.data.tables || [];
      setTables(tablesList);
      
      // Récupérer la table par défaut depuis les paramètres
      const defaultTableName = await fetchDefaultTable();
      
      // Sélectionner la table par défaut si elle existe et est dans la liste
      if (defaultTableName && tablesList.includes(defaultTableName)) {
        console.log(`Utilisation de la table par défaut: ${defaultTableName}`);
        setSelectedTable(defaultTableName);
      } 
      // Sinon, utiliser une table avec "fournisseurs" dans le nom ou la première table disponible
      else if (tablesList.length > 0) {
        const fallbackTable = tablesList.find(table => 
          table.toLowerCase().includes('fournisseurs')
        ) || tablesList[0];
        
        console.log(`Aucune table par défaut définie, utilisation de: ${fallbackTable}`);
        setSelectedTable(fallbackTable);
      }
      
      setLoadingTables(false);
    } catch (error) {
      console.error('Erreur lors de la récupération des tables:', error);
      setLoadingTables(false);
    }
  };

  const fetchData = async (tableName) => {
    if (!tableName) {
      console.error('Aucune table sélectionnée pour le chargement des données');
      return;
    }
    
    console.log(`Chargement des données de la table: ${tableName}`);
    
    try {
      setLoading(true);
      const url = tableName === 'fournisseurs' 
        ? `${config.apiUrl}/fournisseurs?pageSize=15000` 
        : `${config.apiUrl}/fournisseurs/table/${tableName}?pageSize=15000`;
      
      console.log(`Récupération des données de la table ${tableName}:`, url);
      const response = await axios.get(url);
      
      // Extraire le tableau de données de la réponse
      let tableData = [];
      
      if (response.data && Array.isArray(response.data.data)) {
        // Format avec pagination
        tableData = response.data.data;
      } else if (Array.isArray(response.data)) {
        // Format tableau simple
        tableData = response.data;
      } else if (response.data && typeof response.data === 'object') {
        // Si c'est un objet mais pas un tableau, essayer de le convertir
        try {
          tableData = Object.values(response.data);
        } catch (e) {
          console.error('Impossible de convertir les données en tableau:', e);
          tableData = [];
        }
      }
      
      console.log(`Données récupérées pour ${tableName}: ${tableData.length} lignes`);
      setData(tableData);
      calculateStats(tableData);
    } catch (error) {
      console.error(`Erreur lors de la récupération des données de ${tableName}:`, error);
      setData([]);
      setStats({
        totalFournisseurs: 0,
        risqueEleve: 0,
        risqueMoyen: 0,
        risqueFaible: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (fournisseurs) => {
    // Calcul des statistiques réelles selon les nouvelles règles de risque :
    // 0 à 1 : Niveau de risque très faible
    // 2 à 4 : Niveau de risque faible
    // 5 à 7 : Niveau de risque modéré
    // 8 et plus : Niveau de risque élevé
    
    // Vérifier si les scores sont stockés sous 'score' ou 'Score'
    const realStats = {
      totalFournisseurs: fournisseurs.length,
      risqueTresFaible: fournisseurs.filter(f => {
        const score = f.Score !== undefined ? f.Score : f.score;
        return score !== undefined && score !== null && score >= 0 && score <= 1;
      }).length,
      risqueFaible: fournisseurs.filter(f => {
        const score = f.Score !== undefined ? f.Score : f.score;
        return score !== undefined && score !== null && score >= 2 && score <= 4;
      }).length,
      risqueMoyen: fournisseurs.filter(f => {
        const score = f.Score !== undefined ? f.Score : f.score;
        return score !== undefined && score !== null && score >= 5 && score <= 7;
      }).length,
      risqueEleve: fournisseurs.filter(f => {
        const score = f.Score !== undefined ? f.Score : f.score;
        return score !== undefined && score !== null && score >= 8;
      }).length,
      nonEvalues: fournisseurs.filter(f => {
        const score = f.Score !== undefined ? f.Score : f.score;
        return score === undefined || score === null;
      }).length
    };
    
    // Afficher des informations de débogage
    console.log('Statistiques calculées:', realStats);
    if (fournisseurs.length > 0) {
      const firstItem = fournisseurs[0];
      console.log('Premier élément:', firstItem);
      console.log('Propriétés disponibles:', Object.keys(firstItem));
      console.log('Score (minuscule):', firstItem.score);
      console.log('Score (majuscule):', firstItem.Score);
    }
    
    // Enrichissement avec des données fictives
    const enhancedStats = generateEnhancedStats(realStats);
    console.log('Statistiques enrichies:', enhancedStats);
    setStats(enhancedStats);
  };

  // Fonctions pour le tri des tableaux
  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Données pour les différents graphiques
  const getRisquesData = () => [
    { name: 'Risque Très Faible', value: stats.risqueTresFaible },
    { name: 'Risque Faible', value: stats.risqueFaible },
    { name: 'Risque Modéré', value: stats.risqueMoyen },
    { name: 'Risque Élevé', value: stats.risqueEleve },
    { name: 'Non Évalués', value: stats.nonEvalues }
  ];

  const getScoresParZone = () => {
    const zonesMap = new Map();
    data.forEach(item => {
      const zone = item['ORGANIZATION ZONE'] || 'Non spécifié';
      if (!zonesMap.has(zone)) {
        zonesMap.set(zone, { total: 0, count: 0 });
      }
      const zoneData = zonesMap.get(zone);
      if (item.score) {
        zoneData.total += parseFloat(item.score);
        zoneData.count += 1;
      }
    });

    // Données réelles
    const realZoneScores = Array.from(zonesMap)
      .filter(([_, data]) => data.count > 0) 
      .map(([zone, data]) => ({
        zone,
        scoreMoyen: data.count > 0 ? (data.total / data.count).toFixed(2) : 0
      }));
    
    // Enrichir avec des données fictives
    const enrichedZoneScores = [...realZoneScores];
    const existingZones = new Set(realZoneScores.map(item => item.zone));
    
    fictiveZoneScores.forEach(fictZone => {
      if (!existingZones.has(fictZone.zone)) {
        enrichedZoneScores.push({ ...fictZone });
      }
    });
    
    return enrichedZoneScores;
  };

  // Données pour la distribution géographique
  const getDistributionGeographique = () => {
    // Obtenir les données réelles
    const distribution = new Map();
    data.forEach(item => {
      const zone = item['ORGANIZATION ZONE'] || 'Non spécifié';
      distribution.set(zone, (distribution.get(zone) || 0) + 1);
    });

    const realDistribution = Array.from(distribution).map(([zone, count]) => ({
      zone,
      count,
      percentage: ((count / (data.length || 1)) * 100).toFixed(1)
    }));
    
    // Si les données réelles sont insuffisantes, utiliser les données fictives
    if (realDistribution.length < 3) {
      return fictiveGeographicDistribution;
    }
    
    // Enrichir avec des zones manquantes
    const allZones = ['EUROPE', 'NORTH AMERICA', 'SOUTH AMERICA', 'ASIA', 'AFRICA', 'MIDDLE EAST', 'OCEANIA'];
    const existingZones = new Set(realDistribution.map(item => item.zone));
    
    // Ajouter les zones manquantes
    const enrichedDistribution = [...realDistribution];
    allZones.forEach(zone => {
      if (!existingZones.has(zone)) {
        const fictitiousZone = fictiveGeographicDistribution.find(item => item.zone === zone);
        if (fictitiousZone) {
          enrichedDistribution.push({ ...fictitiousZone });
        }
      }
    });
    
    return enrichedDistribution;
  };

  // Données pour la matrice de risques
  const getMatriceRisques = () => {
    return data.map(item => ({
      x: parseFloat(item['Santé financière'] || 0),
      y: parseFloat(item['Risques compliance'] || 0),
      z: parseFloat(item.score || 0),
      name: item['PARTNERS GROUP']
    }));
  };

  // Données pour les informations manquantes nécessaires au calcul du risque
  const getInformationsManquantes = () => {
    // Vérifier que data est bien un tableau
    const dataArray = Array.isArray(data) ? data : [];
    
    console.log(`Nombre total de fournisseurs: ${dataArray.length}`);
    
    // Afficher les premiers éléments pour déboguer et identifier les noms de colonnes
    if (dataArray.length > 0) {
      console.log('Premier élément des données:', dataArray[0]);
      console.log('Noms des colonnes disponibles:', Object.keys(dataArray[0]));
    }
    
    // Fonction utilitaire pour vérifier si un champ est vide
    const estVide = (valeur) => {
      return valeur === null || valeur === undefined || valeur === '' || 
             (typeof valeur === 'string' && valeur.trim() === '');
    };
    
    // Compter directement le nombre de champs vides pour chaque catégorie
    const compteurTypes = {
      region: 0,
      pays: 0,
      localisation: 0,
      natureTier: 0
    };
    
    // Parcourir tous les fournisseurs et compter les champs vides
    dataArray.forEach(f => {
      // Vérifier uniquement les 4 colonnes spécifiques mentionnées par l'utilisateur
      if (estVide(f['Région d\'intervention'])) {
        compteurTypes.region++;
      }
      
      if (estVide(f['Pays d\'intervention'])) {
        compteurTypes.pays++;
      }
      
      if (estVide(f['Localisation'])) {
        compteurTypes.localisation++;
      }
      
      if (estVide(f['Nature du tiers'])) {
        compteurTypes.natureTier++;
      }
    });
    
    // Ajouter un log pour voir le nombre total d'informations manquantes
    console.log('Nombre total d\'informations manquantes:', {
      'Région d\'intervention': compteurTypes.region,
      'Pays d\'intervention': compteurTypes.pays,
      'Localisation': compteurTypes.localisation,
      'Nature du tiers': compteurTypes.natureTier
    });
    
    return [
      { name: 'Région d\'intervention', value: compteurTypes.region },
      { name: 'Pays d\'intervention', value: compteurTypes.pays },
      { name: 'Localisation', value: compteurTypes.localisation },
      { name: 'Nature du tiers', value: compteurTypes.natureTier }
    ];
  };

  // Tableau des fournisseurs à haut risque
  const getFournisseursRisque = () => {
    // Vérifier que data est bien un tableau
    const dataArray = Array.isArray(data) ? data : [];
    
    // Obtenir les données réelles
    const realData = dataArray
      .filter(f => {
        // Vérifier si le score est stocké sous 'score' ou 'Score'
        const scoreValue = f.Score !== undefined ? f.Score : f.score;
        if (!scoreValue) return false;
        
        const scoreNumber = parseFloat(scoreValue);
        return Math.round(scoreNumber) === scoreFilter;
      })
      .sort((a, b) => {
        const scoreA = parseFloat(a.Score !== undefined ? a.Score : a.score) || 0;
        const scoreB = parseFloat(b.Score !== undefined ? b.Score : b.score) || 0;
        return scoreB - scoreA;
      })
      .map(f => ({
        nom: f['PARTNERS GROUP'] || 'Inconnu',
        score: parseFloat(f.Score !== undefined ? f.Score : f.score) || 0,
        zone: f['ORGANIZATION ZONE'] || '',
        region: f['ORGANIZATION 1'] || '', 
        pays: f['ORGANIZATION COUNTRY'] || '', 
        localisation: f['Country of Supplier Contact'] || '', 
        natureTier: f['Activity Area'] || ''
      }));
    
    // Enrichir avec des données fictives
    const enrichedData = [...realData];
    
    // Ajouter des fournisseurs fictifs si les données réelles sont insuffisantes
    if (enrichedData.length < 10) {
      // Filtrer les fournisseurs fictifs pour correspondre au score sélectionné
      const filteredFictiveSuppliers = fictiveHighRiskSuppliers
        .filter(f => Math.round(f.score) === scoreFilter)
        .map(f => ({ ...f }));
      
      enrichedData.push(...filteredFictiveSuppliers);
    }
    
    return enrichedData;
  };

  // Fonction pour calculer les statistiques par catégorie de fournisseur et pour le graphique radar
  const getScoresByCategory = () => {
    const stats = new Map();

    // Traiter chaque fournisseur
    data.forEach(f => {
      const category = f['Activity Area'] || 'Non spécifié';
      if (!stats.has(category)) {
        stats.set(category, { total: 0, count: 0, maxScore: 0 });
      }
      const categoryData = stats.get(category);
      if (f.score) {
        const score = parseFloat(f.score);
        categoryData.total += score;
        categoryData.count += 1;
        categoryData.maxScore = Math.max(categoryData.maxScore, score);
      }
    });

    // Données réelles
    const realCategoryScores = Array.from(stats)
      .filter(([_, data]) => data.count > 0) 
      .map(([category, data]) => ({
        category,
        scoreMoyen: data.count > 0 ? (data.total / data.count).toFixed(2) : 0,
        maxScore: data.maxScore
      }));
    
    // Données fictives pour enrichir les catégories
    const fictiveCategoryScores = [
      { category: 'Logistique', scoreMoyen: '5.8', maxScore: 8 },
      { category: 'Informatique', scoreMoyen: '4.2', maxScore: 7 },
      { category: 'Production', scoreMoyen: '6.5', maxScore: 9 },
      { category: 'Communication', scoreMoyen: '3.9', maxScore: 6 },
      { category: 'Transport', scoreMoyen: '5.3', maxScore: 8 },
      { category: 'Matières premières', scoreMoyen: '7.1', maxScore: 10 },
      { category: 'Immobilier', scoreMoyen: '4.7', maxScore: 7 },
      { category: 'Conseil', scoreMoyen: '3.5', maxScore: 6 }
    ];
    
    // Si les données réelles sont insuffisantes, utiliser les données fictives
    if (realCategoryScores.length < 3) {
      return fictiveCategoryScores;
    }
    
    // Enrichir avec des données fictives
    const enrichedCategoryScores = [...realCategoryScores];
    const existingCategories = new Set(realCategoryScores.map(item => item.category));
    
    fictiveCategoryScores.forEach(fictCategory => {
      if (!existingCategories.has(fictCategory.category)) {
        enrichedCategoryScores.push({ ...fictCategory });
      }
    });
    
    return enrichedCategoryScores;
  };

  // Fonction pour calculer les statistiques par région géographique
  const getGeographicStats = () => {
    // Vérifier si data est défini et non vide
    if (!data || data.length === 0) {
      console.log("Aucune donnée disponible pour l'analyse géographique");
      return new Map(); // Retourner une Map vide pour éviter les erreurs
    }
    
    const stats = new Map();
    
    // Afficher un échantillon pour le débogage
    console.log('Analyse géographique - Premier élément:', data[0]);
    console.log('Propriétés disponibles:', Object.keys(data[0]));

    // Traiter chaque fournisseur
    data.forEach(f => {
      // Vérifier si les propriétés existent
      const continent = f['ORGANIZATION ZONE'] || 'Non spécifié';
      const pays = f['ORGANIZATION COUNTRY'] || 'Non spécifié';
      
      // Vérifier si le score est stocké sous 'score' ou 'Score'
      const scoreValue = f.Score !== undefined ? f.Score : f.score;
      const score = parseFloat(scoreValue) || 0;

      // Initialiser les données du continent s'il n'existe pas encore
      if (!stats.has(continent)) {
        stats.set(continent, {
          continent: continent,
          totalFournisseurs: 0,
          scoreTotal: 0,
          moyenneScore: 0,
          pays: new Map()
        });
      }

      // Mettre à jour les données du continent
      const continentData = stats.get(continent);
      continentData.totalFournisseurs += 1;
      continentData.scoreTotal += score;
      continentData.moyenneScore = continentData.scoreTotal / continentData.totalFournisseurs;

      // Mettre à jour les données du pays
      if (!continentData.pays.has(pays)) {
        continentData.pays.set(pays, {
          pays: pays,
          totalFournisseurs: 0,
          scoreTotal: 0,
          moyenneScore: 0
        });
      }
      
      const paysData = continentData.pays.get(pays);
      paysData.totalFournisseurs += 1;
      paysData.scoreTotal += score;
      paysData.moyenneScore = paysData.scoreTotal / paysData.totalFournisseurs;
    });

    return stats;
  };

  // Fonction pour calculer le pourcentage de remplissage de chaque colonne
  const getColumnFillRates = () => {
    if (!data || data.length === 0) {
      return [];
    }

    // Fonction pour vérifier si une valeur est vide
    const estVide = (valeur) => {
      return valeur === null || valeur === undefined || valeur === '' || 
             (typeof valeur === 'string' && valeur.trim() === '');
    };

    const totalRows = data.length;
    const fillRates = [];
    
    // Récupérer l'ordre des colonnes depuis le backend
    const fetchColumnOrder = async () => {
      try {
        const response = await axios.get(`${config.apiUrl}/table-structure/columns/${selectedTable}`);
        
        if (response.data && response.data.columns) {
          // Trier les colonnes par position
          const sortedColumns = response.data.columns.sort((a, b) => a.position - b.position);
          return sortedColumns.map(col => col.name);
        }
      } catch (error) {
        console.error('Erreur lors de la récupération de l\'ordre des colonnes:', error);
      }
      
      // En cas d'erreur, utiliser l'ordre par défaut des colonnes
      return Object.keys(data[0] || {});
    };
    
    // Obtenir toutes les colonnes disponibles dans les données
    const columns = Object.keys(data[0]);

    // Calculer le pourcentage de remplissage pour chaque colonne
    columns.forEach(column => {
      let filledCount = 0;

      // Compter le nombre de cellules remplies dans cette colonne
      data.forEach(row => {
        if (!estVide(row[column])) {
          filledCount++;
        }
      });

      // Calculer le pourcentage de remplissage
      const fillRate = (filledCount / totalRows) * 100;

      fillRates.push({
        column: column,
        fillRate: fillRate.toFixed(2),
        filledCount: filledCount,
        totalRows: totalRows
      });
    });

    // Conserver l'ordre original des colonnes (comme dans la page Home)
    return fillRates;
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  // Gestionnaire de changement de table
  const handleTableChange = (event) => {
    setSelectedTable(event.target.value);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 2 }}>
        Tableau de Bord d'Analyse des Risques Fournisseurs
      </Typography>
      
      {/* Sélecteur de table */}
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center' }}>
        <Typography variant="subtitle1" sx={{ mr: 2 }}>
          Sélectionner une table :
        </Typography>
        {loadingTables ? (
          <CircularProgress size={24} sx={{ ml: 2 }} />
        ) : (
          <select 
            value={selectedTable} 
            onChange={handleTableChange}
            style={{ 
              padding: '8px 12px', 
              borderRadius: '4px', 
              border: '1px solid #ccc',
              fontSize: '16px',
              minWidth: '200px'
            }}
          >
            {tables.map((table) => (
              <option key={table} value={table}>
                {table}
              </option>
            ))}
          </select>
        )}
      </Box>

      <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 3 }}>
        <Tab label="Vue d'ensemble" />
        <Tab label="Analyse géographique" />
        <Tab label="Analyse détaillée" />
        <Tab label="REMPLISSAGE" />
        <Tab label="Matrice des risques" />
      </Tabs>

      {tabValue === 0 && (
        <Grid container spacing={3}>
          {/* Statistiques générales */}
          <Grid item xs={12}>
            <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Statistiques Générales
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} md={2} lg={2}>
                  <Typography variant="h4">{stats.totalFournisseurs}</Typography>
                  <Typography color="textSecondary">Total Fournisseurs</Typography>
                </Grid>
                <Grid item xs={6} md={2} lg={2}>
                  <Typography variant="h4" sx={{ color: '#FF0000' }}>{stats.risqueEleve}</Typography>
                  <Typography color="textSecondary">Niveau de risque élevé</Typography>
                  <Typography variant="caption" color="textSecondary">(8 et plus)</Typography>
                </Grid>
                <Grid item xs={6} md={2} lg={2}>
                  <Typography variant="h4" sx={{ color: '#FFA500' }}>{stats.risqueMoyen}</Typography>
                  <Typography color="textSecondary">Niveau de risque modéré</Typography>
                  <Typography variant="caption" color="textSecondary">(5 à 7)</Typography>
                </Grid>
                <Grid item xs={6} md={2} lg={2}>
                  <Typography variant="h4" sx={{ color: '#FFFF00' }}>{stats.risqueFaible}</Typography>
                  <Typography color="textSecondary">Niveau de risque faible</Typography>
                  <Typography variant="caption" color="textSecondary">(2 à 4)</Typography>
                </Grid>
                <Grid item xs={6} md={2} lg={2}>
                  <Typography variant="h4" sx={{ color: '#90EE90' }}>{stats.risqueTresFaible}</Typography>
                  <Typography color="textSecondary">Niveau de risque très faible</Typography>
                  <Typography variant="caption" color="textSecondary">(0 à 1)</Typography>
                </Grid>
                <Grid item xs={6} md={2} lg={2}>
                  <Typography variant="h4" sx={{ color: '#9e9e9e' }}>{stats.nonEvalues}</Typography>
                  <Typography color="textSecondary">Non Évalués</Typography>
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* Graphique de répartition des risques */}
          <Grid item xs={12} md={6}>
            <Paper elevation={3} sx={{ p: 3, height: 400 }}>
              <Typography variant="h6" gutterBottom>
                Répartition des Niveaux de Risque
              </Typography>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={getRisquesData()}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label
                  >
                    {getRisquesData().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 3 ? '#9e9e9e' : COLORS[index]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>

          {/* Informations manquantes pour le calcul du risque */}
          <Grid item xs={12} md={6}>
            <Paper elevation={3} sx={{ p: 3, height: 400 }}>
              <Typography variant="h6" gutterBottom>
                Informations Manquantes Empêchant le Calcul du Risque
              </Typography>
              <ResponsiveContainer>
                <BarChart data={getInformationsManquantes()} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={150} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" fill="#1976d2" name="Nombre d'informations manquantes pour calculer la note de risque" />
                </BarChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>

          {/* Tableau des fournisseurs à haut risque */}
          <Grid item xs={12}>
            <Paper elevation={3} sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  Fournisseurs à Haut Risque
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography variant="body2">
                    Filtrer par Score:
                  </Typography>
                  <select
                    value={scoreFilter}
                    onChange={(e) => setScoreFilter(Number(e.target.value))}
                    style={{ 
                      padding: '8px',
                      borderRadius: '4px',
                      border: '1px solid #ccc'
                    }}
                  >
                    {[1,2,3,4,5,6,7,8,9,10].map(score => (
                      <option key={score} value={score}>Score {score}</option>
                    ))}
                  </select>
                </Box>
              </Box>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Nom du Fournisseur</TableCell>
                      <TableCell>Score</TableCell>
                      <TableCell>Zone</TableCell>
                      <TableCell>Region d'intervention</TableCell>
                      <TableCell>Pays d'intervention</TableCell>
                      <TableCell>Localisation</TableCell>
                      <TableCell>Nature de Tier</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {getFournisseursRisque()
                      .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                      .map((fournisseur, index) => (
                        <TableRow key={index}>
                          <TableCell>{fournisseur.nom}</TableCell>
                          <TableCell>{fournisseur.score}</TableCell>
                          <TableCell>{fournisseur.zone}</TableCell>
                          <TableCell>{fournisseur.region}</TableCell>
                          <TableCell>{fournisseur.pays}</TableCell>
                          <TableCell>{fournisseur.localisation}</TableCell>
                          <TableCell>{fournisseur.natureTier}</TableCell>
                        </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <TablePagination
                  rowsPerPageOptions={[5, 10, 25]}
                  component="div"
                  count={getFournisseursRisque().length}
                  rowsPerPage={rowsPerPage}
                  page={page}
                  onPageChange={handleChangePage}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                />
              </TableContainer>
            </Paper>
          </Grid>
        </Grid>
      )}

      {tabValue === 1 && (
        <Grid container spacing={3}>
          {/* Tableau d'analyse géographique */}
          <Grid item xs={12}>
            <Paper elevation={3} sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Analyse Géographique des Fournisseurs
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Continent</TableCell>
                      <TableCell>Pays</TableCell>
                      <TableCell>Nombre de Fournisseurs</TableCell>
                      <TableCell>Note Moyenne</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {Array.from(getGeographicStats().values()).map(continentData => {
                      // Ligne pour le continent
                      return [
                        <TableRow 
                          key={continentData.continent}
                          sx={{ backgroundColor: '#f5f5f5' }}
                        >
                          <TableCell><strong>{continentData.continent}</strong></TableCell>
                          <TableCell>Tous les pays</TableCell>
                          <TableCell>{continentData.totalFournisseurs}</TableCell>
                          <TableCell>{continentData.moyenneScore ? continentData.moyenneScore.toFixed(2) : '0.00'}</TableCell>
                        </TableRow>,
                        // Lignes pour chaque pays du continent
                        Array.from(continentData.pays.values()).map(paysData => (
                          <TableRow key={`${continentData.continent}-${paysData.pays}`}>
                            <TableCell></TableCell>
                            <TableCell>{paysData.pays}</TableCell>
                            <TableCell>{paysData.totalFournisseurs}</TableCell>
                            <TableCell>{paysData.moyenneScore ? paysData.moyenneScore.toFixed(2) : '0.00'}</TableCell>
                          </TableRow>
                        ))
                      ];
                    }).flat()}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>

          {/* Carte des risques par zone géographique */}
          <Grid item xs={12}>
            <Paper elevation={3} sx={{ p: 3, height: 500 }}>
              <Typography variant="h6" gutterBottom>
                Score Moyen par Zone Géographique
              </Typography>
              <ResponsiveContainer>
                <BarChart data={getScoresParZone()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="zone" 
                    angle={-45}
                    textAnchor="end"
                    height={150}
                    interval={0}
                    tick={{
                      fontSize: 12,
                      width: 200,
                      wordWrap: 'break-word'
                    }}
                  />
                  <YAxis />
                  <Tooltip />
                  <Bar 
                    name="Score Moyen" 
                    dataKey="scoreMoyen" 
                    fill="#8884d8"
                  />
                </BarChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>

          {/* Distribution géographique */}
          <Grid item xs={12}>
            <Paper elevation={3} sx={{ p: 3, height: 500 }}>
              <Typography variant="h6" gutterBottom>
                Distribution Géographique
              </Typography>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={getDistributionGeographique()}
                    dataKey="count"
                    nameKey="zone"
                    cx="50%"
                    cy="50%"
                    outerRadius={180}
                    label={({name, percent}) => {
                      // Ne pas afficher les étiquettes pour les sections < 1.5%
                      if ((percent * 100) < 1.5) return null;
                      
                      // Formater le texte pour les étiquettes
                      let displayName = name;
                      if (name === "CENTRAL & SOUTH AMERICA") {
                        displayName = "CENTRAL &\nSOUTH\nAMERICA";
                      } else if (name === "MIDDLE EAST") {
                        displayName = "MIDDLE\nEAST";
                      } else if (name === "Non spécifié") {
                        displayName = "Non\nspécifié";
                      }
                      return `${displayName}\n(${(percent * 100).toFixed(1)}%)`;
                    }}
                    labelLine={(props) => {
                      const percent = props.percent;
                      return (percent * 100) >= 1.5;
                    }}
                  >
                    {getDistributionGeographique().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
        </Grid>
      )}

      {tabValue === 2 && (
        <Grid container spacing={3}>
          {/* Radar des catégories */}
          <Grid item xs={12} md={6}>
            <Paper elevation={3} sx={{ p: 3, height: 500 }}>
              <Typography variant="h6" gutterBottom>
                Analyse des Risques par Catégorie
              </Typography>
              <ResponsiveContainer>
                <RadarChart data={getScoresByCategory()}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="category" />
                  <PolarRadiusAxis />
                  <Radar name="Score Moyen" dataKey="scoreMoyen" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                  <Radar name="Score Maximum" dataKey="maxScore" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.6} />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>

          {/* Tableau détaillé par catégorie */}
          <Grid item xs={12} md={6}>
            <Paper elevation={3} sx={{ p: 3, height: 500 }}>
              <Typography variant="h6" gutterBottom>
                Détails par Catégorie
              </Typography>
              <TableContainer sx={{ maxHeight: 440 }}>
                <Table stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell>Catégorie</TableCell>
                      <TableCell>Score Moyen</TableCell>
                      <TableCell>Score Maximum</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {getScoresByCategory().map((row, index) => (
                      <TableRow key={index}>
                        <TableCell>{row.category}</TableCell>
                        <TableCell>{row.scoreMoyen}</TableCell>
                        <TableCell>{row.maxScore}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>
        </Grid>
      )}

      {tabValue === 3 && (
        <Grid container spacing={3}>
          {/* Tableau détaillé du taux de remplissage */}
          <Grid item xs={12}>
            <Paper elevation={3} sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Détail du Taux de Remplissage par Colonne
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="textSecondary">
                  Ce tableau montre le pourcentage de remplissage de chaque colonne dans la table sélectionnée.
                  L'ordre des colonnes est le même que dans le tableau de la page d'accueil.
                </Typography>
              </Box>
              <TableContainer sx={{ maxHeight: 600 }}>
                <Table stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell>Colonne</TableCell>
                      <TableCell>Taux de Remplissage</TableCell>
                      <TableCell>Cellules Remplies</TableCell>
                      <TableCell>Total Lignes</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {getColumnFillRates().map((row, index) => (
                      <TableRow key={index}>
                        <TableCell>{row.column}</TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Box sx={{ 
                              width: '100px', 
                              mr: 1, 
                              bgcolor: '#e0e0e0', 
                              borderRadius: 1, 
                              height: '10px' 
                            }}>
                              <Box 
                                sx={{ 
                                  width: `${row.fillRate}%`, 
                                  bgcolor: parseFloat(row.fillRate) < 50 ? '#f44336' : 
                                           parseFloat(row.fillRate) < 80 ? '#ff9800' : '#4caf50', 
                                  height: '10px',
                                  borderRadius: 1
                                }} 
                              />
                            </Box>
                            <Typography variant="body2">{row.fillRate}%</Typography>
                          </Box>
                        </TableCell>
                        <TableCell>{row.filledCount}</TableCell>
                        <TableCell>{row.totalRows}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>
        </Grid>
      )}

      {tabValue === 4 && (
        <Grid container spacing={3}>
          {/* Matrice des risques */}
          <Grid item xs={12}>
            <Paper elevation={3} sx={{ p: 3, height: 600 }}>
              <Typography variant="h6" gutterBottom>
                Matrice des Risques (Financier vs Compliance)
              </Typography>
              <ResponsiveContainer>
                <ScatterChart>
                  <CartesianGrid />
                  <XAxis type="number" dataKey="x" name="Risque Financier" />
                  <YAxis type="number" dataKey="y" name="Risque Compliance" />
                  <ZAxis type="number" dataKey="z" range={[100, 1000]} name="Score" />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                  <Scatter name="Fournisseurs" data={getMatriceRisques()} fill="#8884d8" />
                </ScatterChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default Analyse;
