// Script de nettoyage complet du localStorage
// À exécuter dans la console du navigateur

(function() {
  console.log('🧹 Nettoyage complet du localStorage...');
  
  // Sauvegarder les tokens d'authentification
  const accessToken = localStorage.getItem('access_token');
  const refreshToken = localStorage.getItem('refresh_token');
  const user = localStorage.getItem('user');
  
  // Compter les éléments avant nettoyage
  const countBefore = localStorage.length;
  console.log(`📊 Éléments avant nettoyage: ${countBefore}`);
  
  // Vider complètement localStorage
  localStorage.clear();
  
  // Restaurer uniquement les tokens d'authentification
  if (accessToken) {
    localStorage.setItem('access_token', accessToken);
    console.log('✅ Token d\'accès restauré');
  }
  if (refreshToken) {
    localStorage.setItem('refresh_token', refreshToken);
    console.log('✅ Token de rafraîchissement restauré');
  }
  if (user) {
    localStorage.setItem('user', user);
    console.log('✅ Utilisateur restauré');
  }
  
  const countAfter = localStorage.length;
  console.log(`📊 Éléments après nettoyage: ${countAfter}`);
  console.log(`🗑️  ${countBefore - countAfter} éléments supprimés`);
  console.log('✨ Nettoyage terminé! Rechargez la page.');
})();
