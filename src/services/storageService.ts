/**
 * Service de stockage centralisé - Remplace localStorage par des appels backend
 */

const API_BASE_URL = 'http://127.0.0.1:8000/api';

class StorageService {
  private getAuthHeaders() {
    const token = localStorage.getItem('access_token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  // Sauvegarder des données
  async setItem(key: string, value: any): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/storage/`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ key, value: JSON.stringify(value) }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Erreur API storage:', response.status, errorData);
        throw new Error(`Erreur sauvegarde: ${response.status}`);
      }
    } catch (error) {
      console.error('Erreur setItem:', error);
      throw error;
    }
  }

  // Récupérer des données
  async getItem(key: string): Promise<any | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/storage/${key}/`, {
        headers: this.getAuthHeaders(),
      });
      
      if (!response.ok) {
        // Fallback vers localStorage
        const localValue = localStorage.getItem(key);
        return localValue ? JSON.parse(localValue) : null;
      }
      
      const data = await response.json();
      return data.value ? JSON.parse(data.value) : null;
    } catch (error) {
      // Fallback vers localStorage
      const localValue = localStorage.getItem(key);
      return localValue ? JSON.parse(localValue) : null;
    }
  }

  // Supprimer des données
  async removeItem(key: string): Promise<void> {
    try {
      await fetch(`${API_BASE_URL}/storage/${key}/`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      });
    } catch (error) {
      console.error('Erreur removeItem:', error);
    }
  }

  // Récupérer toutes les clés
  async getAllKeys(): Promise<string[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/storage/`, {
        headers: this.getAuthHeaders(),
      });
      
      if (!response.ok) return [];
      
      const data = await response.json();
      return data.results?.map((item: any) => item.key) || [];
    } catch (error) {
      console.error('Erreur getAllKeys:', error);
      return [];
    }
  }
}

export const storageService = new StorageService();
export default storageService;
