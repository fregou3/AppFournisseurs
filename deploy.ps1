# Script de déploiement pour les serveurs de développement et production
param (
    [Parameter(Mandatory=$true)]
    [ValidateSet("dev", "prod")]
    [string]$Environment,
    
    [Parameter(Mandatory=$false)]
    [switch]$BackendOnly,
    
    [Parameter(Mandatory=$false)]
    [switch]$FrontendOnly
)

$ErrorActionPreference = "Stop"

# Configuration des serveurs
$config = @{
    "dev" = @{
        "server" = "13.36.205.246";
        "user" = "ubuntu";
        "key_path" = "C:\\Users\\frede\\.ssh\\clarins-trc-1.pem";
        "backend_path" = "/var/www/fournisseurs/backend";
        "frontend_path" = "/var/www/fournisseurs/frontend";
    };
    "prod" = @{
        "server" = "35.181.84.154";
        "user" = "ubuntu";
        "key_path" = "C:\\Users\\frede\\.ssh\\clarins-trc-1.pem";
        "backend_path" = "/var/www/fournisseurs/backend";
        "frontend_path" = "/var/www/fournisseurs/frontend";
    };
}

$serverConfig = $config[$Environment]

# Fonction pour afficher les messages avec couleur
function Write-ColorOutput($ForegroundColor) {
    $fc = $host.UI.RawUI.ForegroundColor
    $host.UI.RawUI.ForegroundColor = $ForegroundColor
    if ($args) {
        Write-Output $args
    }
    else {
        $input | Write-Output
    }
    $host.UI.RawUI.ForegroundColor = $fc
}

# Vérifier que les outils nécessaires sont installés
function Check-Requirements {
    Write-ColorOutput Green "Vérification des prérequis..."
    
    $sshExists = Get-Command ssh -ErrorAction SilentlyContinue
    if (-not $sshExists) {
        Write-ColorOutput Red "SSH n'est pas installé ou n'est pas dans le PATH."
        Write-ColorOutput Yellow "Veuillez installer OpenSSH ou l'ajouter au PATH."
        exit 1
    }
    
    $scpExists = Get-Command scp -ErrorAction SilentlyContinue
    if (-not $scpExists) {
        Write-ColorOutput Red "SCP n'est pas installé ou n'est pas dans le PATH."
        Write-ColorOutput Yellow "Veuillez installer OpenSSH ou l'ajouter au PATH."
        exit 1
    }
    
    Write-ColorOutput Green "Tous les prérequis sont satisfaits."
}

# Déployer le backend
function Deploy-Backend {
    Write-ColorOutput Green "Déploiement du backend vers $Environment..."
    
    # Créer une archive temporaire du backend
    $backendTempZip = [System.IO.Path]::GetTempFileName() + ".zip"
    Compress-Archive -Path ".\backend\*" -DestinationPath $backendTempZip -Force
    
    # Transférer l'archive vers le serveur
    Write-ColorOutput Yellow "Transfert des fichiers backend vers $($serverConfig.server)..."
    scp -i "$($serverConfig.key_path)" $backendTempZip "$($serverConfig.user)@$($serverConfig.server):~/backend.zip"
    
    # Extraire l'archive sur le serveur et redémarrer le service
    Write-ColorOutput Yellow "Extraction et installation du backend..."
    ssh -i "$($serverConfig.key_path)" "$($serverConfig.user)@$($serverConfig.server)" @"
        mkdir -p $($serverConfig.backend_path)_tmp
        unzip -q ~/backend.zip -d $($serverConfig.backend_path)_tmp
        rm ~/backend.zip
        
        # Arrêter le service
        sudo systemctl stop fournisseurs-backend
        
        # Sauvegarder l'ancien backend
        if [ -d "$($serverConfig.backend_path)_old" ]; then
            rm -rf $($serverConfig.backend_path)_old
        fi
        if [ -d "$($serverConfig.backend_path)" ]; then
            mv $($serverConfig.backend_path) $($serverConfig.backend_path)_old
        fi
        
        # Installer le nouveau backend
        mv $($serverConfig.backend_path)_tmp $($serverConfig.backend_path)
        
        # Installer les dépendances
        cd $($serverConfig.backend_path)
        npm install --production
        
        # Redémarrer le service
        sudo systemctl start fournisseurs-backend
        
        # Vérifier l'état du service
        sudo systemctl status fournisseurs-backend
"@
    
    # Nettoyer les fichiers temporaires
    Remove-Item $backendTempZip -Force
    
    Write-ColorOutput Green "Déploiement du backend terminé."
}

# Déployer le frontend
function Deploy-Frontend {
    Write-ColorOutput Green "Déploiement du frontend vers $Environment..."
    
    # Construire le frontend pour la production
    Write-ColorOutput Yellow "Construction du frontend pour la production..."
    Push-Location .\frontend
    npm run build:prod
    Pop-Location
    
    # Créer une archive temporaire du frontend
    $frontendTempZip = [System.IO.Path]::GetTempFileName() + ".zip"
    Compress-Archive -Path ".\frontend\build\*" -DestinationPath $frontendTempZip -Force
    
    # Transférer l'archive vers le serveur
    Write-ColorOutput Yellow "Transfert des fichiers frontend vers $($serverConfig.server)..."
    scp -i "$($serverConfig.key_path)" $frontendTempZip "$($serverConfig.user)@$($serverConfig.server):~/frontend.zip"
    
    # Extraire l'archive sur le serveur
    Write-ColorOutput Yellow "Extraction et installation du frontend..."
    ssh -i "$($serverConfig.key_path)" "$($serverConfig.user)@$($serverConfig.server)" @"
        mkdir -p $($serverConfig.frontend_path)_tmp
        unzip -q ~/frontend.zip -d $($serverConfig.frontend_path)_tmp
        rm ~/frontend.zip
        
        # Sauvegarder l'ancien frontend
        if [ -d "$($serverConfig.frontend_path)_old" ]; then
            rm -rf $($serverConfig.frontend_path)_old
        fi
        if [ -d "$($serverConfig.frontend_path)" ]; then
            mv $($serverConfig.frontend_path) $($serverConfig.frontend_path)_old
        fi
        
        # Installer le nouveau frontend
        mv $($serverConfig.frontend_path)_tmp $($serverConfig.frontend_path)
        
        # Redémarrer nginx si nécessaire
        sudo systemctl reload nginx
"@
    
    # Nettoyer les fichiers temporaires
    Remove-Item $frontendTempZip -Force
    
    Write-ColorOutput Green "Déploiement du frontend terminé."
}

# Exécution principale
try {
    Write-ColorOutput Cyan "=== Déploiement vers l'environnement $Environment ==="
    
    Check-Requirements
    
    if (-not $FrontendOnly) {
        Deploy-Backend
    }
    
    if (-not $BackendOnly) {
        Deploy-Frontend
    }
    
    Write-ColorOutput Cyan "=== Déploiement terminé avec succès ==="
} catch {
    Write-ColorOutput Red "Une erreur s'est produite lors du déploiement:"
    Write-ColorOutput Red $_.Exception.Message
    exit 1
}
