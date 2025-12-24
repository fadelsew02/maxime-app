import { useState, useEffect } from 'react';
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Label } from '../ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { FileText, Download, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Textarea } from '../ui/textarea';
import { workflowApi } from '../../lib/workflowApi';

interface EssaiChefProjet {
  echantillonCode: string;
  essaiType: string;
  dateReception: string;
  dateDebut: string;
  dateFin: string;
  operateur: string;
  resultats: any;
  commentaires: string;
  fichier: string;
  fichierData: string;
  validationComment: string;
  validationDate: string;
  estRepris: boolean;
}

interface EchantillonGroupe {
  code: string;
  dateEnvoi: string;
  file: string;
  clientName: string;
  essais: EssaiChefProjet[];
}

interface ClientGroupe {
  clientId: string;
  clientName: string;
  echantillons: EchantillonGroupe[];
  dateEnvoi: string;
  file: string;
  fileData: string;
}

export function ChefProjetModule() {
  const [clients, setClients] = useState<ClientGroupe[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClient, setSelectedClient] = useState<ClientGroupe | null>(null);

  const loadEchantillons = async () => {
    setLoading(true);
    const clientsMap = new Map<string, ClientGroupe>();

    const workflows = await workflowApi.getByEtape('chef_service');
    console.log('Tous les workflows chef_service (archivés):', workflows.length, workflows.map(w => w.code_echantillon));
    const workflowsArchives = workflows.filter(w => w.validation_chef_projet);
    console.log('Workflows archivés:', workflowsArchives.length, workflowsArchives.map(w => w.code_echantillon));
    
    for (const workflow of workflowsArchives) {
      const code = workflow.code_echantillon;
      let clientName = workflow.client_name || '-';
      
      // Extraire le code client depuis client_name (format: "NOM (CODE)")
      let clientCode = '';
      const match = clientName.match(/\(([^)]+)\)/);
      if (match) {
        clientCode = match[1];
      }
      
      // IMPORTANT: TOUJOURS grouper par CODE client unique
      const clientKey = clientCode || code;
      console.log(`Échantillon ${code}: clientName=${clientName}, clientCode=${clientCode}, clientKey=${clientKey}`);
      
      if (!clientsMap.has(clientKey)) {
        clientsMap.set(clientKey, {
          clientId: clientCode,
          clientName: clientName,
          echantillons: [],
          dateEnvoi: workflow.created_at || new Date().toISOString(),
          file: workflow.file_name || '-',
          fileData: workflow.file_data || ''
        });
      }
      
      const echantillonGroupe: EchantillonGroupe = {
        code,
        dateEnvoi: workflow.created_at || new Date().toISOString(),
        file: workflow.file_name || '-',
        clientName,
        essais: []
      };
      
      try {
        const echantillonResponse = await fetch(`http://127.0.0.1:8000/api/echantillons/?code=${code}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
            'Content-Type': 'application/json',
          },
        });
        const echantillonData = await echantillonResponse.json();
        const echantillon = echantillonData.results[0];
        
        if (echantillon) {
          const essaisResponse = await fetch(`http://127.0.0.1:8000/api/essais/?echantillon=${echantillon.id}`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
              'Content-Type': 'application/json',
            },
          });
          const essaisData = await essaisResponse.json();
          console.log(`API retourne pour ${code}:`, essaisData.results?.length, 'essais:', essaisData.results?.map((e: any) => ({type: e.type, statut: e.statut, validation: e.statut_validation})));
          const essaisAcceptes = (essaisData.results || []).filter((e: any) => 
            e.statut === 'termine' && e.statut_validation === 'accepted'
          );
          
          console.log(`Essais acceptés pour ${code}:`, essaisAcceptes.length, essaisAcceptes.map((e: any) => e.type));
          
          const essaisUniques = new Map<string, any>();
          essaisAcceptes.forEach((essai: any) => {
            if (!essaisUniques.has(essai.type) || new Date(essai.date_fin) > new Date(essaisUniques.get(essai.type).date_fin)) {
              essaisUniques.set(essai.type, essai);
            }
          });
          
          console.log(`Essais uniques pour ${code}:`, essaisUniques.size, Array.from(essaisUniques.keys()));
          
          essaisUniques.forEach((essai: any) => {
            echantillonGroupe.essais.push({
              echantillonCode: code,
              essaiType: essai.type,
              dateReception: essai.date_reception || '-',
              dateDebut: essai.date_debut || '-',
              dateFin: essai.date_fin || '-',
              operateur: essai.operateur || '-',
              resultats: essai.resultats || {},
              commentaires: essai.commentaires || '-',
              fichier: essai.fichier || '-',
              fichierData: '',
              validationComment: essai.commentaires_validation || '-',
              validationDate: essai.date_validation || '-',
              estRepris: !!essai.date_rejet
            });
          });
        }
      } catch (e) {
        console.error('Erreur chargement essais:', e);
      }
      
      if (echantillonGroupe.essais.length > 0) {
        clientsMap.get(clientKey)!.echantillons.push(echantillonGroupe);
      }
    }

    const finalClients = Array.from(clientsMap.values());
    console.log('Clients groupés:', finalClients.length, finalClients);
    setClients(finalClients);
    setLoading(false);
  };

  useEffect(() => {
    loadEchantillons();
  }, []);

  return (
    <div className="p-8 bg-background">
      <div className="mb-8">
        <h1>Rapports de traitement</h1>
        <p style={{ color: '#A9A9A9' }}>
          Échantillons envoyés par le responsable traitement
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Rapports archivés</CardTitle>
              <CardDescription>
                Tous les rapports transmis au chef service sont archivés ici
              </CardDescription>
            </div>
            <Button onClick={loadEchantillons} disabled={loading}>
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
            ) : clients.length === 0 ? (
              <div className="text-center py-12" style={{ color: '#A9A9A9' }}>
                <p>Aucun rapport de traitement reçu</p>
              </div>
            ) : (
              clients.map((client) => (
                <div
                  key={client.clientId || client.clientName}
                  className="p-4 rounded-lg"
                  style={{ backgroundColor: '#F5F5F5' }}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-semibold text-lg">{client.clientName}</span>
                        <Badge variant="outline" style={{ borderColor: '#28A745', color: '#28A745' }}>
                          {client.echantillons.length} échantillon(s)
                        </Badge>
                      </div>
                      <div className="text-sm space-y-1 mb-3" style={{ color: '#6C757D' }}>
                        <p>Date réception: {new Date(client.dateEnvoi).toLocaleString('fr-FR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}</p>
                        <p>Fichier rapport: {client.file}</p>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        {client.echantillons.map((ech) => (
                          <Badge 
                            key={ech.code}
                            style={{ backgroundColor: '#6C757D', color: '#FFFFFF' }}
                          >
                            {ech.code}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedClient(client)}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Voir détails
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!selectedClient} onOpenChange={() => setSelectedClient(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Détails - {selectedClient?.clientName}</DialogTitle>
            <DialogDescription>
              {selectedClient?.echantillons.length} échantillon(s) avec essais validés
            </DialogDescription>
          </DialogHeader>
          {selectedClient && <ClientDetails client={selectedClient} onClose={() => setSelectedClient(null)} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ClientDetails({ client, onClose }: { client: ClientGroupe; onClose: () => void }) {
  const [selectedEchantillon, setSelectedEchantillon] = useState<EchantillonGroupe | null>(null);
  const [allClientEchantillons, setAllClientEchantillons] = useState<any[]>([]);

  useEffect(() => {
    const loadAllEchantillons = async () => {
      try {
        const firstEchResponse = await fetch(`http://127.0.0.1:8000/api/echantillons/?code=${client.echantillons[0].code}`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` },
        });
        const firstEchData = await firstEchResponse.json();
        const firstEch = firstEchData.results?.[0];
        
        if (firstEch?.client) {
          const response = await fetch(`http://127.0.0.1:8000/api/echantillons/?client=${firstEch.client}`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` },
          });
          const data = await response.json();
          setAllClientEchantillons(data.results || []);
        }
      } catch (error) {
        console.error('Erreur chargement échantillons:', error);
      }
    };
    if (client.echantillons.length > 0) {
      loadAllEchantillons();
    }
  }, [client.echantillons]);

  if (selectedEchantillon) {
    return <EchantillonDetails echantillon={selectedEchantillon} onBack={() => setSelectedEchantillon(null)} />;
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Client</Label>
        <p className="font-semibold text-lg">{client.clientName}</p>
      </div>

      <div className="space-y-2 pt-4 border-t">
        <Label>Fichier rapport de traitement</Label>
        {client.file && client.file !== '-' ? (
          <Button variant="outline" size="sm" onClick={() => {
            const link = document.createElement('a');
            link.href = client.fileData;
            link.download = client.file;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            toast.success(`Téléchargement de ${client.file}`);
          }}>
            <Download className="h-4 w-4 mr-2" />
            {client.file}
          </Button>
        ) : (
          <p className="text-sm text-gray-500">Aucun fichier disponible</p>
        )}
      </div>

      {allClientEchantillons.length > 0 && (
        <div className="space-y-2 pt-4 border-t">
          <Label>Tous les échantillons du client</Label>
          <div className="space-y-2 max-h-60 overflow-y-auto p-2 rounded" style={{ backgroundColor: '#FAFAFA' }}>
            {allClientEchantillons.map((ech) => (
              <div key={ech.id} className="p-3 rounded" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E0E0E0' }}>
                <div className="flex justify-between items-center">
                  <span className="font-medium">{ech.code}</span>
                  <Badge variant="outline" style={{ 
                    borderColor: ech.statut === 'valide' ? '#28A745' : '#FFC107',
                    color: ech.statut === 'valide' ? '#28A745' : '#FFC107'
                  }}>
                    {ech.statut}
                  </Badge>
                </div>
                <p className="text-xs text-gray-500">Reçu le: {new Date(ech.date_reception).toLocaleDateString('fr-FR')}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="pt-4 border-t">
        <h3 className="font-semibold mb-4">Échantillons archivés ({client.echantillons.length})</h3>
        <p className="text-sm text-gray-600 mb-4">
          Ces rapports ont été transmis au chef de service et sont archivés ici pour consultation.
        </p>
        <div className="space-y-3">
          {client.echantillons.map((ech) => {
            console.log(`Échantillon ${ech.code}: ${ech.essais.length} essais`, ech.essais.map(e => e.essaiType));
            return (
            <div key={ech.code} className="p-3 rounded-lg" style={{ backgroundColor: '#F5F5F5' }}>
              <div className="flex justify-between items-center">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-semibold">{ech.code}</span>
                    <Badge variant="outline" style={{ borderColor: '#28A745', color: '#28A745' }}>
                      {ech.essais.length} essai(s)
                    </Badge>
                    <Badge style={{ backgroundColor: '#6C757D', color: '#FFFFFF' }}>
                      ARCHIVÉ
                    </Badge>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {ech.essais.map((essai, index) => (
                      <div key={`${essai.essaiType}-${index}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <Badge 
                          style={{ backgroundColor: '#28A745', color: '#FFFFFF', fontSize: '11px' }}
                        >
                          {essai.essaiType}
                        </Badge>
                        {essai.estRepris && (
                          <Badge 
                            style={{ backgroundColor: '#FD7E14', color: '#FFFFFF', fontSize: '9px', padding: '2px 6px' }}
                          >
                            REPRIS
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                <Button size="sm" variant="outline" onClick={() => setSelectedEchantillon(ech)}>
                  Consulter
                </Button>
              </div>
            </div>
          )})}
        </div>
      </div>
    </div>
  );
}

function ClientValidation({ client, onClose }: { client: ClientGroupe; onClose: () => void }) {
  const [rejectionReason, setRejectionReason] = useState('');
  const [validated, setValidated] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleAcceptAll = async () => {
    setLoading(true);
    try {
      for (const echantillon of client.echantillons) {
        const workflow = await workflowApi.getByCode(echantillon.code);
        if (workflow?.id) {
          await workflowApi.validerChefProjet(workflow.id, '');
        }
      }
      setValidated(true);
      toast.success(`Tous les rapports acceptés pour ${client.clientName}`);
      setTimeout(() => {
        onClose();
        window.location.reload();
      }, 1000);
    } catch (error) {
      toast.error('Erreur lors de la validation');
    } finally {
      setLoading(false);
    }
  };

  const handleRejectAll = async () => {
    if (!rejectionReason.trim()) {
      toast.error('Veuillez indiquer la raison du rejet');
      return;
    }

    setLoading(true);
    try {
      for (const echantillon of client.echantillons) {
        const workflow = await workflowApi.getByCode(echantillon.code);
        if (workflow?.id) {
          await workflowApi.rejeterChefProjet(workflow.id, rejectionReason);
        }
      }
      setValidated(true);
      toast.success(`Tous les rapports rejetés pour ${client.clientName}`);
      setTimeout(() => {
        onClose();
        window.location.reload();
      }, 1000);
    } catch (error) {
      toast.error('Erreur lors du rejet');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 pt-4 border-t">
      <h3 className="font-semibold">Validation des rapports</h3>
      
      <div className="space-y-2">
        <Label>Raison du rejet (optionnel si accepté)</Label>
        <Textarea
          value={rejectionReason}
          onChange={(e) => setRejectionReason(e.target.value)}
          placeholder="Indiquer la raison du rejet..."
          rows={3}
          disabled={validated || loading}
        />
      </div>

      <div className="flex gap-2">
        <Button
          onClick={handleAcceptAll}
          disabled={validated || loading}
          style={{ 
            backgroundColor: validated ? '#6C757D' : '#28A745', 
            color: '#FFFFFF',
            opacity: validated ? 0.5 : 1
          }}
        >
          <CheckCircle className="h-4 w-4 mr-2" />
          {loading ? 'Traitement...' : 'Accepter tous les rapports'}
        </Button>
        <Button
          onClick={handleRejectAll}
          disabled={validated || loading}
          style={{ 
            backgroundColor: validated ? '#6C757D' : '#DC3545', 
            color: '#FFFFFF',
            opacity: validated ? 0.5 : 1
          }}
        >
          <XCircle className="h-4 w-4 mr-2" />
          {loading ? 'Traitement...' : 'Rejeter tous les rapports'}
        </Button>
      </div>
    </div>
  );
}

function EchantillonDetails({ echantillon, onBack }: { echantillon: EchantillonGroupe; onBack: () => void }) {
  const [selectedEssai, setSelectedEssai] = useState<EssaiChefProjet | null>(null);

  if (selectedEssai) {
    return <EssaiDetails essai={selectedEssai} onBack={() => setSelectedEssai(null)} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <Button variant="outline" size="sm" onClick={onBack}>
          ← Retour
        </Button>
        <h3 className="font-semibold">Échantillon {echantillon.code}</h3>
      </div>

      <div>
        <h3 className="font-semibold mb-4">Essais acceptés ({echantillon.essais.length})</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {echantillon.essais.map((essai, index) => (
            <Button
              key={`${essai.essaiType}-${index}`}
              variant="outline"
              className="h-20 flex flex-col justify-center p-4"
              onClick={() => setSelectedEssai(essai)}
              style={{
                borderColor: '#28A745',
                backgroundColor: '#28A745' + '20'
              }}
            >
              <span className="font-semibold">{essai.essaiType}</span>
              <span className="text-xs text-green-600">
                Accepté ✓
              </span>
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}

function EssaiDetails({ essai, onBack }: { essai: EssaiChefProjet; onBack: () => void }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <Button variant="outline" size="sm" onClick={onBack}>
          ← Retour
        </Button>
        <h3 className="font-semibold">Essai {essai.essaiType} - {essai.echantillonCode}</h3>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Code échantillon</Label>
          <p>{essai.echantillonCode}</p>
        </div>
        <div className="space-y-2">
          <Label>Type d'essai</Label>
          <Badge style={{ backgroundColor: '#28A745', color: '#FFFFFF' }}>
            {essai.essaiType}
          </Badge>
        </div>
        <div className="space-y-2">
          <Label>Opérateur</Label>
          <p>{essai.operateur}</p>
        </div>
        <div className="space-y-2">
          <Label>Date fin</Label>
          <p>{essai.dateFin}</p>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Commentaires</Label>
        <p>{essai.commentaires}</p>
      </div>
    </div>
  );
}
