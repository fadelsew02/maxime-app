import { apiRequest } from './api';

export interface Client {
  id: string;
  code: string;
  nom: string;
  contact: string;
  projet: string;
  email?: string;
  telephone?: string;
  photo?: string;
  created_at: string;
  updated_at: string;
  echantillons_count?: number;
}

export interface ClientCreate {
  nom: string;
  contact: string;
  projet: string;
  email?: string;
  telephone?: string;
}

interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// Récupérer tous les clients
export const getClients = async (): Promise<Client[]> => {
  const response = await apiRequest<PaginatedResponse<Client>>('/clients/');
  return response.results;
};

// Récupérer un client par ID
export const getClient = async (id: string): Promise<Client> => {
  return apiRequest<Client>(`/clients/${id}/`);
};

// Créer un nouveau client
export const createClient = async (data: ClientCreate): Promise<Client> => {
  return apiRequest<Client>('/clients/', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

// Mettre à jour un client
export const updateClient = async (id: string, data: Partial<ClientCreate>): Promise<Client> => {
  return apiRequest<Client>(`/clients/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
};

// Supprimer un client
export const deleteClient = async (id: string): Promise<void> => {
  return apiRequest<void>(`/clients/${id}/`, {
    method: 'DELETE',
  });
};

// Récupérer les échantillons d'un client
export const getClientEchantillons = async (id: string): Promise<any[]> => {
  return apiRequest<any[]>(`/clients/${id}/echantillons/`);
};

// Rechercher un client par code
export const searchClientByCode = async (code: string): Promise<Client | null> => {
  try {
    const response = await apiRequest<PaginatedResponse<Client>>(`/clients/?search=${encodeURIComponent(code)}`);
    // Retourner le premier résultat qui correspond exactement au code
    const exactMatch = response.results.find(c => c.code === code);
    return exactMatch || (response.results.length > 0 ? response.results[0] : null);
  } catch (error) {
    console.error('Erreur recherche client:', error);
    return null;
  }
};
