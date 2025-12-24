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

// Fonctions d'accès et manipulation
export const getClients = () => {
  // Charger les clients depuis localStorage
  try {
    const savedClients = localStorage.getItem('clients');
    if (savedClients && savedClients !== 'null') {
      const parsedClients = JSON.parse(savedClients);
      if (Array.isArray(parsedClients)) {
        clients = parsedClients;
      }
    }
  } catch (e) {
    console.error('Erreur lors du chargement des clients:', e);
  }
  return clients;
};

export const getClient = (code: string) => getClients().find(c => c.code === code);

export const addClient = (client: Client) => {
  clients.push(client);
  localStorage.setItem('clients', JSON.stringify(clients));
  return client;
};

export const getEchantillons = () => {
  // Charger les échantillons depuis localStorage
  try {
    const savedEchantillons = localStorage.getItem('echantillons');
    if (savedEchantillons && savedEchantillons !== 'null') {
      const parsedEchantillons = JSON.parse(savedEchantillons);
      if (Array.isArray(parsedEchantillons)) {
        echantillons = parsedEchantillons;
      }
    }
  } catch (e) {
    console.error('Erreur lors du chargement des échantillons:', e);
  }
  return echantillons;
};
export const getEchantillon = (code: string) => echantillons.find(e => e.code === code);
export const getEchantillonsByClient = (clientCode: string) => 
  echantillons.filter(e => e.clientCode === clientCode);
export const addEchantillon = (echantillon: Echantillon) => {
  echantillons.push(echantillon);
  localStorage.setItem('echantillons', JSON.stringify(echantillons));
  return echantillon;
};
export const updateEchantillon = (code: string, updates: Partial<Echantillon>) => {
  const index = echantillons.findIndex(e => e.code === code);
  if (index !== -1) {
    echantillons[index] = { ...echantillons[index], ...updates };
    return echantillons[index];
  }
  return null;
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
