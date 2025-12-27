import { useState, useEffect } from 'react';
import { User } from '../App';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { MarketingDashboard } from './MarketingDashboard';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import QRCode from 'react-qr-code';
import { Calendar } from './ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Clock, CheckCircle, AlertCircle, TrendingUp, Search, QrCode, Users, FileText, Printer, CalendarIcon, Filter, RefreshCw } from 'lucide-react';
import * as React from 'react';
import { getClients, getEchantillons, getEchantillon, getEchantillonsByClient, getClient, getEssais, Client, Echantillon } from '../lib/mockData';
import DirecteurSNERTPDashboard from './DirecteurSNERTPDashboard';
import { SyncButton } from './SyncButton';


interface DashboardHomeProps {
  user: User;
}

// Interface pour la date d'envoi prédite
interface DateEnvoiPredite {
  date: string;
  confidence: number;
  raison: string;
  delaiJours: number;
  dateRetour: string;
  confidenceRetour: number;
  raisonRetour: string;
  delaiRetourJours: number;
  chargeParEssai?: Record<string, number>;
}

// Interface pour la date de retour prédite
interface DateRetourPredite {
  dateRetour: string;
  confidenceRetour: number;
  raisonRetour: string;
  delaiRetourJours: number;
}

// Fonction pour ajouter des jours ouvrables (excluant week-ends et jours fériés)
function ajouterJoursOuvrables(dateDebut: Date, nombreJours: number): Date {
  const joursFeries2025 = [
    new Date(2025, 0, 1),   // Jour de l'an
    new Date(2025, 3, 21),  // Lundi de Pâques
    new Date(2025, 4, 1),   // Fête du travail
    new Date(2025, 4, 29),  // Ascension
    new Date(2025, 5, 9),   // Lundi de Pentecôte
    new Date(2025, 7, 7),   // Fête de l'indépendance
    new Date(2025, 7, 15),  // Assomption
    new Date(2025, 10, 1),  // Toussaint
    new Date(2025, 10, 15), // Journée nationale de la paix
    new Date(2025, 11, 25), // Noël
  ];

  const estJourFerie = (date: Date) => {
    return joursFeries2025.some(ferie => 
      ferie.getDate() === date.getDate() &&
      ferie.getMonth() === date.getMonth() &&
      ferie.getFullYear() === date.getFullYear()
    );
  };

  const estWeekend = (date: Date) => {
    const jour = date.getDay();
    return jour === 0 || jour === 6; // Dimanche ou Samedi
  };

  let dateResultat = new Date(dateDebut);
  let joursAjoutes = 0;

  while (joursAjoutes < nombreJours) {
    dateResultat.setDate(dateResultat.getDate() + 1);
    if (!estWeekend(dateResultat) && !estJourFerie(dateResultat)) {
      joursAjoutes++;
    }
  }

  return dateResultat;
}

// Fonction pour compter les échantillons en attente par type d'essai depuis l'API
async function compterEchantillonsEnAttente(): Promise<Record<string, number>> {
  try {
    const response = await fetch('http://127.0.0.1:8000/api/echantillons/', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        'Content-Type': 'application/json',
      },
    });
    const data = await response.json();
    const echantillons = data.results || [];
    
    // Compter les échantillons en attente (statut stockage ou essais) par type d'essai
    const compteurs: Record<string, number> = {
      AG: 0,
      Proctor: 0,
      CBR: 0,
      Oedometre: 0,
      Cisaillement: 0
    };
    
    echantillons.forEach((ech: any) => {
      if (ech.statut === 'stockage' || ech.statut === 'essais') {
        const essaisTypes = ech.essais_types || [];
        essaisTypes.forEach((type: string) => {
          if (compteurs[type] !== undefined) {
            compteurs[type]++;
          }
        });
      }
    });
    
    return compteurs;
  } catch (error) {
    console.error('Erreur comptage échantillons:', error);
    return { AG: 0, Proctor: 0, CBR: 0, Oedometre: 0, Cisaillement: 0 };
  }
}

// Simulation d'IA pour prédire la date d'envoi basée sur les contraintes réelles du laboratoire
async function simulerIADateEnvoiAsync(echantillon: Echantillon, chargeParEssai?: Record<string, number>): Promise<DateEnvoiPredite> {
  const aujourdHui = new Date();
  
  // Si la charge n'est pas fournie, la charger depuis l'API
  let charge = chargeParEssai;
  if (!charge) {
    charge = await compterEchantillonsEnAttente();
  }
  
  return calculerDateEnvoi(echantillon, aujourdHui, charge);
}

// Version synchrone pour compatibilité
function simulerIADateEnvoi(echantillon: Echantillon, chargeParEssai?: Record<string, number>): DateEnvoiPredite {
  const aujourdHui = new Date();
  const charge = chargeParEssai || {
    AG: 0,
    Proctor: 0,
    CBR: 0,
    Oedometre: 0,
    Cisaillement: 0
  };
  return calculerDateEnvoi(echantillon, aujourdHui, charge);
}

function calculerDateEnvoi(echantillon: Echantillon, aujourdHui: Date, charge: Record<string, number>): DateEnvoiPredite {

  // Durées réelles des essais (en jours)
  const dureesEssais: Record<string, number> = {
    AG: 5,           // Analyse granulométrique par tamisage : 5 jours
    Proctor: 5,      // Proctor : 5 jours
    CBR: 9,          // CBR complet : 9 jours
    Oedometre: 18,   // Oedométrique : 18 jours
    Cisaillement: 4, // Cisaillement direct : 4 jours
  };

  // Capacités par type d'essai par jour (par opérateur)
  const capacitesParJour: Record<string, number> = {
    AG: 5,           // 5 essais AG par jour
    Proctor: 4,      // 4 essais Proctor par jour
    CBR: 4,          // 4 essais CBR par jour
    Oedometre: 10,   // 10 essais simultanés sur 18 jours
    Cisaillement: 4, // 4 essais Cisaillement par jour
  };

  let delaiMaxEnvoi = 0;
  let dureeEssaiLePlusLong = 0;
  let raison = "Basé sur les contraintes réelles du laboratoire";

  echantillon.essais.forEach(essai => {
    const dureeEssai = dureesEssais[essai] || 0;
    const capaciteJour = capacitesParJour[essai] || 1;
    const chargeActuelle = charge[essai] || 0;
    
    let delaiAttente = 0;
    
    // Calcul spécifique pour l'œdométrique (capacité sur 18 jours)
    if (essai === 'Oedometre') {
      if (chargeActuelle >= 10) {
        // Si 10 essais ou plus en cours, attendre qu'un se termine
        delaiAttente = Math.ceil((chargeActuelle - 9) * 18 / 10);
      }
    } else {
      // Pour les autres essais : délai d'attente augmente tous les N échantillons
      // 0-4 → 0 jour, 5-9 → 1 jour, 10-14 → 2 jours, etc.
      delaiAttente = Math.floor(chargeActuelle / capaciteJour);
    }
    
    // Garder la durée de l'essai le plus long (essais en parallèle)
    if (dureeEssai > dureeEssaiLePlusLong) {
      dureeEssaiLePlusLong = dureeEssai;
    }
    
    // Garder le délai d'attente le plus long
    if (delaiAttente > delaiMaxEnvoi) {
      delaiMaxEnvoi = delaiAttente;
    }
  });

  // Date d'envoi = aujourd'hui + délai d'attente maximum (en jours ouvrables)
  const dateEnvoi = ajouterJoursOuvrables(aujourdHui, delaiMaxEnvoi);

  // Date de retour = délai d'attente + essai le plus long + 2 jours de traitement (en jours ouvrables)
  const delaiTraitement = 2; // 2 jours de traitement par échantillon
  const delaiRetourTotal = delaiMaxEnvoi + dureeEssaiLePlusLong + delaiTraitement;
  const dateRetour = ajouterJoursOuvrables(aujourdHui, delaiRetourTotal);

  // Calcul de la confiance basée sur la charge
  let confidence = 0.90; // Base élevée car basé sur contraintes réelles
  
  // Réduire la confiance si beaucoup d'attente
  if (delaiMaxEnvoi > 5) {
    confidence -= 0.15;
  } else if (delaiMaxEnvoi > 2) {
    confidence -= 0.05;
  }
  
  confidence = Math.min(0.95, Math.max(0.75, confidence));

  // Formatage des dates
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  };

  return {
    date: dateEnvoi.toLocaleDateString('fr-FR', options),
    confidence: Math.round(confidence * 100),
    raison,
    delaiJours: delaiMaxEnvoi,
    dateRetour: dateRetour.toLocaleDateString('fr-FR', options),
    confidenceRetour: Math.round((confidence - 0.05) * 100),
    raisonRetour: `Délai total: ${dureeEssaiLePlusLong} jours d'essais + ${delaiTraitement} jours de traitement`,
    delaiRetourJours: delaiRetourTotal,
    chargeParEssai: charge
  };
}

export function DashboardHome({ user }: DashboardHomeProps) {
  // Données mockées pour la démo
  const echantillons = getEchantillons();
  const clients = getClients();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [echantillonsAPI, setEchantillonsAPI] = useState<any[]>([]);

  // Charger les échantillons depuis l'API pour le directeur technique
  useEffect(() => {
    if (user.role === 'directeur_technique') {
      const loadEchantillons = async () => {
        try {
          const response = await fetch('http://127.0.0.1:8000/api/echantillons/', {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
              'Content-Type': 'application/json',
            },
          });
          const data = await response.json();
          setEchantillonsAPI(data.results || []);
        } catch (e) {
          console.error('Erreur chargement échantillons:', e);
        }
      };
      loadEchantillons();
    }
  }, [user.role]);

  // Fusionner les échantillons
  const allEchantillons = user.role === 'directeur_technique' ? echantillonsAPI : echantillons;

  // Filtrage des échantillons selon le statut
  const filteredEchantillons = Array.isArray(allEchantillons) 
    ? (statusFilter === 'all' ? allEchantillons : allEchantillons.filter(e => e.statut === statusFilter))
    : [];

  // Fonction pour obtenir le nom du client
  const getClientName = (clientCode: string) => {
    const client = clients.find(c => c.code === clientCode);
    return client ? client.nom : clientCode;
  };

  // Fonction pour formater le statut
  const formatStatus = (statut: string) => {
    const statusMap: Record<string, string> = {
      'attente': 'En attente',
      'stockage': 'Stockage',
      'essais': 'Essais',
      'decodification': 'Décodification',
      'traitement': 'Traitement',
      'validation': 'Validation',
      'valide': 'Validé',
      'rejete': 'Rejeté'
    };
    return statusMap[statut] || statut;
  };

  // Fonction pour obtenir la couleur du statut
  const getStatusColor = (statut: string) => {
    const colorMap: Record<string, string> = {
      'attente': '#FFC107',
      'stockage': '#17A2B8',
      'essais': '#003366',
      'decodification': '#6F42C1',
      'traitement': '#FD7E14',
      'validation': '#E83E8C',
      'valide': '#28A745',
      'rejete': '#DC3545'
    };
    return colorMap[statut] || '#6C757D';
  };

  // Fonction pour déterminer le statut le plus défavorable
  const getWorstStatus = (echantillons: Echantillon[]): string => {
    const statusPriority: Record<string, number> = {
      'rejete': 0,        // Plus défavorable
      'attente': 1,
      'stockage': 2,
      'essais': 3,
      'decodification': 4,
      'traitement': 5,
      'validation': 6,
      'valide': 7         // Plus favorable
    };

    let worstStatus = 'valide';
    let worstPriority = 7;

    echantillons.forEach(ech => {
      const priority = statusPriority[ech.statut] ?? 7;
      if (priority < worstPriority) {
        worstPriority = priority;
        worstStatus = ech.statut;
      }
    });

    return worstStatus;
  };

  // Grouper les échantillons par client
  const groupedByClient = filteredEchantillons.reduce((acc, ech) => {
    const clientCode = ech.clientCode;
    if (!acc[clientCode]) {
      acc[clientCode] = [];
    }
    acc[clientCode].push(ech);
    return acc;
  }, {} as Record<string, Echantillon[]>);

  // Accueil spécifique pour réceptionniste
  if (user.role === 'receptionniste') {
    return <ReceptionnisteHome stats={{
      enAttente: Array.isArray(echantillons) ? echantillons.filter(e => e.statut === 'stockage').length : 0,
      enCours: Array.isArray(echantillons) ? echantillons.filter(e => e.statut === 'essais').length : 0,
      termines: Array.isArray(echantillons) ? echantillons.filter(e => e.statut === 'decodification').length : 0,
      valides: Array.isArray(echantillons) ? echantillons.filter(e => e.statut === 'valide').length : 0,
    }} />;
  }

  // Dashboard spécialisé pour meca@snertp.com
  if (user.email === 'meca@snertp.com' || user.role === 'operateur_mecanique') {
    return <MecaDashboard />;
  }

  // Dashboard spécialisé pour route@snertp.com
  if (user.email === 'route@snertp.com') {
    return <RouteDashboard />;
  }

  // Dashboard spécialisé pour traitement@snertp.com
  if (user.email === 'traitement@snertp.com') {
    return <TraitementDashboard />;
  }

  // Dashboard spécifique pour chef de projet
  if (user.role === 'chef_projet') {
    return <ChefProjetDashboard />;
  }

  // Dashboard spécifique pour chef de service
  if (user.role === 'chef_service') {
    return <ChefServiceDashboard />;
  }

  // Dashboard spécifique pour directeur technique
  if (user.role === 'directeur_technique' || user.email === 'technique@snertp.com') {
    return <DirecteurTechniqueDashboard />;
  }

  // Dashboard spécifique pour directeur SNERTP
  if (user.role === 'directeur_snertp' || user.email === 'directeur@snertp.com') {
    return <DirecteurSNERTPHome />;
  }

  // Dashboard spécifique pour service marketing
  if (user.role === 'service_marketing') {
    return <MarketingDashboard />;
  }

  // Dashboard commun
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1>Tableau de bord - Directeur Technique</h1>
        <p style={{ color: '#A9A9A9' }}>
          Suivi des échantillons et gestion des processus
        </p>
      </div>

      {/* Filtres */}
      <div className="mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtres
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="space-y-2">
                <Label>Statut des échantillons</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les statuts</SelectItem>
                    <SelectItem value="stockage">En attente</SelectItem>
                    <SelectItem value="essais">En cours d'essais</SelectItem>
                    <SelectItem value="decodification">Décodification</SelectItem>
                    <SelectItem value="traitement">Traitement</SelectItem>
                    <SelectItem value="validation">Validation</SelectItem>
                    <SelectItem value="valide">Validé</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tableau des échantillons groupés par client */}
      <Card>
        <CardHeader>
          <CardTitle>Suivi des échantillons par client ({Object.keys(groupedByClient).length} clients)</CardTitle>
          <CardDescription>
            Vue d'ensemble des échantillons groupés par client avec le statut le plus défavorable
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-semibold">Client</th>
                  <th className="text-left p-3 font-semibold">Date réception</th>
                  <th className="text-left p-3 font-semibold">Date envoi directeur technique</th>
                  <th className="text-left p-3 font-semibold">Statut</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(groupedByClient).map(([clientCode, clientEchantillons]) => {
                  const client = clients.find(c => c.code === clientCode);
                  const worstStatus = getWorstStatus(clientEchantillons);

                  // Trier les échantillons par date de réception (plus récente en premier)
                  const sortedEchantillons = clientEchantillons.sort((a, b) =>
                    new Date(b.dateReception).getTime() - new Date(a.dateReception).getTime()
                  );

                  // Obtenir les dates les plus récentes pour chaque colonne
                  const latestReception = sortedEchantillons[0]?.dateReception;
                  const latestEnvoiEssais = sortedEchantillons
                    .filter(e => e.dateEnvoiSection)
                    .sort((a, b) => new Date(b.dateEnvoiSection!).getTime() - new Date(a.dateEnvoiSection!).getTime())[0]?.dateEnvoiSection;

                  return (
                    <tr key={clientCode} className="border-b hover:bg-gray-50">
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{client?.nom || clientCode}</span>
                        </div>
                      </td>
                      <td className="p-3">
                        <span className="text-sm">{latestReception}</span>
                      </td>
                      <td className="p-3">
                        <span className="text-sm text-gray-500">-</span>
                      </td>
                      <td className="p-3">
                        <Badge
                          style={{
                            backgroundColor: getStatusColor(worstStatus),
                            color: '#FFFFFF'
                          }}
                        >
                          {formatStatus(worstStatus)}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {Object.keys(groupedByClient).length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Aucun échantillon trouvé pour ce filtre
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function EssaiMecaRow({ echantillon, getEssaiInfo }: { echantillon: any; getEssaiInfo: (id: string, type: string) => Promise<{ termine: boolean; dateEnvoi: string | null; dateFin: string | null; operateur: string | null }> }) {
  const [infoOedo, setInfoOedo] = React.useState<{ termine: boolean; dateEnvoi: string | null; dateFin: string | null; operateur: string | null }>({ termine: false, dateEnvoi: null, dateFin: null, operateur: null });
  const [infoCis, setInfoCis] = React.useState<{ termine: boolean; dateEnvoi: string | null; dateFin: string | null; operateur: string | null }>({ termine: false, dateEnvoi: null, dateFin: null, operateur: null });
  const [dateRetourClient, setDateRetourClient] = React.useState<string>('-');

  React.useEffect(() => {
    if (echantillon.essais_types?.includes('Oedometre')) {
      getEssaiInfo(echantillon.id, 'Oedometre').then(setInfoOedo);
    }
    if (echantillon.essais_types?.includes('Cisaillement')) {
      getEssaiInfo(echantillon.id, 'Cisaillement').then(setInfoCis);
    }
  }, [echantillon.id, echantillon.code, getEssaiInfo]);

  // Calculer la date de retour client
  React.useEffect(() => {
    const durees: Record<string, number> = {
      Oedometre: 18,
      Cisaillement: 8,
    };
    
    let dateRetourMax: Date | null = null;
    
    // Pour chaque essai, calculer sa date de fin
    if (echantillon.essais_types?.includes('Oedometre') && infoOedo.dateEnvoi) {
      const dateEnvoi = new Date(infoOedo.dateEnvoi.split('/').reverse().join('-'));
      const dateFin = new Date(dateEnvoi);
      dateFin.setDate(dateFin.getDate() + durees.Oedometre);
      if (!dateRetourMax || dateFin > dateRetourMax) {
        dateRetourMax = dateFin;
      }
    }
    
    if (echantillon.essais_types?.includes('Cisaillement') && infoCis.dateEnvoi) {
      const dateEnvoi = new Date(infoCis.dateEnvoi.split('/').reverse().join('-'));
      const dateFin = new Date(dateEnvoi);
      dateFin.setDate(dateFin.getDate() + durees.Cisaillement);
      if (!dateRetourMax || dateFin > dateRetourMax) {
        dateRetourMax = dateFin;
      }
    }
    
    // Ajouter 2 jours de marge pour la date de retour client
    if (dateRetourMax) {
      dateRetourMax.setDate(dateRetourMax.getDate() + 2);
      setDateRetourClient(dateRetourMax.toLocaleDateString('fr-FR'));
    } else {
      setDateRetourClient('-');
    }
  }, [infoOedo, infoCis, echantillon.essais_types]);

  // Fonction pour déterminer le statut et la couleur en fonction de l'essai individuel
  const getStatutDisplay = (essaiTermine: boolean, essaiDateEnvoi: string | null) => {
    if (essaiTermine) {
      return { text: 'Terminé', color: '#28A745' };
    }
    // Si l'essai a une date_reception, il est en section d'essai (En cours)
    if (essaiDateEnvoi) {
      return { text: 'En cours', color: '#FFC107' };
    }
    // Sinon il est encore en stockage
    return { text: 'Stockage', color: '#17A2B8' };
  };

  const statutOedo = getStatutDisplay(infoOedo.termine, infoOedo.dateEnvoi);
  const statutCis = getStatutDisplay(infoCis.termine, infoCis.dateEnvoi);

  return (
    <tr className="border-b hover:bg-gray-50">
      <td className="p-3">
        <span className="font-medium">{echantillon.code}</span>
      </td>
      <td className="p-3">
        <span className="text-sm">{new Date(echantillon.date_reception).toLocaleDateString('fr-FR')}</span>
      </td>
      <td className="p-3">
        {echantillon.essais_types?.includes('Oedometre') ? (
          <div>
            <div className="text-xs mb-1" style={{ color: '#6C757D' }}>
              {infoOedo.dateEnvoi || '-'}
            </div>
            <div className="my-1">
              <Badge style={{ backgroundColor: statutOedo.color, color: '#FFFFFF', fontSize: '10px', padding: '2px 6px' }}>
                {statutOedo.text}
              </Badge>
            </div>
            {infoOedo.operateur && (
              <div className="text-xs mt-1" style={{ color: '#003366' }}>
                Op: {infoOedo.operateur}
              </div>
            )}
            {infoOedo.dateFin && (
              <div className="text-xs mt-1" style={{ color: '#6C757D' }}>
                {infoOedo.dateFin}
              </div>
            )}
          </div>
        ) : (
          <span className="text-gray-400">-</span>
        )}
      </td>
      <td className="p-3">
        {echantillon.essais_types?.includes('Cisaillement') ? (
          <div>
            <div className="text-xs mb-1" style={{ color: '#6C757D' }}>
              {infoCis.dateEnvoi || '-'}
            </div>
            <div className="my-1">
              <Badge style={{ backgroundColor: statutCis.color, color: '#FFFFFF', fontSize: '10px', padding: '2px 6px' }}>
                {statutCis.text}
              </Badge>
            </div>
            {infoCis.operateur && (
              <div className="text-xs mt-1" style={{ color: '#003366' }}>
                Op: {infoCis.operateur}
              </div>
            )}
            {infoCis.dateFin && (
              <div className="text-xs mt-1" style={{ color: '#6C757D' }}>
                {infoCis.dateFin}
              </div>
            )}
          </div>
        ) : (
          <span className="text-gray-400">-</span>
        )}
      </td>
      <td className="p-3">
        <span className="text-sm font-medium" style={{ color: dateRetourClient === '-' ? '#6C757D' : '#DC3545' }}>
          {dateRetourClient}
        </span>
      </td>
    </tr>
  );
}

function MecaDashboard() {
  const [echantillons, setEchantillons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    const loadEchantillons = async () => {
      try {
        const response = await fetch('http://127.0.0.1:8000/api/echantillons/', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
            'Content-Type': 'application/json',
          },
        });
        const data = await response.json();
        // Filtrer les échantillons qui ont des essais mécaniques
        const echantillonsMeca = (data.results || []).filter((e: any) => 
          e.essais_types && (e.essais_types.includes('Oedometre') || e.essais_types.includes('Cisaillement'))
        );
        
        // Charger les essais pour chaque échantillon
        const echantillonsAvecEssais = await Promise.all(
          echantillonsMeca.map(async (ech: any) => {
            try {
              const essaisResponse = await fetch(`http://127.0.0.1:8000/api/essais/?echantillon=${ech.id}`, {
                headers: {
                  'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
                  'Content-Type': 'application/json',
                },
              });
              const essaisData = await essaisResponse.json();
              const essais = essaisData.results || [];
              
              const essaiOedo = essais.find((e: any) => e.type === 'Oedometre');
              const dateOedometre = essaiOedo?.date_reception ? new Date(essaiOedo.date_reception).toLocaleDateString('fr-FR') : null;
              
              const essaiCis = essais.find((e: any) => e.type === 'Cisaillement');
              const dateCisaillement = essaiCis?.date_reception ? new Date(essaiCis.date_reception).toLocaleDateString('fr-FR') : null;
              
              return {
                ...ech,
                date_envoi_oedometre: dateOedometre,
                date_envoi_cisaillement: dateCisaillement
              };
            } catch (error) {
              return {
                ...ech,
                date_envoi_oedometre: null,
                date_envoi_cisaillement: null
              };
            }
          })
        );
        
        setEchantillons(echantillonsAvecEssais);
      } catch (error) {
        console.error('Erreur chargement échantillons:', error);
      } finally {
        setLoading(false);
      }
    };

    loadEchantillons();
  }, []);

  const getEssaiInfo = async (echantillonId: string, type: string) => {
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/essais/?echantillon=${echantillonId}&type=${type}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      if (data.results && data.results.length > 0) {
        // Trouver l'essai qui correspond à cet échantillon spécifique
        const essai = data.results.find((e: any) => e.echantillon === echantillonId) || data.results[0];
        return {
          termine: essai.statut === 'termine',
          dateEnvoi: essai.date_reception ? new Date(essai.date_reception).toLocaleDateString('fr-FR') : null,
          dateFin: essai.date_fin ? new Date(essai.date_fin).toLocaleDateString('fr-FR') : null,
          operateur: essai.operateur || null
        };
      }
    } catch (e) {}
    return { termine: false, dateEnvoi: null, dateFin: null, operateur: null };
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1>Tableau de bord Mécanique</h1>
        <p style={{ color: '#A9A9A9' }}>
          Suivi des essais mécaniques
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Échantillons avec essais mécaniques</CardTitle>
          <CardDescription>
            {echantillons.length} échantillon(s) avec essais Oedométrique ou Cisaillement
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-semibold">Code Échantillon</th>
                  <th className="text-left p-3 font-semibold">Date Réception</th>
                  <th className="text-left p-3 font-semibold">Oedométrique</th>
                  <th className="text-left p-3 font-semibold">Cisaillement Direct</th>
                  <th className="text-left p-3 font-semibold">Date de Retour Client</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="p-3 text-center text-gray-500">
                      Chargement...
                    </td>
                  </tr>
                ) : echantillons.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-3 text-center text-gray-500">
                      Aucun échantillon avec essais mécaniques
                    </td>
                  </tr>
                ) : (
                  echantillons.map((echantillon) => (
                    <EssaiMecaRow key={`meca-${echantillon.id}-${echantillon.code}`} echantillon={echantillon} getEssaiInfo={getEssaiInfo} />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function DirecteurTechniqueDashboard() {
  const [echantillons, setEchantillons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadEchantillons = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://127.0.0.1:8000/api/echantillons/', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      
      const groupedByClient = data.results.reduce((acc: any, ech: any) => {
        const clientCode = ech.client_code || ech.client_nom || '-';
        if (!acc[clientCode]) {
          acc[clientCode] = [];
        }
        acc[clientCode].push(ech);
        return acc;
      }, {});
      
      const clientsData = Object.entries(groupedByClient).map(([clientCode, echs]: [string, any]) => {
        const echantillons = echs as any[];
        const clientName = `${echantillons[0]?.client_nom || '-'} (${clientCode})`;
        const dateReception = echantillons[0]?.date_reception ? new Date(echantillons[0].date_reception).toLocaleDateString('fr-FR') : '-';
        
        let dateTraitement = '-';
        
        let dateChefProjet = '-';
        
        let dateChefService = '-';
        
        let dateRetourClient = '-';
        const echWithDate = echantillons.find((ech: any) => ech.date_retour_predite);
        if (echWithDate && echWithDate.date_retour_predite) {
          try {
            dateRetourClient = new Date(echWithDate.date_retour_predite).toLocaleDateString('fr-FR');
          } catch (e) {
            dateRetourClient = echWithDate.date_retour_predite;
          }
        } else {
          const echMock = echantillons[0];
          if (echMock) {
            const mockEch = {
              id: echMock.id,
              code: echMock.code,
              clientCode: echMock.client_code || '',
              qrCode: echMock.code,
              nature: echMock.nature || '',
              profondeurDebut: echMock.profondeur_debut || 0,
              profondeurFin: echMock.profondeur_fin || 0,
              dateReception: echMock.date_reception || '',
              essais: echMock.essais_types || [],
              statut: echMock.statut || '',
              priorite: echMock.priorite || 'normale',
              chefProjet: echMock.chef_projet || ''
            };
            const prediction = simulerIADateEnvoi(mockEch as any);
            dateRetourClient = prediction.dateRetour;
          }
        }
        
        return {
          clientName,
          nombreEchantillons: echantillons.length,
          dateReception,
          dateTraitement,
          dateChefProjet,
          dateChefService,
          dateRetourClient
        };
      });
      
      setEchantillons(clientsData);
    } catch (error) {
      console.error('Erreur chargement:', error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    loadEchantillons();
  }, []);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1>Tableau de bord Directeur Technique</h1>
        <p style={{ color: '#A9A9A9' }}>Suivi des échantillons par client</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Échantillons par client</CardTitle>
              <CardDescription>{echantillons.length} client(s)</CardDescription>
            </div>
            <Button onClick={loadEchantillons} disabled={loading}>
              {loading ? 'Chargement...' : 'Actualiser'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-semibold">Nom du client</th>
                  <th className="text-left p-3 font-semibold">Date de réception</th>
                  <th className="text-left p-3 font-semibold">Date traitement</th>
                  <th className="text-left p-3 font-semibold">Date chef projet</th>
                  <th className="text-left p-3 font-semibold">Date chef service</th>
                  <th className="text-left p-3 font-semibold">Date de retour client</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="p-3 text-center text-gray-500">
                      Chargement...
                    </td>
                  </tr>
                ) : echantillons.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-3 text-center text-gray-500">
                      Aucun échantillon
                    </td>
                  </tr>
                ) : (
                  echantillons.map((item, index) => (
                    <tr key={index} className="border-b hover:bg-gray-50">
                      <td className="p-3">
                        <span className="font-medium">{item.clientName}</span>
                      </td>
                      <td className="p-3">
                        <span className="text-sm">{item.dateReception}</span>
                      </td>
                      <td className="p-3">
                        <span className="text-sm">{item.dateTraitement}</span>
                      </td>
                      <td className="p-3">
                        <span className="text-sm">{item.dateChefProjet}</span>
                      </td>
                      <td className="p-3">
                        <span className="text-sm">{item.dateChefService}</span>
                      </td>
                      <td className="p-3">
                        <span className="text-sm text-gray-500">{item.dateRetourClient}</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ChefServiceDashboard() {
  const [echantillons, setEchantillons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadEchantillons = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://127.0.0.1:8000/api/echantillons/', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      
      const groupedByClient = data.results.reduce((acc: any, ech: any) => {
        const clientKey = ech.client_code || ech.client_nom || '-';
        if (!acc[clientKey]) {
          acc[clientKey] = [];
        }
        acc[clientKey].push(ech);
        return acc;
      }, {});
      
      const clientsData = Object.entries(groupedByClient).map(([clientKey, echs]: [string, any]) => {
        const echantillons = echs as any[];
        const dateReception = echantillons[0]?.date_reception ? new Date(echantillons[0].date_reception).toLocaleDateString('fr-FR') : '-';
        
        let dateTraitement = '-';
        
        let dateChefProjet = '-';
        
        let dateRetourClient = '-';
        const echWithDate = echantillons.find((ech: any) => ech.date_retour_predite);
        if (echWithDate && echWithDate.date_retour_predite) {
          try {
            dateRetourClient = new Date(echWithDate.date_retour_predite).toLocaleDateString('fr-FR');
          } catch (e) {
            dateRetourClient = echWithDate.date_retour_predite;
          }
        } else {
          const echMock = echantillons[0];
          if (echMock) {
            const mockEch = {
              id: echMock.id,
              code: echMock.code,
              clientCode: echMock.client_code || '',
              qrCode: echMock.code,
              nature: echMock.nature || '',
              profondeurDebut: echMock.profondeur_debut || 0,
              profondeurFin: echMock.profondeur_fin || 0,
              dateReception: echMock.date_reception || '',
              essais: echMock.essais_types || [],
              statut: echMock.statut || '',
              priorite: echMock.priorite || 'normale',
              chefProjet: echMock.chef_projet || ''
            };
            const prediction = simulerIADateEnvoi(mockEch as any);
            dateRetourClient = prediction.dateRetour;
          }
        }
        
        return {
          clientName: `${echantillons[0].client_nom} (${echantillons[0].client_code})`,
          nombreEchantillons: echantillons.length,
          dateReception,
          dateTraitement,
          dateChefProjet,
          dateRetourClient
        };
      });
      
      setEchantillons(clientsData);
    } catch (error) {
      console.error('Erreur chargement:', error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    loadEchantillons();
  }, []);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1>Tableau de bord Chef de Service</h1>
        <p style={{ color: '#A9A9A9' }}>Suivi des échantillons par client</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Échantillons par client</CardTitle>
              <CardDescription>{echantillons.length} client(s)</CardDescription>
            </div>
            <Button onClick={loadEchantillons} disabled={loading}>
              {loading ? 'Chargement...' : 'Actualiser'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-semibold">Nom du client</th>
                  <th className="text-left p-3 font-semibold">Date de réception</th>
                  <th className="text-left p-3 font-semibold">Nombre d'échantillons</th>
                  <th className="text-left p-3 font-semibold">Date de traitement</th>
                  <th className="text-left p-3 font-semibold">Date chef projet</th>
                  <th className="text-left p-3 font-semibold">Date de retour client</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="p-3 text-center text-gray-500">
                      Chargement...
                    </td>
                  </tr>
                ) : echantillons.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-3 text-center text-gray-500">
                      Aucun échantillon
                    </td>
                  </tr>
                ) : (
                  echantillons.map((item, index) => (
                    <tr key={index} className="border-b hover:bg-gray-50">
                      <td className="p-3">
                        <span className="font-medium">{item.clientName}</span>
                      </td>
                      <td className="p-3">
                        <span className="text-sm">{item.dateReception}</span>
                      </td>
                      <td className="p-3">
                        <Badge style={{ backgroundColor: '#003366', color: '#FFFFFF' }}>
                          {item.nombreEchantillons}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <span className="text-sm">{item.dateTraitement}</span>
                      </td>
                      <td className="p-3">
                        <span className="text-sm">{item.dateChefProjet}</span>
                      </td>
                      <td className="p-3">
                        <span className="text-sm text-gray-500">{item.dateRetourClient}</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ChefProjetDashboard() {
  const [echantillons, setEchantillons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    const loadEchantillons = async () => {
      try {
        const response = await fetch('http://127.0.0.1:8000/api/echantillons/', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
            'Content-Type': 'application/json',
          },
        });
        const data = await response.json();
        
        const groupedByClient = data.results.reduce((acc: any, ech: any) => {
          const clientKey = ech.client_code || ech.client_nom || '-';
          if (!acc[clientKey]) {
            acc[clientKey] = [];
          }
          acc[clientKey].push(ech);
          return acc;
        }, {});
        
        const clientsData = Object.entries(groupedByClient).map(([clientName, echs]: [string, any]) => {
          const echantillons = echs as any[];
          const dateReception = echantillons[0]?.date_reception ? new Date(echantillons[0].date_reception).toLocaleDateString('fr-FR') : '-';
          
          let dateTraitement = '-';
          
          let dateRetourClient = '-';
          const echWithDate = echantillons.find((ech: any) => ech.date_retour_predite);
          if (echWithDate && echWithDate.date_retour_predite) {
            try {
              dateRetourClient = new Date(echWithDate.date_retour_predite).toLocaleDateString('fr-FR');
            } catch (e) {
              dateRetourClient = echWithDate.date_retour_predite;
            }
          } else {
            const echMock = echantillons[0];
            if (echMock) {
              const mockEch = {
                id: echMock.id,
                code: echMock.code,
                clientCode: echMock.client_code || '',
                qrCode: echMock.code,
                nature: echMock.nature || '',
                profondeurDebut: echMock.profondeur_debut || 0,
                profondeurFin: echMock.profondeur_fin || 0,
                dateReception: echMock.date_reception || '',
                essais: echMock.essais_types || [],
                statut: echMock.statut || '',
                priorite: echMock.priorite || 'normale',
                chefProjet: echMock.chef_projet || ''
              };
              const prediction = simulerIADateEnvoi(mockEch as any);
              dateRetourClient = prediction.dateRetour;
            }
          }
          
          return {
            clientName,
            nombreEchantillons: echantillons.length,
            dateReception,
            dateTraitement,
            dateRetourClient
          };
        });
        
        setEchantillons(clientsData);
      } catch (error) {
        console.error('Erreur chargement:', error);
      } finally {
        setLoading(false);
      }
    };

    loadEchantillons();
  }, []);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1>Tableau de bord Chef de Projet</h1>
        <p style={{ color: '#A9A9A9' }}>Suivi des échantillons par client</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Échantillons par client</CardTitle>
          <CardDescription>{echantillons.length} client(s)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-semibold">Nom du client</th>
                  <th className="text-left p-3 font-semibold">Nombre d'échantillons</th>
                  <th className="text-left p-3 font-semibold">Date de réception</th>
                  <th className="text-left p-3 font-semibold">Date traitement</th>
                  <th className="text-left p-3 font-semibold">Date de retour client</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="p-3 text-center text-gray-500">
                      Chargement...
                    </td>
                  </tr>
                ) : echantillons.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-3 text-center text-gray-500">
                      Aucun échantillon
                    </td>
                  </tr>
                ) : (
                  echantillons.map((item, index) => (
                    <tr key={index} className="border-b hover:bg-gray-50">
                      <td className="p-3">
                        <span className="font-medium">{item.clientName}</span>
                      </td>
                      <td className="p-3">
                        <Badge style={{ backgroundColor: '#003366', color: '#FFFFFF' }}>
                          {item.nombreEchantillons}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <span className="text-sm">{item.dateReception}</span>
                      </td>
                      <td className="p-3">
                        <span className="text-sm">{item.dateTraitement}</span>
                      </td>
                      <td className="p-3">
                        <span className="text-sm text-gray-500">{item.dateRetourClient}</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function EssaiRouteCell({ echantillonId, type, dateEnvoi, echantillonStatut }: { echantillonId: string; type: string; dateEnvoi: string | null; echantillonStatut: string }) {
  const [info, setInfo] = React.useState<{ termine: boolean; dateEnvoi: string | null; dateReception: string | null; dateFin: string | null; operateur: string | null }>({ termine: false, dateEnvoi: null, dateReception: null, dateFin: null, operateur: null });

  React.useEffect(() => {
    const loadEssaiInfo = async () => {
      try {
        const response = await fetch(`http://127.0.0.1:8000/api/essais/?echantillon=${echantillonId}&type=${type}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
            'Content-Type': 'application/json',
          },
        });
        const data = await response.json();
        if (data.results && data.results.length > 0) {
          const essai = data.results.find((e: any) => e.echantillon === echantillonId) || data.results[0];
          
          // Calculer la date de fin si date_reception existe
          let dateFin = null;
          if (essai.date_reception) {
            const durees: Record<string, number> = { AG: 5, Proctor: 4, CBR: 5 };
            const dateReception = new Date(essai.date_reception);
            const dateFinCalculee = new Date(dateReception);
            dateFinCalculee.setDate(dateFinCalculee.getDate() + durees[type]);
            dateFin = dateFinCalculee.toLocaleDateString('fr-FR');
          }
          
          setInfo({
            termine: essai.statut === 'termine',
            dateEnvoi: essai.date_envoi_decodification ? new Date(essai.date_envoi_decodification).toLocaleDateString('fr-FR') : null,
            dateReception: essai.date_reception ? new Date(essai.date_reception).toLocaleDateString('fr-FR') : null,
            dateFin: dateFin,
            operateur: essai.operateur || null
          });
        }
      } catch (e) {}
    };
    loadEssaiInfo();
  }, [echantillonId, type]);

  const getStatutDisplay = () => {
    if (info.termine) {
      return { text: 'Terminé', color: '#28A745' };
    }
    if (info.dateReception) {
      return { text: 'En cours', color: '#FFC107' };
    }
    return { text: 'Stockage', color: '#17A2B8' };
  };

  const statutDisplay = getStatutDisplay();

  return (
    <div>
      <div className="text-xs mb-1" style={{ color: '#6C757D' }}>
        {info.dateReception || '-'}
      </div>
      <div className="my-1">
        <Badge style={{ backgroundColor: statutDisplay.color, color: '#FFFFFF', fontSize: '10px', padding: '2px 6px' }}>
          {statutDisplay.text}
        </Badge>
      </div>
      {info.operateur && (
        <div className="text-xs mt-1" style={{ color: '#003366' }}>
          Op: {info.operateur}
        </div>
      )}
      {info.dateFin && (
        <div className="text-xs mt-1" style={{ color: '#003366', fontWeight: 500 }}>
          Fin: {info.dateFin}
        </div>
      )}
    </div>
  );
}

function RouteDashboard() {
  const [echantillons, setEchantillons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    const loadEchantillons = async () => {
      try {
        const response = await fetch('http://127.0.0.1:8000/api/echantillons/', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
            'Content-Type': 'application/json',
          },
        });
        const data = await response.json();
        const echantillonsRoute = data.results.filter((e: any) => 
          e.essais_types && (e.essais_types.includes('AG') || e.essais_types.includes('Proctor') || e.essais_types.includes('CBR'))
        );
        
        const charge = await compterEchantillonsEnAttente();
        let compteurAG = 0;
        let compteurProctor = 0;
        let compteurCBR = 0;
        
        const echantillonsEnrichis = echantillonsRoute.map((ech: any) => {
          const dateReception = ech.date_reception ? new Date(ech.date_reception) : new Date();
          let dateAG = null;
          let dateProctor = null;
          let dateCBR = null;
          
          if (ech.essais_types?.includes('AG')) {
            const delai = Math.floor((charge.AG + compteurAG) / 5);
            dateAG = ajouterJoursOuvrables(dateReception, delai).toLocaleDateString('fr-FR');
            compteurAG++;
          }
          
          if (ech.essais_types?.includes('Proctor')) {
            const delai = Math.floor((charge.Proctor + compteurProctor) / 4);
            dateProctor = ajouterJoursOuvrables(dateReception, delai).toLocaleDateString('fr-FR');
            compteurProctor++;
          }
          
          if (ech.essais_types?.includes('CBR')) {
            const delai = Math.floor((charge.CBR + compteurCBR) / 4);
            dateCBR = ajouterJoursOuvrables(dateReception, delai).toLocaleDateString('fr-FR');
            compteurCBR++;
          }
          
          return {
            ...ech,
            date_envoi_ag: dateAG,
            date_envoi_proctor: dateProctor,
            date_envoi_cbr: dateCBR
          };
        });
        
        setEchantillons(echantillonsEnrichis);
      } catch (error) {
        console.error('Erreur chargement échantillons:', error);
      } finally {
        setLoading(false);
      }
    };

    loadEchantillons();
  }, []);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1>Tableau de bord Route</h1>
        <p style={{ color: '#A9A9A9' }}>
          Suivi des essais route
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Échantillons avec essais route</CardTitle>
          <CardDescription>
            {echantillons.length} échantillon(s) avec essais AG, Proctor ou CBR
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-semibold">Code Échantillon</th>
                  <th className="text-left p-3 font-semibold">Date Réception</th>
                  <th className="text-left p-3 font-semibold">AG</th>
                  <th className="text-left p-3 font-semibold">Proctor</th>
                  <th className="text-left p-3 font-semibold">CBR</th>
                  <th className="text-left p-3 font-semibold">Date de Retour Client</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="p-3 text-center text-gray-500">
                      Chargement...
                    </td>
                  </tr>
                ) : echantillons.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-3 text-center text-gray-500">
                      Aucun échantillon avec essais route
                    </td>
                  </tr>
                ) : (
                  echantillons.map((echantillon) => {
                    // Calculer la date de retour client basée sur les dates de fin des essais
                    const durees: Record<string, number> = { AG: 5, Proctor: 4, CBR: 5 };
                    let dateRetourMax: Date | null = null;
                    
                    ['AG', 'Proctor', 'CBR'].forEach(essaiType => {
                      if (echantillon.essais_types?.includes(essaiType)) {
                        const dateEnvoiKey = `date_envoi_${essaiType.toLowerCase()}`;
                        const dateEnvoi = echantillon[dateEnvoiKey];
                        if (dateEnvoi) {
                          const dateEnvoiParsed = new Date(dateEnvoi.split('/').reverse().join('-'));
                          const dateFin = new Date(dateEnvoiParsed);
                          dateFin.setDate(dateFin.getDate() + durees[essaiType]);
                          if (!dateRetourMax || dateFin > dateRetourMax) {
                            dateRetourMax = dateFin;
                          }
                        }
                      }
                    });
                    
                    // Ajouter 2 jours de marge pour la date de retour client
                    if (dateRetourMax) {
                      dateRetourMax.setDate(dateRetourMax.getDate() + 2);
                    }
                    
                    const dateRetourClient = dateRetourMax ? dateRetourMax.toLocaleDateString('fr-FR') : '-';
                    
                    return (
                      <tr key={echantillon.id} className="border-b hover:bg-gray-50">
                        <td className="p-3">
                          <span className="font-medium">{echantillon.code}</span>
                        </td>
                        <td className="p-3">
                          <span className="text-sm">{new Date(echantillon.date_reception).toLocaleDateString('fr-FR')}</span>
                        </td>
                        <td className="p-3">
                          {echantillon.essais_types?.includes('AG') ? (
                            <div key={`${echantillon.id}-AG`}>
                              <EssaiRouteCell echantillonId={echantillon.id} type="AG" dateEnvoi={echantillon.date_envoi_ag} echantillonStatut={echantillon.statut} />
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="p-3">
                          {echantillon.essais_types?.includes('Proctor') ? (
                            <div key={`${echantillon.id}-Proctor`}>
                              <EssaiRouteCell echantillonId={echantillon.id} type="Proctor" dateEnvoi={echantillon.date_envoi_proctor} echantillonStatut={echantillon.statut} />
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="p-3">
                          {echantillon.essais_types?.includes('CBR') ? (
                            <div key={`${echantillon.id}-CBR`}>
                              <EssaiRouteCell echantillonId={echantillon.id} type="CBR" dateEnvoi={echantillon.date_envoi_cbr} echantillonStatut={echantillon.statut} />
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="p-3">
                          <span className="text-sm font-medium" style={{ color: dateRetourClient === '-' ? '#6C757D' : '#DC3545' }}>
                            {dateRetourClient}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function TraitementDashboard() {
  const [echantillons, setEchantillons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    const loadEchantillons = async () => {
      try {
        const response = await fetch('http://127.0.0.1:8000/api/echantillons/', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
            'Content-Type': 'application/json',
          },
        });
        const data = await response.json();
        console.log('📦 Dashboard Traitement:', data.results.length, 'échantillons');
        data.results.forEach((e: any) => console.log(`  ${e.code}: date_retour_predite=${e.date_retour_predite}`));
        
        const groupedByClient = data.results.reduce((acc: any, ech: any) => {
          const clientKey = ech.client_code || ech.client_nom || '-';
          if (!acc[clientKey]) {
            acc[clientKey] = [];
          }
          acc[clientKey].push(ech);
          return acc;
        }, {});
        
        const transformedData = Object.entries(groupedByClient).map(([clientKey, echs]: [string, any]) => {
          const echantillons = echs as any[];
          const client = echantillons[0];
          const dateReception = client?.date_reception ? 
            new Date(client.date_reception).toLocaleDateString('fr-FR') : '-';
          
          let dateTraitement = '-';
          const echWithTraitement = echantillons.find((ech: any) => ech.statut === 'traitement');
          if (echWithTraitement) {
            dateTraitement = 'En traitement';
          }
          
          let dateRetourClient = '-';
          const echWithDate = echantillons.find((ech: any) => ech.date_retour_predite);
          if (echWithDate && echWithDate.date_retour_predite) {
            try {
              dateRetourClient = new Date(echWithDate.date_retour_predite).toLocaleDateString('fr-FR');
            } catch (e) {
              dateRetourClient = echWithDate.date_retour_predite;
            }
          }
          
          return {
            clientName: `${client.client_nom} (${client.client_code})`,
            nombreEchantillons: echantillons.length,
            dateReception,
            dateTraitement,
            dateRetourClient
          };
        });
        
        setEchantillons(transformedData);
      } catch (error) {
        console.error('Erreur chargement:', error);
      } finally {
        setLoading(false);
      }
    };

    loadEchantillons();
  }, []);

  return (
    <div className="p-8">
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1>Tableau de bord Traitement</h1>
            <p style={{ color: '#A9A9A9' }}>Suivi des échantillons par client</p>
          </div>
          <SyncButton />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Échantillons par client</CardTitle>
          <CardDescription>{echantillons.length} client(s)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-semibold">Nom du client</th>
                  <th className="text-left p-3 font-semibold">Nombre d'échantillons</th>
                  <th className="text-left p-3 font-semibold">Date de réception</th>
                  <th className="text-left p-3 font-semibold">Date traitement</th>
                  <th className="text-left p-3 font-semibold">Date de retour client</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="p-3 text-center text-gray-500">
                      Chargement...
                    </td>
                  </tr>
                ) : echantillons.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-3 text-center text-gray-500">
                      Aucun échantillon
                    </td>
                  </tr>
                ) : (
                  echantillons.map((item, index) => (
                    <tr key={index} className="border-b hover:bg-gray-50">
                      <td className="p-3">
                        <span className="font-medium">{item.clientName}</span>
                      </td>
                      <td className="p-3">
                        <Badge style={{ backgroundColor: '#003366', color: '#FFFFFF' }}>
                          {item.nombreEchantillons}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <span className="text-sm">{item.dateReception}</span>
                      </td>
                      <td className="p-3">
                        <span className="text-sm">{item.dateTraitement}</span>
                      </td>
                      <td className="p-3">
                        <span className="text-sm text-gray-500">{item.dateRetourClient}</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function DirecteurSNERTPHome() {
  const [echantillons, setEchantillons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadEchantillons = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://127.0.0.1:8000/api/echantillons/', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      
      const groupedByClient = data.results.reduce((acc: any, ech: any) => {
        const clientName = ech.client_nom || '-';
        if (!acc[clientName]) {
          acc[clientName] = [];
        }
        acc[clientName].push(ech);
        return acc;
      }, {});
      
      const clientsData = Object.entries(groupedByClient).map(([clientName, echs]: [string, any]) => {
        const echantillons = echs as any[];
        const dateReception = echantillons[0]?.date_reception ? new Date(echantillons[0].date_reception).toLocaleDateString('fr-FR') : '-';
        
        let dateDirecteurTechnique = '-';
        
        let dateRetourClient = '-';
        const echWithDate = echantillons.find((ech: any) => ech.date_retour_predite);
        if (echWithDate && echWithDate.date_retour_predite) {
          try {
            dateRetourClient = new Date(echWithDate.date_retour_predite).toLocaleDateString('fr-FR');
          } catch (e) {
            dateRetourClient = echWithDate.date_retour_predite;
          }
        } else {
          const echMock = echantillons[0];
          if (echMock) {
            const mockEch = {
              id: echMock.id,
              code: echMock.code,
              clientCode: echMock.client_code || '',
              qrCode: echMock.code,
              nature: echMock.nature || '',
              profondeurDebut: echMock.profondeur_debut || 0,
              profondeurFin: echMock.profondeur_fin || 0,
              dateReception: echMock.date_reception || '',
              essais: echMock.essais_types || [],
              statut: echMock.statut || '',
              priorite: echMock.priorite || 'normale',
              chefProjet: echMock.chef_projet || ''
            };
            const prediction = simulerIADateEnvoi(mockEch as any);
            dateRetourClient = prediction.dateRetour;
          }
        }
        
        let statut = 'Pas avisé';
        
        return {
          clientName,
          dateReception,
          dateDirecteurTechnique,
          dateRetourClient,
          statut
        };
      });
      
      setEchantillons(clientsData);
    } catch (error) {
      console.error('Erreur chargement:', error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    loadEchantillons();
  }, []);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1>Tableau de bord Directeur SNERTP</h1>
        <p style={{ color: '#A9A9A9' }}>Vue d'ensemble des échantillons par client</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Échantillons par client</CardTitle>
              <CardDescription>{echantillons.length} client(s)</CardDescription>
            </div>
            <Button onClick={loadEchantillons} disabled={loading}>
              {loading ? 'Chargement...' : 'Actualiser'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-semibold">Nom du client</th>
                  <th className="text-left p-3 font-semibold">Date de réception</th>
                  <th className="text-left p-3 font-semibold">Date directeur technique</th>
                  <th className="text-left p-3 font-semibold">Date de retour client</th>
                  <th className="text-left p-3 font-semibold">Statut</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="p-3 text-center text-gray-500">
                      Chargement...
                    </td>
                  </tr>
                ) : echantillons.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-3 text-center text-gray-500">
                      Aucun échantillon
                    </td>
                  </tr>
                ) : (
                  echantillons.map((item, index) => (
                    <tr key={index} className="border-b hover:bg-gray-50">
                      <td className="p-3">
                        <span className="font-medium">{item.clientName}</span>
                      </td>
                      <td className="p-3">
                        <span className="text-sm">{item.dateReception}</span>
                      </td>
                      <td className="p-3">
                        <span className="text-sm">{item.dateDirecteurTechnique}</span>
                      </td>
                      <td className="p-3">
                        <span className="text-sm text-gray-500">{item.dateRetourClient}</span>
                      </td>
                      <td className="p-3">
                        <Badge style={{ 
                          backgroundColor: item.statut === 'Avisé' ? '#28A745' : '#FFC107',
                          color: '#FFFFFF'
                        }}>
                          {item.statut}
                        </Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ReceptionnisteHome({ stats }: { stats: { enAttente: number; enCours: number; termines: number; valides: number } }) {
  const [searchType, setSearchType] = useState<'client' | 'echantillon'>('client');
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<any>(null);
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [dateDebut, setDateDebut] = useState<Date | undefined>();
  const [dateFin, setDateFin] = useState<Date | undefined>();
  const [natureFilter, setNatureFilter] = useState<string>('all');
  const [clients, setClients] = useState<Client[]>([]);
  const [echantillonsAPI, setEchantillonsAPI] = useState<any[]>([]);

  // Filtrer les clients selon les critères
  const filteredClients = clients.filter(client => {
    const echantillonsClient = echantillonsAPI.filter((ech: any) => ech.client_code === client.code);
    
    if (echantillonsClient.length === 0) return false;
    
    // Filtre par période
    if (dateFilter !== 'all' || dateDebut || dateFin) {
      const now = new Date();
      let dateMin: Date | undefined;
      let dateMax: Date | undefined;
      
      if (dateFilter === 'week') {
        dateMin = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      } else if (dateFilter === 'month') {
        dateMin = new Date(now.getFullYear(), now.getMonth(), 1);
      } else if (dateFilter === 'year') {
        dateMin = new Date(now.getFullYear(), 0, 1);
      } else if (dateDebut) {
        dateMin = dateDebut;
      }
      
      if (dateFin) {
        dateMax = dateFin;
      }
      
      const hasEchantillonInPeriod = echantillonsClient.some((ech: any) => {
        const dateReception = new Date(ech.date_reception);
        if (dateMin && dateReception < dateMin) return false;
        if (dateMax && dateReception > dateMax) return false;
        return true;
      });
      
      if (!hasEchantillonInPeriod) return false;
    }
    
    // Filtre par nature
    if (natureFilter !== 'all') {
      const hasNature = echantillonsClient.some((ech: any) => ech.nature === natureFilter);
      if (!hasNature) return false;
    }
    
    return true;
  });

  // Charger les clients et échantillons depuis l'API uniquement
  React.useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetch('http://127.0.0.1:8000/api/echantillons/', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
            'Content-Type': 'application/json',
          },
        });
        const data = await response.json();
        
        // Stocker tous les échantillons de l'API
        setEchantillonsAPI(data.results || []);
        
        // Extraire les clients uniques depuis les échantillons
        const clientsFromAPI: Client[] = [];
        const clientCodes = new Set();
        
        data.results.forEach((ech: any) => {
          if (ech.client_code && ech.client_nom && !clientCodes.has(ech.client_code)) {
            clientCodes.add(ech.client_code);
            clientsFromAPI.push({
              id: ech.client_code,
              code: ech.client_code,
              nom: ech.client_nom,
              contact: ech.client_contact || '-',
              projet: ech.client_projet || '-',
              email: ech.client_email || '-',
              telephone: ech.client_telephone || '-',
              dateCreation: new Date().toISOString().split('T')[0]
            });
          }
        });
        
        setClients(clientsFromAPI);
      } catch (e) {
        console.error('Erreur chargement données:', e);
        toast.error('Erreur de connexion au serveur');
      }
    };
    
    loadData();
  }, []);

  const handleSearch = () => {
    if (!searchQuery) return;

  const handleSearch = async () => {
    if (!searchQuery) return;

    if (searchType === 'client') {
      // Chercher dans les échantillons API uniquement
      const echantillonsFromAPI = echantillonsAPI.filter((ech: any) => ech.client_code === searchQuery);
      const allEchantillons = echantillonsFromAPI.map((ech: any) => ({
        id: ech.id,
        code: ech.code,
        clientCode: ech.client_code,
        nature: ech.nature || '',
        profondeurDebut: ech.profondeur_debut || 0,
        profondeurFin: ech.profondeur_fin || 0,
        sondage: ech.sondage || 'vrac',
        nappe: ech.nappe || '',
        essais: ech.essais_types || [],
        qrCode: ech.code,
        dateReception: ech.date_reception || '',
        dateFinEstimee: '',
        statut: ech.statut || 'stockage',
        chefProjet: ech.chef_projet || '',
        photo: ech.photo || '',
        numeroSondage: ech.numero_sondage || ''
      }));
      
      const client = clients.find(c => c.code === searchQuery);
      setResults({ type: 'client', data: allEchantillons, client });
    } else {
      // Chercher échantillon dans l'API uniquement
      const echAPI = echantillonsAPI.find((ech: any) => ech.code === searchQuery);
      let echantillon = null;
      if (echAPI) {
        echantillon = {
          id: echAPI.id,
          code: echAPI.code,
          clientCode: echAPI.client_code,
          nature: echAPI.nature || '',
          profondeurDebut: echAPI.profondeur_debut || 0,
          profondeurFin: echAPI.profondeur_fin || 0,
          sondage: echAPI.sondage || 'vrac',
          nappe: echAPI.nappe || '',
          essais: echAPI.essais_types || [],
          qrCode: echAPI.code,
          dateReception: echAPI.date_reception || '',
          dateFinEstimee: '',
          statut: echAPI.statut || 'stockage',
          chefProjet: echAPI.chef_projet || '',
          photo: echAPI.photo || '',
          numeroSondage: echAPI.numero_sondage || ''
        };
      }
      const client = echantillon ? clients.find(c => c.code === echantillon.clientCode) : null;
      setResults({ type: 'echantillon', data: echantillon, client });
    }
  };
  };

  // Composant pour afficher la prédiction de date d'envoi et retour
  const AffichageDateEnvoi = ({ echantillon }: { echantillon: Echantillon }) => {
    const [prediction, setPrediction] = React.useState<DateEnvoiPredite | null>(null);
    
    React.useEffect(() => {
      const loadPrediction = async () => {
        const pred = await simulerIADateEnvoiAsync(echantillon);
        setPrediction(pred);
      };
      loadPrediction();
    }, [echantillon]);
    
    if (!prediction) {
      return <div className="mt-3 p-3 rounded-lg border" style={{ backgroundColor: '#F8F9FA', borderColor: '#E9ECEF' }}>
        <span className="text-sm">Chargement de la prédiction...</span>
      </div>;
    }

    return (
      <div className="mt-3 p-3 rounded-lg border" style={{ backgroundColor: '#F8F9FA', borderColor: '#E9ECEF' }}>
        <div className="flex items-center gap-2 mb-2">
          <Calendar className="h-4 w-4" style={{ color: '#003366' }} />
          <span className="text-sm font-semibold">Prédiction d'envoi par IA</span>
        </div>
        <div className="space-y-3">
          <div className="text-sm font-semibold" style={{ color: '#495057' }}>Détails par essai :</div>
          {echantillon.essais.map((essai: string) => {
            const dureesEssais: Record<string, number> = {
              AG: 5, Proctor: 5, CBR: 9, Oedometre: 18, Cisaillement: 4
            };
            const capacitesParJour: Record<string, number> = {
              AG: 5, Proctor: 4, CBR: 4, Oedometre: 10, Cisaillement: 4
            };
            
            // Calculer le délai pour cet essai spécifique
            const chargeActuelle = prediction.chargeParEssai?.[essai] || 0;
            const capacite = capacitesParJour[essai] || 1;
            const delaiEssai = essai === 'Oedometre' && chargeActuelle >= 10
              ? Math.ceil((chargeActuelle - 9) * 18 / 10)
              : Math.floor(chargeActuelle / capacite);
            const dureeEssai = dureesEssais[essai] || 0;
            
            // Calculer la date d'envoi pour cet essai
            const aujourdHui = new Date();
            const dateEnvoiEssai = ajouterJoursOuvrables(aujourdHui, delaiEssai);
            const dateRetourEssai = ajouterJoursOuvrables(aujourdHui, delaiEssai + dureeEssai + 2);
            
            const options: Intl.DateTimeFormatOptions = {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            };
            
            return (
              <div key={essai} className="p-3 rounded border" style={{ backgroundColor: '#F8F9FA', borderColor: '#DEE2E6' }}>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold">{essai}</span>
                    <span className="text-xs" style={{ color: '#6C757D' }}>
                      Délai: {delaiEssai} jour(s)
                    </span>
                  </div>
                  <div className="text-xs" style={{ color: '#495057' }}>
                    <div>Envoi prévu: <strong>{dateEnvoiEssai.toLocaleDateString('fr-FR', options)}</strong></div>
                    <div className="mt-1">Retour prévu: <strong>{dateRetourEssai.toLocaleDateString('fr-FR', options)}</strong></div>
                  </div>
                </div>
              </div>
            );
          })}
          
          <div className="flex justify-between items-center pt-2 border-t" style={{ borderColor: '#DEE2E6' }}>
            <span className="text-sm" style={{ color: '#495057' }}>
              Envoi prévu pour :
            </span>
            <Badge
              variant="outline"
              style={{
                backgroundColor: prediction.delaiJours <= 5 ? '#D4EDDA' : '#FFF3CD',
                color: prediction.delaiJours <= 5 ? '#155724' : '#856404',
                borderColor: prediction.delaiJours <= 5 ? '#C3E6CB' : '#FFEEBA'
              }}
            >
              {prediction.date}
            </Badge>
          </div>

          {/* Section Date de retour */}
          <div className="mt-3 pt-3 border-t" style={{ borderColor: '#DEE2E6' }}>
            <div className="flex items-center gap-2 mb-2">
              <FileText className="h-4 w-4" style={{ color: '#28A745' }} />
              <span className="text-sm font-semibold">Date probable de retour des résultats</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm" style={{ color: '#495057' }}>
                Résultats disponibles le :
              </span>
              <Badge
                variant="outline"
                style={{
                  backgroundColor: '#E3F2FD',
                  color: '#003366',
                  borderColor: '#B3D9FF'
                }}
              >
                {prediction.dateRetour}
              </Badge>
            </div>
            <div className="flex justify-between items-center text-xs mt-1">
              <span style={{ color: '#6C757D' }}>Délai total: {prediction.delaiRetourJours} jours</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1>Accueil Réception</h1>
        <p style={{ color: '#A9A9A9' }}>
          Gestion des clients et recherche d'échantillons
        </p>
      </div>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">En attente</CardTitle>
            <Clock className="h-4 w-4" style={{ color: '#FFC107' }} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{stats.enAttente}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">En cours</CardTitle>
            <AlertCircle className="h-4 w-4" style={{ color: '#003366' }} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{stats.enCours}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Terminés</CardTitle>
            <CheckCircle className="h-4 w-4" style={{ color: '#28A745' }} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{stats.termines}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Clients</CardTitle>
            <Users className="h-4 w-4" style={{ color: '#003366' }} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{clients.length}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Liste des clients avec filtres */}
        <Card>
          <CardHeader>
            <CardTitle>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Clients enregistrés
              </div>
            </CardTitle>
            <CardDescription>
              {filteredClients.length} client(s) sur {clients.length} au total
            </CardDescription>
            
            {/* Filtres */}
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Période</Label>
                  <Select value={dateFilter} onValueChange={setDateFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes les périodes</SelectItem>
                      <SelectItem value="week">Cette semaine</SelectItem>
                      <SelectItem value="month">Ce mois</SelectItem>
                      <SelectItem value="year">Cette année</SelectItem>
                      <SelectItem value="custom">Période personnalisée</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {dateFilter === 'custom' && (
                  <>
                    <div className="space-y-2">
                      <Label>Date début</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-start text-left">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {dateDebut ? format(dateDebut, 'PPP', { locale: fr }) : 'Sélectionner'}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar mode="single" selected={dateDebut} onSelect={setDateDebut} initialFocus />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="space-y-2">
                      <Label>Date fin</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-start text-left">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {dateFin ? format(dateFin, 'PPP', { locale: fr }) : 'Sélectionner'}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar mode="single" selected={dateFin} onSelect={setDateFin} initialFocus />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </>
                )}
                
                <div className="space-y-2">
                  <Label>Nature d'échantillon</Label>
                  <Select value={natureFilter} onValueChange={setNatureFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes les natures</SelectItem>
                      <SelectItem value="Sol">Sol</SelectItem>
                      <SelectItem value="Gravier">Gravier</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {filteredClients.map((client) => {
                const echantillonsFromAPI = echantillonsAPI.filter((ech: any) => ech.client_code === client.code);
                const totalEchantillons = echantillonsFromAPI.length;
                
                // Calculer la date de retour la plus tardive pour ce client
                const allEchantillons = echantillonsFromAPI.map((ech: any) => ({
                  id: ech.id,
                  code: ech.code,
                  clientCode: ech.client_code,
                  nature: ech.nature || '',
                  profondeurDebut: ech.profondeur_debut || 0,
                  profondeurFin: ech.profondeur_fin || 0,
                  sondage: ech.sondage || 'vrac',
                  nappe: ech.nappe || '',
                  essais: ech.essais_types || [],
                  qrCode: ech.code,
                  dateReception: ech.date_reception || '',
                  dateFinEstimee: '',
                  statut: ech.statut || 'stockage',
                  chefProjet: ech.chef_projet || ''
                }));
                
                let dateRetourPlusTardive = '';
                if (allEchantillons.length > 0) {
                  const predictions = allEchantillons.map(ech => simulerIADateEnvoi(ech));
                  const delaiMax = Math.max(...predictions.map(p => p.delaiRetourJours));
                  const predictionMax = predictions.find(p => p.delaiRetourJours === delaiMax);
                  if (predictionMax) {
                    dateRetourPlusTardive = predictionMax.dateRetour;
                  }
                }
                
                return (
                  <div
                    key={client.id}
                    className="p-4 rounded-lg"
                    style={{ backgroundColor: '#F5F5F5' }}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <span>{client.code}</span>
                          <Badge variant="outline">{client.nom}</Badge>
                        </div>
                        {dateRetourPlusTardive && (
                          <div className="text-xs mt-2" style={{ color: '#28A745' }}>
                            <strong>Retour client prévu :</strong> {dateRetourPlusTardive}
                          </div>
                        )}
                        <div className="text-sm space-y-1 mt-2">
                          <div className="flex items-start gap-2">
                            <span style={{ color: '#A9A9A9' }}>Contact:</span>
                            <span>{client.contact}</span>
                          </div>
                          <div className="flex items-start gap-2">
                            <span style={{ color: '#A9A9A9' }}>Projet:</span>
                            <span>{client.projet}</span>
                          </div>
                          <div className="flex items-start gap-2">
                            <span style={{ color: '#A9A9A9' }}>Email:</span>
                            <span>{client.email}</span>
                          </div>
                          <div className="flex items-start gap-2">
                            <span style={{ color: '#A9A9A9' }}>Tél:</span>
                            <span>{client.telephone}</span>
                          </div>
                        </div>
                      </div>
                      <Badge style={{ backgroundColor: '#003366', color: '#FFFFFF' }}>
                        {totalEchantillons} échantillon(s)
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Recherche */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>
                <div className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  Recherche
                </div>
              </CardTitle>
              <CardDescription>Rechercher par code client ou code échantillon</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label>Type de recherche</Label>
                  <Select value={searchType} onValueChange={(value: 'client' | 'echantillon') => setSearchType(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="client">Par code client</SelectItem>
                      <SelectItem value="echantillon">Par code échantillon</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Code</Label>
                  <Input
                    placeholder={
                      searchType === 'client' ? 'Ex: CLI-001' : 'Ex: S-0001/25'
                    }
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  />
                </div>

                <Button
                  onClick={handleSearch}
                  className="w-full"
                  style={{ backgroundColor: '#003366' }}
                >
                  <Search className="h-4 w-4 mr-2" />
                  Rechercher
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Résultats de recherche */}
          {results && (
            <Card>
              <CardHeader>
                <CardTitle>Résultats</CardTitle>
              </CardHeader>
              <CardContent>
                {results.type === 'client' && Array.isArray(results.data) ? (
                  <div className="space-y-4">
                    {results.client && (
                      <div className="p-3 rounded-lg" style={{ backgroundColor: '#F5F5F5' }}>
                        <h4 className="font-semibold mb-2">Client: {results.client.nom}</h4>
                        <p className="text-sm" style={{ color: '#A9A9A9' }}>
                          {results.client.contact} - {results.client.projet}
                        </p>
                      </div>
                    )}

                    <div className="space-y-2">
                      <h4 className="font-semibold">
                        Échantillons ({results.data.length})
                      </h4>
                      {results.data.length === 0 ? (
                        <p style={{ color: '#A9A9A9' }}>Aucun échantillon trouvé</p>
                      ) : (
                        results.data.map((ech: Echantillon) => (
                          <div
                            key={ech.id}
                            className="p-3 rounded-lg border"
                            style={{ backgroundColor: '#F5F5F5' }}
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <span>{ech.code}</span>
                                  {ech.photo && (
                                    <div className="w-8 h-8 rounded overflow-hidden border">
                                      <img src={ech.photo} alt="Photo échantillon" className="w-full h-full object-cover" />
                                    </div>
                                  )}
                                </div>
                                <p className="text-sm" style={{ color: '#A9A9A9' }}>
                                  {ech.nature} - {ech.profondeurDebut}m à {ech.profondeurFin}m
                                </p>
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {ech.essais && ech.essais.length > 0 ? (
                                    ech.essais.map((essai: string) => (
                                      <Badge key={essai} variant="outline" style={{ fontSize: '10px', padding: '2px 6px' }}>
                                        {essai}
                                      </Badge>
                                    ))
                                  ) : (
                                    <span className="text-xs text-gray-400">Aucun essai</span>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8">
                                  <QRCode value={`Code: ${ech.code}\nNature: ${ech.nature}\nProfondeurs: ${ech.profondeurDebut}m - ${ech.profondeurFin}m\nNappe phréatique: ${ech.nappe ? ech.nappe + ' m' : 'Non renseignée'}\nType de sondage: ${ech.sondage === 'carotte' ? 'Carotté' : 'Vrac'}\nEssais demandés: ${(ech.essais || []).join(', ')}\nEnvoi prévu pour: ${simulerIADateEnvoi(ech).date}\nDurée en attente de stock: ${simulerIADateEnvoi(ech).delaiJours} jours\nDate de retour essai: ${simulerIADateEnvoi(ech).dateRetour}${ech.photo ? '\nTélécharger photo: http://127.0.0.1:8000' + ech.photo : ''}`} size={32} />
                                </div>
                                <span className="text-xs" style={{ color: '#A9A9A9' }}>
                                  {ech.qrCode}
                                </span>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    const printWindow = window.open('', '_blank');
                                    if (printWindow) {
                                      printWindow.document.write(`
                                        <html>
                                          <head>
                                            <title>Code QR - ${ech.code}</title>
                                            <style>
                                              body { font-family: Arial, sans-serif; text-align: center; padding: 20px; }
                                              .qr-container { margin: 20px auto; display: inline-block; }
                                              .info { margin-top: 20px; }
                                              .prediction { margin-top: 15px; padding: 10px; background: #f8f9fa; border-radius: 5px; }
                                            </style>
                                          </head>
                                          <body>
                                            <h2>Code QR de l'échantillon</h2>
                                            <div class="qr-container">
                                              <div id="qr-code"></div>
                                            </div>
                                            <div class="info">
                                              <p><strong>Code:</strong> ${ech.code}</p>
                                              <p><strong>Nature:</strong> ${ech.nature}</p>
                                              <p><strong>Profondeurs:</strong> ${ech.profondeurDebut}m - ${ech.profondeurFin}m</p>
                                              ${ech.photo ? `<img src="${ech.photo}" alt="Photo échantillon" style="max-width: 200px; margin-top: 10px; border-radius: 8px;" />` : ''}
                                            </div>
                                            <div class="prediction">
                                              <p><strong>Nappe phréatique :</strong> ${ech.nappe ? ech.nappe + ' m' : 'Non renseignée'}</p>
                                              <p><strong>Type de sondage :</strong> ${ech.sondage === 'carotte' ? 'Carotté' : 'Vrac'}</p>
                                              <p style="margin-top: 10px;"><strong>Essais demandés :</strong> ${(ech.essais || []).join(', ')}</p>
                                              <p style="margin-top: 15px;"><strong>Envoi prévu pour :</strong> ${simulerIADateEnvoi(ech).date}</p>
                                              <p><strong>Durée en attente de stock :</strong> ${simulerIADateEnvoi(ech).delaiJours} jours</p>
                                              <p style="margin-top: 10px;"><strong>Date de retour essai :</strong> ${simulerIADateEnvoi(ech).dateRetour}</p>
                                              ${ech.photo ? '<p style="margin-top: 15px; padding-top: 10px; border-top: 1px solid #dee2e6;"><strong>Lien photo :</strong><br/><a href="' + ech.photo + '" target="_blank" style="color: #003366; word-break: break-all;">' + ech.photo + '</a></p>' : ''}
                                            </div>
                                            <script src="https://unpkg.com/qr-code-styling@1.6.0-rc.1/lib/qr-code-styling.js"></script>
                                            <script>
                                              const prediction = { date: '${simulerIADateEnvoi(ech).date}', delaiJours: ${simulerIADateEnvoi(ech).delaiJours}, dateRetour: '${simulerIADateEnvoi(ech).dateRetour}' };
                                              const photoUrl = '${ech.photo || ''}';
                                              const qrData = 'Code: ${ech.code}\\nNature: ${ech.nature}\\nProfondeurs: ${ech.profondeurDebut}m - ${ech.profondeurFin}m\\nNappe phréatique: ${ech.nappe ? ech.nappe + ' m' : 'Non renseignée'}\\nType de sondage: ${ech.sondage === 'carotte' ? 'Carotté' : 'Vrac'}\\nEssais demandés: ${(ech.essais || []).join(', ')}\\nEnvoi prévu pour: ' + prediction.date + '\\nDurée en attente de stock: ' + prediction.delaiJours + ' jours\\nDate de retour essai: ' + prediction.dateRetour + (photoUrl ? '\\nPhoto: ' + photoUrl : '');
                                              const qrCode = new QRCodeStyling({
                                                width: 200,
                                                height: 200,
                                                data: qrData,
                                                dotsOptions: { color: "#000000", type: "square" },
                                                backgroundOptions: { color: "#ffffff" }
                                              });
                                              qrCode.append(document.getElementById("qr-code"));
                                              setTimeout(() => window.print(), 500);
                                            </script>
                                          </body>
                                        </html>
                                      `);
                                      printWindow.document.close();
                                    }
                                  }}
                                  style={{ padding: '4px 8px', fontSize: '12px' }}
                                >
                                  <Printer className="h-3 w-3 mr-1" />
                                  Imprimer
                                </Button>
                              </div>
                            </div>
                            {/* Affichage de la prédiction d'envoi */}
                            <AffichageDateEnvoi echantillon={ech} />
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                ) : results.data ? (
                  <div className="space-y-4">
                    {results.client && (
                      <div className="p-3 rounded-lg" style={{ backgroundColor: '#F5F5F5' }}>
                        <h4 className="font-semibold mb-2">Client: {results.client.nom}</h4>
                        <p className="text-sm" style={{ color: '#A9A9A9' }}>
                          {results.client.contact} - {results.client.projet}
                        </p>
                      </div>
                    )}

                    <div className="space-y-3">
                      <h4 className="font-semibold">Détails échantillon</h4>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <Label>Code</Label>
                          <p className="font-medium">{results.data.code}</p>
                        </div>
                        <div>
                          <Label>Nature</Label>
                          <p className="font-medium">{results.data.nature}</p>
                        </div>
                        <div>
                          <Label>Profondeurs</Label>
                          <p className="font-medium">{results.data.profondeurDebut}m - {results.data.profondeurFin}m</p>
                        </div>
                        <div>
                          <Label>Type de sondage</Label>
                          <p className="font-medium">{results.data.sondage === 'carotte' ? 'Caroté' : 'Vrac'}</p>
                        </div>
                        {results.data.numeroSondage && (
                          <div>
                            <Label>Numéro de sondage</Label>
                            <p className="font-medium">{results.data.numeroSondage}</p>
                          </div>
                        )}
                        <div>
                          <Label>Nappe phréatique</Label>
                          <p className="font-medium">{results.data.nappe ? `${results.data.nappe} m` : 'Non renseignée'}</p>
                        </div>
                        <div>
                          <Label>Date réception</Label>
                          <p className="font-medium">{results.data.dateReception}</p>
                        </div>
                        <div>
                          <Label>Chef de projet</Label>
                          <p className="font-medium">{results.data.chefProjet || '-'}</p>
                        </div>
                      </div>
                      
                      {results.data.photo && (
                        <div className="mt-4">
                          <Label>Photo de l'échantillon</Label>
                          <div className="mt-2">
                            <img
                              src={results.data.photo}
                              alt="Photo échantillon"
                              className="max-w-full h-auto rounded-lg border"
                              style={{ maxHeight: '200px' }}
                            />
                            <div className="flex gap-2 mt-2">
                              <a 
                                href={results.data.photo} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-xs text-blue-600 hover:underline"
                              >
                                Ouvrir en plein écran
                              </a>
                              <a 
                                href={results.data.photo} 
                                download
                                className="text-xs text-green-600 hover:underline font-semibold"
                              >
                                ⬇️ Télécharger l'image
                              </a>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      <div>
                        <Label>Essais demandés</Label>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {(results.data.essais && results.data.essais.length > 0) ? (
                            results.data.essais.map((essai: string) => (
                              <Badge key={essai} variant="outline">
                                {essai}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-sm text-gray-500">Aucun essai demandé</span>
                          )}
                        </div>
                      </div>
                      
                      {/* Affichage de la prédiction d'envoi pour un échantillon unique */}
                      <AffichageDateEnvoi echantillon={results.data} />
                    </div>
                  </div>
                ) : (
                  <p style={{ color: '#A9A9A9' }}>Aucun résultat trouvé</p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
