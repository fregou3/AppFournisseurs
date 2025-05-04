// 1. Modification pour l'affichage des en-têtes de colonnes
// Remplacer {column} par {getColumnDisplayName(column)}
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

// 2. Modification pour l'affichage des noms de colonnes dans le menu
// Remplacer {column} par {getColumnDisplayName(column)}
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

// 3. Modification de la fonction handleSaveGroup
// Remplacer la partie qui prépare les données du groupe pour utiliser les noms de colonnes originaux
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
