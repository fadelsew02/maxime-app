import { apiRequest } from './api';

export interface Echantillon {
  id: string;
  code: string;
  client: string;
  client_nom?: string;
  client_code?: string;
  nature: string;
  profondeur_debut: number;
  profondeur_fin: number;
  sondage: 'carotte' | 'vrac';
  nappe?: string;
  qr_code: string;
  photo?: string;
  date_reception: string;
  date_fin_estimee?: string;
  statut: string;
  statut_display?: string;
  priorite: string;
  priorite_display?: string;
  chef_projet?: string;
  essais?: any[];
  essais_types?: string[];
  created_at: string;
  updated_at: string;
}

export interface EchantillonCreate {
  client: string; // UUID du client
  nature: string;
  profondeur_debut: number;
  profondeur_fin: number;
  sondage: 'carotte' | 'vrac';
  nappe?: string;
  chef_projet?: string;
  priorite?: 'normale' | 'urgente';
  statut?: string;
  essais_types?: string[]; // Liste des types d'essais à créer
}

interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// Récupérer tous les échantillons
export const getEchantillons = async (): Promise<Echantillon[]> => {
  const response = await apiRequest<PaginatedResponse<Echantillon>>('/echantillons/');
  return response.results;
};

// Récupérer les échantillons par statut
export const getEchantillonsByStatut = async (statut: string): Promise<Echantillon[]> => {
  const response = await apiRequest<PaginatedResponse<Echantillon>>(`/echantillons/?statut=${statut}`);
  return response.results;
};

// Récupérer un échantillon par ID
export const getEchantillon = async (id: string): Promise<Echantillon> => {
  return apiRequest<Echantillon>(`/echantillons/${id}/`);
};

// Créer un nouvel échantillon
export const createEchantillon = async (data: EchantillonCreate, photoFile?: File): Promise<Echantillon> => {
  // Si une photo est fournie, utiliser FormData
  if (photoFile) {
    const formData = new FormData();
    formData.append('client', data.client);
    formData.append('nature', data.nature);
    formData.append('profondeur_debut', data.profondeur_debut.toString());
    formData.append('profondeur_fin', data.profondeur_fin.toString());
    formData.append('sondage', data.sondage);
    if (data.nappe) formData.append('nappe', data.nappe);
    if (data.chef_projet) formData.append('chef_projet', data.chef_projet);
    if (data.priorite) formData.append('priorite', data.priorite);
    if (data.statut) formData.append('statut', data.statut);
    if (data.essais_types) {
      data.essais_types.forEach(type => formData.append('essais_types', type));
    }
    formData.append('photo', photoFile);

    // Pour FormData, ne pas définir Content-Type (le navigateur le fait automatiquement)
    const token = localStorage.getItem('access_token');
    
    if (!token) {
      throw new Error('Non authentifié. Veuillez vous reconnecter.');
    }
    
    const response = await fetch(`https://snertp.onrender.com/api/echantillons/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Erreur lors de la création de l\'échantillon');
    }

    return response.json();
  }

  // Sans photo, utiliser JSON classique
  return apiRequest<Echantillon>('/echantillons/', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

// Mettre à jour un échantillon
export const updateEchantillon = async (id: string, data: Partial<EchantillonCreate>): Promise<Echantillon> => {
  return apiRequest<Echantillon>(`/echantillons/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
};

// Supprimer un échantillon
export const deleteEchantillon = async (id: string): Promise<void> => {
  return apiRequest<void>(`/echantillons/${id}/`, {
    method: 'DELETE',
  });
};

// Changer le statut d'un échantillon
export const changeEchantillonStatut = async (id: string, statut: string): Promise<Echantillon> => {
  return apiRequest<Echantillon>(`/echantillons/${id}/change_statut/`, {
    method: 'POST',
    body: JSON.stringify({ statut }),
  });
};

// Récupérer les essais d'un échantillon
export const getEchantillonEssais = async (id: string): Promise<any[]> => {
  return apiRequest<any[]>(`/echantillons/${id}/essais/`);
};

// Rechercher un échantillon par code
export const searchEchantillonByCode = async (code: string): Promise<Echantillon | null> => {
  try {
    const response = await apiRequest<PaginatedResponse<Echantillon>>(`/echantillons/?search=${encodeURIComponent(code)}`);
    // Retourner le premier résultat qui correspond exactement au code
    const exactMatch = response.results.find(e => e.code === code);
    return exactMatch || (response.results.length > 0 ? response.results[0] : null);
  } catch (error) {
    console.error('Erreur recherche échantillon:', error);
    return null;
  }
};

// Récupérer les échantillons d'un client par code client
export const getEchantillonsByClientCode = async (clientCode: string): Promise<Echantillon[]> => {
  try {
    const response = await apiRequest<PaginatedResponse<Echantillon>>(`/echantillons/?search=${encodeURIComponent(clientCode)}`);
    // Filtrer pour ne garder que les échantillons dont le client_code correspond
    return response.results.filter(e => e.client_code === clientCode);
  } catch (error) {
    console.error('Erreur récupération échantillons client:', error);
    return [];
  }
};
