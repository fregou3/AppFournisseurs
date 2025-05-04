$filePath = "c:\App\AppGetionFournisseurs\AppGetionFournisseurs_3.9_EN\frontend\src\components\DataTable.js"
$backupPath = "$filePath.bak.minimal"

# Créer une nouvelle sauvegarde avant de commencer
Copy-Item -Path $filePath -Destination $backupPath -Force
Write-Host "Sauvegarde créée: $backupPath"

# Lire le contenu du fichier
$content = Get-Content -Path $filePath -Raw

# 1. Ajouter l'import pour getOriginalColumnNames s'il n'existe pas déjà
$importPattern = "import \{ correctColumnNames, correctFilters, getDisplayNames, displayNameMapping \} from '../utils/column-mapper';"
$importReplacement = "import { correctColumnNames, correctFilters, getDisplayNames, displayNameMapping, getOriginalColumnNames } from '../utils/column-mapper';"

if ($content -match [regex]::Escape($importPattern)) {
    $content = $content -replace [regex]::Escape($importPattern), $importReplacement
    Write-Host "Import pour getOriginalColumnNames ajouté avec succès"
} else {
    Write-Host "Import pour getOriginalColumnNames déjà présent ou pattern non trouvé"
}

# 2. Modifier uniquement la fonction handleSaveGroup pour utiliser getOriginalColumnNames
# Recherche spécifique de la section qui prépare les données du groupe
$groupDataPattern = "const correctedVisibleColumns = correctColumnNames\(Array\.from\(visibleColumns\)\);"
$groupDataReplacement = "// Utiliser les noms de colonnes originaux pour le groupe
      const visibleColumnsArray = Array.from(visibleColumns);
      const originalVisibleColumns = getOriginalColumnNames(visibleColumnsArray);"

if ($content -match [regex]::Escape($groupDataPattern)) {
    $content = $content -replace [regex]::Escape($groupDataPattern), $groupDataReplacement
    Write-Host "Préparation des données du groupe modifiée avec succès"
} else {
    Write-Host "Impossible de trouver le pattern de préparation des données du groupe"
}

# 3. Modifier la référence aux colonnes visibles dans groupData
$visibleColumnsPattern = "visibleColumns: correctedVisibleColumns,"
$visibleColumnsReplacement = "visibleColumns: originalVisibleColumns,"

if ($content -match [regex]::Escape($visibleColumnsPattern)) {
    $content = $content -replace [regex]::Escape($visibleColumnsPattern), $visibleColumnsReplacement
    Write-Host "Référence aux colonnes visibles modifiée avec succès"
} else {
    Write-Host "Impossible de trouver le pattern de référence aux colonnes visibles"
}

# Écrire le contenu modifié dans le fichier
Set-Content -Path $filePath -Value $content

Write-Host "Modifications minimales appliquées au fichier $filePath"
Write-Host "Script terminé avec succès. Une sauvegarde a été créée à $backupPath"
