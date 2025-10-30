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
  qrCode: string;
  dateReception: string;
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

// Données mockées
let clients: Client[] = [
  {
    id: '1',
    code: 'CLI-001',
    nom: 'SOGEA-SATOM',
    contact: 'M. Koné',
    projet: 'Autoroute Abidjan-Grand Bassam',
    email: 'kone@sogea-satom.com',
    telephone: '+225 07 00 00 01',
    dateCreation: '2025-01-15',
  },
  {
    id: '2',
    code: 'CLI-002',
    nom: 'Bouygues TP',
    contact: 'Mme Traoré',
    projet: 'Pont 3ème Pont',
    email: 'traore@bouygues.com',
    telephone: '+225 07 00 00 02',
    dateCreation: '2025-02-01',
  },
];

let echantillons: Echantillon[] = [
  {
    id: '1',
    code: 'S-0001/25',
    clientCode: 'CLI-001',
    nature: 'Sol argileux',
    profondeurDebut: '0',
    profondeurFin: '2',
    sondage: 'carotte',
    nappe: 'Non rencontrée',
    essais: ['AG', 'Proctor', 'CBR'],
    qrCode: 'QR-S-0001-25',
    dateReception: '2025-10-15',
    dateFinEstimee: '2025-10-25',
    statut: 'validation',
    priorite: 'urgente',
    chefProjet: 'Ing. Kouadio',
  },
  {
    id: '2',
    code: 'S-0002/25',
    clientCode: 'CLI-002',
    nature: 'Sol sableux',
    profondeurDebut: '2',
    profondeurFin: '4',
    sondage: 'vrac',
    nappe: '3.5m',
    essais: ['Oedometre', 'Cisaillement'],
    qrCode: 'QR-S-0002-25',
    dateReception: '2025-10-16',
    dateFinEstimee: '2025-11-05',
    statut: 'validation',
    chefProjet: 'Ing. Diallo',
  },
  {
    id: '3',
    code: 'S-0003/25',
    clientCode: 'CLI-001',
    nature: 'Sol limoneux',
    profondeurDebut: '0',
    profondeurFin: '3',
    sondage: 'carotte',
    nappe: '2.5m',
    essais: ['AG', 'Proctor'],
    qrCode: 'QR-S-0003-25',
    dateReception: '2025-10-17',
    dateFinEstimee: '2025-10-28',
    statut: 'validation',
    priorite: 'normale',
    chefProjet: 'Ing. Kouadio',
  },
  {
    id: '4',
    code: 'S-0004/25',
    clientCode: 'CLI-002',
    nature: 'Roche',
    profondeurDebut: '1',
    profondeurFin: '5',
    sondage: 'carotte',
    nappe: 'Non rencontrée',
    essais: ['CBR', 'Cisaillement'],
    qrCode: 'QR-S-0004-25',
    dateReception: '2025-10-18',
    dateFinEstimee: '2025-11-10',
    statut: 'validation',
    priorite: 'urgente',
    chefProjet: 'Ing. Touré',
  },
];

let essais: EssaiTest[] = [
  {
    id: '1',
    echantillonCode: 'S-0001/25',
    type: 'AG',
    section: 'route',
    dateReception: '2025-10-16',
    dateDebut: '2025-10-17',
    dateFin: '2025-10-21',
    operateur: 'Kouassi Jean',
    statut: 'termine',
    resultats: {
      pourcent_inf_2mm: '85.5',
      pourcent_inf_80um: '45.2',
      coefficient_uniformite: '6.5',
    },
    commentaires: 'Essai terminé avec succès',
    statutValidation: 'accepted',
    dureeEstimee: 5,
    fichier: 'AG_S-0001-25_Resultats.pdf',
  },
  {
    id: '2',
    echantillonCode: 'S-0001/25',
    type: 'Proctor',
    section: 'route',
    dateReception: '2025-10-16',
    dateDebut: '2025-10-18',
    dateFin: '2025-10-22',
    operateur: 'Marie Dupont',
    statut: 'termine',
    resultats: {
      densite_opt: '1.95',
      teneur_eau_opt: '12.5',
      type_proctor: 'Normal',
    },
    commentaires: 'Résultats optimaux obtenus',
    statutValidation: 'accepted',
    dureeEstimee: 4,
    fichier: 'Proctor_S-0001-25_Resultats.pdf',
  },
  {
    id: '3',
    echantillonCode: 'S-0001/25',
    type: 'CBR',
    section: 'route',
    dateReception: '2025-10-16',
    dateDebut: '2025-10-19',
    dateFin: '2025-10-24',
    operateur: 'Pierre Martin',
    statut: 'termine',
    resultats: {
      cbr_95: '45',
      cbr_98: '65',
      cbr_100: '85',
      gonflement: '0.5',
    },
    commentaires: 'Essai CBR réalisé selon normes',
    statutValidation: 'accepted',
    dureeEstimee: 5,
    fichier: 'CBR_S-0001-25_Resultats.pdf',
  },
  {
    id: '4',
    echantillonCode: 'S-0002/25',
    type: 'Oedometre',
    section: 'mecanique',
    dateReception: '2025-10-17',
    dateDebut: '2025-10-18',
    dateFin: '2025-11-02',
    operateur: 'Sophie Bernard',
    statut: 'termine',
    resultats: {
      module_young: '15000',
      coefficient_poisson: '0.35',
      contrainte_preconsolidation: '120',
    },
    commentaires: 'Essai oedométrique terminé',
    statutValidation: 'accepted',
    dureeEstimee: 18,
    fichier: 'Oedometre_S-0002-25_Resultats.pdf',
  },
  {
    id: '5',
    echantillonCode: 'S-0002/25',
    type: 'Cisaillement',
    section: 'mecanique',
    dateReception: '2025-10-17',
    dateDebut: '2025-10-20',
    dateFin: '2025-10-28',
    operateur: 'Luc Dubois',
    statut: 'termine',
    resultats: {
      cohesion: '15',
      angle_frottement: '28',
      resistance_cisaillement: '42',
    },
    commentaires: 'Essai de cisaillement terminé',
    statutValidation: 'accepted',
    dureeEstimee: 8,
    fichier: 'Cisaillement_S-0002-25_Resultats.pdf',
  },
  {
    id: '6',
    echantillonCode: 'S-0003/25',
    type: 'AG',
    section: 'route',
    dateReception: '2025-10-18',
    dateDebut: '2025-10-19',
    dateFin: '2025-10-23',
    operateur: 'Alice Moreau',
    statut: 'termine',
    resultats: {
      pourcent_inf_2mm: '78.3',
      pourcent_inf_80um: '38.7',
      coefficient_uniformite: '5.2',
    },
    commentaires: 'Résultats conformes',
    statutValidation: 'accepted',
    dureeEstimee: 5,
    fichier: 'AG_S-0003-25_Resultats.pdf',
  },
  {
    id: '7',
    echantillonCode: 'S-0003/25',
    type: 'Proctor',
    section: 'route',
    dateReception: '2025-10-18',
    dateDebut: '2025-10-20',
    dateFin: '2025-10-24',
    operateur: 'Thomas Petit',
    statut: 'termine',
    resultats: {
      densite_opt: '1.88',
      teneur_eau_opt: '14.2',
      type_proctor: 'Normal',
    },
    commentaires: 'Essai Proctor réussi',
    statutValidation: 'accepted',
    dureeEstimee: 4,
    fichier: 'Proctor_S-0003-25_Resultats.pdf',
  },
  {
    id: '8',
    echantillonCode: 'S-0004/25',
    type: 'CBR',
    section: 'route',
    dateReception: '2025-10-19',
    dateDebut: '2025-10-20',
    dateFin: '2025-10-25',
    operateur: 'Emma Leroy',
    statut: 'termine',
    resultats: {
      cbr_95: '52',
      cbr_98: '72',
      cbr_100: '92',
      gonflement: '0.3',
    },
    commentaires: 'CBR sur roche - valeurs élevées',
    statutValidation: 'accepted',
    dureeEstimee: 5,
    fichier: 'CBR_S-0004-25_Resultats.pdf',
  },
  {
    id: '9',
    echantillonCode: 'S-0004/25',
    type: 'Cisaillement',
    section: 'mecanique',
    dateReception: '2025-10-19',
    dateDebut: '2025-10-22',
    dateFin: '2025-10-30',
    operateur: 'Nicolas Roux',
    statut: 'termine',
    resultats: {
      cohesion: '25',
      angle_frottement: '35',
      resistance_cisaillement: '60',
    },
    commentaires: 'Essai sur roche - résistance élevée',
    statutValidation: 'accepted',
    dureeEstimee: 8,
    fichier: 'Cisaillement_S-0004-25_Resultats.pdf',
  },
  // Essai rejeté pour démonstration
  {
    id: '10',
    echantillonCode: 'S-0001/25',
    type: 'AG',
    section: 'route',
    dateReception: '2025-10-16',
    dateDebut: '2025-10-17',
    dateFin: '2025-10-21',
    dateRejet: '2025-10-22',
    operateur: 'Kouassi Jean',
    statut: 'termine',
    resultats: {
      pourcent_inf_2mm: '85.5',
      pourcent_inf_80um: '45.2',
      coefficient_uniformite: '6.5',
    },
    commentaires: 'Essai terminé avec succès',
    statutValidation: 'rejected',
    commentairesValidation: 'Valeurs d\'analyse granulométrique incohérentes - vérification requise',
    dureeEstimee: 5,
    fichier: 'AG_S-0001-25_Resultats.pdf',
  },
];

// Fonctions d'accès et manipulation
export const getClients = () => clients;
export const getClient = (code: string) => clients.find(c => c.code === code);
export const addClient = (client: Client) => {
  clients.push(client);
  return client;
};

export const getEchantillons = () => echantillons;
export const getEchantillon = (code: string) => echantillons.find(e => e.code === code);
export const getEchantillonsByClient = (clientCode: string) => 
  echantillons.filter(e => e.clientCode === clientCode);
export const addEchantillon = (echantillon: Echantillon) => {
  echantillons.push(echantillon);
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
  'Sol argileux',
  'Sol sableux',
  'Sol limoneux',
  'Sol graveleux',
  'Roche',
  'Latérite',
  'Argile',
  'Sable',
  'Gravier',
  'Tout-venant',
];

// Liste des chefs de projet
export const chefsProjets = [
  'Ing. Kouadio',
  'Ing. Diallo',
  'Ing. Yao',
  'Ing. Touré',
  'Ing. N\'Guessan',
];
