$filePath = "c:\App\AppGetionFournisseurs\AppGetionFournisseurs_3.9_EN\frontend\src\components\DataTable.js"
$backupPath = "$filePath.bak.fix-input"

# Créer une nouvelle sauvegarde avant de commencer
Copy-Item -Path $filePath -Destination $backupPath -Force
Write-Host "Sauvegarde créée: $backupPath"

# Lire le contenu du fichier
$content = Get-Content -Path $filePath -Raw

# Corriger spécifiquement l'élément input corrompu
$inputPattern = @"
          <input
            type="file"
            style={{ display: 'none' }}
            onChange={\(e\) => handleFileUpload\(row\.id, e\)}
            ref={ref}
                <TableCell colSpan={displayColumns\.length} align="center">
                  <Typography variant="body1" sx={{ py: 2 }}>
                    Aucune donnée trouvée
                  </Typography>
                </TableCell>
              </TableRow>
            \)}
          </TableBody>
        </Table>
      </TableContainer>
"@

$inputReplacement = @"
          <input
            type="file"
            style={{ display: 'none' }}
            onChange={(e) => handleFileUpload(row.id, e)}
            ref={ref}
          />
          <Button
            variant="contained"
            color="primary"
            size="small"
            onClick={() => ref.current?.click()}
          >
            Uploader un rapport
          </Button>
        </div>
      );
    }
  };
"@

if ($content -match [regex]::Escape($inputPattern)) {
    $content = $content -replace [regex]::Escape($inputPattern), $inputReplacement
    Write-Host "Élément input corrompu corrigé avec succès"
} else {
    Write-Host "Impossible de trouver l'élément input corrompu avec le pattern exact"
    
    # Essayer un pattern plus simple
    $simplePattern = "<input[^>]*ref={ref}[^>]*>[^<]*<TableCell"
    $simpleReplacement = @"
<input
            type="file"
            style={{ display: 'none' }}
            onChange={(e) => handleFileUpload(row.id, e)}
            ref={ref}
          />
          <Button
            variant="contained"
            color="primary"
            size="small"
            onClick={() => ref.current?.click()}
          >
            Uploader un rapport
          </Button>
        </div>
      );
    }
  };

  // Fonction pour rendre le tableau
  return (
    <>
      <TableContainer component={Paper} sx={{ maxHeight: maxHeight || 'auto' }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              {displayColumns.map((column) => (
                <TableCell
                  key={column}
                  sx={{
                    ...getHeaderStyle(column),
                    minWidth: getColumnMinWidth(column),
                    position: 'sticky',
                    top: 0,
                    backgroundColor: getHeaderStyle(column).backgroundColor
                  }}
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
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedData.length > 0 ? (
              paginatedData.map((row, index) => (
                <TableRow
                  key={row.id || index}
                  sx={{
                    '&:nth-of-type(odd)': { backgroundColor: 'rgba(0, 0, 0, 0.02)' },
                    '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' }
                  }}
                >
                  {displayColumns.map((column) => (
                    <TableCell key={`${row.id || index}-${column}`}>
                      {renderCell(row, column)}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
"@
    
    if ($content -match $simplePattern) {
        $content = $content -replace $simplePattern, $simpleReplacement
        Write-Host "Élément input corrompu corrigé avec succès (pattern simplifié)"
    } else {
        Write-Host "Impossible de trouver l'élément input corrompu même avec un pattern simplifié"
        
        # Dernière tentative avec un pattern très simple
        $verySimplePattern = "ref={ref}[^<]*<TableCell"
        
        if ($content -match $verySimplePattern) {
            $content = $content -replace $verySimplePattern, @"
ref={ref}
          />
          <Button
            variant="contained"
            color="primary"
            size="small"
            onClick={() => ref.current?.click()}
          >
            Uploader un rapport
          </Button>
        </div>
      );
    }
  };

  // Fonction pour rendre le tableau
  return (
    <>
      <TableContainer component={Paper} sx={{ maxHeight: maxHeight || 'auto' }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              {displayColumns.map((column) => (
                <TableCell
"@
            Write-Host "Élément input corrompu corrigé avec succès (pattern très simplifié)"
        } else {
            Write-Host "Impossible de trouver l'élément input corrompu même avec un pattern très simplifié"
        }
    }
}

# Ajouter l'import pour getOriginalColumnNames s'il n'existe pas déjà
$importPattern = "import \{ correctColumnNames, correctFilters, getDisplayNames, displayNameMapping \} from '../utils/column-mapper';"
$importReplacement = "import { correctColumnNames, correctFilters, getDisplayNames, displayNameMapping, getOriginalColumnNames } from '../utils/column-mapper';"

if ($content -match [regex]::Escape($importPattern)) {
    $content = $content -replace [regex]::Escape($importPattern), $importReplacement
    Write-Host "Import pour getOriginalColumnNames ajouté avec succès"
} else {
    Write-Host "Import pour getOriginalColumnNames déjà présent ou pattern non trouvé"
}

# Modifier uniquement la fonction handleSaveGroup pour utiliser getOriginalColumnNames
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

# Modifier la référence aux colonnes visibles dans groupData
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

Write-Host "Modifications appliquées au fichier $filePath"
Write-Host "Script terminé avec succès. Une sauvegarde a été créée à $backupPath"
