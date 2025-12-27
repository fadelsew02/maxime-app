/**
 * Service API pour synchroniser les données avec le backend
 */

const API_BASE_URL = 'http://127.0.0.1:8000/api';

interface ApiResponse<T> {
  results?: T[];
  data?: T;
  count?: number;
}

class ApiService {
  private getAuthHeaders() {
    const token = localStorage.getItem('access_token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        ...this.getAuthHeaders(),
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // Échantillons
  async getEchantillons() {
    return this.request<ApiResponse<any>>('/echantillons/');
  }

  async getEchantillonsGroupedByClient() {
    return this.request<any[]>('/echantillons/grouped_by_client/');
  }

  async updateEchantillonDatesEnvoi(id: string, data: any) {
    return this.request<any>(`/echantillons/${id}/update_dates_envoi/`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateEchantillonStatut(id: string, statut: string) {
    return this.request<any>(`/echantillons/${id}/change_statut/`, {
      method: 'POST',
      body: JSON.stringify({ statut }),
    });
  }

  // Rapports
  async getRapports() {
    return this.request<ApiResponse<any>>('/rapports/');
  }

  async createRapport(data: any) {
    return this.request<any>('/rapports/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async envoyerRapportChefService(id: string) {
    return this.request<any>(`/rapports/${id}/envoyer_chef_service/`, {
      method: 'POST',
    });
  }

  async validerRapportChefService(id: string, action: 'accepter' | 'rejeter', observations: string) {
    return this.request<any>(`/rapports/${id}/valider_chef_service/`, {
      method: 'POST',
      body: JSON.stringify({ action, observations }),
    });
  }

  async validerRapportDirecteurTechnique(id: string, action: 'accepter' | 'rejeter', observations: string) {
    return this.request<any>(`/rapports/${id}/valider_directeur_technique/`, {
      method: 'POST',
      body: JSON.stringify({ action, observations }),
    });
  }

  async envoyerRapportClient(id: string, signature: string, observations: string) {
    return this.request<any>(`/rapports/${id}/envoyer_client/`, {
      method: 'POST',
      body: JSON.stringify({ signature, observations }),
    });
  }

  // Synchronisation des données localStorage
  async syncLocalStorageData() {
    try {
      console.log('Début de la synchronisation des données localStorage...');
      
      const echantillonsResponse = await this.getEchantillons();
      const echantillons = echantillonsResponse.results || [];

      let syncCount = 0;

      for (const echantillon of echantillons) {
        const updates: any = {};
        let hasUpdates = false;

        // Synchroniser les données de planification
        const planKey = `planning_${echantillon.code}`;
        const planData = localStorage.getItem(planKey);
        
        if (planData) {
          try {
            const planning = JSON.parse(planData);
            
            if (planning.dateEnvoiAG && !echantillon.date_envoi_ag) {
              updates.date_envoi_ag = planning.dateEnvoiAG;
              hasUpdates = true;
            }
            if (planning.dateEnvoiProctor && !echantillon.date_envoi_proctor) {
              updates.date_envoi_proctor = planning.dateEnvoiProctor;
              hasUpdates = true;
            }
            if (planning.dateEnvoiCBR && !echantillon.date_envoi_cbr) {
              updates.date_envoi_cbr = planning.dateEnvoiCBR;
              hasUpdates = true;
            }
            if (planning.dateRetour && !echantillon.date_retour_predite) {
              updates.date_retour_predite = planning.dateRetour;
              hasUpdates = true;
            }
            if (planning.essais && (!echantillon.essais_types || echantillon.essais_types.length === 0)) {
              updates.essais_types = planning.essais;
              hasUpdates = true;
            }
          } catch (e) {
            console.warn(`Erreur parsing planning pour ${echantillon.code}:`, e);
          }
        }

        // Synchroniser les données d'envoi au chef service
        const sentKey = `sent_to_chef_${echantillon.code}`;
        const sentData = localStorage.getItem(sentKey);
        
        if (sentData) {
          try {
            const sent = JSON.parse(sentData);
            if (sent.sent === true && echantillon.statut !== 'traitement') {
              const rapportData = {
                echantillon: echantillon.id,
                contenu: `Rapport pour l'échantillon ${echantillon.code}`,
                statut: 'chef_service',
                date_envoi_chef_service: sent.date || new Date().toISOString(),
              };

              try {
                await this.createRapport(rapportData);
                console.log(`Rapport créé pour ${echantillon.code}`);
              } catch (error) {
                console.warn(`Rapport existe déjà pour ${echantillon.code}`);
              }

              if (echantillon.statut !== 'traitement') {
                await this.updateEchantillonStatut(echantillon.id, 'traitement');
                console.log(`Statut mis à jour pour ${echantillon.code}`);
              }
            }
          } catch (e) {
            console.warn(`Erreur parsing sent data pour ${echantillon.code}:`, e);
          }
        }

        if (hasUpdates) {
          try {
            await this.updateEchantillonDatesEnvoi(echantillon.id, updates);
            syncCount++;
            console.log(`Données synchronisées pour ${echantillon.code}:`, updates);
          } catch (error) {
            console.error(`Erreur sync pour ${echantillon.code}:`, error);
          }
        }
      }

      console.log(`Synchronisation terminée. ${syncCount} échantillons mis à jour.`);
      return { success: true, syncCount };

    } catch (error) {
      console.error('Erreur lors de la synchronisation:', error);
      return { success: false, error };
    }
  }
}

export const apiService = new ApiService();
export default apiService;