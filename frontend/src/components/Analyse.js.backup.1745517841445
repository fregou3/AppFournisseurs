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
    risqueEleve: 0,
    risqueMoyen: 0,
    risqueFaible: 0
  });
  const [scoreFilter, setScoreFilter] = useState(7);

  const COLORS = ['#4caf50', '#ff9800', '#f44336', '#2196f3'];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await axios.get(`${config.apiUrl}/fournisseurs`);
      // Extraire le tableau de données de la réponse
    setData(response.data.data || []);
    
      calculateStats(response.data.data || []);
      setLoading(false);
    } catch (error) {
      console.error('Erreur lors de la récupération des données:', error);
      setLoading(false);
    }
  };

  const calculateStats = (fournisseurs) => {
    const stats = {
      totalFournisseurs: fournisseurs.length,
      risqueEleve: fournisseurs.filter(f => f.score >= 7).length,
      risqueMoyen: fournisseurs.filter(f => f.score >= 4 && f.score < 7).length,
      risqueFaible: fournisseurs.filter(f => f.score < 4).length
    };
    setStats(stats);
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
    { name: 'Risque Faible', value: stats.risqueFaible },
    { name: 'Risque Moyen', value: stats.risqueMoyen },
    { name: 'Risque Élevé', value: stats.risqueEleve }
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

    return Array.from(zonesMap)
      .filter(([_, data]) => data.count > 0) 
      .map(([zone, data]) => ({
        zone,
        scoreMoyen: data.count > 0 ? (data.total / data.count).toFixed(2) : 0
      }))
      .filter(item => parseFloat(item.scoreMoyen) > 0); 
  };

  // Nouvelles données pour le radar chart des catégories
  const getRadarData = () => {
    const categories = new Map();
    data.forEach(item => {
      const category = item['Activity Area'] || 'Non spécifié';
      if (!categories.has(category)) {
        categories.set(category, {
          category,
          scoreTotal: 0,
          count: 0,
          maxScore: 0
        });
      }
      const catData = categories.get(category);
      if (item.score) {
        const score = parseFloat(item.score);
        catData.scoreTotal += score;
        catData.count += 1;
        catData.maxScore = Math.max(catData.maxScore, score);
      }
    });

    return Array.from(categories.values())
      .filter(cat => cat.count > 0)
      .map(cat => ({
        category: cat.category,
        scoreMoyen: (cat.scoreTotal / cat.count).toFixed(2),
        maxScore: cat.maxScore
      }))
      .slice(0, 8); // Limiter aux 8 principales catégories
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

  // Données pour l'évolution des risques
  const getEvolutionRisques = () => {
    const evolution = Array(12).fill(0).map((_, i) => ({
      mois: i + 1,
      risqueEleve: Math.random() * stats.risqueEleve,
      risqueMoyen: Math.random() * stats.risqueMoyen,
      risqueFaible: Math.random() * stats.risqueFaible
    }));
    return evolution;
  };

  // Tableau des fournisseurs à haut risque
  const getFournisseursRisque = () => {
    // Vérifier que data est bien un tableau
    const dataArray = Array.isArray(data) ? data : [];
    return dataArray
      .filter(f => Math.round(f.score) === scoreFilter)
      .sort((a, b) => b.score - a.score)
      .map(f => ({
        nom: f['PARTNERS GROUP'],
        score: f.score,
        zone: f['ORGANIZATION ZONE'],
        region: f['ORGANIZATION 1'], 
        pays: f['ORGANIZATION COUNTRY'], 
        localisation: f['Country of Supplier Contact'], 
        natureTier: f['Activity Area'] 
      }));
  };

  // Données pour la distribution géographique
  const getDistributionGeographique = () => {
    const distribution = new Map();
    data.forEach(item => {
      const zone = item['ORGANIZATION ZONE'] || 'Non spécifié';
      distribution.set(zone, (distribution.get(zone) || 0) + 1);
    });

    return Array.from(distribution).map(([zone, count]) => ({
      zone,
      count,
      percentage: ((count / data.length) * 100).toFixed(1)
    }));
  };

  // Fonction pour calculer les statistiques par région géographique
  const getGeographicStats = () => {
    const stats = new Map();

    // Traiter chaque fournisseur
    data.forEach(f => {
      const continent = f['ORGANIZATION ZONE'] || 'Non spécifié';
      const pays = f['ORGANIZATION COUNTRY'] || 'Non spécifié';
      const score = parseFloat(f.score) || 0;
      const nom = f['PARTNERS GROUP'];

      // Initialiser ou mettre à jour les statistiques du continent
      if (!stats.has(continent)) {
        stats.set(continent, {
          continent,
          pays: new Map(),
          totalScore: 0,
          count: 0,
          fournisseurs: new Set(),
          moyenneScore: 0
        });
      }

      const continentStats = stats.get(continent);
      continentStats.totalScore += score;
      continentStats.count += 1;
      continentStats.fournisseurs.add(nom);
      continentStats.moyenneScore = continentStats.totalScore / continentStats.count;

      // Initialiser ou mettre à jour les statistiques du pays
      if (!continentStats.pays.has(pays)) {
        continentStats.pays.set(pays, {
          pays,
          totalScore: 0,
          count: 0,
          fournisseurs: new Set(),
          moyenneScore: 0
        });
      }

      const paysStats = continentStats.pays.get(pays);
      paysStats.totalScore += score;
      paysStats.count += 1;
      paysStats.fournisseurs.add(nom);
      paysStats.moyenneScore = paysStats.totalScore / paysStats.count;
    });

    return stats;
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

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 4 }}>
        Tableau de Bord d'Analyse des Risques Fournisseurs
      </Typography>

      <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 3 }}>
        <Tab label="Vue d'ensemble" />
        <Tab label="Analyse géographique" />
        <Tab label="Analyse détaillée" />
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
                <Grid item xs={3}>
                  <Typography variant="h4">{stats.totalFournisseurs}</Typography>
                  <Typography color="textSecondary">Total Fournisseurs</Typography>
                </Grid>
                <Grid item xs={3}>
                  <Typography variant="h4" color="error">{stats.risqueEleve}</Typography>
                  <Typography color="textSecondary">Risque Élevé</Typography>
                </Grid>
                <Grid item xs={3}>
                  <Typography variant="h4" sx={{ color: '#ff9800' }}>{stats.risqueMoyen}</Typography>
                  <Typography color="textSecondary">Risque Moyen</Typography>
                </Grid>
                <Grid item xs={3}>
                  <Typography variant="h4" sx={{ color: '#4caf50' }}>{stats.risqueFaible}</Typography>
                  <Typography color="textSecondary">Risque Faible</Typography>
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
                      <Cell key={`cell-${index}`} fill={COLORS[index]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>

          {/* Évolution des risques */}
          <Grid item xs={12} md={6}>
            <Paper elevation={3} sx={{ p: 3, height: 400 }}>
              <Typography variant="h6" gutterBottom>
                Évolution des Risques
              </Typography>
              <ResponsiveContainer>
                <ComposedChart data={getEvolutionRisques()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mois" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="risqueFaible" fill="#4caf50" stroke="#4caf50" />
                  <Area type="monotone" dataKey="risqueMoyen" fill="#ff9800" stroke="#ff9800" />
                  <Area type="monotone" dataKey="risqueEleve" fill="#f44336" stroke="#f44336" />
                </ComposedChart>
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
                          <TableCell>{continentData.fournisseurs.size}</TableCell>
                          <TableCell>{continentData.moyenneScore.toFixed(2)}</TableCell>
                        </TableRow>,
                        // Lignes pour chaque pays du continent
                        Array.from(continentData.pays.values()).map(paysData => (
                          <TableRow key={`${continentData.continent}-${paysData.pays}`}>
                            <TableCell></TableCell>
                            <TableCell>{paysData.pays}</TableCell>
                            <TableCell>{paysData.fournisseurs.size}</TableCell>
                            <TableCell>{paysData.moyenneScore.toFixed(2)}</TableCell>
                          </TableRow>
                        ))
                      ];
                    })}
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
                <RadarChart data={getRadarData()}>
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
                    {getRadarData().map((row, index) => (
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
