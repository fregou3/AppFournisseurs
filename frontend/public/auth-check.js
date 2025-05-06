// Script de vérification d'authentification
(function() {
  // Fonction pour vérifier si nous sommes sur un environnement de production
  function isProductionServer() {
    var hostname = window.location.hostname;
    return hostname === 'supplier-prd.communify.solutions' || 
           hostname === 'app2.communify.solutions';
  }

  // Fonction pour vérifier si nous sommes sur la page de login
  function isLoginPage() {
    var path = window.location.pathname;
    return path.includes('/login');
  }

  // Fonction pour obtenir le chemin de base
  function getBasePath() {
    return '/fournisseurs';
  }

  // Vérification principale
  function checkAuthentication() {
    console.log('=== VÉRIFICATION AUTHENTIFICATION PRÉ-REACT ===');
    console.log('Hostname:', window.location.hostname);
    console.log('Path:', window.location.pathname);
    
    // Ne vérifier l'authentification que sur les serveurs de production et hors de la page de login
    if (isProductionServer() && !isLoginPage()) {
      console.log('Environnement de production détecté, vérification de l\'authentification...');
      
      var isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
      var lastLoginTime = localStorage.getItem('lastLoginTime');
      
      console.log('isAuthenticated:', isAuthenticated);
      console.log('lastLoginTime:', lastLoginTime);
      
      // Vérifier si la session a expiré (3 heures)
      var sessionExpired = false;
      if (lastLoginTime) {
        var loginTime = new Date(lastLoginTime);
        var now = new Date();
        var hoursDiff = (now - loginTime) / (1000 * 60 * 60);
        
        console.log('Heures écoulées depuis la dernière connexion:', hoursDiff);
        sessionExpired = hoursDiff > 3;
      }
      
      // Si l'utilisateur n'est pas authentifié ou si la session a expiré
      if (!isAuthenticated || sessionExpired) {
        console.log('Utilisateur non authentifié ou session expirée, redirection vers la page de login');
        
        // Supprimer les informations d'authentification
        localStorage.removeItem('isAuthenticated');
        localStorage.removeItem('lastLoginTime');
        
        // Rediriger vers la page de login
        var loginUrl = getBasePath() + '/login';
        console.log('Redirection vers:', loginUrl);
        
        // Afficher une alerte
        alert('Authentification requise. Vous allez être redirigé vers la page de connexion.');
        
        // Rediriger
        window.location.href = loginUrl;
      }
    }
  }
  
  // Exécuter la vérification immédiatement
  checkAuthentication();
})();
