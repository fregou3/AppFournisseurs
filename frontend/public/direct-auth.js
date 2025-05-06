// Script simple de vérification d'authentification
(function() {
  // Ne pas exécuter sur la page de login
  if (window.location.pathname.includes('/login')) {
    console.log('Page de login détectée, pas de vérification d\'authentification');
    return;
  }
  
  console.log('Vérification d\'authentification directe...');
  
  // Vérifier si l'utilisateur est authentifié
  var isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
  var lastLoginTime = localStorage.getItem('lastLoginTime');
  
  console.log('isAuthenticated:', isAuthenticated);
  console.log('lastLoginTime:', lastLoginTime);
  
  // Si l'utilisateur n'est pas authentifié ou si lastLoginTime n'existe pas
  if (!isAuthenticated || !lastLoginTime) {
    console.log('Utilisateur non authentifié, redirection vers la page de login');
    window.location.href = '/fournisseurs/login';
    return;
  }
  
  // Vérifier si la session a expiré (3 heures)
  var loginTime = new Date(lastLoginTime);
  var now = new Date();
  var hoursDiff = (now - loginTime) / (1000 * 60 * 60);
  
  console.log('Heures écoulées depuis la dernière connexion:', hoursDiff);
  
  if (hoursDiff > 3) {
    console.log('Session expirée, redirection vers la page de login');
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('lastLoginTime');
    window.location.href = '/fournisseurs/login';
  }
})();
