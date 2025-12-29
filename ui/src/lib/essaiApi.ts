const API_BASE = 'https://snertp.onrender.com/api';

const getAuthHeaders = () => ({
  'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
  'Content-Type': 'application/json',
});

export interface EssaiData {
  id?: string;
  echantillon: string;
  type: string;
  section: string;
  resultats?: any;
  statut?: string;
  statut_validation?: string;
  date_debut?: string;
  date_fin?: string;
  operateur?: string;
  commentaires?: string;
  commentaires_validation?: string;
  fichier?: any;
}

export const essaiApi = {
  async getByEchantillon(echantillonId: string): Promise<EssaiData[]> {
    try {
      const url = `${API_BASE}/echantillons/${echantillonId}/essais/`;
      console.log('Fetching essais from:', url);
      const response = await fetch(url, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error('Erreur API');
      const data = await response.json();
      console.log('Essais reçus:', data.length || data.results?.length || 0);
      return data.results || data;
    } catch (error) {
      console.error('Erreur getByEchantillon:', error);
      return [];
    }
  },

  async create(data: Partial<EssaiData>): Promise<EssaiData | null> {
    try {
      const response = await fetch(`${API_BASE}/essais/`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Erreur création');
      return await response.json();
    } catch (error) {
      console.error('Erreur create:', error);
      return null;
    }
  },

  async update(id: string, data: Partial<EssaiData>): Promise<EssaiData | null> {
    try {
      const response = await fetch(`${API_BASE}/essais/${id}/`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Erreur mise à jour');
      return await response.json();
    } catch (error) {
      console.error('Erreur update:', error);
      return null;
    }
  },

  async getByStatus(status: string): Promise<EssaiData[]> {
    try {
      const response = await fetch(`${API_BASE}/essais/?statut=${status}`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error('Erreur API');
      const data = await response.json();
      return data.results || data;
    } catch (error) {
      console.error('Erreur getByStatus:', error);
      return [];
    }
  },
};
