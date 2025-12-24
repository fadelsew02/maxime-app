// Types de données
export interface Client {
  id: string;
  code: string;
  nom: string;
  contact: string;
  projet: string;
  email: string;
  telephone: string;
  photo?: string;
  dateCreation: string;
}

export interface Echantillon {
  id: string;
  code: string;
  clientCode: string;
  nature: string;
  profondeurDebut: string;
  profondeurFin: string;
  sondage: 'carotte' | 'vrac';
  nappe: string;
  essais: string[];
  essaisDetails?: any[]; // Détails complets des essais avec dates
  qrCode: string;
  dateReception: string;
  dateEnvoiEssais?: string;
  dateFinEstimee: string;
  statut: 'attente' | 'stockage' | 'essais' | 'decodification' | 'traitement' | 'validation' | 'valide' | 'rejete';
  priorite?: 'normale' | 'urgente';
  chefProjet?: string;
  dateEnvoiSection?: string;
  dateRetourEstimee?: string;
  photo?: string;
}

export interface EssaiTest {
  id: string;
  echantillonCode: string;
  type: 'AG' | 'Proctor' | 'CBR' | 'Oedometre' | 'Cisaillement';
  section: 'route' | 'mecanique';
  dateReception?: string;
  dateDebut?: string;
  dateFin?: string;
  dateRejet?: string; // Date de rejet
  operateur?: string;
  statut: 'attente' | 'en_cours' | 'termine';
  resultats?: Record<string, any>;
  fichiers?: string[];
  commentaires?: string;
  commentairesValidation?: string; // Commentaires ajoutés lors de la validation
  statutValidation?: 'accepted' | 'rejected'; // Statut de validation du décodification
  dureeEstimee: number; // en jours
  fichier?: string; // URL ou nom du fichier attaché
  wasResumed?: boolean; // Indique si l'essai a été repris après rejet
}

// Données vides - tout sera chargé depuis localStorage
let clients: Client[] = [];
let echantillons: Echantillon[] = [];

let essais: EssaiTest[] = [];

// Service de données - utilise uniquement le backend
export const getClients = async (): Promise<Client[]> => {
  try {
    const response = await fetch('http://127.0.0.1:8000/api/clients/', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        'Content-Type': 'application/json',
      },
    });
    const data = await response.json();
    return data.results || [];
  } catch (e) {
    console.error('Erreur lors du chargement des clients:', e);
    return [];
  }
};

export const getClient = async (code: string): Promise<Client | undefined> => {
  const clients = await getClients();
  return clients.find(c => c.code === code);
};

export const addClient = async (client: Client): Promise<Client | null> => {
  try {
    const response = await fetch('http://127.0.0.1:8000/api/clients/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(client)
    });
    return response.ok ? await response.json() : null;
  } catch (e) {
    console.error('Erreur lors de l\'ajout du client:', e);
    return null;
  }
};

export const getEchantillons = async (): Promise<Echantillon[]> => {
  try {
    const response = await fetch('http://127.0.0.1:8000/api/echantillons/', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        'Content-Type': 'application/json',
      },
    });
    const data = await response.json();
    return data.results?.map((ech: any) => ({
      id: ech.id,
      code: ech.code,
      clientCode: ech.client_code,
      nature: ech.nature || '',
      profondeurDebut: ech.profondeur_debut || '',
      profondeurFin: ech.profondeur_fin || '',
      sondage: ech.sondage || 'vrac',
      nappe: ech.nappe || '',
      essais: ech.essais_types || [],
      qrCode: ech.code,
      dateReception: ech.date_reception || '',
      dateFinEstimee: '',
      statut: ech.statut || 'stockage',
      chefProjet: ech.chef_projet || ''
    })) || [];
  } catch (e) {
    console.error('Erreur lors du chargement des échantillons:', e);
    return [];
  }
};

export const getEchantillon = async (code: string): Promise<Echantillon | undefined> => {
  const echantillons = await getEchantillons();
  return echantillons.find(e => e.code === code);
};

export const getEchantillonsByClient = async (clientCode: string): Promise<Echantillon[]> => {
  const echantillons = await getEchantillons();
  return echantillons.filter(e => e.clientCode === clientCode);
};

export const addEchantillon = async (echantillon: Echantillon): Promise<Echantillon | null> => {
  try {
    const response = await fetch('http://127.0.0.1:8000/api/echantillons/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(echantillon)
    });
    return response.ok ? await response.json() : null;
  } catch (e) {
    console.error('Erreur lors de l\'ajout de l\'échantillon:', e);
    return null;
  }
};

export const updateEchantillon = async (code: string, updates: Partial<Echantillon>): Promise<Echantillon | null> => {
  try {
    const response = await fetch(`http://127.0.0.1:8000/api/echantillons/${code}/`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates)
    });
    return response.ok ? await response.json() : null;
  } catch (e) {
    console.error('Erreur lors de la mise à jour de l\'échantillon:', e);
    return null;
  }
};

export const getEssais = () => essais;
export const getEssaisBySection = (section: 'route' | 'mecanique') =>
  essais.filter(e => e.section === section);
export const getEssaisByEchantillon = (echantillonCode: string) =>
  essais.filter(e => e.echantillonCode === echantillonCode);
export const addEssai = (essai: EssaiTest) => {
  essais.push(essai);
  return essai;
};
export const updateEssai = (id: string, updates: Partial<EssaiTest>) => {
  const index = essais.findIndex(e => e.id === id);
  if (index !== -1) {
    essais[index] = { ...essais[index], ...updates };
    return essais[index];
  }
  return null;
};

// Générateur de code auto
export const generateClientCode = () => {
  const count = clients.length + 1;
  return `CLI-${String(count).padStart(3, '0')}`;
};

export const generateEchantillonCode = () => {
  const year = new Date().getFullYear().toString().slice(-2);
  const count = echantillons.length + 1;
  return `S-${String(count).padStart(4, '0')}/${year}`;
};

// Estimation de date de fin basée sur les essais
export const estimateEndDate = (essaisTypes: string[], priorite: 'normale' | 'urgente' = 'normale'): string => {
  const durees: Record<string, number> = {
    AG: 5,
    Proctor: 4,
    CBR: 5,
    Oedometre: 18,
    Cisaillement: 8,
  };
  
  const maxDuree = Math.max(...essaisTypes.map(type => durees[type] || 0));
  const reductionUrgent = priorite === 'urgente' ? 0.7 : 1; // 30% de réduction pour urgent
  const dureeFinale = Math.ceil(maxDuree * reductionUrgent);
  const today = new Date();
  const endDate = new Date(today.setDate(today.getDate() + dureeFinale + 2)); // +2 jours de marge
  
  return endDate.toISOString().split('T')[0];
};

// Calcul de la date de retour estimée depuis une date d'envoi
export const calculateReturnDate = (dateEnvoi: string, essaisTypes: string[], priorite: 'normale' | 'urgente' = 'normale'): string => {
  const durees: Record<string, number> = {
    AG: 5,
    Proctor: 4,
    CBR: 5,
    Oedometre: 18,
    Cisaillement: 8,
  };
  
  const maxDuree = Math.max(...essaisTypes.map(type => durees[type] || 0));
  const reductionUrgent = priorite === 'urgente' ? 0.7 : 1;
  const dureeFinale = Math.ceil(maxDuree * reductionUrgent);
  
  const startDate = new Date(dateEnvoi);
  const returnDate = new Date(startDate.setDate(startDate.getDate() + dureeFinale + 2));
  
  return returnDate.toISOString().split('T')[0];
};

// Liste des natures d'échantillons disponibles
export const naturesEchantillons = [
  'Sol',
  'Gravier',
];

// Liste des chefs de projet
export const chefsProjets = [
  'Ing. Kouadio',
  'Ing. Diallo',
  'Ing. Yao',
  'Ing. Touré',
  'Ing. N\'Guessan',
];
