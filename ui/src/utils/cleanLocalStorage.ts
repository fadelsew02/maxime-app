/**
 * Nettoyer localStorage et garder uniquement les tokens d'authentification
 */
export function cleanLocalStorage(): void {
  const tokens = {
    access_token: localStorage.getItem('access_token'),
    refresh_token: localStorage.getItem('refresh_token'),
    user: localStorage.getItem('user')
  };

  localStorage.clear();

  Object.entries(tokens).forEach(([key, value]) => {
    if (value) localStorage.setItem(key, value);
  });

  console.log('✅ localStorage nettoyé - Seuls les tokens sont conservés');
}

/**
 * Vérifier si localStorage contient des données obsolètes
 */
export function hasObsoleteData(): boolean {
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && !['access_token', 'refresh_token', 'user'].includes(key)) {
      return true;
    }
  }
  return false;
}

/**
 * Nettoyer automatiquement au démarrage
 */
export function autoCleanOnStartup(): void {
  if (hasObsoleteData()) {
    console.warn('⚠️ Données obsolètes détectées dans localStorage');
    cleanLocalStorage();
  }
}
