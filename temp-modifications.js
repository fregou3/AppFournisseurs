// Fonction pour obtenir le nom d'affichage d'une colonne
const getColumnDisplayName = (column) => {
  // Utiliser le nom d'affichage s'il existe, sinon utiliser le nom de la colonne
  return displayNameMapping[column] || column;
};

// Modification pour l'affichage des en-têtes de colonnes
<TableCell
  key={column}
  align={column === 'Score' || column === 'score' ? 'center' : 'left'}
  sx={getHeaderStyle(column)}
>
  <Box sx={{ display: 'flex', alignItems: 'center' }}>
    {getColumnDisplayName(column)}
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

// Modification pour l'affichage des noms de colonnes dans le menu
<MenuItem
  key={column}
  onClick={() => toggleColumnVisibility(column)}
>
  <Checkbox
    checked={isColumnVisible(column)}
    color="primary"
  />
  {getColumnDisplayName(column)}
</MenuItem>

// Modification de la fonction handleSaveGroup
const handleSaveGroup = async () => {
  if (!groupName.trim()) {
    setGroupError('Le nom du groupe est requis');
    return;
  }

  setLoading(true);
  setError(null);

  try {
    // Utiliser les noms de colonnes originaux pour le groupe
    const visibleColumnsArray = Array.from(visibleColumns);
    const originalVisibleColumns = visibleColumnsArray.map(col => {
      // Si la colonne a un nom d'affichage, utiliser le nom original du fichier Excel
      return displayNameMapping[col] || col;
    });
    
    // Corriger les filtres avant d'envoyer la requête
    const correctedFilters = correctFilters(filters);
    
    const groupData = {
      name: groupName,
      filters: correctedFilters,
      visibleColumns: originalVisibleColumns,
      tableName: propTableName // Ajouter le nom de la table
    };
    
    console.log('Envoi des données corrigées pour la création du groupe:', groupData);
    await axios.post(`${config.apiUrl}/groups`, groupData);

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
    setError(err.response?.data?.error || 'Erreur lors de la sauvegarde du groupe');
    setSnackbar({
      open: true,
      message: 'Erreur lors de la sauvegarde du groupe',
      severity: 'error'
    });
  } finally {
    setLoading(false);
  }
};
