import { User } from '../App';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Clock, CheckCircle, AlertCircle, TrendingUp, Search, QrCode, Users, FileText, Printer, Calendar, Filter } from 'lucide-react';
import QRCode from 'react-qr-code';
import { useState } from 'react';
import { getClients, getEchantillons, getEchantillon, getEchantillonsByClient, getClient, getEssais, Client, Echantillon } from '../lib/mockData';

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
}

// Interface pour la date de retour prédite
interface DateRetourPredite {
  dateRetour: string;
  confidenceRetour: number;
  raisonRetour: string;
  delaiRetourJours: number;
}

// Simulation d'IA pour prédire la date d'envoi basée sur les durées réelles des essais
function simulerIADateEnvoi(echantillon: Echantillon): DateEnvoiPredite {
  const aujourdHui = new Date();

  // Durées réelles des essais (en jours)
  const dureesEssais: Record<string, number> = {
    AG: 5,
    Proctor: 4,
    CBR: 5,
    Oedometre: 18,
    Cisaillement: 8,
  };

  // Récupérer les essais en cours dans les labos
  const essaisEnCours = getEssais().filter((e: any) => e.statut === 'en_cours' || e.statut === 'attente');

  // Calculer la charge actuelle par section
  const chargeRoute = essaisEnCours.filter((e: any) => e.section === 'route').length;
  const chargeMeca = essaisEnCours.filter((e: any) => e.section === 'mecanique').length;

  // Capacités maximales par section (échantillons simultanés)
  const capaciteRoute = 5;
  const capaciteMeca = 3;

  // Déterminer les sections nécessaires pour cet échantillon
  const aEssaisRoute = echantillon.essais.some(e => ['AG', 'Proctor', 'CBR'].includes(e));
  const aEssaisMeca = echantillon.essais.some(e => ['Oedometre', 'Cisaillement'].includes(e));

  // Calculer le délai basé sur les durées des essais
  let delaiMax = 0;
  let raison = "Basé sur les durées standard des essais";

  echantillon.essais.forEach(essai => {
    const duree = dureesEssais[essai] || 0;
    if (duree > delaiMax) {
      delaiMax = duree;
      raison = `Essai ${essai} nécessite ${duree} jours`;
    }
  });

  // Ajustement selon la charge actuelle
  let facteurCharge = 1;

  if (aEssaisRoute && chargeRoute >= capaciteRoute) {
    facteurCharge = Math.max(facteurCharge, 1.5);
    raison = "Charge élevée en laboratoire Route - délai ajusté";
  }

  if (aEssaisMeca && chargeMeca >= capaciteMeca) {
    facteurCharge = Math.max(facteurCharge, 2.0);
    raison = "Charge élevée en laboratoire Mécanique - délai ajusté";
  }

  // Ajustement selon la priorité
  let facteurPriorite = 1;
  if (echantillon.priorite === 'urgente') {
    facteurPriorite = 0.7;
    raison = "Échantillon prioritaire - traitement accéléré";
  }

  // Calcul du délai total
  const delaiTotal = Math.max(1, Math.ceil(delaiMax * facteurCharge * facteurPriorite));

  // Calcul de la date d'envoi
  const dateEnvoi = new Date(aujourdHui);
  dateEnvoi.setDate(aujourdHui.getDate() + delaiTotal);

  // Calcul de la date de retour (durée des essais + temps de traitement des résultats)
  const delaiRetour = delaiTotal + Math.ceil(delaiMax * 0.3) + 2; // +30% du temps d'essai + 2 jours de traitement
  const dateRetour = new Date(aujourdHui);
  dateRetour.setDate(aujourdHui.getDate() + delaiRetour);

  // Calcul de la confiance basée sur la charge et les données disponibles
  let confidence = 0.85; // Base élevée car basé sur données réelles

  if (facteurCharge > 1.5) {
    confidence -= 0.2;
  }

  if (echantillon.priorite === 'urgente') {
    confidence += 0.1;
  }

  confidence = Math.min(0.95, Math.max(0.7, confidence));

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
    delaiJours: delaiTotal,
    dateRetour: dateRetour.toLocaleDateString('fr-FR', options),
    confidenceRetour: Math.round((confidence - 0.05) * 100),
    raisonRetour: "Temps nécessaire pour finaliser les rapports et validations",
    delaiRetourJours: delaiRetour
  };
}

export function DashboardHome({ user }: DashboardHomeProps) {
  // Données mockées pour la démo
  const echantillons = getEchantillons();
  const clients = getClients();
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Filtrage des échantillons selon le statut
  const filteredEchantillons = statusFilter === 'all'
    ? echantillons
    : echantillons.filter(e => e.statut === statusFilter);

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
      enAttente: echantillons.filter(e => e.statut === 'stockage').length,
      enCours: echantillons.filter(e => e.statut === 'essais').length,
      termines: echantillons.filter(e => e.statut === 'decodification').length,
      valides: echantillons.filter(e => e.statut === 'valide').length,
    }} />;
  }

  // Dashboard commun pour directeur technique et chef de service
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1>Tableau de bord - {user.role === 'directeur_technique' ? 'Directeur Technique' : 'Chef de Service'}</h1>
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
                  <th className="text-left p-3 font-semibold">Codes échantillons</th>
                  <th className="text-left p-3 font-semibold">Date réception</th>
                  <th className="text-left p-3 font-semibold">Date envoi essais</th>
                  <th className="text-left p-3 font-semibold">Date envoi traitement</th>
                  <th className="text-left p-3 font-semibold">Date envoi chef projet</th>
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
                        <div className="space-y-1">
                          {sortedEchantillons.map((ech, index) => (
                            <div key={ech.id} className="flex items-center gap-2">
                              <span className="text-sm">{ech.code}</span>
                              {ech.priorite === 'urgente' && (
                                <Badge variant="destructive" className="text-xs">URGENT</Badge>
                              )}
                              {index < sortedEchantillons.length - 1 && <span className="text-gray-400">•</span>}
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="p-3">
                        <span className="text-sm">{latestReception}</span>
                      </td>
                      <td className="p-3">
                        <span className="text-sm">{latestEnvoiEssais || '-'}</span>
                      </td>
                      <td className="p-3">
                        <span className="text-sm text-gray-500">-</span>
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

function ReceptionnisteHome({ stats }: { stats: { enAttente: number; enCours: number; termines: number; valides: number } }) {
  const [searchType, setSearchType] = useState<'client' | 'echantillon'>('client');
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<any>(null);
  const clients = getClients();

  const handleSearch = () => {
    if (!searchQuery) return;

    if (searchType === 'client') {
      const echantillons = getEchantillonsByClient(searchQuery);
      const client = getClient(searchQuery);
      setResults({ type: 'client', data: echantillons, client });
    } else {
      const echantillon = getEchantillon(searchQuery);
      const client = echantillon ? getClient(echantillon.clientCode) : null;
      setResults({ type: 'echantillon', data: echantillon, client });
    }
  };

  // Composant pour afficher la prédiction de date d'envoi et retour
  const AffichageDateEnvoi = ({ echantillon }: { echantillon: Echantillon }) => {
    const prediction = simulerIADateEnvoi(echantillon);

    return (
      <div className="mt-3 p-3 rounded-lg border" style={{ backgroundColor: '#F8F9FA', borderColor: '#E9ECEF' }}>
        <div className="flex items-center gap-2 mb-2">
          <Calendar className="h-4 w-4" style={{ color: '#003366' }} />
          <span className="text-sm font-semibold">Prédiction d'envoi par IA</span>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
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
          <div className="flex justify-between items-center text-xs">
            <span style={{ color: '#6C757D' }}>Délai estimé: {prediction.delaiJours} jours</span>
            <span style={{ color: '#6C757D' }}>Confiance: {prediction.confidence}%</span>
          </div>
          <div className="text-xs" style={{ color: '#6C757D', fontStyle: 'italic' }}>
            {prediction.raison}
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
              <span style={{ color: '#6C757D' }}>Confiance: {prediction.confidenceRetour}%</span>
            </div>
            <div className="text-xs" style={{ color: '#6C757D', fontStyle: 'italic' }}>
              {prediction.raisonRetour}
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
        {/* Liste des clients */}
        <Card>
          <CardHeader>
            <CardTitle>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Clients enregistrés
              </div>
            </CardTitle>
            <CardDescription>
              {clients.length} client(s) au total
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {clients.map((client) => {
                const echantillonsClient = getEchantillonsByClient(client.code);
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
                        {echantillonsClient.length} échantillon(s)
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
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8">
                                  <QRCode value={ech.qrCode} size={32} />
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
                                              <p><strong>QR Code:</strong> ${ech.qrCode}</p>
                                              <p><strong>Nature:</strong> ${ech.nature}</p>
                                              <p><strong>Profondeurs:</strong> ${ech.profondeurDebut}m - ${ech.profondeurFin}m</p>
                                              ${ech.photo ? `<img src="${ech.photo}" alt="Photo échantillon" style="max-width: 200px; margin-top: 10px; border-radius: 8px;" />` : ''}
                                            </div>
                                            <div class="prediction">
                                              <h3>Prédiction d'envoi par IA</h3>
                                              <p><strong>Envoi prévu pour :</strong> ${simulerIADateEnvoi(ech).date}</p>
                                              <p><strong>Délai estimé :</strong> ${simulerIADateEnvoi(ech).delaiJours} jours</p>
                                              <p><strong>Confiance :</strong> ${simulerIADateEnvoi(ech).confidence}%</p>
                                              <p><em>${simulerIADateEnvoi(ech).raison}</em></p>
                                            </div>
                                            <script src="https://unpkg.com/qr-code-styling@1.6.0-rc.1/lib/qr-code-styling.js"></script>
                                            <script>
                                              const qrCode = new QRCodeStyling({
                                                width: 200,
                                                height: 200,
                                                data: "${ech.qrCode}",
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
                          <p>{results.data.code}</p>
                        </div>
                        <div>
                          <Label>QR Code</Label>
                          <p>{results.data.qrCode}</p>
                        </div>
                        <div>
                          <Label>Nature</Label>
                          <p>{results.data.nature}</p>
                        </div>
                        <div>
                          <Label>Profondeurs</Label>
                          <p>{results.data.profondeurDebut}m - {results.data.profondeurFin}m</p>
                        </div>
                        <div>
                          <Label>Date réception</Label>
                          <p>{results.data.dateReception}</p>
                        </div>
                        <div>
                          <Label>Chef de projet</Label>
                          <p>{results.data.chefProjet || '-'}</p>
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
                          </div>
                        </div>
                      )}
                      <div>
                        <Label>Essais demandés</Label>
                        <div className="flex gap-2 mt-2">
                          {results.data.essais.map((essai: string) => (
                            <Badge key={essai} variant="outline">
                              {essai}
                            </Badge>
                          ))}
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
