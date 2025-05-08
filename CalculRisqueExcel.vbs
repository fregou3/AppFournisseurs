Option Explicit

' Macro pour calculer les scores de risque dans un fichier Excel
' Basée sur les 4 valeurs : Région d'intervention, Pays d'intervention, Localisation, Nature du tiers

Sub CalculerScoresRisque()
    Dim ws As Worksheet
    Dim lastRow As Long
    Dim i As Long
    Dim regionIntervention As String
    Dim paysIntervention As String
    Dim localisation As String
    Dim natureTiers As String
    Dim score As Integer
    Dim regionCol As Integer
    Dim paysCol As Integer
    Dim localisationCol As Integer
    Dim natureTiersCol As Integer
    Dim scoreCol As Integer
    
    ' Définir la feuille de travail active
    Set ws = ActiveSheet
    
    ' Trouver les colonnes correspondant à nos critères
    regionCol = FindColumnByHeader(ws, "Région d'intervention")
    paysCol = FindColumnByHeader(ws, "Pays d'intervention")
    localisationCol = FindColumnByHeader(ws, "Localisation")
    natureTiersCol = FindColumnByHeader(ws, "Nature du tiers")
    
    ' Vérifier que toutes les colonnes ont été trouvées
    If regionCol = 0 Or paysCol = 0 Or localisationCol = 0 Or natureTiersCol = 0 Then
        MsgBox "Impossible de trouver toutes les colonnes nécessaires. Assurez-vous que votre fichier contient les en-têtes suivants : " & _
               "Région d'intervention, Pays d'intervention, Localisation, Nature du tiers", vbExclamation
        Exit Sub
    End If
    
    ' Ajouter une colonne de score si elle n'existe pas déjà
    scoreCol = FindColumnByHeader(ws, "Score")
    If scoreCol = 0 Then
        scoreCol = ws.UsedRange.Columns.Count + 1
        ws.Cells(1, scoreCol).Value = "Score"
    End If
    
    ' Trouver la dernière ligne avec des données
    lastRow = ws.Cells(ws.Rows.Count, regionCol).End(xlUp).Row
    
    ' Parcourir toutes les lignes et calculer les scores
    For i = 2 To lastRow ' Commencer à la ligne 2 pour ignorer les en-têtes
        ' Récupérer les valeurs
        regionIntervention = Trim(ws.Cells(i, regionCol).Value)
        paysIntervention = Trim(ws.Cells(i, paysCol).Value)
        localisation = Trim(ws.Cells(i, localisationCol).Value)
        natureTiers = Trim(ws.Cells(i, natureTiersCol).Value)
        
        ' Calculer le score
        If regionIntervention <> "" And paysIntervention <> "" And localisation <> "" And natureTiers <> "" Then
            score = CalculEvaluationPremierNiveau(natureTiers, localisation, regionIntervention, paysIntervention)
            ws.Cells(i, scoreCol).Value = score
            
            ' Appliquer un formatage conditionnel en fonction du score
            ApplyScoreFormatting ws.Cells(i, scoreCol), score
        Else
            ws.Cells(i, scoreCol).Value = "N/A"
        End If
    Next i
    
    MsgBox "Calcul des scores terminé !", vbInformation
End Sub

' Fonction pour trouver l'index d'une colonne par son en-tête
Function FindColumnByHeader(ws As Worksheet, headerText As String) As Integer
    Dim col As Integer
    Dim found As Boolean
    
    found = False
    For col = 1 To ws.UsedRange.Columns.Count
        If Trim(ws.Cells(1, col).Value) = headerText Then
            FindColumnByHeader = col
            found = True
            Exit For
        End If
    Next col
    
    If Not found Then
        FindColumnByHeader = 0
    End If
End Function

' Fonction pour calculer le score d'évaluation de premier niveau
Function CalculEvaluationPremierNiveau(natureTier As String, localisation As String, regionIntervention As String, paysIntervention As String) As Integer
    Dim score As Integer
    Dim natureTierLower As String
    Dim regionInterventionLower As String
    Dim localisationLower As String
    
    ' Convertir en minuscules pour faciliter les comparaisons
    natureTierLower = LCase(natureTier)
    regionInterventionLower = LCase(regionIntervention)
    localisationLower = LCase(localisation)
    
    score = 0
    
    ' 1. Points pour nature du tiers
    ' Catégories à 10 points
    If InStr(natureTierLower, "cible de croissance externe") > 0 Or _
       InStr(natureTierLower, "wholesalers") > 0 Or _
       InStr(natureTierLower, "bénéficiaire d'actions de sponsoring") > 0 Then
        score = score + 10
        
    ' Catégories à 5 points
    ElseIf InStr(natureTierLower, "retailers") > 0 Or _
           InStr(natureTierLower, "department stores") > 0 Or _
           InStr(natureTierLower, "baux et loyers") > 0 Or _
           InStr(natureTierLower, "communication et média") > 0 Or _
           InStr(natureTierLower, "conseils") > 0 Or _
           InStr(natureTierLower, "fourniture de matériel de promotion") > 0 Or _
           InStr(natureTierLower, "fourniture de packaging") > 0 Or _
           InStr(natureTierLower, "fourniture de matières premières") > 0 Or _
           InStr(natureTierLower, "immobilier") > 0 Or _
           InStr(natureTierLower, "influenceurs") > 0 Or _
           InStr(natureTierLower, "intérimaires") > 0 Or _
           InStr(natureTierLower, "logistique") > 0 Or _
           InStr(natureTierLower, "organismes de recherche") > 0 Or _
           InStr(natureTierLower, "promotion de la marque") > 0 Or _
           InStr(natureTierLower, "sous-traitance production") > 0 Or _
           InStr(natureTierLower, "transport de marchandise") > 0 Or _
           InStr(natureTierLower, "auditeurs") > 0 Or _
           InStr(natureTierLower, "agents publics") > 0 Then
        score = score + 5
        
    ' Catégories à 3 points
    ElseIf InStr(natureTierLower, "equipement de sécurité") > 0 Or _
           InStr(natureTierLower, "installations et équipements techniques") > 0 Or _
           InStr(natureTierLower, "maintenance des bâtiments") > 0 Or _
           InStr(natureTierLower, "matériel informatique") > 0 Or _
           InStr(natureTierLower, "mobilier de bureau") > 0 Or _
           InStr(natureTierLower, "nourriture et boissons") > 0 Or _
           InStr(natureTierLower, "services de nettoyage") > 0 Or _
           InStr(natureTierLower, "services de sécurité") > 0 Or _
           InStr(natureTierLower, "services liés au e-commerce") > 0 Or _
           InStr(natureTierLower, "télécommunications") > 0 Or _
           InStr(natureTierLower, "transport de taxi") > 0 Then
        score = score + 3
        
    ' Catégories à 1 point
    ElseIf InStr(natureTierLower, "électricité et gaz") > 0 Or _
           InStr(natureTierLower, "hébergement") > 0 Or _
           InStr(natureTierLower, "maintenance informatique") > 0 Then
        score = score + 1
    End If
    
    ' 2. Points pour région d'intervention
    If InStr(regionInterventionLower, "france - siège") > 0 Or _
       InStr(regionInterventionLower, "europe") > 0 Or _
       InStr(regionInterventionLower, "amerique du nord") > 0 Then
        score = score + 1
    ElseIf InStr(regionInterventionLower, "apac") > 0 Or _
           InStr(regionInterventionLower, "future growth markets") > 0 Or _
           InStr(regionInterventionLower, "global travel retail") > 0 Then
        score = score + 3
        If localisationLower = "france" Then
            ' Ajouter le point France uniquement si la région n'est pas Europe/Amérique du Nord
            score = score + 1
        End If
    ElseIf localisationLower = "france" Then
        ' Ajouter le point France si pas de région spécifiée dans les catégories précédentes
        score = score + 1
    End If
    
    CalculEvaluationPremierNiveau = score
End Function

' Procédure pour appliquer un formatage conditionnel en fonction du score
Sub ApplyScoreFormatting(cell As Range, score As Integer)
    ' Effacer le formatage existant
    cell.Interior.ColorIndex = xlNone
    
    ' Appliquer un formatage en fonction du score
    If score >= 10 Then
        ' Rouge pour risque élevé
        cell.Interior.Color = RGB(255, 150, 150)
    ElseIf score >= 6 Then
        ' Orange pour risque moyen
        cell.Interior.Color = RGB(255, 200, 150)
    ElseIf score >= 3 Then
        ' Jaune pour risque faible
        cell.Interior.Color = RGB(255, 255, 150)
    Else
        ' Vert pour risque très faible
        cell.Interior.Color = RGB(200, 255, 200)
    End If
End Sub

' Ajouter un bouton pour exécuter la macro
Sub AddCalculateButton()
    Dim btn As Button
    
    ' Supprimer les boutons existants avec le même nom
    On Error Resume Next
    ActiveSheet.Buttons("btnCalculerScores").Delete
    On Error GoTo 0
    
    ' Ajouter un nouveau bouton
    Set btn = ActiveSheet.Buttons.Add(10, 10, 150, 30)
    With btn
        .OnAction = "CalculerScoresRisque"
        .Caption = "Calculer les scores"
        .Name = "btnCalculerScores"
    End With
    
    MsgBox "Bouton ajouté ! Cliquez dessus pour calculer les scores.", vbInformation
End Sub
