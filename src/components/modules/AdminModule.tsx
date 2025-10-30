import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { BarChart3, TrendingUp, Clock, CheckCircle, XCircle, Package } from 'lucide-react';
import { getEchantillons, getEssais } from '../../lib/mockData';

export function AdminModule() {
  const [periodeFilter, setPeriodeFilter] = useState<'semaine' | 'mois' | 'annee'>('mois');

  const echantillons = getEchantillons();
  const essais = getEssais();

  // Statistiques
  const stats = {
    total: echantillons.length,
    enAttente: echantillons.filter(e => e.statut === 'stockage').length,
    enCours: echantillons.filter(e => e.statut === 'essais').length,
    enValidation: echantillons.filter(e => e.statut === 'validation' || e.statut === 'traitement').length,
    valides: echantillons.filter(e => e.statut === 'valide').length,
    rejetes: echantillons.filter(e => e.statut === 'rejete').length,
  };

  const getStatusLabel = (statut: string) => {
    const labels: Record<string, string> = {
      stockage: 'Stockage',
      essais: 'Essais en cours',
      decodification: 'Décodification',
      traitement: 'Traitement',
      validation: 'Validation',
      valide: 'Validé',
      rejete: 'Rejeté',
    };
    return labels[statut] || statut;
  };

  const getStatusColor = (statut: string) => {
    const colors: Record<string, string> = {
      stockage: '#FFC107',
      essais: '#003366',
      decodification: '#003366',
      traitement: '#003366',
      validation: '#FFC107',
      valide: '#28A745',
      rejete: '#DC3545',
    };
    return colors[statut] || '#A9A9A9';
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1>Module Administration</h1>
        <p style={{ color: '#A9A9A9' }}>
          Supervision et statistiques globales
        </p>
      </div>

      <div className="mb-6 flex justify-end">
        <Select value={periodeFilter} onValueChange={(v: any) => setPeriodeFilter(v)}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="semaine">Cette semaine</SelectItem>
            <SelectItem value="mois">Ce mois</SelectItem>
            <SelectItem value="annee">Cette année</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Total échantillons</CardTitle>
            <Package className="h-4 w-4" style={{ color: '#003366' }} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{stats.total}</div>
            <p className="text-xs" style={{ color: '#A9A9A9' }}>
              Tous statuts confondus
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">En cours</CardTitle>
            <Clock className="h-4 w-4" style={{ color: '#FFC107' }} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{stats.enCours + stats.enValidation}</div>
            <p className="text-xs" style={{ color: '#A9A9A9' }}>
              En traitement
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Validés</CardTitle>
            <CheckCircle className="h-4 w-4" style={{ color: '#28A745' }} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{stats.valides}</div>
            <p className="text-xs" style={{ color: '#A9A9A9' }}>
              Rapports finalisés
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Rejetés</CardTitle>
            <XCircle className="h-4 w-4" style={{ color: '#DC3545' }} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{stats.rejetes}</div>
            <p className="text-xs" style={{ color: '#A9A9A9' }}>
              Nécessitent révision
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="chaine" className="space-y-6">
        <TabsList>
          <TabsTrigger value="chaine">Chaîne de traitement</TabsTrigger>
          <TabsTrigger value="essais">Statistiques essais</TabsTrigger>
          <TabsTrigger value="details">Détails</TabsTrigger>
        </TabsList>

        <TabsContent value="chaine" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Vue d'ensemble de la chaîne</CardTitle>
              <CardDescription>
                Suivi des échantillons à chaque étape
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { etape: 'Stockage', count: stats.enAttente, color: '#FFC107' },
                  { etape: 'Essais en cours', count: stats.enCours, color: '#003366' },
                  { etape: 'En validation', count: stats.enValidation, color: '#FFC107' },
                  { etape: 'Validés', count: stats.valides, color: '#28A745' },
                  { etape: 'Rejetés', count: stats.rejetes, color: '#DC3545' },
                ].map((item) => (
                  <div key={item.etape} className="flex items-center justify-between p-4 rounded-lg" style={{ backgroundColor: '#F5F5F5' }}>
                    <div className="flex items-center gap-4">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <span>{item.etape}</span>
                    </div>
                    <Badge variant="outline">{item.count}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="essais" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Essais par type</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {['AG', 'Proctor', 'CBR', 'Oedometre', 'Cisaillement'].map((type) => {
                    const count = essais.filter(e => e.type === type).length;
                    return (
                      <div key={type} className="flex justify-between items-center">
                        <span>{type}</span>
                        <Badge variant="outline">{count}</Badge>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Statut des essais</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full" style={{ backgroundColor: '#FFC107' }} />
                      <span>En attente</span>
                    </div>
                    <Badge variant="outline">
                      {essais.filter(e => e.statut === 'attente').length}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full" style={{ backgroundColor: '#003366' }} />
                      <span>En cours</span>
                    </div>
                    <Badge variant="outline">
                      {essais.filter(e => e.statut === 'en_cours').length}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full" style={{ backgroundColor: '#28A745' }} />
                      <span>Terminés</span>
                    </div>
                    <Badge variant="outline">
                      {essais.filter(e => e.statut === 'termine').length}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="details" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Détails des échantillons</CardTitle>
              <CardDescription>
                Vue détaillée de tous les échantillons
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {echantillons.map((ech) => (
                  <div
                    key={ech.id}
                    className="p-4 rounded-lg flex justify-between items-center"
                    style={{ backgroundColor: '#F5F5F5' }}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span>{ech.code}</span>
                        <Badge
                          style={{
                            backgroundColor: getStatusColor(ech.statut),
                            color: '#FFFFFF',
                          }}
                        >
                          {getStatusLabel(ech.statut)}
                        </Badge>
                        {ech.priorite === 'urgente' && (
                          <Badge variant="outline" style={{ borderColor: '#DC3545', color: '#DC3545' }}>
                            Urgent
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm" style={{ color: '#A9A9A9' }}>
                        {ech.nature} - Reçu le {ech.dateReception}
                      </p>
                    </div>
                    <div className="text-xs text-right" style={{ color: '#A9A9A9' }}>
                      <p>Date fin estimée</p>
                      <p>{ech.dateFinEstimee}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
