// Service pour gérer les rapports via l'API backend
const API_BASE_URL = 'http://127.0.0.1:8000/api';

const getAuthToken = (): string | null => {
  return localStorage.getItem('access_token');
};

export interface RapportData {
  echantillon: string;
  contenu: string;
  statut?: string;
}

export interface Rapport {
  id: string;
  echantillon: string;
  echantillon_code: string;
  client_nom: string;
  contenu: string;
  signature_directeur: string;
  observations_chef_service: string;
  observations_directeur_technique: string;
  observations_directeur_snertp: string;
  statut: string;
  statut_display: string;
  date_envoi_chef_service: string | null;
  date_validation_chef_service: string | null;
  date_envoi_directeur_technique: string | null;
  date_validation_directeur_technique: string | null;
  date_envoi_directeur_snertp: string | null;
  date_envoi_client: string | null;
  created_at: string;
  updated_at: string;
}

// Créer un rapport
export const createRapport = async (data: RapportData): Promise<Rapport> => {
  const token = getAuthToken();
  const response = await fetch(`${API_BASE_URL}/rapports/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Erreur lors de la création du rapport');
  }

  return response.json();
};

// Récupérer tous les rapports
export const getRapports = async (filters?: { statut?: string; echantillon?: string }): Promise<Rapport[]> => {
  const token = getAuthToken();
  const params = new URLSearchParams();
  
  if (filters?.statut) params.append('statut', filters.statut);
  if (filters?.echantillon) params.append('echantillon', filters.echantillon);

  const response = await fetch(`${API_BASE_URL}/rapports/?${params.toString()}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error('Erreur lors de la récupération des rapports');
  }

  return response.json();
};

// Récupérer un rapport par ID
export const getRapport = async (id: string): Promise<Rapport> => {
  const token = getAuthToken();
  const response = await fetch(`${API_BASE_URL}/rapports/${id}/`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error('Erreur lors de la récupération du rapport');
  }

  return response.json();
};

// Mettre à jour un rapport
export const updateRapport = async (id: string, data: Partial<RapportData>): Promise<Rapport> => {
  const token = getAuthToken();
  const response = await fetch(`${API_BASE_URL}/rapports/${id}/`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Erreur lors de la mise à jour du rapport');
  }

  return response.json();
};

// Envoyer le rapport au chef service
export const envoyerRapportChefService = async (id: string): Promise<Rapport> => {
  const token = getAuthToken();
  const response = await fetch(`${API_BASE_URL}/rapports/${id}/envoyer_chef_service/`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Erreur lors de l\'envoi au chef service');
  }

  return response.json();
};

// Valider le rapport par le chef service
export const validerRapportChefService = async (id: string, action: 'accepter' | 'rejeter', observations: string): Promise<Rapport> => {
  const token = getAuthToken();
  const response = await fetch(`${API_BASE_URL}/rapports/${id}/valider_chef_service/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ action, observations })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Erreur lors de la validation');
  }

  return response.json();
};

// Valider le rapport par le directeur technique
export const validerRapportDirecteurTechnique = async (id: string, action: 'accepter' | 'rejeter', observations: string): Promise<Rapport> => {
  const token = getAuthToken();
  const response = await fetch(`${API_BASE_URL}/rapports/${id}/valider_directeur_technique/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ action, observations })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Erreur lors de la validation');
  }

  return response.json();
};

// Envoyer le rapport de traitement avec fichier
export const envoyerRapportTraitement = async (id: string, fichier: File): Promise<Rapport> => {
  const token = getAuthToken();
  const formData = new FormData();
  formData.append('fichier', fichier);

  const response = await fetch(`${API_BASE_URL}/rapports/${id}/envoyer_traitement/`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Erreur lors de l\'envoi du rapport de traitement');
  }

  return response.json();
};

// Envoyer le rapport au client avec signature
export const envoyerRapportClient = async (id: string, signature: string, observations: string): Promise<Rapport> => {
  const token = getAuthToken();
  const response = await fetch(`${API_BASE_URL}/rapports/${id}/envoyer_client/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ signature, observations })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Erreur lors de l\'envoi au client');
  }

  return response.json();
};
