import { useState } from 'react';
import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { simulerIADateEnvoi } from './DashboardHome';

function DirecteurSNERTPDashboard() {
  const [echantillons, setEchantillons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClient, setSelectedClient] = useState<any>(null);

  React.useEffect(() => {
    const loadEchantillons = async () => {
      try {
        const workflowResponse = await fetch('http://127.0.0.1:8000/api/workflows/?etape_actuelle=directeur_snertp&statut=en_attente', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
            'Content-Type': 'application/json',
          },
        });
        
        const workflowData = await workflowResponse.json();
        
        if (!workflowData.results || workflowData.results.length === 0) {
          setEchantillons([]);
          setLoading(false);
          return;
        }
        
        const echantillonIds = workflowData.results.map((w: any) => w.echantillon);
        
        const [echResponse, rapportResponse] = await Promise.all([
          fetch('http://127.0.0.1:8000/api/echantillons/', {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
              'Content-Type': 'application/json',
            },
          }),
          fetch('http://127.0.0.1:8000/api/rapports/', {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
              'Content-Type': 'application/json',
            },
          })
        ]);
        
        const echData = await echResponse.json();
        const rapportData = await rapportResponse.json();
        
        const rapportsMap = new Map();
        rapportData.results?.forEach((rapport: any) => {
          rapportsMap.set(rapport.echantillon, rapport);
        });
        
        const filteredEchantillons = echData.results.filter((ech: any) => echantillonIds.includes(ech.id));
        
        const groupedByClient = filteredEchantillons.reduce((acc: any, ech: any) => {
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
          for (const ech of echantillons) {
            const rapport = rapportsMap.get(ech.id);
            if (rapport?.date_validation_directeur_technique) {
              dateDirecteurTechnique = new Date(rapport.date_validation_directeur_technique).toLocaleDateString('fr-FR');
              break;
            }
          }
          
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
            dateReception,
            dateDirecteurTechnique,
            dateRetourClient,
            echantillons
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

  if (selectedClient) {
    return (
      <div className="p-8">
        <Button 
          onClick={() => setSelectedClient(null)} 
          variant="outline" 
          className="mb-4"
        >
          ← Retour à la liste
        </Button>
        
        <div className="mb-8">
          <h1>Détails - {selectedClient.clientName}</h1>
          <p style={{ color: '#A9A9A9' }}>Liste des échantillons du client</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Échantillons</CardTitle>
            <CardDescription>{selectedClient.echantillons.length} échantillon(s)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-semibold">Code</th>
                    <th className="text-left p-3 font-semibold">Nature</th>
                    <th className="text-left p-3 font-semibold">Profondeur</th>
                    <th className="text-left p-3 font-semibold">Date réception</th>
                    <th className="text-left p-3 font-semibold">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedClient.echantillons.map((ech: any) => (
                    <tr key={ech.id} className="border-b hover:bg-gray-50">
                      <td className="p-3">
                        <span className="font-medium">{ech.code}</span>
                      </td>
                      <td className="p-3">
                        <span className="text-sm">{ech.nature}</span>
                      </td>
                      <td className="p-3">
                        <span className="text-sm">{ech.profondeur_debut}m - {ech.profondeur_fin}m</span>
                      </td>
                      <td className="p-3">
                        <span className="text-sm">{new Date(ech.date_reception).toLocaleDateString('fr-FR')}</span>
                      </td>
                      <td className="p-3">
                        <span className="text-sm capitalize">{ech.statut}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1>Tableau de bord - Directeur Technique</h1>
        <p style={{ color: '#A9A9A9' }}>Suivi des échantillons et gestion des processus</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Suivi des échantillons par client</CardTitle>
          <CardDescription>{echantillons.length} client(s)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-semibold">Nom du client</th>
                  <th className="text-left p-3 font-semibold">Date de réception</th>
                  <th className="text-left p-3 font-semibold">Date Directeur Technique</th>
                  <th className="text-left p-3 font-semibold">Date de retour client</th>
                  <th className="text-left p-3 font-semibold">Actions</th>
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
                      Aucun échantillon trouvé
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
                        <Button 
                          size="sm" 
                          onClick={() => setSelectedClient(item)}
                          style={{ backgroundColor: '#003366' }}
                        >
                          Voir les détails
                        </Button>
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

export default DirecteurSNERTPDashboard;