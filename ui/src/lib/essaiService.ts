// Service pour gérer les essais via l'API backend
const API_BASE_URL = 'http://127.0.0.1:8000/api';

const getAuthToken = (): string | null => {
  return localStorage.getItem('access_token');
};

export interface EssaiData {
  echantillon: string;
  type: string;
  section: string;
  duree_estimee: number;
  operateur?: string;
  date_reception?: string;
  date_debut?: string;
  date_fin?: string;
  resultats?: any;
  commentaires?: string;
  statut?: string;
}

export interface Essai {
  id: string;
  echantillon: string;
  echantillon_code: string;
  type: string;
  type_display: string;
  section: string;
  section_display: string;
  date_reception: string | null;
  date_debut: string | null;
  date_fin: string | null;
  date_rejet: string | null;
  duree_estimee: number;
  operateur: string;
  statut: string;
  statut_display: string;
  statut_validation: string;
  resultats: any;
  commentaires: string;
  commentaires_validation: string;
  fichier: string | null;
  was_resumed: boolean;
  created_at: string;
  updated_at: string;
}

// Créer un essai
export const createEssai = async (data: EssaiData): Promise<Essai> => {
  const token = getAuthToken();
  const response = await fetch(`${API_BASE_URL}/essais/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Erreur lors de la création de l\'essai');
  }

  return response.json();
};

// Créer un essai avec fichier
export const createEssaiWithFile = async (data: EssaiData, file: File): Promise<Essai> => {
  const token = getAuthToken();
  const formData = new FormData();
  
  Object.keys(data).forEach(key => {
    const value = data[key as keyof EssaiData];
    if (value !== undefined && value !== null) {
      formData.append(key, typeof value === 'object' ? JSON.stringify(value) : String(value));
    }
  });
  
  formData.append('fichier', file);

  const response = await fetch(`${API_BASE_URL}/essais/create_with_file/`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Erreur lors de la création de l\'essai');
  }

  return response.json();
};

// Récupérer tous les essais
export const getEssais = async (filters?: { section?: string; statut?: string; type?: string }): Promise<Essai[]> => {
  const token = getAuthToken();
  const params = new URLSearchParams();
  
  if (filters?.section) params.append('section', filters.section);
  if (filters?.statut) params.append('statut', filters.statut);
  if (filters?.type) params.append('type', filters.type);

  const response = await fetch(`${API_BASE_URL}/essais/?${params.toString()}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error('Erreur lors de la récupération des essais');
  }

  return response.json();
};

// Récupérer un essai par ID
export const getEssai = async (id: string): Promise<Essai> => {
  const token = getAuthToken();
  const response = await fetch(`${API_BASE_URL}/essais/${id}/`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error('Erreur lors de la récupération de l\'essai');
  }

  return response.json();
};

// Mettre à jour un essai
export const updateEssai = async (id: string, data: Partial<EssaiData>): Promise<Essai> => {
  const token = getAuthToken();
  const response = await fetch(`${API_BASE_URL}/essais/${id}/`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Erreur lors de la mise à jour de l\'essai');
  }

  return response.json();
};

// Mettre à jour les résultats d'un essai
export const updateEssaiResultats = async (id: string, data: { resultats?: any; operateur?: string; commentaires?: string }, file?: File): Promise<Essai> => {
  const token = getAuthToken();
  
  if (file) {
    const formData = new FormData();
    if (data.resultats) formData.append('resultats', JSON.stringify(data.resultats));
    if (data.operateur) formData.append('operateur', data.operateur);
    if (data.commentaires) formData.append('commentaires', data.commentaires);
    formData.append('fichier', file);

    const response = await fetch(`${API_BASE_URL}/essais/${id}/update_resultats/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Erreur lors de la mise à jour des résultats');
    }

    return response.json();
  } else {
    const response = await fetch(`${API_BASE_URL}/essais/${id}/update_resultats/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Erreur lors de la mise à jour des résultats');
    }

    return response.json();
  }
};

// Démarrer un essai
export const demarrerEssai = async (id: string, data: { date_debut?: string; operateur?: string }): Promise<Essai> => {
  const token = getAuthToken();
  const response = await fetch(`${API_BASE_URL}/essais/${id}/demarrer/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Erreur lors du démarrage de l\'essai');
  }

  return response.json();
};

// Terminer un essai
export const terminerEssai = async (id: string, data: { date_fin?: string; resultats?: any; commentaires?: string; statut_validation?: string }, file?: File): Promise<Essai> => {
  const token = getAuthToken();
  
  if (file) {
    const formData = new FormData();
    if (data.date_fin) formData.append('date_fin', data.date_fin);
    if (data.resultats) formData.append('resultats', JSON.stringify(data.resultats));
    if (data.commentaires) formData.append('commentaires', data.commentaires);
    if (data.statut_validation) formData.append('statut_validation', data.statut_validation);
    formData.append('fichier', file);

    const response = await fetch(`${API_BASE_URL}/essais/${id}/terminer/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Erreur lors de la fin de l\'essai');
    }

    return response.json();
  } else {
    const response = await fetch(`${API_BASE_URL}/essais/${id}/terminer/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Erreur lors de la fin de l\'essai');
    }

    return response.json();
  }
};

// Rejeter un essai
export const rejeterEssai = async (id: string, commentaires: string): Promise<Essai> => {
  const token = getAuthToken();
  const response = await fetch(`${API_BASE_URL}/essais/${id}/rejeter/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ commentaires })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Erreur lors du rejet de l\'essai');
  }

  return response.json();
};

// Accepter un essai
export const accepterEssai = async (id: string, commentaires?: string): Promise<Essai> => {
  const token = getAuthToken();
  const response = await fetch(`${API_BASE_URL}/essais/${id}/accepter/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ commentaires: commentaires || '' })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Erreur lors de l\'acceptation de l\'essai');
  }

  return response.json();
};

// Récupérer les essais par section
export const getEssaisBySection = async (section: 'route' | 'mecanique'): Promise<Essai[]> => {
  return getEssais({ section });
};

// Récupérer les essais d'un échantillon
export const getEssaisByEchantillon = async (echantillonId: string): Promise<Essai[]> => {
  const token = getAuthToken();
  const response = await fetch(`${API_BASE_URL}/echantillons/${echantillonId}/essais/`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error('Erreur lors de la récupération des essais de l\'échantillon');
  }

  return response.json();
};
