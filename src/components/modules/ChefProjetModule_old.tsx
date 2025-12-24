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
import mammoth from 'mammoth';
import { workflowApi, WorkflowData } from '../../lib/workflowApi';

function EchantillonBadge({ code, essaisCount }: { code: string; essaisCount: number }) {
  const [status, setStatus] = React.useState<'loading' | 'sent' | 'pending'>('loading');

  React.useEffect(() => {
    const checkStatus = async () => {
      const workflow = await workflowApi.getByCode(code);
      if (workflow?.validation_chef_projet) {
        setStatus('sent');
      } else {
        setStatus('pending');
      }
    };
    checkStatus();
  }, [code]);

  if (status === 'loading') return null;

  return status === 'sent' ? (
    <Badge style={{ backgroundColor: '#003366', color: '#FFFFFF' }}>
      Envoyé au chef GC
    </Badge>
  ) : (
    <Badge variant="outline" style={{ borderColor: '#28A745', color: '#28A745' }}>
      {essaisCount} essai(s) accepté(s)
    </Badge>
  );
}

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
}

interface EchantillonGroupe {
  code: string;
  dateEnvoi: string;
  file: string;
  clientName: string;
  essais: EssaiChefProjet[];
}

interface ClientGroupe {
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

    const workflows = await workflowApi.getByEtape('chef_projet');
    const workflowsActifs = workflows.filter(w => !w.rejet_chef_projet && !w.validation_chef_projet);
    
    for (const workflow of workflowsActifs) {
      const code = workflow.code_echantillon;
      let clientName = workflow.client_name || '-';
      
      try {
        const response = await fetch(`http://127.0.0.1:8000/api/echantillons/?code=${code}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
            'Content-Type': 'application/json',
          },
        });
        const apiData = await response.json();
        const echantillon = apiData.results?.[0];
        if (echantillon?.client_nom) {
          clientName = echantillon.client_nom;
        }
      } catch (e) {
        console.error('Erreur récupération client:', e);
      }
      
      if (!clientsMap.has(clientName)) {
        clientsMap.set(clientName, {
          clientName,
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
          const essaisAcceptes = (essaisData.results || []).filter((e: any) => 
            e.statut === 'termine' && e.statut_validation === 'accepted'
          );
          
          essaisAcceptes.forEach((essai: any) => {
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
              validationDate: essai.date_validation || '-'
            });
          });
        }
      } catch (e) {
        console.error('Erreur chargement essais:', e);
      }
      
      clientsMap.get(clientName)!.echantillons.push(echantillonGroupe);
    }

    const finalClients = Array.from(clientsMap.values());
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
              <CardTitle>Clients reçus</CardTitle>
              <CardDescription>
                {clients.length} client(s) en attente de validation
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
                <p className="text-xs mt-2">Les rapports envoyés depuis le module traitement apparaissent ici</p>
              </div>
            ) : (
              clients.map((client) => (
                <div
                  key={client.clientName}
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

function ObservationsTraitement({ code }: { code: string }) {
  const [observations, setObservations] = React.useState<string>('');
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const loadObservations = async () => {
      const workflow = await workflowApi.getByCode(code);
      if (workflow?.observations_traitement) {
        setObservations(workflow.observations_traitement);
      }
      setLoading(false);
    };
    loadObservations();
  }, [code]);

  if (loading) return null;
  if (!observations) return null;

  return (
    <div className="space-y-2">
      <Label>Observations du responsable traitement</Label>
      <div className="p-3 rounded-md" style={{ backgroundColor: '#F5F5F5', border: '1px solid #E0E0E0' }}>
        <p className="text-sm whitespace-pre-wrap">{observations}</p>
      </div>
    </div>
  );
}

function EchantillonDetails({ echantillon, onClose }: { echantillon: EchantillonGroupe; onClose: () => void }) {
  const [selectedEssai, setSelectedEssai] = useState<EssaiChefProjet | null>(null);
  const [showDocument, setShowDocument] = useState(false);
  const [documentHtml, setDocumentHtml] = useState('');
  const [workflowStatus, setWorkflowStatus] = useState<{
    isValidated: boolean;
    isSentToChefService: boolean;
  }>({ isValidated: false, isSentToChefService: false });
  const [clientEchantillons, setClientEchantillons] = useState<any[]>([]);
  const [rapportFile, setRapportFile] = useState<{ name: string; data: string } | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const workflow = await workflowApi.getByCode(echantillon.code);
        console.log('Workflow chargé:', workflow);
        
        if (workflow) {
          setWorkflowStatus({
            isValidated: !!workflow.validation_chef_projet,
            isSentToChefService: workflow.etape_actuelle === 'chef_service'
          });
          
          if (workflow.file_name && workflow.file_data) {
            console.log('Fichier trouvé:', workflow.file_name);
            setRapportFile({ name: workflow.file_name, data: workflow.file_data });
          }
        }
        
        const echResponse = await fetch(`http://127.0.0.1:8000/api/echantillons/?code=${echantillon.code}`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` },
        });
        const echData = await echResponse.json();
        const currentEch = echData.results?.[0];
        console.log('Échantillon actuel:', currentEch);
        
        if (currentEch?.client_nom) {
          const clientEchResponse = await fetch(`http://127.0.0.1:8000/api/echantillons/?client_nom=${encodeURIComponent(currentEch.client_nom)}`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` },
          });
          const clientEchData = await clientEchResponse.json();
          console.log('Échantillons du client:', clientEchData.results);
          setClientEchantillons(clientEchData.results || []);
        }
      } catch (error) {
        console.error('Erreur chargement données:', error);
      }
    };
    loadData();
  }, [echantillon.code]);

  if (selectedEssai) {
    return <EssaiDetails essai={selectedEssai} onBack={() => setSelectedEssai(null)} />;
  }
  
  if (showDocument) {
    return (
      <div className="space-y-4">
        <Button variant="outline" size="sm" onClick={() => setShowDocument(false)}>
          ← Retour
        </Button>
        <div 
          style={{ 
            width: '100%', 
            height: '600px', 
            overflow: 'auto',
            padding: '20px',
            backgroundColor: 'white',
            border: '1px solid #ddd'
          }}
          dangerouslySetInnerHTML={{ __html: documentHtml }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Code échantillon</Label>
        <p>{echantillon.code}</p>
      </div>
      <div className="space-y-2">
        <Label>Date de réception</Label>
        <p>{new Date(echantillon.dateEnvoi).toLocaleString('fr-FR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })}</p>
      </div>
      <div className="space-y-2 pt-4 border-t">
        <Label>Fichier rapport de traitement</Label>
        {rapportFile ? (
          <Button variant="outline" size="sm" onClick={() => {
            const link = document.createElement('a');
            link.href = rapportFile.data;
            link.download = rapportFile.name;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            toast.success(`Téléchargement de ${rapportFile.name}`);
          }}>
            <Download className="h-4 w-4 mr-2" />
            {rapportFile.name}
          </Button>
        ) : (
          <p className="text-sm text-gray-500">Aucun fichier disponible</p>
        )}
      </div>
      
      <div className="space-y-2 pt-4 border-t">
        <Label>Tous les échantillons du client ({echantillon.clientName})</Label>
        {clientEchantillons.length > 0 ? (
          <div className="space-y-2 max-h-60 overflow-y-auto p-2 rounded" style={{ backgroundColor: '#FAFAFA' }}>
            {clientEchantillons.map((ech) => (
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
        ) : (
          <p className="text-sm text-gray-500">Chargement des échantillons...</p>
        )}
      </div>

      <ObservationsTraitement code={echantillon.code} />

      {workflowStatus.isValidated && (
        <div className="flex items-center gap-2 p-4 rounded-lg" style={{ backgroundColor: '#003366' + '20' }}>
          <CheckCircle className="h-6 w-6" style={{ color: '#003366' }} />
          <span className="font-semibold" style={{ color: '#003366' }}>Envoyé au Chef GC</span>
        </div>
      )}

      <div>
        <h3 className="font-semibold mb-4">Essais acceptés</h3>
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

      <RapportValidation echantillon={echantillon} onClose={onClose} workflowStatus={workflowStatus} onStatusChange={setWorkflowStatus} />
    </div>
  );
}

function RapportValidation({ echantillon, onClose, workflowStatus, onStatusChange }: { 
  echantillon: EchantillonGroupe; 
  onClose: () => void;
  workflowStatus: { isValidated: boolean; isSentToChefService: boolean };
  onStatusChange: (status: { isValidated: boolean; isSentToChefService: boolean }) => void;
}) {
  const [rejectionReason, setRejectionReason] = useState('');
  const [validated, setValidated] = useState(false);
  const [isAccepted, setIsAccepted] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkStatus = async () => {
      const workflow = await workflowApi.getByCode(echantillon.code);
      if (workflow) {
        if (workflow.validation_chef_projet) {
          setValidated(true);
          setIsAccepted(true);
        } else if (workflow.rejet_chef_projet) {
          setValidated(true);
          setIsAccepted(false);
        }
      }
      setLoading(false);
    };
    checkStatus();
  }, [echantillon.code]);

  const handleAccept = async () => {
    const workflow = await workflowApi.getByCode(echantillon.code);
    if (workflow?.id) {
      const success = await workflowApi.validerChefProjet(workflow.id, '');
      if (success) {
        setValidated(true);
        setIsAccepted(true);
        onStatusChange({ isValidated: true, isSentToChefService: false });
        toast.success('Rapport accepté et envoyé au chef GC');
      } else {
        toast.error('Erreur lors de la validation');
      }
    } else {
      toast.error('Workflow introuvable');
    }
  };

  const handleSendToChefService = async () => {
    const workflow = await workflowApi.getByCode(echantillon.code);
    if (workflow?.id) {
      try {
        const response = await fetch(`http://127.0.0.1:8000/api/workflows/${workflow.id}/`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ etape_actuelle: 'chef_service' })
        });
        if (response.ok) {
          onStatusChange({ isValidated: true, isSentToChefService: true });
          toast.success('Rapport envoyé au chef service');
        } else {
          toast.error('Erreur lors de l\'envoi');
        }
      } catch (error) {
        toast.error('Erreur de connexion');
      }
    } else {
      toast.error('Workflow introuvable');
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast.error('Veuillez indiquer la raison du rejet');
      return;
    }

    const workflow = await workflowApi.getByCode(echantillon.code);
    if (workflow?.id) {
      const success = await workflowApi.rejeterChefProjet(workflow.id, rejectionReason);
      if (success) {
        setValidated(true);
        setIsAccepted(false);
        toast.success('Rapport rejeté et renvoyé au traitement');
        setTimeout(() => {
          onClose();
          window.location.reload();
        }, 1000);
      } else {
        toast.error('Erreur lors du rejet');
      }
    } else {
      toast.error('Workflow introuvable');
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 pt-4 border-t">
        <h3 className="font-semibold">Validation du rapport</h3>
        <div className="text-center py-4">
          <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 pt-4 border-t">
      <h3 className="font-semibold">Validation du rapport</h3>
      
      {workflowStatus.isSentToChefService ? (
        <div className="flex items-center gap-2 p-4 rounded-lg" style={{ backgroundColor: '#17A2B8' + '20' }}>
          <CheckCircle className="h-6 w-6" style={{ color: '#17A2B8' }} />
          <span className="font-semibold" style={{ color: '#17A2B8' }}>Envoyé au chef service</span>
        </div>
      ) : workflowStatus.isValidated ? (
        <Button
          onClick={handleSendToChefService}
          style={{ backgroundColor: '#003366', color: '#FFFFFF' }}
          className="w-full"
        >
          <CheckCircle className="h-4 w-4 mr-2" />
          Envoyer au chef service
        </Button>
      ) : (
        <>
          <div className="space-y-2">
            <Label>Raison du rejet (optionnel si accepté)</Label>
            <Textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Indiquer la raison du rejet..."
              rows={3}
              disabled={validated}
            />
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleAccept}
              disabled={validated}
              style={{ 
                backgroundColor: validated ? '#6C757D' : '#28A745', 
                color: '#FFFFFF',
                opacity: validated ? 0.5 : 1
              }}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Accepter le rapport
            </Button>
            <Button
              onClick={handleReject}
              disabled={validated}
              style={{ 
                backgroundColor: validated ? '#6C757D' : '#DC3545', 
                color: '#FFFFFF',
                opacity: validated ? 0.5 : 1
              }}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Rejeter le rapport
            </Button>
          </div>
        </>
      )}
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
          <Label>Date réception</Label>
          <p>{essai.dateReception}</p>
        </div>
        <div className="space-y-2">
          <Label>Opérateur</Label>
          <p>{essai.operateur}</p>
        </div>
        <div className="space-y-2">
          <Label>Date début</Label>
          <p>{essai.dateDebut}</p>
        </div>
        <div className="space-y-2">
          <Label>Date fin</Label>
          <p>{essai.dateFin}</p>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="font-semibold">Résultats</h3>
        
        {essai.essaiType === 'AG' && essai.resultats && (
          <>
            <div className="space-y-2">
              <Label>% passant à 2mm</Label>
              <p>{essai.resultats.pourcent_inf_2mm}</p>
            </div>
            <div className="space-y-2">
              <Label>% passant à 80µm</Label>
              <p>{essai.resultats.pourcent_inf_80um}</p>
            </div>
            <div className="space-y-2">
              <Label>Coefficient d'uniformité (Cu)</Label>
              <p>{essai.resultats.coefficient_uniformite}</p>
            </div>
          </>
        )}

        {essai.essaiType === 'Proctor' && essai.resultats && (
          <>
            <div className="space-y-2">
              <Label>Type Proctor</Label>
              <p>{essai.resultats.type_proctor}</p>
            </div>
            <div className="space-y-2">
              <Label>Densité sèche optimale (g/cm³)</Label>
              <p>{essai.resultats.densite_opt}</p>
            </div>
            <div className="space-y-2">
              <Label>Teneur en eau optimale (%)</Label>
              <p>{essai.resultats.teneur_eau_opt}</p>
            </div>
          </>
        )}

        {essai.essaiType === 'CBR' && essai.resultats && (
          <>
            <div className="space-y-2">
              <Label>CBR à 95% OPM (%)</Label>
              <p>{essai.resultats.cbr_95}</p>
            </div>
            <div className="space-y-2">
              <Label>CBR à 98% OPM (%)</Label>
              <p>{essai.resultats.cbr_98}</p>
            </div>
            <div className="space-y-2">
              <Label>CBR à 100% OPM (%)</Label>
              <p>{essai.resultats.cbr_100}</p>
            </div>
            <div className="space-y-2">
              <Label>Gonflement (%)</Label>
              <p>{essai.resultats.gonflement}</p>
            </div>
          </>
        )}

        {essai.essaiType === 'Oedometre' && essai.resultats && (
          <>
            <div className="space-y-2">
              <Label>Indice de compression (Cc)</Label>
              <p>{essai.resultats.cc}</p>
            </div>
            <div className="space-y-2">
              <Label>Indice de gonflement (Cs)</Label>
              <p>{essai.resultats.cs}</p>
            </div>
            <div className="space-y-2">
              <Label>Contrainte de préconsolidation (kPa)</Label>
              <p>{essai.resultats.gp}</p>
            </div>
          </>
        )}

        {essai.essaiType === 'Cisaillement' && essai.resultats && (
          <>
            <div className="space-y-2">
              <Label>Cohésion (kPa)</Label>
              <p>{essai.resultats.cohesion}</p>
            </div>
            <div className="space-y-2">
              <Label>Angle de frottement φ (°)</Label>
              <p>{essai.resultats.phi}</p>
            </div>
          </>
        )}

        <div className="space-y-2">
          <Label>Commentaires</Label>
          <p>{essai.commentaires}</p>
        </div>

        {essai.fichier && essai.fichier !== '-' && (
          <div className="space-y-2">
            <Label>Fichier</Label>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (essai.fichierData) {
                  const link = document.createElement('a');
                  link.href = essai.fichierData;
                  link.download = essai.fichier;
                  link.click();
                } 
              }}
            >
              <FileText className="h-3 w-3 mr-1" />
              {essai.fichier}
            </Button>
          </div>
        )}
      </div>

      <div className="space-y-4 pt-4 border-t">
        <h3 className="font-semibold">Validation</h3>
        <div className="space-y-2">
          <Label>Date de validation</Label>
          <p>{essai.validationDate ? (
            typeof essai.validationDate === 'string' && essai.validationDate.includes('T') 
              ? new Date(essai.validationDate).toLocaleString('fr-FR', { 
                  day: '2-digit', 
                  month: '2-digit', 
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })
              : essai.validationDate
          ) : '-'}</p>
        </div>
        <div className="space-y-2">
          <Label>Commentaire de validation</Label>
          <p>{essai.validationComment}</p>
        </div>
        <div className="space-y-2">
          <Label>Statut</Label>
          <Badge style={{ backgroundColor: '#28A745', color: '#FFFFFF' }}>
            Accepté ✓
          </Badge>
        </div>
      </div>
    </div>
  );
}
