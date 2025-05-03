import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { correctColumnNames, correctFilters } from '../utils/column-mapper';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Box,
  TextField,
  Menu,
  MenuItem,
  Checkbox,
  FormControlLabel,
  Typography,
  Button,
  TablePagination,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar,
  Chip,
  Input,
  CircularProgress
} from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import ViewColumnIcon from '@mui/icons-material/ViewColumn';
import ClearIcon from '@mui/icons-material/Clear';
import SaveIcon from '@mui/icons-material/Save';
import UploadIcon from '@mui/icons-material/Upload';
import axios from 'axios';
import config from '../config';

const DataTable = ({ 
  data = [], 
  isGroupView = false,
  externalFilters,
  setExternalFilters,
  externalVisibleColumns,
  setExternalVisibleColumns,
  onDataUpdate,
  tableName: propTableName
}) => {
  console.log('DataTable - Props reçues:', {
    dataLength: (Array.isArray(data) ? data : []).length,
    firstRow: data[0],
    isGroupView,
    externalFilters,
    externalVisibleColumns: externalVisibleColumns ? Array.from(externalVisibleColumns) : null
  });

  // États locaux
  const [localFilters, setLocalFilters] = useState({});
  const [localVisibleColumns, setLocalVisibleColumns] = useState(() => {
    // Par défaut, toutes les colonnes sont visibles
    if (data && (Array.isArray(data) ? data : []).length > 0) {
      return new Set(Object.keys(data && data[0] ? data[0] : {}));
    }
    return new Set();
  });
  const [searchText, setSearchText] = useState('');
  const [columnMenuAnchor, setColumnMenuAnchor] = useState(null);
  const [filterAnchorEl, setFilterAnchorEl] = useState({});
  const [uploadError, setUploadError] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [openGroupDialog, setOpenGroupDialog] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupError, setGroupError] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  
  // Créer un Map pour stocker les refs des inputs de fichier
  const fileInputRefs = useRef(new Map());

  // Réinitialiser les refs quand les données source changent
  useEffect(() => {
    fileInputRefs.current = new Map();
  }, [data]);

  // Fonction pour obtenir ou créer une ref pour un fournisseur
  const getFileInputRef = useCallback((id) => {
    if (!fileInputRefs.current.has(id)) {
      fileInputRefs.current.set(id, React.createRef());
    }
    return fileInputRefs.current.get(id);
  }, []);

  // Utiliser les filtres externes s'ils existent, sinon utiliser les filtres locaux
  const filters = externalFilters || localFilters;
  
  // Utiliser les colonnes visibles externes si elles existent, sinon utiliser les colonnes visibles locales
  // S'assurer que visibleColumns est toujours un objet Set et qu'il contient au moins les colonnes de base
  const visibleColumns = useMemo(() => {
    // Déterminer les colonnes disponibles
    const availableColumns = data && (Array.isArray(data) ? data : []).length > 0 ? Object.keys(data && data[0] ? data[0] : {}) : [];
    
    // Créer un Set avec les colonnes visibles
    let result;
    if (externalVisibleColumns) {
      result = externalVisibleColumns instanceof Set ? 
        new Set(externalVisibleColumns) : 
        new Set(Array.isArray(externalVisibleColumns) ? externalVisibleColumns : []);
    } else {
      result = new Set(localVisibleColumns);
    }
    
    // Si le Set est vide, ajouter toutes les colonnes disponibles
    if (result.size === 0 && availableColumns.length > 0) {
      availableColumns.forEach(col => result.add(col));
    }
    
    return result;
  }, [externalVisibleColumns, localVisibleColumns, data]);
  
  // Fonction pour vérifier si une colonne est visible
  const isColumnVisible = (column) => {
    // Vérifier si visibleColumns est un Set et utiliser la méthode has
    if (visibleColumns instanceof Set) {
      return visibleColumns.has(column);
    }
    // Fallback au cas où visibleColumns n'est pas un Set
    if (Array.isArray(visibleColumns)) {
      return visibleColumns.includes(column);
    }
    // Par défaut, toutes les colonnes sont visibles
    return true;
  };
  
  // Synchroniser les filtres locaux avec les filtres externes si nécessaire
  useEffect(() => {
    if (externalFilters && Object.keys(externalFilters).length > 0) {
      setLocalFilters(externalFilters);
    }
  }, [externalFilters]);
  
  // Synchroniser les colonnes visibles locales avec les colonnes visibles externes si nécessaires
  useEffect(() => {
    if (externalVisibleColumns && externalVisibleColumns.size > 0) {
      setLocalVisibleColumns(new Set(externalVisibleColumns));
    }
  }, [externalVisibleColumns]);

  // Calculer les données filtrées
  const filteredData = useMemo(() => {
    // S'assurer que data est un tableau
    let result = Array.isArray(data) ? [...data] : [];

    // Appliquer la recherche textuelle
    if (searchText && result.length > 0) {
      const searchLower = searchText.toLowerCase();
      result = result.filter(row => 
        Object.values(row).some(value => 
          value != null && value.toString().toLowerCase().includes(searchLower)
        )
      );
    }

    // Appliquer les filtres
    if (filters && Object.keys(filters).length > 0 && result.length > 0) {
      Object.entries(filters).forEach(([column, selectedValues]) => {
        if (selectedValues && selectedValues.length > 0) {
          result = result.filter(row => 
            selectedValues.includes(row[column]?.toString() || '')
          );
        }
      });
    }

    return result;
  }, [data, searchText, filters]);

  // Calculer les données paginées
  const paginatedData = useMemo(() => {
    const start = page * rowsPerPage;
    return filteredData.slice(start, start + rowsPerPage);
  }, [filteredData, page, rowsPerPage]);

  // Calculer les valeurs uniques pour chaque colonne
  const columnValues = useMemo(() => {
    const values = {};
    // S'assurer que data est un tableau et qu'il contient au moins un élément
    if (Array.isArray(data) && data.length > 0) {
      Object.keys(data[0]).forEach(column => {
        const uniqueValues = new Set();
        data.forEach(row => {
          if (row[column] != null) {
            uniqueValues.add(row[column].toString());
          }
        });
        values[column] = Array.from(uniqueValues).sort();
      });
    }
    return values;
  }, [data]);

  // État pour stocker l'ordre des colonnes de la table
  const [tableColumns, setTableColumns] = useState([]);
  const [isLoadingColumns, setIsLoadingColumns] = useState(false);
  
  // Déterminer le nom de la table en fonction des données et des props
  const tableName = useMemo(() => {
    // Si le nom de la table est passé en prop, l'utiliser
    if (propTableName) {
      return propTableName;
    }
    
    // Si les données contiennent une colonne 'table_name', l'utiliser
    if (data && (Array.isArray(data) ? data : []).length > 0 && data[0].hasOwnProperty('table_name')) {
      return data[0].table_name;
    }
    
    // Sinon, essayer de déterminer le nom de la table à partir de l'URL
    const currentUrl = window.location.href;
    if (currentUrl.includes('/table/')) {
      const urlParts = currentUrl.split('/table/');
      if (urlParts.length > 1) {
        return urlParts[1].split('/')[0];
      }
    }
    
    // Par défaut, utiliser 'fournisseurs'
    return 'fournisseurs';
  }, [data, propTableName]);
  
  // Charger l'ordre des colonnes depuis le backend
  useEffect(() => {
    const fetchColumnOrder = async () => {
      if (!data || (Array.isArray(data) ? data : []).length === 0) return;
      
      try {
        setIsLoadingColumns(true);
        const response = await axios.get(`${config.apiUrl}/table-structure/columns/${tableName}`);
        
        if (response.data && response.data.columns) {
          // Trier les colonnes par position
          const sortedColumns = response.data.columns.sort((a, b) => a.position - b.position);
          setTableColumns(sortedColumns.map(col => col.name));
        }
      } catch (error) {
        console.error('Erreur lors de la récupération de l\'ordre des colonnes:', error);
        // En cas d'erreur, utiliser l'ordre par défaut des colonnes
        setTableColumns(Object.keys(data && data[0] ? data[0] : {}));
      } finally {
        setIsLoadingColumns(false);
      }
    };
    
    fetchColumnOrder();
  }, [data, tableName]);
  
  // Calculer les colonnes à afficher
  const displayColumns = useMemo(() => {
    if (!data || (Array.isArray(data) ? data : []).length === 0) return [];
    
    // Obtenir toutes les colonnes disponibles
    let allColumns;
    
    // Si nous avons l'ordre des colonnes depuis le backend, l'utiliser
    if (tableColumns.length > 0) {
      allColumns = [...tableColumns];
    } else {
      // Sinon, utiliser l'ordre par défaut
      allColumns = Object.keys(data && data[0] ? data[0] : {});
      
      // Si evaluated_not_evaluated n'existe pas, ajouter Eval Moodies après score
      if (!allColumns.includes('evaluated_not_evaluated')) {
        const scoreIndex = allColumns.indexOf('score');
        if (scoreIndex !== -1) {
          allColumns.splice(scoreIndex + 1, 0, 'Eval Moodies');
        } else {
          allColumns.push('Eval Moodies');
        }
      }
    }
    
    // Si visibleColumns est vide ou si aucune colonne n'est visible, afficher toutes les colonnes
    if (visibleColumns.size === 0 || !allColumns.some(col => isColumnVisible(col))) {
      return allColumns;
    }
    
    // Filtrer pour n'afficher que les colonnes visibles
    return allColumns.filter(column => isColumnVisible(column));
  }, [data, tableColumns, visibleColumns]);

  // Fonction pour obtenir les valeurs uniques d'une colonne
  const getUniqueValues = (column) => {
    return columnValues[column] || [];
  };

  // Style des colonnes
  const getHeaderStyle = (columnName) => {
    const baseStyle = {
      fontWeight: 'bold',
      color: '#FFFFFF'
    };

    // Fonction pour déterminer la couleur en fonction du nom de colonne
    const getColumnColor = (colName) => {
      const lowerColName = colName.toLowerCase();
      
      // Colonnes en #FF9800 (orange) - Identifiants et organisation
      if (lowerColName.includes('id') || 
          lowerColName.includes('supplier') || 
          lowerColName.includes('procurement') || 
          lowerColName.includes('partners') || 
          lowerColName.includes('evaluated') || 
          lowerColName.includes('organization') || 
          lowerColName.includes('country')) {
        return '#FF9800';
      }
      
      // Colonnes en #4CAF50 (vert) - Ecovadis et dates
      else if (lowerColName.includes('ecovadis') || 
              lowerColName.includes('score') || 
              lowerColName.includes('date')) {
        return '#4CAF50';
      }
      
      // Colonnes en #C62828 (rouge) - Informations de contact et détails fournisseur
      else if (lowerColName.includes('subsidiary') || 
              lowerColName.includes('original') || 
              lowerColName.includes('contact') || 
              lowerColName.includes('vat') || 
              lowerColName.includes('activity') || 
              lowerColName.includes('spend') || 
              lowerColName.includes('name') || 
              lowerColName.includes('email') || 
              lowerColName.includes('phone') || 
              lowerColName.includes('adresse')) {
        return '#C62828';
      }
      
      // Colonnes en #582900 (marron) - Nature et localisation
      else if (lowerColName.includes('nature') || 
              lowerColName.includes('tiers') || 
              lowerColName.includes('localisation') || 
              lowerColName.includes('pays') || 
              lowerColName.includes('region') || 
              isScoreColumn(colName)) {
        return '#582900';
      }
      
      // Couleur par défaut pour les autres colonnes
      return '#1976d2';
    };

    // Mapping spécifique pour certaines colonnes
    const colorMapping = {
      // Colonnes en #FF9800 (orange)
      'id': '#FF9800',
      'supplier_id': '#FF9800',
      'Supplier_ID': '#FF9800',
      'PROCUREMENT ORGA': '#FF9800',
      'procurement_orga': '#FF9800',
      'PARTNERS': '#FF9800',
      'partners': '#FF9800',
      'Evaluated / Not Evaluated': '#FF9800',
      'evaluated_not_evaluated': '#FF9800',
      'ORGANIZATION 1': '#FF9800',
      'organization_1': '#FF9800',
      'ORGANIZATION 2': '#FF9800',
      'organization_2': '#FF9800',
      'ORGANIZATION COUNTRY': '#FF9800',
      'organization_country': '#FF9800',

      // Colonnes en #4CAF50 (vert)
      'Ecovadis name': '#4CAF50',
      'ecovadis_name': '#4CAF50',
      'Score Ecovadis': '#4CAF50',
      'score_ecovadis': '#4CAF50',
      'Date': '#4CAF50',
      'date': '#4CAF50',
      'Ecovadis ID': '#4CAF50',
      'ecovadis_id': '#4CAF50',

      // Colonnes en #C62828 (rouge)
      'SUBSIDIARY': '#C62828',
      'subsidiary': '#C62828',
      'ORIGINAL NAME PARTNER': '#C62828',
      'original_name_partner': '#C62828',
      'Country of Supplier Contact': '#C62828',
      'country_of_supplier_contact': '#C62828',
      'VAT number': '#C62828',
      'vat_number': '#C62828',
      'Activity Area': '#C62828',
      'activity_area': '#C62828',
      'Annual spend k€ A-2023': '#C62828',
      'annual_spend_k_a_2023': '#C62828',
      'Supplier Contact First Name': '#C62828',
      'supplier_contact_first_name': '#C62828',
      'Supplier Contact Last Name': '#C62828',
      'supplier_contact_last_name': '#C62828',
      'Supplier Contact Email': '#C62828',
      'supplier_contact_email': '#C62828',
      'Supplier Contact Phone': '#C62828',
      'supplier_contact_phone': '#C62828',
      'Adresse fournisseur': '#C62828',
      'adresse_fournisseur': '#C62828',
      'Adresse': '#C62828',
      'adresse': '#C62828',

      // Colonnes en #582900 (marron)
      'NATURE DU TIERS': '#582900',
      'nature_du_tiers': '#582900',
      'Nature du tiers': '#582900',
      'localisation': '#582900',
      "Pays d'intervention": '#582900',
      "pays_d_intervention": '#582900',
      "Région d'intervention": '#582900',
      "region_d_intervention": '#582900',
      'score': '#582900'
    };

    // Si la colonne a un filtre actif, utiliser une couleur de fond plus claire
    // Utiliser le mapping spécifique ou la fonction générique
    const bgColor = colorMapping[columnName] || getColumnColor(columnName);
    return {
      ...baseStyle,
      backgroundColor: bgColor
    };
  };

    // Fonction pour vérifier si une colonne est liée au score
  const isScoreColumn = (columnName) => {
    const lowerCol = columnName.toLowerCase();
    return lowerCol === 'score' || columnName === 'Score' || lowerCol.includes('score');
  };

  // Style des cellules avec score
  const getScoreStyle = (score) => {
    if (score === null) return {};

    const scoreNum = parseInt(score);
    const styles = {
      2: {
        backgroundColor: '#90EE90',
        label: 'Risque très faible',
        color: '#1b5e20'
      },
      4: {
        backgroundColor: '#FFFF00',
        label: 'Risque faible',
        color: '#8b8000'
      },
      5: {
        backgroundColor: '#FFA500',
        label: 'Risque modéré',
        color: '#804000'
      },
      6: {
        backgroundColor: '#FFA500',
        label: 'Risque modéré',
        color: '#804000'
      },
      7: {
        backgroundColor: '#FFA500',
        label: 'Risque modéré',
        color: '#804000'
      },
      8: {
        backgroundColor: '#FF0000',
        label: 'Risque élevé',
        color: 'white'
      },
      9: {
        backgroundColor: '#FF0000',
        label: 'Risque élevé',
        color: 'white'
      },
      11: {
        backgroundColor: '#FF0000',
        label: 'Risque élevé',
        color: 'white'
      },
      13: {
        backgroundColor: '#FF0000',
        label: 'Risque élevé',
        color: 'white'
      }
    };

    return styles[scoreNum] || {};
  };

  const renderScoreCell = (score) => {
    if (score === null) return '';
    
    const style = getScoreStyle(score);
    return (
      <Chip
        label={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
              {score}
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.9 }}>
              {style.label}
            </Typography>
          </Box>
        }
        sx={{
          backgroundColor: style.backgroundColor,
          color: style.color,
          fontWeight: 'bold',
          minWidth: '120px',
          '& .MuiChip-label': {
            px: 1
          }
        }}
      />
    );
  };

  // Fonction pour ouvrir un fichier PDF local
  const openLocalPDF = useCallback(async (filename) => {
    try {
      const encodedFilename = encodeURIComponent(filename);
      await axios.get(`${config.apiUrl}/fournisseurs/open-pdf/${encodedFilename}`);
    } catch (error) {
      console.error('Erreur lors de l\'ouverture du PDF:', error);
      // Afficher un message d'erreur à l'utilisateur
      setUploadError('Erreur lors de l\'ouverture du fichier PDF');
    }
  }, []);

  // Fonction pour télécharger un fichier
  const handleFileDownload = useCallback((filename) => {
    openLocalPDF(filename);
  }, [openLocalPDF]);

  // Fonction pour gérer l'upload de fichier
  const handleFileUpload = useCallback(async (id, event) => {
    if (!id) {
      setUploadError("ID du fournisseur manquant");
      return;
    }

    const file = event.target.files[0];
    if (!file) {
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post(
        `${config.apiUrl}/fournisseurs/moodies-report/${id}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      if (response.data.success) {
        setUploadSuccess('Fichier uploadé avec succès');
        // Mettre à jour les données
        if (onDataUpdate) {
          onDataUpdate();
        }
      }
    } catch (error) {
      console.error('Erreur lors de l\'upload:', error);
      setUploadError(error.response?.data?.error || 'Erreur lors de l\'upload du fichier');
    }
  }, [onDataUpdate]);

  // Fonction pour rendre une cellule
  const renderCell = useCallback((row, column) => {
    // Gestion du champ Evaluated / Not Evaluated ou Eval Moodies
    if (column === 'Eval Moodies' || column === 'evaluated_not_evaluated') {
      console.log('Checking row:', { id: row.id, partners: row.PARTNERS, evaluated: row.evaluated_not_evaluated });
      
      // Si le champ evaluated_not_evaluated existe, l'afficher avec un style approprié
      if (column === 'evaluated_not_evaluated' && row.evaluated_not_evaluated) {
        const isEvaluated = row.evaluated_not_evaluated === 'Evaluated';
        return (
          <Chip 
            label={row.evaluated_not_evaluated}
            color={isEvaluated ? "success" : "warning"}
            variant="outlined"
            size="small"
          />
        );
      }
      
      // Cas spécial pour PLASTUNI NORMANDIE SAS (ID: 4720)
      if (row.id === 4720 || (row.PARTNERS && row.PARTNERS === 'PLASTUNI NORMANDIE SAS')) {
        return (
          <Button
            variant="contained"
            color="primary"
            size="small"
            onClick={() => {
              window.open(`${config.apiUrl}/fournisseurs/plastuni-pdf`, '_blank');
            }}
          >
            Voir le rapport Moodies
          </Button>
        );
      }

      // Cas spécial pour TUPACK VERPACKUNGEN (ID: 6225)
      if (row.id === 6225 || (row.PARTNERS && row.PARTNERS === 'TUPACK VERPACKUNGEN')) {
        return (
          <Button
            variant="contained"
            color="primary"
            size="small"
            onClick={() => {
              window.open(`${config.apiUrl}/fournisseurs/tupack-pdf`, '_blank');
            }}
          >
            Voir le rapport Moodies
          </Button>
        );
      }

      // S'assurer que id existe pour les autres cas
      if (!row.id) {
        console.error('id manquant pour la ligne:', row);
        return <div>Erreur: ID manquant</div>;
      }

      const ref = getFileInputRef(row.id);
      
      if (row.moodies_report) {
        return (
          <Button
            variant="text"
            size="small"
            onClick={() => handleFileDownload(row.moodies_report)}
          >
            {row.moodies_report}
          </Button>
        );
      }

      return (
        <div>
          <input
            type="file"
            style={{ display: 'none' }}
            onChange={(e) => handleFileUpload(row.id, e)}
            ref={ref}
            accept=".pdf"
          />
          <Button
            variant="text"
            size="small"
            startIcon={<UploadIcon />}
            onClick={() => {
              const input = ref.current;
              if (input) {
                input.click();
              }
            }}
          >
            Upload
          </Button>
        </div>
      );
    }
    return row[column] || '';
  }, [handleFileDownload, handleFileUpload, getFileInputRef]);

  // Fonction pour sauvegarder un groupe
  const handleSaveGroup = async () => {
    if (!groupName.trim()) {
      setGroupError('Le nom du groupe est requis');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Utiliser directement les noms des colonnes réels (avec accents et espaces)
      const realColumnNames = Array.from(visibleColumns);
      
      // Vérifier si le nom de la table est défini
      if (!propTableName) {
        console.error('ERREUR: Le nom de la table (propTableName) est manquant ou non défini:', propTableName);
        setError('Le nom de la table source est requis pour créer un groupe');
        setSnackbar({
          open: true,
          message: 'Erreur: Le nom de la table source est manquant',
          severity: 'error'
        });
        setLoading(false);
        return;
      }
      
      // Utiliser directement les filtres sans correction
      const groupData = {
        name: groupName,
        filters: filters,
        visibleColumns: realColumnNames,
        tableName: propTableName // Ajouter le nom de la table
      };
      
      console.log('Détails de la création du groupe:');
      console.log('- URL:', `${config.apiUrl}/groups`);
      console.log('- Nom du groupe:', groupName);
      console.log('- Nom de la table source:', propTableName);
      console.log('- Colonnes visibles (noms réels):', realColumnNames);
      console.log('- Filtres:', filters);
      console.log('- Données complètes:', groupData);
      
      const response = await axios.post(`${config.apiUrl}/groups`, groupData);

      console.log('Réponse du serveur:', response);
      
      setSnackbar({
        open: true,
        message: 'Groupe sauvegardé avec succès',
        severity: 'success'
      });
      setOpenGroupDialog(false);
      setGroupName('');
      setGroupError('');
    } catch (err) {
      console.error('Erreur lors de la sauvegarde du groupe:', err);
      console.error('Détails de l\'erreur:');
      console.error('- Code de statut:', err.response?.status);
      console.error('- Message d\'erreur:', err.response?.data?.error);
      console.error('- Détails complètes:', err.response?.data);
      
      // Afficher un message d'erreur plus précis
      const errorMessage = err.response?.data?.error || err.response?.data?.details || err.message || 'Erreur lors de la sauvegarde du groupe';
      setError(errorMessage);
      setSnackbar({
        open: true,
        message: `Erreur: ${errorMessage}`,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Gestionnaires de pagination
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Fonction pour gérer la visibilité des colonnes
  const toggleColumnVisibility = (column) => {
    // Créer un nouveau Set à partir des colonnes visibles actuelles
    const newVisibleColumns = new Set(
      Array.isArray(visibleColumns) ? visibleColumns : 
      (visibleColumns instanceof Set ? visibleColumns : [])
    );
    
    // Vérifier si la colonne est déjà visible
    if (isColumnVisible(column)) {
      // Ne pas permettre de masquer toutes les colonnes
      // Vérifier qu'il restera au moins une colonne visible
      const visibleCount = Array.from(newVisibleColumns).filter(col => isColumnVisible(col)).length;
      if (visibleCount > 1) {
        newVisibleColumns.delete(column);
      } else {
        // Afficher un message dans la console
        console.log('Impossible de masquer toutes les colonnes');
        return; // Ne pas effectuer le changement
      }
    } else {
      newVisibleColumns.add(column);
    }
    
    // Mettre à jour l'état des colonnes visibles
    if (setExternalVisibleColumns) {
      setExternalVisibleColumns(newVisibleColumns);
    } else {
      setLocalVisibleColumns(newVisibleColumns);
    }
  };

  // Menu de sélection des colonnes
  const renderColumnMenu = () => {
    // Obtenir toutes les colonnes disponibles (pas seulement celles qui sont visibles)
    const allColumns = tableColumns.length > 0 
      ? tableColumns 
      : (data && (Array.isArray(data) ? data : []).length > 0 ? Object.keys(data && data[0] ? data[0] : {}) : []);
      
    return (
      <Menu
        anchorEl={columnMenuAnchor}
        open={Boolean(columnMenuAnchor)}
        onClose={() => setColumnMenuAnchor(null)}
        PaperProps={{
          style: {
            maxHeight: 400,
            width: 250,
          },
        }}
      >
        {allColumns.map((column) => (
          <MenuItem
            key={column}
            onClick={() => toggleColumnVisibility(column)}
          >
            <Checkbox
              checked={isColumnVisible(column)}
              color="primary"
            />
            {column}
          </MenuItem>
        ))}
      </Menu>
    );
  };

  // Gestionnaire de clic sur le bouton de filtre
  const handleFilterClick = (event, column) => {
    setFilterAnchorEl({
      ...filterAnchorEl,
      [column]: event.currentTarget
    });
  };

  // Gestionnaire de changement de filtre
  const handleFilterChange = (column, value) => {
    const currentFilters = filters[column] || [];
    const newFilters = currentFilters.includes(value)
      ? currentFilters.filter(v => v !== value)
      : [...currentFilters, value];

    const updatedFilters = {
      ...filters,
      [column]: newFilters
    };

    if (newFilters.length === 0) {
      delete updatedFilters[column];
    }

    if (setExternalFilters) {
      setExternalFilters(updatedFilters);
    } else {
      setLocalFilters(updatedFilters);
    }
  };

  // Fermer le menu de filtre
  const handleFilterClose = (column) => {
    setFilterAnchorEl({
      ...filterAnchorEl,
      [column]: null
    });
  };

  // Fonction pour appliquer un filtre
  const applyFilter = (column, value) => {
    const newFilters = { ...filters };
    if (value === null || value === '') {
      delete newFilters[column];
    } else {
      newFilters[column] = value;
    }
    
    // Mettre à jour les filtres locaux ou externes selon le cas
    if (setExternalFilters) {
      setExternalFilters(newFilters);
    } else {
      setLocalFilters(newFilters);
    }
    
    setFilterAnchorEl(prev => ({ ...prev, [column]: null }));
    setPage(0); // Réinitialiser à la première page après filtrage
  };

  // Effacer un filtre spécifique
  const clearFilter = (column) => {
    const newFilters = { ...filters };
    delete newFilters[column];
    
    if (setExternalFilters) {
      setExternalFilters(newFilters);
    } else {
      setLocalFilters(newFilters);
    }
  };

  // Effacer tous les filtres
  const clearAllFilters = () => {
    if (setExternalFilters) {
      setExternalFilters({});
    } else {
      setLocalFilters({});
    }
    setSearchText('');
  };

  // Réinitialiser tous les filtres
  const resetAllFilters = () => {
    if (setExternalFilters) {
      setExternalFilters({});
    } else {
      setLocalFilters({});
    }
    setSearchText('');
    setPage(0);
  };

  return (
    <Box sx={{ width: '100%' }}>
      {/* Barre d'outils */}
      <Box sx={{ mb: 2 }}>
        <TextField
          label="Rechercher"
          variant="outlined"
          size="small"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          sx={{ mr: 2 }}
        />
        <IconButton
          onClick={(e) => setColumnMenuAnchor(e.currentTarget)}
          color="default"
        >
          <ViewColumnIcon />
        </IconButton>
        {!isGroupView && (
          <Button
            variant="contained"
            color="primary"
            onClick={() => setOpenGroupDialog(true)}
            sx={{ float: 'right' }}
          >
            Créer un groupe
          </Button>
        )}

        {renderColumnMenu()}

        {/* Menu des filtres pour chaque colonne */}
        {displayColumns.map(column => (
          <Menu
            key={column}
            anchorEl={filterAnchorEl[column]}
            open={Boolean(filterAnchorEl[column])}
            onClose={() => handleFilterClose(column)}
          >
            {columnValues[column]?.map(value => (
              <MenuItem key={value} onClick={() => handleFilterChange(column, value)}>
                <Checkbox 
                  checked={filters[column]?.includes(value) || false}
                  size="small"
                />
                <Typography variant="body2">{value}</Typography>
              </MenuItem>
            ))}
          </Menu>
        ))}
      </Box>

      {/* Table principale */}
      <TableContainer component={Paper} sx={{ width: "100%", overflowX: "auto" }}>
        <Table sx={{ minWidth: 650 }} size="small">
          <TableHead>
            <TableRow>
              {displayColumns.map((column) => (
                <TableCell
                  key={column}
                  align={column === 'Score' || column === 'score' ? 'center' : 'left'}
                  sx={getHeaderStyle(column)}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    {column}
                    {getUniqueValues(column).length > 1 && (
                      <IconButton
                        size="small"
                        onClick={(e) => handleFilterClick(e, column)}
                        color={filters[column]?.length ? "primary" : "default"}
                      >
                        <FilterListIcon />
                      </IconButton>
                    )}
                  </Box>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedData.length > 0 ? (
              paginatedData.map((row, index) => (
                <TableRow key={index}>
                  {displayColumns.map((column) => (
                    <TableCell 
                      key={column} 
                      align={column === 'Score' || column === 'score' ? 'center' : 'left'}
                    >
                      {column === 'Score' || (column === 'Score' || column === 'score') ? renderScoreCell(row[column]) : renderCell(row, column)}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={displayColumns.length} align="center">
                  <Typography variant="body1" sx={{ py: 2 }}>
                    Aucune donnée trouvée
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1, mb: 1 }}>
          <Button 
            variant="contained" 
            color="primary" 
            size="small"
            onClick={() => {
              setRowsPerPage(filteredData.length);
              setPage(0);
            }}
          >
            Afficher toutes les lignes
          </Button>
        </Box>

      {/* Pagination */}
      <TablePagination
        rowsPerPageOptions={[10, 25, 50, 100, 250, 500, 1000, 5000, 15000]}
        component="div"
        count={filteredData.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      labelDisplayedRows={({ from, to, count }) => `Affichage de ${from} à ${to} sur ${count} lignes (total: ${filteredData.length})`} />

      {/* Dialog pour sauvegarder un groupe */}
      <Dialog open={openGroupDialog} onClose={() => {
        setOpenGroupDialog(false);
        setGroupName('');
        setGroupError('');
      }}>
        <DialogTitle>Sauvegarder le groupe</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Nom du groupe"
            type="text"
            fullWidth
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            error={Boolean(groupError)}
            helperText={groupError}
            disabled={loading}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setOpenGroupDialog(false);
            setGroupName('');
            setGroupError('');
          }} disabled={loading}>
            Annuler
          </Button>
          <Button onClick={handleSaveGroup} disabled={loading}>
            {loading ? <CircularProgress size={24} /> : 'Sauvegarder'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbars pour les messages d'upload */}
      <Snackbar
        open={!!uploadError}
        autoHideDuration={6000}
        onClose={() => setUploadError(null)}
      >
        <Alert onClose={() => setUploadError(null)} severity="error">
          {uploadError}
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!uploadSuccess}
        autoHideDuration={6000}
        onClose={() => setUploadSuccess(null)}
      >
        <Alert onClose={() => setUploadSuccess(null)} severity="success">
          {uploadSuccess}
        </Alert>
      </Snackbar>

      {/* Snackbar pour les messages */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
      >
        <Alert
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
          severity={snackbar.severity}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default DataTable;