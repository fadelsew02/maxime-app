import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { toast } from 'sonner';
import { workflowApi } from '../../lib/workflowApi';

export function TraitementRejeteModule() {
  const [clientsRejetes, setClientsRejetes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadEssaisRejetes = async () => {
    setLoading(true);
    try {
      const workflowsResponse = await fetch('http://127.0.0.1:8000/api/workflows/', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
      });
      const workflowsData = await workflowsResponse.json();
      const allWorkflows = workflowsData.results || [];
      
      const rejetesParCode = new Map<string, any>();
      
      for (const workflow of allWorkflows) {
        const aEteRejete = workflow.rejet_chef_projet || workflow.rejet_chef_service || 
                          workflow.rejet_directeur_technique || workflow.rejet_directeur_snertp ||
                          (workflow.statut === 'rejete');
        
        if (aEteRejete) {
          const code = workflow.code_echantillon;
          if (!rejetesParCode.has(code) || 
              new Date(workflow.updated_at) > new Date(rejetesParCode.get(code).updated_at)) {
            rejetesParCode.set(code, workflow);
          }
        }
      }
      
      const clientsMap = new Map<string, any>();
      
      for (const [code, workflow] of rejetesParCode.entries()) {
        const echResponse = await fetch(`http://127.0.0.1:8000/api/echantillons/?code=${code}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
            'Content-Type': 'application/json',
          },
        });
        const echData = await echResponse.json();
        console.log(`API response for ${code}:`, echData.results);
        const ech = echData.results?.[0];
        
        if (ech) {
          let rejectedBy = '';
          let rejectionReason = workflow.raison_rejet || 'Aucune raison spécifiée';
          let dateRejected = workflow.date_rejet || workflow.updated_at || '';
          
          if (workflow.rejet_chef_projet) {
            rejectedBy = 'Chef de Projet';
          } else if (workflow.rejet_chef_service) {
            rejectedBy = 'Chef de Service';
          } else if (workflow.rejet_directeur_technique) {
            rejectedBy = 'Directeur Technique';
          } else if (workflow.rejet_directeur_snertp) {
            rejectedBy = 'Directeur SNERTP';
          } else {
            rejectedBy = 'Chef de Projet';
          }
          
          const clientNom = ech.client_nom || 'Client inconnu';
          const clientCode = ech.client_code || '';
          const clientKey = clientCode || clientNom;
          
          console.log(`Échantillon ${code}: clientNom=${clientNom}, clientCode=${clientCode}, clientKey=${clientKey}`);
          console.log('Full ech object:', ech);
          
          if (!clientsMap.has(clientKey)) {
            clientsMap.set(clientKey, {
              clientNom,
              chefProjet: ech.chef_projet || '-',
              echantillons: [],
              rejectedBy,
              rejectionReason,
              dateRejected,
              file: workflow.file_name || '-'
            });
          }
          
          const existingEch = clientsMap.get(clientKey).echantillons.find((e: any) => e.code === ech.code);
          if (!existingEch) {
            clientsMap.get(clientKey).echantillons.push({
              code: ech.code,
              statutActuel: ech.statut
            });
          }
        }
      }
      
      setClientsRejetes(Array.from(clientsMap.values()));
    } catch (error) {
      console.error('Erreur chargement:', error);
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEssaisRejetes();
  }, []);

  return (
    <div className="p-8 bg-background">
      <div className="mb-8">
        <h1>Traitement rejeté</h1>
        <p style={{ color: '#A9A9A9' }}>
          Échantillons rejetés par les chefs de projet, service ou directeurs
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Clients avec rapports rejetés</CardTitle>
              <CardDescription>
                {clientsRejetes.length} client(s) avec rapports rejetés
              </CardDescription>
            </div>
            <Button onClick={loadEssaisRejetes} disabled={loading}>
              {loading ? 'Chargement...' : 'Actualiser'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                <p className="mt-2 text-gray-500">Chargement...</p>
              </div>
            ) : clientsRejetes.length === 0 ? (
              <div className="text-center py-12" style={{ color: '#A9A9A9' }}>
                Aucun rapport rejeté
              </div>
            ) : (
              clientsRejetes.map((client, index) => (
                <div
                  key={`${client.clientNom}_${index}`}
                  className="p-4 rounded-lg"
                  style={{ backgroundColor: '#FFF3CD', borderLeft: '4px solid #DC3545' }}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-semibold text-lg">{client.clientNom}</span>
                        <Badge style={{ backgroundColor: '#DC3545', color: '#FFFFFF' }}>
                          Rejeté par {client.rejectedBy}
                        </Badge>
                      </div>
                      <div className="text-sm space-y-1 mb-3" style={{ color: '#6C757D' }}>
                        <p>Chef de projet: {client.chefProjet}</p>
                        <p>Nombre d'échantillons: {client.echantillons.length}</p>
                        {client.dateRejected && (
                          <p>Date de rejet: {new Date(client.dateRejected).toLocaleString('fr-FR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}</p>
                        )}
                        <p className="text-red-600 font-medium">Raison: {client.rejectionReason}</p>
                        <p>Fichier: {client.file}</p>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        {client.echantillons.map((ech: any) => (
                          <Badge 
                            key={ech.code}
                            style={{ backgroundColor: '#6C757D', color: '#FFFFFF' }}
                          >
                            {ech.code}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
