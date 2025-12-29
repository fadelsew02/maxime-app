const API_BASE = 'https://snertp.onrender.com/api';

const getAuthHeaders = () => ({
  'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
  'Content-Type': 'application/json',
});

export interface WorkflowData {
  id?: number;
  echantillon: number;
  code_echantillon: string;
  client_id?: string;
  etape_actuelle: 'chef_projet' | 'chef_service' | 'directeur_technique' | 'directeur_snertp' | 'marketing' | 'client';
  statut: 'en_attente' | 'valide' | 'rejete';
  file_data?: string;
  file_name?: string;
  client_name?: string;
  created_at?: string;
  
  // Responsable Traitement
  observations_traitement?: string;
  
  // Chef Projet
  validation_chef_projet?: boolean;
  date_validation_chef_projet?: string;
  date_envoi_chef_projet?: string;
  commentaire_chef_projet?: string;
  rejet_chef_projet?: boolean;
  raison_rejet_chef_projet?: string;
  validated_by_chef_projet?: boolean;
  comment_chef_projet?: string;
  
  // Chef Service
  validation_chef_service?: boolean;
  date_validation_chef_service?: string;
  commentaire_chef_service?: string;
  rejet_chef_service?: boolean;
  raison_rejet_chef_service?: string;
  validated_by_chef_service?: boolean;
  comment_chef_service?: string;
  
  // Directeur Technique
  validation_directeur_technique?: boolean;
  date_validation_directeur_technique?: string;
  commentaire_directeur_technique?: string;
  rejet_directeur_technique?: boolean;
  raison_rejet_directeur_technique?: string;
  validated_by_directeur_technique?: boolean;
  comment_directeur_technique?: string;
  
  // Directeur SNERTP
  avis_directeur_snertp?: string;
  signature_directeur_snertp?: string;
  date_avis_directeur_snertp?: string;
  rejet_directeur_snertp?: boolean;
  raison_rejet_directeur_snertp?: string;
  observations_directeur_snertp?: string;
  signature_directeur_snertp?: string;
  avise_by_directeur_snertp?: boolean;
  
  // Marketing
  date_envoi_client?: string;
  email_client?: string;
}

export const workflowApi = {
  // Récupérer workflows par étape
  async getByEtape(etape: string): Promise<WorkflowData[]> {
    try {
      const response = await fetch(`${API_BASE}/workflows/par_etape/?etape=${etape}`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error('Erreur API');
      const data = await response.json();
      return data.results || data;
    } catch (error) {
      console.error('Erreur getByEtape:', error);
      return [];
    }
  },

  // Créer un workflow
  async create(data: Partial<WorkflowData>): Promise<WorkflowData | null> {
    try {
      const response = await fetch(`${API_BASE}/workflows/`, {
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

  // Valider par chef projet
  async validerChefProjet(id: number, commentaire?: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE}/workflows/${id}/valider_chef_projet/`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ action: 'accepter', comment: commentaire }),
      });
      return response.ok;
    } catch (error) {
      console.error('Erreur validerChefProjet:', error);
      return false;
    }
  },

  // Rejeter par chef projet
  async rejeterChefProjet(id: number, raison: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE}/workflows/${id}/valider_chef_projet/`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ action: 'rejeter', comment: raison }),
      });
      return response.ok;
    } catch (error) {
      console.error('Erreur rejeterChefProjet:', error);
      return false;
    }
  },

  // Valider par chef service
  async validerChefService(id: number, commentaire?: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE}/workflows/${id}/valider_chef_service/`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ action: 'accepter', comment: commentaire }),
      });
      return response.ok;
    } catch (error) {
      console.error('Erreur validerChefService:', error);
      return false;
    }
  },

  // Rejeter par chef service
  async rejeterChefService(id: number, raison: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE}/workflows/${id}/valider_chef_service/`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ action: 'rejeter', comment: raison }),
      });
      return response.ok;
    } catch (error) {
      console.error('Erreur rejeterChefService:', error);
      return false;
    }
  },

  // Valider par directeur technique
  async validerDirecteurTechnique(id: number, commentaire?: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE}/workflows/${id}/valider_directeur_technique/`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ action: 'accepter', comment: commentaire }),
      });
      return response.ok;
    } catch (error) {
      console.error('Erreur validerDirecteurTechnique:', error);
      return false;
    }
  },

  // Rejeter par directeur technique
  async rejeterDirecteurTechnique(id: number, raison: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE}/workflows/${id}/valider_directeur_technique/`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ action: 'rejeter', comment: raison }),
      });
      return response.ok;
    } catch (error) {
      console.error('Erreur rejeterDirecteurTechnique:', error);
      return false;
    }
  },

  // Aviser par directeur SNERTP
  async aviserDirecteurSNERTP(id: number, avis: string, signature: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE}/workflows/${id}/aviser_directeur_snertp/`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ observations: avis, signature }),
      });
      return response.ok;
    } catch (error) {
      console.error('Erreur aviserDirecteurSNERTP:', error);
      return false;
    }
  },

  // Rejeter par directeur SNERTP
  async rejeterDirecteurSNERTP(id: number, raison: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE}/workflows/${id}/aviser_directeur_snertp/`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ action: 'rejeter', observations: raison }),
      });
      return response.ok;
    } catch (error) {
      console.error('Erreur rejeterDirecteurSNERTP:', error);
      return false;
    }
  },

  // Envoyer au client
  async envoyerClient(id: number, email: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE}/workflows/${id}/envoyer_client/`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ email_client: email }),
      });
      return response.ok;
    } catch (error) {
      console.error('Erreur envoyerClient:', error);
      return false;
    }
  },

  // Récupérer un workflow par code échantillon
  async getByCode(code: string): Promise<WorkflowData | null> {
    try {
      const response = await fetch(`${API_BASE}/workflows/?code_echantillon=${code}`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error('Erreur API');
      const data = await response.json();
      return data.results?.[0] || null;
    } catch (error) {
      console.error('Erreur getByCode:', error);
      return null;
    }
  },
};
