import { useEffect } from 'react';
import { apiService } from '../services/apiService';

export function useAutoSync() {
  useEffect(() => {
    const performAutoSync = async () => {
      try {
        const token = localStorage.getItem('access_token');
        if (!token) return;

        console.log('Démarrage de la synchronisation automatique...');
        const result = await apiService.syncLocalStorageData();
        
        if (result.success && result.syncCount > 0) {
          console.log(`Synchronisation réussie: ${result.syncCount} éléments synchronisés`);
        }
      } catch (error) {
        console.warn('Synchronisation automatique échouée:', error);
      }
    };

    // Synchroniser au démarrage après un délai
    const timer = setTimeout(performAutoSync, 2000);

    return () => clearTimeout(timer);
  }, []);
}