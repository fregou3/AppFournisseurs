$filePath = "c:\App\AppGetionFournisseurs\AppGetionFournisseurs_3.9_EN\frontend\src\components\DataTable.js"

# Créer une sauvegarde du fichier original si elle n'existe pas déjà
if (-not (Test-Path "$filePath.bak")) {
    Copy-Item -Path $filePath -Destination "$filePath.bak"
    Write-Host "Sauvegarde créée: $filePath.bak"
}

# Lire le contenu du fichier
$content = Get-Content -Path $filePath -Raw

# 1. Remplacer les occurrences de {column} par {getColumnDisplayName(column)} dans les en-têtes de colonnes
# Cette regex cible spécifiquement les en-têtes de colonnes dans le TableCell
$content = $content -replace '(<Box sx=\{\{ display: ''flex'', alignItems: ''center'' \}\}>\s*)\{column\}', '$1{getColumnDisplayName(column)}'

# 2. Remplacer les occurrences de {column} par {getColumnDisplayName(column)} dans le menu des colonnes
# Cette regex cible spécifiquement les items du menu des colonnes
$content = $content -replace '(<Checkbox\s+checked=\{isColumnVisible\(column\)\}\s+color="primary"\s+\/>\s*)\{column\}', '$1{getColumnDisplayName(column)}'

# 3. Modifier la fonction handleSaveGroup pour utiliser les noms de colonnes originaux
$oldHandleSaveGroup = @"
  const handleSaveGroup = async \(\) => \{
    if \(!groupName\.trim\(\)\) \{
      setGroupError\('Le nom du groupe est requis'\);
      return;
    \}

    setLoading\(true\);
    setError\(null\);

    try \{
      // Corriger les noms de colonnes avant d'envoyer la requête
      const correctedVisibleColumns = correctColumnNames\(Array\.from\(visibleColumns\)\);
      const correctedFilters = correctFilters\(filters\);
      
      const groupData = \{
        name: groupName,
        filters: correctedFilters,
        visibleColumns: correctedVisibleColumns,
        tableName: propTableName // Ajouter le nom de la table
      \};
"@

$newHandleSaveGroup = @"
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
"@

$content = $content -replace [regex]::Escape($oldHandleSaveGroup), $newHandleSaveGroup

# Écrire le contenu modifié dans le fichier
Set-Content -Path $filePath -Value $content

Write-Host "Modifications appliquées avec succès au fichier $filePath"
