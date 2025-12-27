/**
 * Service de nettoyage localStorage - Supprime toutes les données obsolètes
 * Garde uniquement les tokens d'authentification
 */

export function cleanupObsoleteLocalStorage() {
  const tokensToKeep = {
    access_token: localStorage.getItem('access_token'),
    refresh_token: localStorage.getItem('refresh_token'),
    user: localStorage.getItem('user')
  };

  // Vider complètement localStorage
  localStorage.clear();

  // Restaurer uniquement les tokens d'authentification
  Object.entries(tokensToKeep).forEach(([key, value]) => {
    if (value) localStorage.setItem(key, value);
  });

  console.log('✅ localStorage nettoyé - Migration vers backend terminée');
}

/**
 * Vérifier et nettoyer automatiquement au démarrage de l'application
 */
export function autoCleanupOnStartup() {
  const isCleanupDone = sessionStorage.getItem('backend_migration_done');
  
  if (!isCleanupDone) {
    cleanupObsoleteLocalStorage();
    sessionStorage.setItem('backend_migration_done', 'true');
    console.log('🚀 Migration automatique vers backend effectuée');
  }
}