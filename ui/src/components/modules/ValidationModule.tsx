import { useState, useEffect } from 'react';
import { UserRole } from '../../App';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { CheckCircle, XCircle, FileText, AlertCircle, Loader2, Download } from 'lucide-react';
import { toast } from 'sonner';
import { workflowApi } from '../../lib/workflowApi';

interface ValidationModuleProps {
  userRole: UserRole;
}

interface EssaiResult {
  essaiType: string;
  resultats: any;
  dateDebut: string;
  dateFin: string;
}

interface RapportValidation {
  code: string;
  clientName: string;
  file: string;
  fileData: string;
  essais: EssaiResult[];
  dateEnvoi: string;
  commentChefService?: string;
}

interface ClientGroupe {
  clientId: string;
  clientName: string;
  rapports: RapportValidation[];
  dateEnvoi: string;
  file: string;
  fileData: string;
  commentChefService?: string;
}

export function ValidationModule({ userRole }: ValidationModuleProps) {
  const [clients, setClients] = useState<ClientGroupe[]>([]);
  const [rapportsValides, setRapportsValides] = useState<RapportValidation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClient, setSelectedClient] = useState<ClientGroupe | null>(null);
  const [observations, setObservations] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadRapports = async () => {
    setLoading(true);
    const clientsMap = new Map<string, ClientGroupe>();
    const valides: RapportValidation[] = [];

    if (userRole === 'directeur_technique') {
      const workflows = await workflowApi.getByEtape('directeur_technique');
      console.log('Workflows directeur_technique:', workflows.length);
      
      for (const workflow of workflows) {
        const code = workflow.code_echantillon;
        const clientName = workflow.client_name || '-';
        const clientId = workflow.client_id || code;
        
        if (!clientsMap.has(clientId)) {
          clientsMap.set(clientId, {
            clientId,
            clientName,
            rapports: [],
            dateEnvoi: workflow.date_validation_chef_service || new Date().toISOString(),
            file: workflow.file_name || '-',
            fileData: workflow.file_data || '',
            commentChefService: workflow.commentaire_chef_service
          });
        }
        
        clientsMap.get(clientId)!.rapports.push({
          code,
          clientName,
          file: workflow.file_name || '-',
          fileData: workflow.file_data || '',
          essais: [],
          dateEnvoi: workflow.date_validation_chef_service || new Date().toISOString(),
          commentChefService: workflow.commentaire_chef_service
        });
      }
      
      // Charger les rapports validés
      try {
        const response = await fetch('https://snertp.onrender.com/api/workflows/', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
            'Content-Type': 'application/json',
          },
        });
        const data = await response.json();
        const allWorkflows = data.results || [];
        for (const workflow of allWorkflows) {
          if (workflow.date_validation_directeur_technique && workflow.etape_actuelle === 'directeur_snertp') {
            valides.push({
              code: workflow.code_echantillon,
              clientName: workflow.client_name || '-',
              file: workflow.file_name || '-',
              fileData: workflow.file_data || '',
              essais: [],
              dateEnvoi: workflow.date_validation_directeur_technique,
              commentChefService: workflow.commentaire_directeur_technique
            });
          }
        }
      } catch (e) {
        console.error('Erreur chargement workflows validés:', e);
      }
    }
    
    if (userRole === 'directeur_snertp') {
      const workflows = await workflowApi.getByEtape('directeur_snertp');
      for (const workflow of workflows) {
        const code = workflow.code_echantillon;
        const clientName = workflow.client_name || '-';
        const clientId = workflow.client_id || code;
        
        if (!clientsMap.has(clientId)) {
          clientsMap.set(clientId, {
            clientId,
            clientName,
            rapports: [],
            dateEnvoi: workflow.date_validation_directeur_technique || new Date().toISOString(),
            file: workflow.file_name || '-',
            fileData: workflow.file_data || '',
            commentChefService: workflow.commentaire_directeur_technique
          });
        }
        
        clientsMap.get(clientId)!.rapports.push({
          code,
          clientName,
          file: workflow.file_name || '-',
          fileData: workflow.file_data || '',
          essais: [],
          dateEnvoi: workflow.date_validation_directeur_technique || new Date().toISOString(),
          commentChefService: workflow.commentaire_directeur_technique
        });
      }
    }

    setClients(Array.from(clientsMap.values()));
    setRapportsValides(valides);
    setLoading(false);
  };

  useEffect(() => {
    loadRapports();
  }, [userRole]);

  const getRoleLabel = () => {
    const labels: Record<string, string> = {
      chef_projet: 'Chef de Projet',
      chef_service: 'Chef Service Génie Civil',
      directeur_technique: 'Directeur Technique',
      directeur_snertp: 'Directeur SNERTP',
      directeur_general: 'Directeur Général',
    };
    return labels[userRole] || 'Validateur';
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1>Module Validation</h1>
        <p style={{ color: '#A9A9A9' }}>
          Niveau: {getRoleLabel()}
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Rapports en attente de validation</CardTitle>
              <CardDescription>
                {clients.length} client(s) avec rapport(s) à valider
              </CardDescription>
            </div>
            <Button onClick={loadRapports} disabled={loading}>
              {loading ? 'Chargement...' : 'Actualiser'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {loading ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                <p className="mt-2 text-gray-500">Chargement...</p>
              </div>
            ) : clients.length === 0 ? (
              <div className="text-center py-12" style={{ color: '#A9A9A9' }}>
                Aucun rapport en attente de validation
              </div>
            ) : (
              clients.map((client) => (
                <div key={client.clientId} className="space-y-4">
                  <div className="p-4 rounded-lg" style={{ backgroundColor: '#F5F5F5' }}>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <span className="font-semibold text-lg">{client.clientName}</span>
                          <Badge variant="outline" style={{ borderColor: '#FFC107', color: '#FFC107' }}>
                            <AlertCircle className="h-3 w-3 mr-1" />
                            {client.rapports.length} rapport(s)
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                          <div>
                            <Label>Date réception</Label>
                            <p>{new Date(client.dateEnvoi).toLocaleString('fr-FR', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}</p>
                          </div>
                          <div>
                            <Label>Fichier rapport</Label>
                            <p>{client.file}</p>
                          </div>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          {client.rapports.map((rapport) => (
                            <Badge 
                              key={rapport.code}
                              style={{ backgroundColor: '#003366', color: '#FFFFFF' }}
                            >
                              {rapport.code}
                            </Badge>
                          ))}
                        </div>
                        {client.commentChefService && (
                          <div className="mt-3 p-2 rounded" style={{ backgroundColor: '#E3F2FD' }}>
                            <Label className="text-xs">Commentaire Chef Service:</Label>
                            <p className="text-sm">{client.commentChefService}</p>
                          </div>
                        )}
                      </div>
                      <Button
                        size="sm"
                        onClick={() => setSelectedClient(client)}
                        style={{ backgroundColor: '#003366' }}
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Examiner
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {rapportsValides.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Rapports validés</CardTitle>
            <CardDescription>
              {rapportsValides.length} rapport(s) validé(s)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {rapportsValides.map((rapport) => (
                <div key={rapport.code} className="p-4 rounded-lg" style={{ backgroundColor: '#E8F5E9' }}>
                  <div className="flex items-center gap-3">
                    <Badge style={{ backgroundColor: '#28A745', color: '#FFFFFF' }}>
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Validé
                    </Badge>
                    <Badge style={{ backgroundColor: '#003366', color: '#FFFFFF' }}>
                      {rapport.code}
                    </Badge>
                    <span className="text-sm text-gray-600">
                      {new Date(rapport.dateEnvoi).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={!!selectedClient} onOpenChange={() => setSelectedClient(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Validation du rapport - {selectedClient?.clientName}</DialogTitle>
            <DialogDescription>
              Niveau: {getRoleLabel()}
            </DialogDescription>
          </DialogHeader>
          {selectedClient && (
            <ClientValidation 
              client={selectedClient} 
              userRole={userRole}
              onClose={() => {
                setSelectedClient(null);
                loadRapports();
              }} 
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ClientValidation({ client, userRole, onClose }: { client: ClientGroupe; userRole: UserRole; onClose: () => void }) {
  const [observations, setObservations] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleValidation = async (action: 'valide' | 'rejete') => {
    setIsSubmitting(true);
    try {
      for (const rapport of client.rapports) {
        const workflow = await workflowApi.getByCode(rapport.code);
        if (!workflow?.id) {
          toast.error(`Workflow introuvable pour ${rapport.code}`);
          continue;
        }

        let success = false;
        if (action === 'valide') {
          if (userRole === 'directeur_technique') {
            success = await workflowApi.validerDirecteurTechnique(workflow.id, observations);
          }
        } else {
          if (userRole === 'directeur_technique') {
            success = await workflowApi.rejeterDirecteurTechnique(workflow.id, observations);
          }
        }

        if (!success) {
          toast.error(`Erreur lors de la validation de ${rapport.code}`);
          setIsSubmitting(false);
          return;
        }
      }

      if (action === 'valide') {
        toast.success('Tous les rapports validés et transférés au niveau suivant');
      } else {
        toast.error('Tous les rapports rejetés');
      }
      
      onClose();
    } catch (error) {
      toast.error('Erreur lors de la validation');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="p-4 rounded-lg" style={{ backgroundColor: '#F5F5F5' }}>
        <h3 className="font-semibold mb-3">Informations</h3>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <Label>Client</Label>
            <p className="font-semibold">{client.clientName}</p>
          </div>
          <div>
            <Label>Nombre de rapports</Label>
            <p>{client.rapports.length}</p>
          </div>
          <div>
            <Label>Date réception</Label>
            <p>{new Date(client.dateEnvoi).toLocaleString('fr-FR', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}</p>
          </div>
          <div>
            <Label>Fichier rapport</Label>
            <p>{client.file}</p>
          </div>
        </div>
      </div>

      {client.commentChefService && (
        <div className="p-4 rounded-lg" style={{ backgroundColor: '#E3F2FD' }}>
          <h3 className="font-semibold mb-2">Commentaire du Chef Service</h3>
          <p className="text-sm">{client.commentChefService}</p>
        </div>
      )}

      <div className="space-y-2">
        <Label>Échantillons ({client.rapports.length})</Label>
        <div className="flex gap-2 flex-wrap">
          {client.rapports.map((rapport) => (
            <Badge 
              key={rapport.code}
              style={{ backgroundColor: '#003366', color: '#FFFFFF' }}
            >
              {rapport.code}
            </Badge>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Rapport technique</Label>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (client.fileData) {
                try {
                  if (client.fileData.startsWith('http')) {
                    window.open(client.fileData, '_blank');
                  } else if (client.fileData.startsWith('data:')) {
                    const newWindow = window.open();
                    if (newWindow) {
                      newWindow.document.write(`
                        <html>
                          <head>
                            <title>Rapport - ${client.clientName}</title>
                            <style>body { margin: 0; }</style>
                          </head>
                          <body>
                            <embed src="${client.fileData}" type="application/pdf" width="100%" height="100%" />
                          </body>
                        </html>
                      `);
                      newWindow.document.close();
                    }
                  } else {
                    toast.warning('Format de fichier non reconnu');
                  }
                } catch (error) {
                  toast.error('Erreur lors de l\'ouverture du rapport');
                }
              } else {
                toast.error('Fichier non disponible');
              }
            }}
          >
            <FileText className="h-3 w-3 mr-1" />
            Ouvrir le rapport
          </Button>
          {client.fileData && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                try {
                  const link = document.createElement('a');
                  link.href = client.fileData;
                  link.download = client.file || 'rapport.pdf';
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  toast.success('Téléchargement démarré');
                } catch (error) {
                  toast.error('Erreur lors du téléchargement');
                }
              }}
            >
              <Download className="h-3 w-3 mr-1" />
              Télécharger
            </Button>
          )}
        </div>
        {!client.fileData ? (
          <p className="text-sm text-red-500 mt-2">⚠️ Aucun fichier disponible</p>
        ) : (
          <p className="text-sm text-gray-500 mt-2">✓ Fichier disponible: {client.file}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="observations">Observations</Label>
        <Textarea
          id="observations"
          value={observations}
          onChange={(e) => setObservations(e.target.value)}
          placeholder="Ajouter des observations ou remarques..."
          rows={4}
          disabled={isSubmitting}
        />
      </div>

      <div className="flex gap-3 justify-end">
        <Button
          variant="destructive"
          onClick={() => handleValidation('rejete')}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Traitement...
            </>
          ) : (
            <>
              <XCircle className="h-4 w-4 mr-2" />
              Rejeter
            </>
          )}
        </Button>
        <Button
          style={{ backgroundColor: '#28A745', color: '#FFFFFF' }}
          onClick={() => handleValidation('valide')}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Traitement...
            </>
          ) : (
            <>
              <CheckCircle className="h-4 w-4 mr-2" />
              Valider
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
