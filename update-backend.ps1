# Script pour mettre à jour uniquement le fichier server.js et fournisseurs.js sur le serveur de développement
param (
    [Parameter(Mandatory=$true)]
    [ValidateSet("dev", "prod")]
    [string]$Environment
)

$ErrorActionPreference = "Stop"

# Configuration des serveurs
$config = @{
    "dev" = @{
        "server" = "13.36.205.246";
        "user" = "ubuntu";
        "key_path" = "C:\Users\frede\.ssh\clarins-trc-1.pem";
        "backend_path" = "/home/ubuntu/AppGetionFournisseurs_3.9_EN/AppFournisseurs/backend";
        "frontend_path" = "/home/ubuntu/AppGetionFournisseurs_3.9_EN/AppFournisseurs/frontend";
    };
    "prod" = @{
        "server" = "35.181.84.154";
        "user" = "ubuntu";
        "key_path" = "C:\Users\frede\.ssh\clarins-trc-1.pem";
        "backend_path" = "/home/ubuntu/AppGetionFournisseurs_3.9_EN/AppFournisseurs/backend";
        "frontend_path" = "/home/ubuntu/AppGetionFournisseurs_3.9_EN/AppFournisseurs/frontend";
    };
}

$serverConfig = $config[$Environment]

# Créer un répertoire temporaire pour les fichiers à mettre à jour
$tempDir = Join-Path $env:TEMP "backend-update-$(Get-Date -Format 'yyyyMMddHHmmss')"
New-Item -ItemType Directory -Path $tempDir -Force | Out-Null

# Copier les fichiers à mettre à jour dans le répertoire temporaire
Copy-Item -Path ".\backend\server.js" -Destination $tempDir
Copy-Item -Path ".\backend\routes\fournisseurs.js" -Destination (Join-Path $tempDir "fournisseurs.js")

# Créer un fichier temporaire avec les commandes à exécuter sur le serveur
$scriptPath = Join-Path $tempDir "update-commands.sh"
@"
#!/bin/bash
# Script pour mettre à jour les fichiers du backend

# Utiliser les chemins connus pour le backend
BACKEND_DIR="$($serverConfig.backend_path)"
ROUTES_DIR="$($serverConfig.backend_path)/routes"

echo "Répertoire du backend : \$BACKEND_DIR"
echo "Répertoire des routes : \$ROUTES_DIR"

# Vérifier que les répertoires existent
if [ ! -d "\$BACKEND_DIR" ]; then
    echo "Erreur : Le répertoire du backend n'existe pas"
    exit 1
fi

if [ ! -d "\$ROUTES_DIR" ]; then
    echo "Erreur : Le répertoire des routes n'existe pas"
    exit 1
fi

# Sauvegarder les fichiers originaux
cp "\$BACKEND_DIR/server.js" "\$BACKEND_DIR/server.js.bak"
cp "\$ROUTES_DIR/fournisseurs.js" "\$ROUTES_DIR/fournisseurs.js.bak"

# Copier les nouveaux fichiers
cp /tmp/server.js "\$BACKEND_DIR/server.js"
cp /tmp/fournisseurs.js "\$ROUTES_DIR/fournisseurs.js"

echo "Fichiers mis à jour avec succès"

# Redémarrer le service backend
PM2_PATH=\$(which pm2 2>/dev/null)
if [ -n "\$PM2_PATH" ]; then
    echo "Redémarrage du service avec PM2..."
    pm2 restart all
else
    echo "PM2 non trouvé, tentative de redémarrage avec systemctl..."
    sudo systemctl restart fournisseurs-backend || echo "Impossible de redémarrer le service avec systemctl"
fi

echo "Mise à jour terminée"
"@ | Out-File -FilePath $scriptPath -Encoding utf8

Write-Host "Transfert des fichiers vers le serveur $($serverConfig.server)..." -ForegroundColor Yellow

# Transférer les fichiers vers le serveur
scp -i $($serverConfig.key_path) "$tempDir\server.js" "$tempDir\fournisseurs.js" "$($serverConfig.user)@$($serverConfig.server):/tmp/"
scp -i $($serverConfig.key_path) $scriptPath "$($serverConfig.user)@$($serverConfig.server):/tmp/update-backend.sh"

Write-Host "Exécution du script de mise à jour sur le serveur..." -ForegroundColor Yellow

# Exécuter le script sur le serveur
ssh -i $($serverConfig.key_path) "$($serverConfig.user)@$($serverConfig.server)" "chmod +x /tmp/update-backend.sh && /tmp/update-backend.sh"

# Nettoyer les fichiers temporaires
Remove-Item -Path $tempDir -Recurse -Force

Write-Host "Mise à jour terminée" -ForegroundColor Green
