# Guide de déploiement pour AppGetionFournisseurs

Ce guide explique comment déployer l'application sur les serveurs de développement et de production.

## Prérequis

- PowerShell 5.1 ou supérieur
- OpenSSH client (installé sur Windows 10 1809 ou supérieur)
- Accès SSH aux serveurs de développement et de production

## Configuration du script de déploiement

Avant d'utiliser le script de déploiement, vous devez configurer les informations de connexion aux serveurs dans le fichier `deploy.ps1`. Modifiez les sections suivantes :

```powershell
# Configuration des serveurs
$config = @{
    "dev" = @{
        "server" = "dev-server.example.com",  # Remplacer par l'adresse du serveur de développement
        "user" = "dev-user",                  # Remplacer par le nom d'utilisateur
        "backend_path" = "/var/www/fournisseurs/backend",
        "frontend_path" = "/var/www/fournisseurs/frontend"
    },
    "prod" = @{
        "server" = "prod-server.example.com", # Remplacer par l'adresse du serveur de production
        "user" = "prod-user",                 # Remplacer par le nom d'utilisateur
        "backend_path" = "/var/www/fournisseurs/backend",
        "frontend_path" = "/var/www/fournisseurs/frontend"
    }
}
```

## Utilisation du script de déploiement

### Déployer l'application complète

Pour déployer à la fois le backend et le frontend sur l'environnement de développement :

```powershell
.\deploy.ps1 -Environment dev
```

Pour déployer sur l'environnement de production :

```powershell
.\deploy.ps1 -Environment prod
```

### Déployer uniquement le backend

```powershell
.\deploy.ps1 -Environment dev -BackendOnly
```

### Déployer uniquement le frontend

```powershell
.\deploy.ps1 -Environment prod -FrontendOnly
```

## Vérification après déploiement

Après le déploiement, vous devriez vérifier que l'application fonctionne correctement :

1. **Backend** : Vérifiez les logs du service avec `sudo journalctl -u fournisseurs-backend`
2. **Frontend** : Accédez à l'application via un navigateur

## Modifications récentes importantes

### Gestion des environnements multiples

Les modifications récentes ont amélioré la gestion des environnements multiples :

- **Détection automatique de l'environnement** : Le backend détecte automatiquement s'il s'exécute sur Windows (localhost) ou Linux (0.0.0.0)
- **Configuration du proxy améliorée** : Timeouts augmentés à 60 secondes pour éviter les erreurs 504
- **Gestion d'erreur améliorée** : Messages d'erreur plus clairs en cas de problème de connexion

Ces modifications garantissent que l'application fonctionne correctement à la fois en environnement de développement local (Windows) et sur les serveurs distants (Linux).

## Rollback en cas de problème

Si vous rencontrez des problèmes après le déploiement, vous pouvez revenir à la version précédente :

```bash
# Sur le serveur
sudo systemctl stop fournisseurs-backend
mv /var/www/fournisseurs/backend /var/www/fournisseurs/backend_broken
mv /var/www/fournisseurs/backend_old /var/www/fournisseurs/backend
sudo systemctl start fournisseurs-backend

# Pour le frontend
mv /var/www/fournisseurs/frontend /var/www/fournisseurs/frontend_broken
mv /var/www/fournisseurs/frontend_old /var/www/fournisseurs/frontend
sudo systemctl reload nginx
```
