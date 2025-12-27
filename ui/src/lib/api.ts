// Configuration de l'API
const API_BASE_URL = 'http://127.0.0.1:8000/api';

// Récupérer le token depuis le localStorage
const getAuthToken = (): string | null => {
  return localStorage.getItem('access_token');
};

// Sauvegarder les tokens
export const saveTokens = (accessToken: string, refreshToken: string) => {
  localStorage.setItem('access_token', accessToken);
  localStorage.setItem('refresh_token', refreshToken);
};

// Supprimer les tokens
export const clearTokens = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
};

// Fonction générique pour les requêtes API
export const apiRequest = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  const token = getAuthToken();
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    if (response.status === 401) {
      console.log('🔴 401 Unauthorized - Token invalide ou expiré');
      console.log('Endpoint:', endpoint);
      console.log('Token actuel:', token?.substring(0, 20) + '...');
      
      // Token expiré, essayer de rafraîchir
      const refreshed = await refreshAccessToken();
      if (refreshed) {
        console.log('✅ Token rafraîchi avec succès');
        // Réessayer la requête avec le nouveau token
        return apiRequest<T>(endpoint, options);
      } else {
        console.log('❌ Échec du rafraîchissement - Déconnexion');
        clearTokens();
        window.location.href = '/';
        throw new Error('Session expirée');
      }
    }
    
    const error = await response.json().catch(() => ({ detail: 'Erreur inconnue' }));
    console.log('🔴 Erreur API:', response.status, error);
    throw new Error(error.detail || `Erreur ${response.status}`);
  }

  return response.json();
};

// Rafraîchir le token d'accès
const refreshAccessToken = async (): Promise<boolean> => {
  const refreshToken = localStorage.getItem('refresh_token');
  
  if (!refreshToken) {
    return false;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh: refreshToken }),
    });

    if (response.ok) {
      const data = await response.json();
      localStorage.setItem('access_token', data.access);
      return true;
    }
    
    return false;
  } catch {
    return false;
  }
};
