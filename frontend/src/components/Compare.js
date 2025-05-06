import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  CircularProgress,
  Checkbox,
  FormControlLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  Snackbar,
  Divider,
  Chip,
  TablePagination,
  Container,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import axios from 'axios';
import config from '../config';

const Compare = () => {
  // États pour les tables sélectionnées
  const [tables, setTables] = useState([]);
  const [selectedTable1, setSelectedTable1] = useState('');
  const [selectedTable2, setSelectedTable2] = useState('');
  const [loading, setLoading] = useState(false);
  const [tableLoading, setTableLoading] = useState(false);
  const [error, setError] = useState(null);
  const [compareResult, setCompareResult] = useState(null);
  const [showOnlyDifferences, setShowOnlyDifferences] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [selectedRow, setSelectedRow] = useState(null);

  // États pour la comparaison d'Annual Spend
  const [selectedSpendTable1, setSelectedSpendTable1] = useState('');
  const [selectedSpendTable2, setSelectedSpendTable2] = useState('');
  const [spendCompareResult, setSpendCompareResult] = useState(null);
  const [spendLoading, setSpendLoading] = useState(false);
  const [spendError, setSpendError] = useState(null);
  const [spendPage, setSpendPage] = useState(0);
  const [spendRowsPerPage, setSpendRowsPerPage] = useState(10);

  // État pour la pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Charger la liste des tables disponibles
  useEffect(() => {
    const fetchTables = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${config.apiUrl}/fournisseurs/tables`);
        if (response.data && response.data.tables) {
          setTables(response.data.tables);
          if (response.data.tables.length > 1) {
            setSelectedTable1(response.data.tables[0]);
            setSelectedTable2(response.data.tables[1]);
          }
        }
      } catch (error) {
        console.error('Erreur lors du chargement des tables:', error);
        setError('Erreur lors du chargement des tables');
        setSnackbar({
          open: true,
          message: 'Erreur lors du chargement des tables',
          severity: 'error'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchTables();
  }, []);

  // Fonction pour récupérer toutes les données d'une table avec pagination
  const fetchAllTableData = async (tableName) => {
    try {
      console.log(`Début de la récupération des données pour ${tableName}`);
      let allData = [];
      let currentPage = 1;
      const pageSize = 1000; // Taille de page optimisée pour la performance
      let hasMoreData = true;
      let totalRows = 0;

      // Première requête pour obtenir le nombre total de lignes
      const initialResponse = await axios.get(`${config.apiUrl}/fournisseurs/table/${tableName}`, {
        params: {
          page: 1,
          pageSize: 1
        }
      });
      
      if (initialResponse.data && initialResponse.data.totalCount) {
        totalRows = initialResponse.data.totalCount;
        console.log(`Table ${tableName} contient ${totalRows} lignes au total`);
      }

      // Récupérer toutes les données par pages
      while (hasMoreData) {
        console.log(`Récupération de la page ${currentPage} pour ${tableName}`);
        const response = await axios.get(`${config.apiUrl}/fournisseurs/table/${tableName}`, {
          params: {
            page: currentPage,
            pageSize: pageSize
          }
        });

        const { data, totalCount } = response.data;
        console.log(`Reçu ${data?.length || 0} lignes sur ${totalCount} pour ${tableName}`);
        
        if (data && data.length > 0) {
          allData = [...allData, ...data];
          // Vérifier si nous avons récupéré toutes les données
          if (allData.length >= totalCount) {
            console.log(`Toutes les données récupérées pour ${tableName} (${allData.length} lignes)`);
            hasMoreData = false;
          } else {
            currentPage++;
          }
        } else {
          console.log(`Aucune donnée reçue pour la page ${currentPage} de ${tableName}`);
          hasMoreData = false;
        }
      }

      console.log(`Récupération terminée pour ${tableName}, ${allData.length} lignes sur ${totalRows} au total`);
      return allData;
    } catch (error) {
      console.error(`Erreur lors de la récupération des données pour ${tableName}:`, error);
      throw error;
    }
  };

  // Fonction pour comparer les tables
  const compareTables = async () => {
    if (!selectedTable1 || !selectedTable2) {
      setSnackbar({
        open: true,
        message: 'Veuillez sélectionner deux tables à comparer',
        severity: 'warning'
      });
      return;
    }

    if (selectedTable1 === selectedTable2) {
      setSnackbar({
        open: true,
        message: 'Veuillez sélectionner deux tables différentes',
        severity: 'warning'
      });
      return;
    }

    try {
      setTableLoading(true);
      setError(null);
      setCompareResult(null);

      // Afficher un message pour indiquer que la récupération des données est en cours
      setSnackbar({
        open: true,
        message: 'Récupération de toutes les données des tables...',
        severity: 'info'
      });

      // Récupérer toutes les données des deux tables avec pagination
      const [table1Data, table2Data] = await Promise.all([
        fetchAllTableData(selectedTable1),
        fetchAllTableData(selectedTable2)
      ]);

      // Informer l'utilisateur du nombre de lignes récupérées
      setSnackbar({
        open: true,
        message: `Comparaison de ${table1Data.length} lignes de ${selectedTable1} avec ${table2Data.length} lignes de ${selectedTable2}`,
        severity: 'info'
      });

      // Comparer les données
      const result = compareTableData(table1Data, table2Data);
      setCompareResult(result);

    } catch (error) {
      console.error('Erreur lors de la comparaison des tables:', error);
      setError('Erreur lors de la comparaison des tables');
      setSnackbar({
        open: true,
        message: 'Erreur lors de la comparaison des tables',
        severity: 'error'
      });
    } finally {
      setTableLoading(false);
    }
  };

  // Fonction améliorée pour normaliser les valeurs pour la comparaison
  const normalizeValue = (value) => {
    // Traiter les cas null et undefined
    if (value === null || value === undefined) {
      return '';
    }
    
    // Si la valeur est une chaîne
    if (typeof value === 'string') {
      // Convertir en minuscules et supprimer les espaces en début et fin
      return value.toLowerCase().trim();
    }
    
    // Si la valeur est un nombre, la convertir en chaîne
    if (typeof value === 'number') {
      return value.toString();
    }
    
    // Pour les autres types (booléens, dates, etc.)
    return String(value).toLowerCase();
  };

  // Fonction pour comparer les données des tables
  const compareTableData = (table1Data, table2Data) => {
    try {
      console.log(`Début de la comparaison: ${table1Data.length} lignes dans table1, ${table2Data.length} lignes dans table2`);
      
      // Obtenir toutes les colonnes uniques des deux tables
      const allColumns = new Set();
      if (table1Data.length > 0) {
        Object.keys(table1Data[0]).forEach(col => {
          allColumns.add(col);
        });
      }
      if (table2Data.length > 0) {
        Object.keys(table2Data[0]).forEach(col => {
          allColumns.add(col);
        });
      }
      console.log(`Colonnes identifiées: ${Array.from(allColumns).join(', ')}`);
      
      // Exclure la colonne ID de la comparaison
      allColumns.delete('id');
      allColumns.delete('ID');
      allColumns.delete('Id');
      console.log(`Colonnes après exclusion de l'ID: ${Array.from(allColumns).join(', ')}`);

      // Créer un index composé pour les données de la table 2 basé sur Supplier_ID et Partners
      console.log('Création des index pour la table 2...');
      const table2Index = {};
      
      table2Data.forEach((row, index) => {
        try {
          // Extraire Supplier_ID et Partners (différentes variantes possibles)
          const supplierId = row.supplier_id || row.Supplier_ID || row.SUPPLIER_ID || '';
          const partners = row.partners || row.Partners || row.PARTNERS || '';
          
          // Créer une clé composée
          const normalizedSupplierId = String(supplierId).toLowerCase().trim();
          const normalizedPartners = String(partners).toLowerCase().trim();
          
          // Utiliser les deux champs comme clé d'index
          const compositeKey = `${normalizedSupplierId}|${normalizedPartners}`;
          
          // Stocker la référence à la ligne
          table2Index[compositeKey] = row;
          
          // Créer également un index secondaire basé uniquement sur Supplier_ID pour les cas où Partners ne correspond pas
          if (normalizedSupplierId && !table2Index[normalizedSupplierId]) {
            table2Index[normalizedSupplierId] = row;
          }
        } catch (err) {
          console.error(`Erreur lors de l'indexation de la ligne ${index} de la table 2:`, err);
        }
      });
      console.log(`Index créé avec ${Object.keys(table2Index).length} entrées`);

      // Comparer les lignes
      console.log('Début de la comparaison des lignes...');
      const comparisonResults = [];
      const processedTable2Keys = new Set(); // Pour suivre les lignes de la table 2 déjà traitées
      
      // 1. Traiter les lignes de la table 1
      console.log('Analyse des lignes de la table 1...');
      table1Data.forEach((row1, index) => {
        try {
          // Extraire les identifiants
          const supplierId1 = row1.supplier_id || row1.Supplier_ID || row1.SUPPLIER_ID || 'N/A';
          const partners1 = row1.partners || row1.Partners || row1.PARTNERS || 'N/A';
          const id1 = row1.id || row1.ID || row1.Id || 'N/A';
          
          // Normaliser les identifiants pour la recherche
          const normalizedSupplierId1 = String(supplierId1).toLowerCase().trim();
          const normalizedPartners1 = String(partners1).toLowerCase().trim();
          
          // Créer une clé composée
          const compositeKey = `${normalizedSupplierId1}|${normalizedPartners1}`;
          
          // Chercher la ligne correspondante dans la table 2 (d'abord avec la clé composée)
          let row2 = table2Index[compositeKey];
          let matchType = 'supplier_id_and_partners';
          
          // Si pas de correspondance exacte, essayer avec seulement Supplier_ID
          if (!row2 && normalizedSupplierId1) {
            row2 = table2Index[normalizedSupplierId1];
            matchType = 'supplier_id';
          }
          
          if (row2) {
            // Marquer comme traité
            processedTable2Keys.add(compositeKey);
            
            // Si match par Supplier_ID uniquement, marquer également cette clé
            if (matchType === 'supplier_id') {
              processedTable2Keys.add(normalizedSupplierId1);
            }
            
            // Comparer les colonnes (sauf ID)
            const differences = {};
            let hasDifferences = false;
            
            allColumns.forEach(column => {
              try {
                // Ignorer la colonne ID dans la comparaison
                if (column.toLowerCase() === 'id') return;
                
                const value1 = row1[column] !== undefined ? row1[column] : null;
                const value2 = row2[column] !== undefined ? row2[column] : null;
                
                // Normaliser les valeurs
                const normalizedValue1 = normalizeValue(value1);
                const normalizedValue2 = normalizeValue(value2);
                
                // Comparer
                if (normalizedValue1 !== normalizedValue2) {
                  differences[column] = {
                    table1: value1,
                    table2: value2
                  };
                  hasDifferences = true;
                }
              } catch (err) {
                console.error(`Erreur lors de la comparaison de la colonne ${column}:`, err);
              }
            });
            
            // Ajouter aux résultats
            comparisonResults.push({
              id: id1, // Conserver l'ID pour l'affichage uniquement
              supplierId: supplierId1,
              partners: partners1,
              matchType,
              existsInTable1: true,
              existsInTable2: true,
              differences,
              hasDifferences
            });
          } else {
            // La ligne n'existe que dans la table 1
            comparisonResults.push({
              id: id1,
              supplierId: supplierId1,
              partners: partners1,
              matchType: 'none',
              existsInTable1: true,
              existsInTable2: false,
              differences: {},
              hasDifferences: true
            });
          }
        } catch (err) {
          console.error(`Erreur lors du traitement de la ligne ${index} de la table 1:`, err);
        }
      });
      
      // 2. Trouver les lignes qui n'existent que dans la table 2
      console.log('Analyse des lignes uniques de la table 2...');
      table2Data.forEach((row2, index) => {
        try {
          // Extraire les identifiants
          const supplierId2 = row2.supplier_id || row2.Supplier_ID || row2.SUPPLIER_ID || 'N/A';
          const partners2 = row2.partners || row2.Partners || row2.PARTNERS || 'N/A';
          const id2 = row2.id || row2.ID || row2.Id || 'N/A';
          
          // Normaliser les identifiants
          const normalizedSupplierId2 = String(supplierId2).toLowerCase().trim();
          const normalizedPartners2 = String(partners2).toLowerCase().trim();
          
          // Créer une clé composée
          const compositeKey = `${normalizedSupplierId2}|${normalizedPartners2}`;
          
          // Vérifier si cette ligne a déjà été traitée
          if (processedTable2Keys.has(compositeKey) || processedTable2Keys.has(normalizedSupplierId2)) {
            return; // Déjà traitée
          }
          
          // Cette ligne n'existe que dans la table 2
          comparisonResults.push({
            id: id2,
            supplierId: supplierId2,
            partners: partners2,
            matchType: 'none',
            existsInTable1: false,
            existsInTable2: true,
            differences: {},
            hasDifferences: true
          });
        } catch (err) {
          console.error(`Erreur lors du traitement de la ligne ${index} de la table 2:`, err);
        }
      });

      // 3. Calculer les statistiques
      console.log('Calcul des statistiques...');
      const stats = {
        totalRows: comparisonResults.length,
        rowsWithDifferences: comparisonResults.filter(r => r.hasDifferences).length,
        onlyInTable1: comparisonResults.filter(r => r.existsInTable1 && !r.existsInTable2).length,
        onlyInTable2: comparisonResults.filter(r => !r.existsInTable1 && r.existsInTable2).length,
        columnsWithMostDifferences: []
      };
      
      // 4. Calculer les colonnes avec le plus de différences
      if (stats.rowsWithDifferences > 0) {
        const columnDifferences = {};
        
        // Compter les différences par colonne
        comparisonResults.forEach(result => {
          if (result.hasDifferences && result.existsInTable1 && result.existsInTable2) {
            Object.keys(result.differences).forEach(column => {
              if (!columnDifferences[column]) {
                columnDifferences[column] = 0;
              }
              columnDifferences[column]++;
            });
          }
        });
        
        // Convertir en tableau et trier
        stats.columnsWithMostDifferences = Object.entries(columnDifferences)
          .map(([column, count]) => ({ column, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5); // Top 5
      }
      
      console.log(`Comparaison terminée: ${stats.totalRows} lignes au total, ${stats.rowsWithDifferences} avec différences`);
      
      return {
        table1Name: selectedTable1,
        table2Name: selectedTable2,
        columns: Array.from(allColumns),
        results: comparisonResults,
        stats: stats
      };
    } catch (error) {
      console.error('Erreur lors de la comparaison des tables:', error);
      throw new Error(`Erreur lors de la comparaison des tables: ${error.message}`);
    }
  };

  // Fonction pour gérer le changement de page
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  // Fonction pour gérer le changement du nombre de lignes par page
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  // Fonction pour gérer le changement de page pour la comparaison d'Annual Spend
  const handleSpendChangePage = (event, newPage) => {
    setSpendPage(newPage);
  };

  // Fonction pour gérer le changement du nombre de lignes par page pour la comparaison d'Annual Spend
  const handleSpendChangeRowsPerPage = (event) => {
    setSpendRowsPerPage(parseInt(event.target.value, 10));
    setSpendPage(0);
  };
  
  // Fonction pour comparer l'Annual Spend entre deux tables
  const compareAnnualSpend = async () => {
    if (!selectedSpendTable1 || !selectedSpendTable2) {
      setSnackbar({
        open: true,
        message: 'Veuillez sélectionner deux tables à comparer',
        severity: 'warning'
      });
      return;
    }

    if (selectedSpendTable1 === selectedSpendTable2) {
      setSnackbar({
        open: true,
        message: 'Veuillez sélectionner deux tables différentes',
        severity: 'warning'
      });
      return;
    }

    try {
      setSpendLoading(true);
      setSpendError(null);
      setSpendCompareResult(null);

      // Afficher un message pour indiquer que la récupération des données est en cours
      setSnackbar({
        open: true,
        message: 'Récupération des données pour la comparaison d\'Annual Spend...',
        severity: 'info'
      });

      // Récupérer toutes les données des deux tables avec pagination
      const [table1Data, table2Data] = await Promise.all([
        fetchAllTableData(selectedSpendTable1),
        fetchAllTableData(selectedSpendTable2)
      ]);

      // Informer l'utilisateur du nombre de lignes récupérées
      setSnackbar({
        open: true,
        message: `Comparaison de l'Annual Spend entre ${table1Data.length} lignes de ${selectedSpendTable1} et ${table2Data.length} lignes de ${selectedSpendTable2}`,
        severity: 'info'
      });

      // Comparer les données d'Annual Spend
      const result = compareAnnualSpendData(table1Data, table2Data);
      setSpendCompareResult(result);

    } catch (error) {
      console.error('Erreur lors de la comparaison de l\'Annual Spend:', error);
      setSpendError('Erreur lors de la comparaison de l\'Annual Spend');
      setSnackbar({
        open: true,
        message: 'Erreur lors de la comparaison de l\'Annual Spend',
        severity: 'error'
      });
    } finally {
      setSpendLoading(false);
    }
  };
  
  // Fonction pour comparer les données d'Annual Spend entre deux tables
  const compareAnnualSpendData = (table1Data, table2Data) => {
    try {
      console.log(`Début de la comparaison d'Annual Spend: ${table1Data.length} lignes dans table1, ${table2Data.length} lignes dans table2`);
      
      // Identifier les colonnes Annual Spend dans les deux tables
      const annualSpendColumns1 = Object.keys(table1Data[0] || {}).filter(col => 
        col.toLowerCase().startsWith('annual spend'));
      const annualSpendColumns2 = Object.keys(table2Data[0] || {}).filter(col => 
        col.toLowerCase().startsWith('annual spend'));
      
      console.log(`Colonnes Annual Spend dans table1: ${annualSpendColumns1.join(', ')}`);
      console.log(`Colonnes Annual Spend dans table2: ${annualSpendColumns2.join(', ')}`);
      
      if (annualSpendColumns1.length === 0 || annualSpendColumns2.length === 0) {
        throw new Error('Aucune colonne Annual Spend trouvée dans une ou les deux tables');
      }
      
      // Utiliser la première colonne Annual Spend trouvée dans chaque table
      const annualSpendCol1 = annualSpendColumns1[0];
      const annualSpendCol2 = annualSpendColumns2[0];
      
      // Créer un index pour la table 2 basé sur Supplier_ID, Partners et SUBSIDIARY
      const table2Index = {};
      table2Data.forEach(row => {
        const supplierId = row.supplier_id || row.Supplier_ID || row.SUPPLIER_ID || '';
        const partners = row.partners || row.Partners || row.PARTNERS || '';
        const subsidiary = row.subsidiary || row.Subsidiary || row.SUBSIDIARY || '';
        
        // Normaliser les identifiants
        const normalizedSupplierId = String(supplierId).toLowerCase().trim();
        const normalizedPartners = String(partners).toLowerCase().trim();
        const normalizedSubsidiary = String(subsidiary).toLowerCase().trim();
        
        // Créer une clé composée avec les trois champs
        const compositeKey = `${normalizedSupplierId}|${normalizedPartners}|${normalizedSubsidiary}`;
        
        // Stocker la référence à la ligne
        table2Index[compositeKey] = row;
        
        // Créer également un index secondaire basé sur Supplier_ID et Partners
        const supplierPartnersKey = `${normalizedSupplierId}|${normalizedPartners}`;
        if (!table2Index[supplierPartnersKey]) {
          table2Index[supplierPartnersKey] = row;
        }
        
        // Créer également un index tertiaire basé uniquement sur Supplier_ID
        if (normalizedSupplierId && !table2Index[normalizedSupplierId]) {
          table2Index[normalizedSupplierId] = row;
        }
      });
      
      // Comparer les valeurs d'Annual Spend
      const comparisonResults = [];
      
      table1Data.forEach(row1 => {
        // Extraire les identifiants
        const supplierId = row1.supplier_id || row1.Supplier_ID || row1.SUPPLIER_ID || 'N/A';
        const partners = row1.partners || row1.Partners || row1.PARTNERS || 'N/A';
        const subsidiary = row1.subsidiary || row1.Subsidiary || row1.SUBSIDIARY || 'N/A';
        
        // Normaliser les identifiants
        const normalizedSupplierId = String(supplierId).toLowerCase().trim();
        const normalizedPartners = String(partners).toLowerCase().trim();
        const normalizedSubsidiary = String(subsidiary).toLowerCase().trim();
        
        // Créer une clé composée avec les trois champs
        const compositeKey = `${normalizedSupplierId}|${normalizedPartners}|${normalizedSubsidiary}`;
        
        // Chercher la ligne correspondante dans la table 2
        let row2 = table2Index[compositeKey];
        let matchType = 'supplier_id_partners_subsidiary';
        
        // Si pas de correspondance exacte, essayer avec Supplier_ID et Partners
        if (!row2) {
          const supplierPartnersKey = `${normalizedSupplierId}|${normalizedPartners}`;
          row2 = table2Index[supplierPartnersKey];
          if (row2) matchType = 'supplier_id_and_partners';
        }
        
        // Si toujours pas de correspondance, essayer avec seulement Supplier_ID
        if (!row2 && normalizedSupplierId) {
          row2 = table2Index[normalizedSupplierId];
          if (row2) matchType = 'supplier_id';
        }
        
        if (row2) {
          // Extraire les valeurs d'Annual Spend
          const annualSpend1 = parseFloat(row1[annualSpendCol1] || 0);
          const annualSpend2 = parseFloat(row2[annualSpendCol2] || 0);
          
          // Calculer la différence
          const difference = annualSpend1 - annualSpend2;
          const percentDifference = annualSpend2 !== 0 ? (difference / annualSpend2) * 100 : 0;
          
          comparisonResults.push({
            supplierId,
            partners,
            subsidiary,
            matchType,
            annualSpend1,
            annualSpend2,
            difference,
            percentDifference,
            existsInBothTables: true
          });
        } else {
          // La ligne n'existe que dans la table 1
          const annualSpend1 = parseFloat(row1[annualSpendCol1] || 0);
          
          comparisonResults.push({
            supplierId,
            partners,
            subsidiary,
            matchType: 'none',
            annualSpend1,
            annualSpend2: 0,
            difference: annualSpend1,
            percentDifference: 100,
            existsInBothTables: false
          });
        }
      });
      
      // Trier les résultats par différence absolue (du plus grand au plus petit)
      comparisonResults.sort((a, b) => Math.abs(b.difference) - Math.abs(a.difference));
      
      return {
        table1Name: selectedSpendTable1,
        table2Name: selectedSpendTable2,
        annualSpendCol1,
        annualSpendCol2,
        results: comparisonResults
      };
      
    } catch (error) {
      console.error('Erreur lors de la comparaison des données d\'Annual Spend:', error);
      throw error;
    }
  };

  // Filtrer les résultats pour n'afficher que les différences si demandé
  const getFilteredResults = () => {
    if (!compareResult) return [];
    
    if (showOnlyDifferences) {
      return compareResult.results.filter(result => result.hasDifferences);
    }
    
    return compareResult.results;
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Comparaison de Tables
      </Typography>
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel id="table1-label">Table 1</InputLabel>
            <Select
              labelId="table1-label"
              value={selectedTable1}
              label="Table 1"
              onChange={(e) => setSelectedTable1(e.target.value)}
              disabled={loading}
            >
              {tables.map((table) => (
                <MenuItem key={`table1-${table}`} value={table}>
                  {table}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel id="table2-label">Table 2</InputLabel>
            <Select
              labelId="table2-label"
              value={selectedTable2}
              label="Table 2"
              onChange={(e) => setSelectedTable2(e.target.value)}
              disabled={loading}
            >
              {tables.map((table) => (
                <MenuItem key={`table2-${table}`} value={table}>
                  {table}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <Button
            variant="contained"
            startIcon={<CompareArrowsIcon />}
            onClick={compareTables}
            disabled={loading || tableLoading || !selectedTable1 || !selectedTable2}
          >
            {tableLoading ? <CircularProgress size={24} /> : 'Comparer'}
          </Button>
        </Box>
        
        {compareResult && (
          <FormControlLabel
            control={
              <Checkbox
                checked={showOnlyDifferences}
                onChange={(e) => setShowOnlyDifferences(e.target.checked)}
              />
            }
            label="Afficher uniquement les différences"
          />
        )}
      </Paper>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {compareResult && (
        <>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Résumé de la comparaison
            </Typography>
            
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
              <Chip 
                label={`Total: ${compareResult.stats.totalRows} lignes`} 
                color="primary" 
                variant="outlined"
              />
              <Chip 
                label={`Différences: ${compareResult.stats.rowsWithDifferences} lignes`} 
                color="warning" 
                variant="outlined"
              />
              <Chip 
                label={`Uniquement dans ${compareResult.table1Name}: ${compareResult.stats.onlyInTable1} lignes`} 
                color="error" 
                variant="outlined"
              />
              <Chip 
                label={`Uniquement dans ${compareResult.table2Name}: ${compareResult.stats.onlyInTable2} lignes`} 
                color="error" 
                variant="outlined"
              />
            </Box>
            
            {compareResult.stats.columnsWithMostDifferences.length > 0 && (
              <>
                <Typography variant="subtitle1" gutterBottom>
                  Colonnes avec le plus de différences:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {compareResult.stats.columnsWithMostDifferences.map(({ column, count }) => (
                    <Chip 
                      key={column}
                      label={`${column}: ${count} différences`} 
                      color="info" 
                      size="small"
                    />
                  ))}
                </Box>
              </>
            )}
          </Paper>
          
          <TableContainer component={Paper} style={{ marginTop: '20px' }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Supplier ID</TableCell>
                  <TableCell>Partners</TableCell>
                  <TableCell>Match Type</TableCell>
                  <TableCell>Existe dans {compareResult.table1Name}</TableCell>
                  <TableCell>Existe dans {compareResult.table2Name}</TableCell>
                  <TableCell>Différences</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {getFilteredResults()
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((row, index) => (
                    <TableRow key={index} 
                      style={{
                        backgroundColor: !row.existsInTable1 ? '#ffebee' : // Rouge clair pour lignes seulement dans table 2
                                          !row.existsInTable2 ? '#e8f5e9' : // Vert clair pour lignes seulement dans table 1
                                          row.hasDifferences ? '#fff8e1' : // Jaune clair pour lignes avec différences
                                          'inherit' // Couleur par défaut pour lignes identiques
                      }}
                    >
                      <TableCell>{row.id}</TableCell>
                      <TableCell>{row.supplierId}</TableCell>
                      <TableCell>{row.partners}</TableCell>
                      <TableCell>{row.matchType}</TableCell>
                      <TableCell>
                        {row.existsInTable1 ? <CheckIcon color="success" /> : <CloseIcon color="error" />}
                      </TableCell>
                      <TableCell>
                        {row.existsInTable2 ? <CheckIcon color="success" /> : <CloseIcon color="error" />}
                      </TableCell>
                      <TableCell>
                        {row.hasDifferences && row.existsInTable1 && row.existsInTable2 ? (
                          <Button
                            variant="outlined"
                            color="primary"
                            size="small"
                            onClick={() => setSelectedRow(row)}
                          >
                            Voir les différences ({Object.keys(row.differences).length})
                          </Button>
                        ) : (
                          row.existsInTable1 && row.existsInTable2 ? (
                            <Chip 
                              label="Identique" 
                              color="success" 
                              size="small"
                            />
                          ) : (
                            "N/A"
                          )
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
            <TablePagination
              rowsPerPageOptions={[10, 25, 50, 100]}
              component="div"
              count={getFilteredResults().length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              labelRowsPerPage="Lignes par page:"
              labelDisplayedRows={({ from, to, count }) => `${from}-${to} sur ${count}`}
            />
          </TableContainer>
        </>
      )}
      
      {/* Dialogue pour afficher les détails des différences */}
      <Dialog
        open={Boolean(selectedRow)}
        onClose={() => setSelectedRow(null)}
        maxWidth="md"
        fullWidth
      >
        {selectedRow && (
          <>
            <DialogTitle>
              Détails des différences - Fournisseur {selectedRow.supplierId}
            </DialogTitle>
            <DialogContent>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Colonne</TableCell>
                      <TableCell>{compareResult.table1Name}</TableCell>
                      <TableCell>{compareResult.table2Name}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {Object.entries(selectedRow.differences).map(([column, values]) => (
                      <TableRow key={column}>
                        <TableCell><strong>{column}</strong></TableCell>
                        <TableCell style={{ backgroundColor: '#e8f5e9' }}>
                          {values.table1 !== null && values.table1 !== undefined ? values.table1.toString() : '(vide)'}
                        </TableCell>
                        <TableCell style={{ backgroundColor: '#ffebee' }}>
                          {values.table2 !== null && values.table2 !== undefined ? values.table2.toString() : '(vide)'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setSelectedRow(null)} color="primary">
                Fermer
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Section de comparaison de l'Annual Spend */}
      <Typography variant="h4" gutterBottom sx={{ mt: 6 }}>
        Comparaison de l'Annual Spend
      </Typography>
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel id="spend-table1-label">Table 1</InputLabel>
            <Select
              labelId="spend-table1-label"
              value={selectedSpendTable1}
              label="Table 1"
              onChange={(e) => setSelectedSpendTable1(e.target.value)}
              disabled={loading || spendLoading}
            >
              {tables.map((table) => (
                <MenuItem key={`spend-table1-${table}`} value={table}>
                  {table}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel id="spend-table2-label">Table 2</InputLabel>
            <Select
              labelId="spend-table2-label"
              value={selectedSpendTable2}
              label="Table 2"
              onChange={(e) => setSelectedSpendTable2(e.target.value)}
              disabled={loading || spendLoading}
            >
              {tables.map((table) => (
                <MenuItem key={`spend-table2-${table}`} value={table}>
                  {table}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <Button
            variant="contained"
            startIcon={<CompareArrowsIcon />}
            onClick={compareAnnualSpend}
            disabled={loading || spendLoading || !selectedSpendTable1 || !selectedSpendTable2}
          >
            {spendLoading ? <CircularProgress size={24} /> : 'COMPARER'}
          </Button>
        </Box>
      </Paper>
      
      {spendError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {spendError}
        </Alert>
      )}
      
      {spendCompareResult && (
        <>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Résumé de la comparaison d'Annual Spend
            </Typography>
            
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
              <Chip 
                label={`Total: ${spendCompareResult.results.length} lignes comparées`} 
                color="primary" 
                variant="outlined"
              />
              <Chip 
                label={`Colonne dans ${spendCompareResult.table1Name}: ${spendCompareResult.annualSpendCol1}`} 
                color="info" 
                variant="outlined"
              />
              <Chip 
                label={`Colonne dans ${spendCompareResult.table2Name}: ${spendCompareResult.annualSpendCol2}`} 
                color="info" 
                variant="outlined"
              />
            </Box>
          </Paper>
          
          <TableContainer component={Paper} style={{ marginTop: '20px' }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Supplier ID</TableCell>
                  <TableCell>PARTNERS</TableCell>
                  <TableCell>SUBSIDIARY</TableCell>
                  <TableCell>Type de correspondance</TableCell>
                  <TableCell>{spendCompareResult.annualSpendCol1} ({spendCompareResult.table1Name})</TableCell>
                  <TableCell>{spendCompareResult.annualSpendCol2} ({spendCompareResult.table2Name})</TableCell>
                  <TableCell>Différence</TableCell>
                  <TableCell>Différence (%)</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {spendCompareResult.results
                  .slice(spendPage * spendRowsPerPage, spendPage * spendRowsPerPage + spendRowsPerPage)
                  .map((row, index) => (
                    <TableRow key={index} 
                      style={{
                        backgroundColor: !row.existsInBothTables ? '#ffebee' : // Rouge clair pour lignes non présentes dans les deux tables
                                          Math.abs(row.difference) > 10000 ? '#fff8e1' : // Jaune clair pour différences importantes
                                          'inherit' // Couleur par défaut pour les autres lignes
                      }}
                    >
                      <TableCell>{row.supplierId}</TableCell>
                      <TableCell>{row.partners}</TableCell>
                      <TableCell>{row.subsidiary}</TableCell>
                      <TableCell>
                        {row.matchType === 'supplier_id_partners_subsidiary' ? (
                          <Chip size="small" label="Exact" color="success" />
                        ) : row.matchType === 'supplier_id_and_partners' ? (
                          <Chip size="small" label="Sans SUBSIDIARY" color="warning" />
                        ) : row.matchType === 'supplier_id' ? (
                          <Chip size="small" label="Supplier ID uniquement" color="error" />
                        ) : (
                          <Chip size="small" label="Aucune correspondance" color="default" />
                        )}
                      </TableCell>
                      <TableCell>
                        {row.annualSpend1.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                      </TableCell>
                      <TableCell>
                        {row.annualSpend2.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                      </TableCell>
                      <TableCell>
                        {row.difference.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                      </TableCell>
                      <TableCell>
                        {row.percentDifference.toFixed(2)}%
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
            <TablePagination
              rowsPerPageOptions={[10, 25, 50, 100]}
              component="div"
              count={spendCompareResult.results.length}
              rowsPerPage={spendRowsPerPage}
              page={spendPage}
              onPageChange={handleSpendChangePage}
              onRowsPerPageChange={handleSpendChangeRowsPerPage}
              labelRowsPerPage="Lignes par page:"
              labelDisplayedRows={({ from, to, count }) => `${from}-${to} sur ${count}`}
            />
          </TableContainer>
        </>
      )}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Compare;
