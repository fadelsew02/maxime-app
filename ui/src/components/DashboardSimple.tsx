import { useState, useEffect } from 'react';
import { User } from '../App';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Loader2, Users, Package, FlaskConical, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { getClients, Client } from '../lib/clientService';
import { getEchantillons, Echantillon } from '../lib/echantillonService';
import { getDashboardStats, DashboardStats } from '../lib/dashboardService';
import { toast } from 'sonner';

interface DashboardSimpleProps {
  user: User;
}

export function DashboardSimple({ user }: DashboardSimpleProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [echantillons, setEchantillons] = useState<Echantillon[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // États pour la recherche
  const [searchCode, setSearchCode] = useState('');
  const [searchClient, setSearchClient] = useState('');
  const [searchDateDebut, setSearchDateDebut] = useState('');
  const [searchDateFin, setSearchDateFin] = useState('');
  
  // États pour les filtres de recherche
  const [searchCode, setSearchCode] = useState('');
  const [searchClient, setSearchClient] = useState('');
  const [searchDateDebut, setSearchDateDebut] = useState('');
  const [searchDateFin, setSearchDateFin] = useState('');

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        console.log('Chargement des données du dashboard...');
        
        const [clientsData, echantillonsData, statsData] = await Promise.all([
          getClients(),
          getEchantillons(),
          getDashboardStats(),
        ]);
        
        console.log('Données chargées:', { 
          clients: clientsData.length, 
          echantillons: echantillonsData.length,
          stats: statsData 
        });
        
        setClients(clientsData);
        setEchantillons(echantillonsData);
        setStats(statsData);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
        console.error('Erreur lors du chargement:', err);
        setError(errorMessage);
        toast.error('Erreur lors du chargement des données');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4" style={{ color: '#003366' }} />
          <p className="text-gray-600">Chargement du dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-red-600">
              <AlertCircle className="h-12 w-12 mx-auto mb-4" />
              <p className="font-semibold">Erreur de chargement</p>
              <p className="text-sm mt-2">{error}</p>
              <p className="text-xs mt-4 text-gray-500">
                Vérifiez que le backend est démarré sur http://127.0.0.1:8000
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getStatusColor = (statut: string) => {
    const colors: Record<string, string> = {
      'attente': '#FFC107',
      'stockage': '#17A2B8',
      'essais': '#003366',
      'decodification': '#6F42C1',
      'traitement': '#FD7E14',
      'validation': '#E83E8C',
      'valide': '#28A745',
      'rejete': '#DC3545'
    };
    return colors[statut] || '#6C757D';
  };

  const getStatusLabel = (statut: string) => {
    const labels: Record<string, string> = {
      'attente': 'En attente',
      'stockage': 'Stockage',
      'essais': 'Essais',
      'decodification': 'Décodification',
      'traitement': 'Traitement',
      'validation': 'Validation',
      'valide': 'Validé',
      'rejete': 'Rejeté'
    };
    return labels[statut] || statut;
  };

  // Filtrer les échantillons selon les critères de recherche
  const filteredEchantillons = echantillons.filter((ech) => {
    // Filtre par code
    if (searchCode && !ech.code.toLowerCase().includes(searchCode.toLowerCase())) {
      return false;
    }

    // Filtre par client
    if (searchClient) {
      const client = clients.find(c => c.id === ech.client);
      if (!client || !client.nom.toLowerCase().includes(searchClient.toLowerCase())) {
        return false;
      }
    }

    // Filtre par date de début
    if (searchDateDebut) {
      const dateReception = new Date(ech.date_reception);
      const dateDebut = new Date(searchDateDebut);
      if (dateReception < dateDebut) {
        return false;
      }
    }

    // Filtre par date de fin
    if (searchDateFin) {
      const dateReception = new Date(ech.date_reception);
      const dateFin = new Date(searchDateFin);
      if (dateReception > dateFin) {
        return false;
      }
    }

    return true;
  });

  // Réinitialiser les filtres
  const resetFilters = () => {
    setSearchCode('');
    setSearchClient('');
    setSearchDateDebut('');
    setSearchDateFin('');
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1>Tableau de bord</h1>
        <p style={{ color: '#A9A9A9' }}>
          Bienvenue {user.name}
        </p>
      </div>

      {/* Statistiques */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Échantillons</CardTitle>
              <Package className="h-4 w-4" style={{ color: '#003366' }} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_echantillons}</div>
              <p className="text-xs text-gray-500 mt-1">
                {stats.echantillons_en_cours} en cours
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Essais</CardTitle>
              <FlaskConical className="h-4 w-4" style={{ color: '#003366' }} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.essais_en_cours}</div>
              <p className="text-xs text-gray-500 mt-1">
                {stats.essais_en_attente} en attente
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Clients Actifs</CardTitle>
              <Users className="h-4 w-4" style={{ color: '#003366' }} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.clients_actifs}</div>
              <p className="text-xs text-gray-500 mt-1">
                {clients.length} total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Validés</CardTitle>
              <CheckCircle className="h-4 w-4" style={{ color: '#28A745' }} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.echantillons_termines}</div>
              <p className="text-xs text-gray-500 mt-1">
                Taux: {stats.taux_respect_delais.toFixed(1)}%
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Liste des échantillons récents */}
      <Card>
        <CardHeader>
          <CardTitle>Échantillons récents</CardTitle>
        </CardHeader>
        <CardContent>
          {echantillons.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              Aucun échantillon enregistré
            </p>
          ) : (
            <div className="space-y-4">
              {echantillons.slice(0, 10).map((ech) => {
                return (
                  <div
                    key={ech.id}
                    className="flex items-center justify-between p-4 rounded-lg border"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <span className="font-semibold">{ech.code}</span>
                        <Badge style={{ backgroundColor: getStatusColor(ech.statut) }}>
                          {getStatusLabel(ech.statut)}
                        </Badge>
                        {ech.priorite === 'urgente' && (
                          <Badge variant="destructive">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Urgent
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        <span className="font-medium">{ech.client_nom || 'Client inconnu'}</span>
                        {' • '}
                        {ech.nature}
                        {' • '}
                        {ech.profondeur_debut}m - {ech.profondeur_fin}m
                      </div>
                      {ech.chef_projet && (
                        <div className="text-xs text-gray-500 mt-1">
                          Chef de projet: {ech.chef_projet}
                        </div>
                      )}
                    </div>
                    <div className="text-right text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(ech.date_reception).toLocaleDateString('fr-FR')}
                      </div>
                      {ech.essais && ech.essais.length > 0 && (
                        <div className="text-xs mt-1">
                          {ech.essais.length} essai(s)
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
