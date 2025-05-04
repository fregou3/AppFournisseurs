$filePath = "c:\App\AppGetionFournisseurs\AppGetionFournisseurs_3.9_EN\frontend\src\components\DataTable.js"
$backupPath = "$filePath.bak.new"

# Créer une nouvelle sauvegarde avant de commencer
Copy-Item -Path $filePath -Destination $backupPath -Force
Write-Host "Sauvegarde créée: $backupPath"

# Lire le contenu du fichier
$content = Get-Content -Path $filePath -Raw

# 0. Ajouter l'import pour getOriginalColumnNames s'il n'existe pas déjà
$importPattern = "import \{ correctColumnNames, correctFilters, getDisplayNames, displayNameMapping \} from '../utils/column-mapper';"
$importReplacement = "import { correctColumnNames, correctFilters, getDisplayNames, displayNameMapping, getOriginalColumnNames } from '../utils/column-mapper';"

if ($content -match [regex]::Escape($importPattern)) {
    $content = $content -replace [regex]::Escape($importPattern), $importReplacement
    Write-Host "Import pour getOriginalColumnNames ajouté avec succès"
} else {
    Write-Host "Import pour getOriginalColumnNames déjà présent ou pattern non trouvé"
}

# 1. Trouver et modifier la fonction handleSaveGroup
# Utiliser une approche plus flexible pour trouver le pattern
# Pattern pour trouver la fonction handleSaveGroup
$saveGroupPattern = "(?s)const handleSaveGroup = async \(\) => \{.*?try \{.*?const correctedVisibleColumns = correctColumnNames\(Array\.from\(visibleColumns\)\);.*?const groupData = \{.*?visibleColumns: correctedVisibleColumns,"

$saveGroupReplacement = @"
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
      const originalVisibleColumns = getOriginalColumnNames(visibleColumnsArray);
      
      // Corriger les filtres avant d'envoyer la requête
      const correctedFilters = correctFilters(filters);
      
      const groupData = {
        name: groupName,
        filters: correctedFilters,
        visibleColumns: originalVisibleColumns,
"@

# Supprimer cette section car elle est redondante avec le saveGroupReplacement
# $replacement = @"
# ... contenu supprimé ...
# "@

# Utiliser directement le saveGroupReplacement
if ($content -match $saveGroupPattern) {
    $content = $content -replace $saveGroupPattern, $saveGroupReplacement
    Write-Host "Fonction handleSaveGroup modifiée avec succès"
} else {
    Write-Host "Impossible de trouver la fonction handleSaveGroup avec le pattern spécifié"
    
    # Essayer un pattern alternatif plus simple
    $altSaveGroupPattern = "const handleSaveGroup = async \(\) => \{[\s\S]*?const correctedVisibleColumns = correctColumnNames\(Array\.from\(visibleColumns\)\);"
    
    if ($content -match $altSaveGroupPattern) {
        $altSaveGroupReplacement = "const handleSaveGroup = async () => {\n    if (!groupName.trim()) {\n      setGroupError('Le nom du groupe est requis');\n      return;\n    }\n\n    setLoading(true);\n    setError(null);\n\n    try {\n      // Utiliser les noms de colonnes originaux pour le groupe\n      const visibleColumnsArray = Array.from(visibleColumns);\n      const originalVisibleColumns = getOriginalColumnNames(visibleColumnsArray);"
        
        $content = $content -replace $altSaveGroupPattern, $altSaveGroupReplacement
        Write-Host "Fonction handleSaveGroup modifiée avec succès (pattern alternatif)"
    } else {
        Write-Host "Impossible de trouver la fonction handleSaveGroup même avec le pattern alternatif"
    }
}

# Cette section est maintenant redondante et peut être supprimée car nous utilisons directement saveGroupPattern et saveGroupReplacement plus haut

# 2. Trouver et modifier l'affichage des en-têtes de colonnes
# Utiliser une approche plus flexible pour trouver le pattern
$headerPattern = "<Box sx=\{\{ display: 'flex', alignItems: 'center' \}\}>[\s\n]*\{column\}"
$headerReplacement = "<Box sx={{ display: 'flex', alignItems: 'center' }}>\n                    {getColumnDisplayName(column)}"

if ($content -match $headerPattern) {
    $content = $content -replace $headerPattern, $headerReplacement
    Write-Host "Affichage des en-têtes de colonnes modifié avec succès"
} else {
    Write-Host "Impossible de trouver le pattern d'affichage des en-têtes de colonnes"
    
    # Essayer un pattern alternatif
    $altHeaderPattern = "\{column\}[\s\n]*\{getUniqueValues\(column\).length > 1"
    $altHeaderReplacement = "{getColumnDisplayName(column)}\n                    {getUniqueValues(column).length > 1"
    
    if ($content -match $altHeaderPattern) {
        $content = $content -replace $altHeaderPattern, $altHeaderReplacement
        Write-Host "Affichage des en-têtes de colonnes modifié avec succès (pattern alternatif)"
    } else {
        Write-Host "Impossible de trouver le pattern alternatif d'affichage des en-têtes de colonnes"
    }
}

# 3. Trouver et modifier l'affichage des noms de colonnes dans le menu
# Utiliser une approche plus flexible pour trouver le pattern
$menuPattern = "<Checkbox[\s\n]*checked=\{isColumnVisible\(column\)\}[\s\n]*color=""primary""[\s\n]*\/>[\s\n]*\{column\}"
$menuReplacement = "<Checkbox\n              checked={isColumnVisible(column)}\n              color=""primary""\n            />\n            {getColumnDisplayName(column)}"

if ($content -match $menuPattern) {
    $content = $content -replace $menuPattern, $menuReplacement
    Write-Host "Affichage des noms de colonnes dans le menu modifié avec succès"
} else {
    Write-Host "Impossible de trouver le pattern d'affichage des noms de colonnes dans le menu"
    
    # Essayer un pattern alternatif
    $altMenuPattern = "\/>[\s\n]*\{column\}[\s\n]*<\/MenuItem>"
    $altMenuReplacement = "/>\n            {getColumnDisplayName(column)}\n          </MenuItem>"
    
    if ($content -match $altMenuPattern) {
        $content = $content -replace $altMenuPattern, $altMenuReplacement
        Write-Host "Affichage des noms de colonnes dans le menu modifié avec succès (pattern alternatif)"
    } else {
        Write-Host "Impossible de trouver le pattern alternatif d'affichage des noms de colonnes dans le menu"
    }
}

# Écrire le contenu modifié dans le fichier
Set-Content -Path $filePath -Value $content

Write-Host "Modifications appliquées au fichier $filePath"

# Afficher un message de succès
Write-Host "Script terminé avec succès. Une sauvegarde a été créée à $backupPath"
