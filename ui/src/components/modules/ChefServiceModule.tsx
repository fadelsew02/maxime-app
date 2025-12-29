import { useState, useEffect } from 'react';
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Label } from '../ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { FileText, Download, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Textarea } from '../ui/textarea';
import { workflowApi } from '../../lib/workflowApi';

interface EssaiResult {
  essaiType: string;
  resultats: any;
  dateDebut: string;
  dateFin: string;
  dureeJours?: number;
}

interface EchantillonRapport {
  code: string;
  clientName: string;
  dateEnvoi: string;
  file: string;
  fileData: string;
  essais: EssaiResult[];
}

interface ClientGroupe {
  clientId: string;
  clientName: string;
  echantillons: EchantillonRapport[];
  dateEnvoi: string;
  file: string;
  fileData: string;
}

export function ChefServiceModule() {
  const [clients, setClients] = useState<ClientGroupe[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClient, setSelectedClient] = useState<ClientGroupe | null>(null);

  const loadRapports = async () => {
    setLoading(true);
    const clientsMap = new Map<string, ClientGroupe>();

    const workflows = await workflowApi.getByEtape('chef_service');
    console.log('Workflows chef_service:', workflows.length);
    
    for (const workflow of workflows) {
      const code = workflow.code_echantillon;
      const clientName = workflow.client_name || '-';
      const clientId = workflow.client_id || code;
      
      console.log(`Échantillon ${code}: clientId=${clientId}, clientName=${clientName}`);
      
      // Grouper par client_id
      if (!clientsMap.has(clientId)) {
        clientsMap.set(clientId, {
          clientId: clientId,
          clientName: clientName,
          echantillons: [],
          dateEnvoi: workflow.date_validation_chef_projet || new Date().toISOString(),
          file: workflow.file_name || '-',
          fileData: workflow.file_data || ''
        });
      }

      const essais: EssaiResult[] = [];
      try {
        const essaisResponse = await fetch(`https://snertp.onrender.com/api/essais/?echantillon_code=${code}&statut_validation=accepted`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
            'Content-Type': 'application/json',
          },
        });
        const essaisData = await essaisResponse.json();
        
        for (const essai of essaisData.results || []) {
          const dureesStandard: Record<string, number> = {
            AG: 5,
            Proctor: 5,
            CBR: 9,
            Oedometre: 18,
            Cisaillement: 4
          };
          
          let dateDebut = essai.date_debut || essai.date_reception || '-';
          let dateFin = essai.date_fin || essai.date_validation || '-';
          
          if (dateDebut === '-' && dateFin === '-' && workflow.date_validation_chef_projet) {
            try {
              const dateEnvoi = new Date(workflow.date_validation_chef_projet);
              const duree = dureesStandard[essai.type] || 5;
              dateFin = dateEnvoi.toISOString().split('T')[0];
              const debut = new Date(dateEnvoi);
              debut.setDate(debut.getDate() - duree);
              dateDebut = debut.toISOString().split('T')[0];
            } catch (e) {}
          }
          
          let dureeJours = undefined;
          if (dateDebut !== '-' && dateFin !== '-') {
            try {
              const debut = new Date(dateDebut);
              const fin = new Date(dateFin);
              dureeJours = Math.ceil((fin.getTime() - debut.getTime()) / (1000 * 60 * 60 * 24)) as any;
            } catch (e) {}
          }
          
          essais.push({
            essaiType: essai.type,
            resultats: essai.resultats || {},
            dateDebut,
            dateFin,
            dureeJours
          });
        }
      } catch (e) {}

      clientsMap.get(clientId)!.echantillons.push({
        code,
        clientName,
        dateEnvoi: workflow.date_validation_chef_projet || new Date().toISOString(),
        file: workflow.file_name || '-',
        fileData: workflow.file_data || '',
        essais
      });
    }

    setClients(Array.from(clientsMap.values()));
    setLoading(false);
  };

  useEffect(() => {
    loadRapports();
  }, []);

  return (
    <div className="p-8 bg-background">
      <div className="mb-8">
        <h1>Rapports reçus</h1>
        <p style={{ color: '#A9A9A9' }}>
          Échantillons envoyés par les chefs de projet
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Rapports en attente</CardTitle>
              <CardDescription>
                {clients.length} client(s) avec rapport(s) reçu(s)
              </CardDescription>
            </div>
            <Button onClick={loadRapports} disabled={loading}>
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
                Aucun rapport reçu
              </div>
            ) : (
              clients.map((client) => (
                <div
                  key={client.clientId}
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
                            style={{ backgroundColor: '#003366', color: '#FFFFFF' }}
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Détails du rapport - {selectedClient?.clientName}</DialogTitle>
            <DialogDescription>
              {selectedClient?.echantillons.length} échantillon(s) reçu(s)
            </DialogDescription>
          </DialogHeader>
          {selectedClient && (
            <ClientDetails client={selectedClient} onClose={() => setSelectedClient(null)} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ClientDetails({ client, onClose }: { client: ClientGroupe; onClose: () => void }) {
  const [selectedEchantillon, setSelectedEchantillon] = useState<EchantillonRapport | null>(null);

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

      <div className="pt-4 border-t">
        <h3 className="font-semibold mb-4">Échantillons ({client.echantillons.length})</h3>
        <div className="space-y-3">
          {client.echantillons.map((ech) => (
            <div key={ech.code} className="p-3 rounded-lg" style={{ backgroundColor: '#F5F5F5' }}>
              <div className="flex justify-between items-center">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-semibold">{ech.code}</span>
                    <Badge variant="outline" style={{ borderColor: '#28A745', color: '#28A745' }}>
                      {ech.essais.length} essai(s)
                    </Badge>
                  </div>
                </div>
                <Button size="sm" variant="outline" onClick={() => setSelectedEchantillon(ech)}>
                  Voir détails
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <ValidationSection client={client} onClose={onClose} />
    </div>
  );
}

function EchantillonDetails({ echantillon, onBack }: { echantillon: EchantillonRapport; onBack: () => void }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <Button variant="outline" size="sm" onClick={onBack}>← Retour</Button>
        <h3 className="font-semibold">Échantillon {echantillon.code}</h3>
      </div>

      <div className="space-y-2">
        <Label>Code échantillon</Label>
        <p>{echantillon.code}</p>
      </div>
      
      <div className="space-y-2">
        <Label>Client</Label>
        <p>{echantillon.clientName}</p>
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

      {echantillon.essais && echantillon.essais.length > 0 && (
        <div className="space-y-2">
          <Label>Essais réalisés</Label>
          <div className="space-y-2">
            {echantillon.essais.map((essai, index) => {
              const formatDate = (dateStr: string) => {
                if (!dateStr || dateStr === '-') return '-';
                try {
                  const date = new Date(dateStr);
                  return date.toLocaleDateString('fr-FR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                  });
                } catch (e) {
                  return dateStr;
                }
              };
              
              return (
                <div key={index} className="p-3 border rounded-lg" style={{ backgroundColor: '#F8F9FA' }}>
                  <div className="flex justify-between items-start mb-2">
                    <div className="font-semibold text-sm">{essai.essaiType}</div>
                    {essai.dureeJours !== undefined && (
                      <Badge variant="outline" style={{ fontSize: '10px' }}>
                        {essai.dureeJours} jour{essai.dureeJours > 1 ? 's' : ''}
                      </Badge>
                    )}
                  </div>
                  <div className="text-xs text-gray-600 space-y-1">
                    <p><strong>Date début:</strong> {formatDate(essai.dateDebut)}</p>
                    <p><strong>Date fin:</strong> {formatDate(essai.dateFin)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function ValidationSection({ client, onClose }: { client: ClientGroupe; onClose: () => void }) {
  const [comment, setComment] = useState('');
  const [validated, setValidated] = useState(false);
  const [isAccepted, setIsAccepted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const checkValidationStatus = async () => {
      let allValidated = true;
      let allAccepted = true;
      
      for (const echantillon of client.echantillons) {
        const workflow = await workflowApi.getByCode(echantillon.code);
        if (workflow) {
          if (workflow.etape_actuelle === 'chef_service') {
            allValidated = false;
          }
          if (workflow.etape_actuelle !== 'directeur_technique') {
            allAccepted = false;
          }
        }
      }
      
      setValidated(allValidated);
      setIsAccepted(allAccepted);
    };
    checkValidationStatus();
  }, [client.echantillons]);

  const handleAccept = async () => {
    setIsSubmitting(true);
    try {
      for (const echantillon of client.echantillons) {
        const workflow = await workflowApi.getByCode(echantillon.code);
        if (workflow?.id) {
          const success = await workflowApi.validerChefService(workflow.id, comment);
          if (!success) {
            toast.error(`Erreur lors de la validation de ${echantillon.code}`);
            setIsSubmitting(false);
            return;
          }
        }
      }
      setValidated(true);
      setIsAccepted(true);
      toast.success('Rapport accepté et envoyé au Directeur Technique');
      setTimeout(() => onClose(), 1000);
    } catch (error) {
      toast.error('Erreur lors de la validation');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!comment.trim()) {
      toast.error('Veuillez indiquer la raison du rejet');
      return;
    }

    setIsSubmitting(true);
    try {
      for (const echantillon of client.echantillons) {
        const workflow = await workflowApi.getByCode(echantillon.code);
        if (workflow?.id) {
          const success = await workflowApi.rejeterChefService(workflow.id, comment);
          if (!success) {
            toast.error(`Erreur lors du rejet de ${echantillon.code}`);
            setIsSubmitting(false);
            return;
          }
        }
      }
      setValidated(true);
      toast.success('Rapport rejeté et renvoyé au responsable traitement');
      setTimeout(() => onClose(), 1000);
    } catch (error) {
      toast.error('Erreur lors du rejet');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 pt-4 border-t">
      <h3 className="font-semibold">Validation du rapport</h3>
      
      {validated && isAccepted ? (
        <div className="flex items-center gap-2 p-4 rounded-lg" style={{ backgroundColor: '#28A745' + '20' }}>
          <CheckCircle className="h-6 w-6" style={{ color: '#28A745' }} />
          <span className="font-semibold" style={{ color: '#28A745' }}>Rapport validé</span>
        </div>
      ) : validated ? (
        <div className="flex items-center gap-2 p-4 rounded-lg" style={{ backgroundColor: '#DC3545' + '20' }}>
          <XCircle className="h-6 w-6" style={{ color: '#DC3545' }} />
          <span className="font-semibold" style={{ color: '#DC3545' }}>Rapport rejeté</span>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            <Label>Commentaire</Label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Ajouter un commentaire (obligatoire en cas de rejet)..."
              rows={3}
              disabled={validated || isSubmitting}
            />
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleAccept}
              disabled={validated || isSubmitting}
              style={{ 
                backgroundColor: validated ? '#6C757D' : '#28A745', 
                color: '#FFFFFF',
                opacity: validated ? 0.5 : 1
              }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Traitement...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Accepter le rapport
                </>
              )}
            </Button>
            <Button
              onClick={handleReject}
              disabled={validated || isSubmitting}
              style={{ 
                backgroundColor: validated ? '#6C757D' : '#DC3545', 
                color: '#FFFFFF',
                opacity: validated ? 0.5 : 1
              }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Traitement...
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 mr-2" />
                  Rejeter le rapport
                </>
              )}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
