import { useState, useEffect } from 'react';
import { UserRole } from '../../App';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { CheckCircle, XCircle, FileText, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { getEchantillons, getClient, getEssaisByEchantillon, updateEchantillon, Echantillon } from '../../lib/mockData';
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

export function ValidationModule({ userRole }: ValidationModuleProps) {
  const [rapportsValidation, setRapportsValidation] = useState<RapportValidation[]>([]);
  const [rapportsValides, setRapportsValides] = useState<RapportValidation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRapport, setSelectedRapport] = useState<RapportValidation | null>(null);
  const [observations, setObservations] = useState('');

  const loadRapports = async () => {
    setLoading(true);
    const rapports: RapportValidation[] = [];
    const valides: RapportValidation[] = [];

    if (userRole === 'directeur_technique') {
      const workflows = await workflowApi.getByEtape('directeur_technique');
      console.log('Workflows directeur_technique:', workflows.length, workflows);
      for (const workflow of workflows) {
        rapports.push({
          code: workflow.code_echantillon,
          clientName: '-',
          file: workflow.file_name || '-',
          fileData: workflow.file_data || '',
          essais: [],
          dateEnvoi: workflow.date_validation_chef_service || new Date().toISOString(),
          commentChefService: workflow.commentaire_chef_service
        });
      }
      
      try {
        const response = await fetch('http://127.0.0.1:8000/api/workflows/', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
            'Content-Type': 'application/json',
          },
        });
        const data = await response.json();
        const allWorkflows = data.results || [];
        console.log('Tous les workflows:', allWorkflows.length);
        for (const workflow of allWorkflows) {
          if (workflow.date_validation_directeur_technique && workflow.etape_actuelle === 'directeur_snertp') {
            valides.push({
              code: workflow.code_echantillon,
              clientName: '-',
              file: workflow.file_name || '-',
              fileData: workflow.file_data || '',
              essais: [],
              dateEnvoi: workflow.date_validation_directeur_technique,
              commentChefService: workflow.commentaire_directeur_technique
            });
          }
        }
        console.log('Rapports validés trouvés:', valides.length);
      } catch (e) {
        console.error('Erreur chargement workflows validés:', e);
      }
    }
    
    if (userRole === 'directeur_snertp') {
      const workflows = await workflowApi.getByEtape('directeur_snertp');
      for (const workflow of workflows) {
        rapports.push({
          code: workflow.code_echantillon,
          clientName: '-',
          file: workflow.file_name || '-',
          fileData: workflow.file_data || '',
          essais: [],
          dateEnvoi: workflow.date_validation_directeur_technique || new Date().toISOString(),
          commentChefService: workflow.commentaire_directeur_technique
        });
      }
      
      try {
        const response = await fetch('http://127.0.0.1:8000/api/workflows/', {
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
              clientName: '-',
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

    setRapportsValidation(rapports);
    setRapportsValides(valides);
    setLoading(false);
  };

  useEffect(() => {
    loadRapports();
  }, [userRole]);

  // Grouper les rapports par client
  const rapportsParClient = rapportsValidation.reduce((acc, rapport) => {
    const client = rapport.clientName || 'Non spécifié';
    if (!acc[client]) {
      acc[client] = [];
    }
    acc[client].push(rapport);
    return acc;
  }, {} as Record<string, RapportValidation[]>);

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

  const getNextRole = () => {
    const hierarchy = ['chef_projet', 'chef_service', 'directeur_technique', 'directeur_general'];
    const currentIndex = hierarchy.indexOf(userRole);
    return currentIndex < hierarchy.length - 1 ? hierarchy[currentIndex + 1] : null;
  };

  const handleValidation = async (code: string, action: 'valide' | 'rejete') => {
    const workflow = await workflowApi.getByCode(code);
    if (!workflow?.id) return;

    let success = false;
    if (action === 'valide') {
      if (userRole === 'directeur_technique') {
        success = await workflowApi.validerDirecteurTechnique(workflow.id, observations);
      }
      if (success) {
        toast.success('Rapport validé et transféré au niveau suivant', {
          description: observations || 'Aucune observation',
        });
      }
    } else {
      if (userRole === 'directeur_technique') {
        success = await workflowApi.rejeterDirecteurTechnique(workflow.id, observations);
      }
      if (success) {
        toast.error('Rapport rejeté', {
          description: observations || 'Aucune observation',
        });
      }
    }

    if (!success) {
      toast.error('Erreur lors de la validation');
    }

    setSelectedRapport(null);
    setObservations('');
    loadRapports();
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
                {rapportsValidation.length} rapport(s) à valider
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
            ) : Object.keys(rapportsParClient).length === 0 ? (
              <div className="text-center py-12" style={{ color: '#A9A9A9' }}>
                Aucun rapport en attente de validation
              </div>
            ) : (
              Object.entries(rapportsParClient).map(([client, rapportsClient]) => (
                <div key={client} className="space-y-4">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold" style={{ color: '#003366' }}>
                      Client: {client}
                    </h3>
                    <Badge variant="outline">
                      {rapportsClient.length} rapport(s)
                    </Badge>
                  </div>

                  <div className="space-y-4 pl-4 border-l-2" style={{ borderColor: '#003366' }}>
                    {rapportsClient.map((rapport) => (
                      <div
                        key={rapport.code}
                        className="p-4 rounded-lg"
                        style={{ backgroundColor: '#F5F5F5' }}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <Badge
                                style={{ backgroundColor: '#FFC107', color: '#FFFFFF' }}
                              >
                                <AlertCircle className="h-3 w-3 mr-1" />
                                En attente
                              </Badge>
                              <Badge style={{ backgroundColor: '#003366', color: '#FFFFFF' }}>
                                {rapport.code}
                              </Badge>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <Label>Date réception</Label>
                                <p>{new Date(rapport.dateEnvoi).toLocaleString('fr-FR', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}</p>
                              </div>
                              <div>
                                <Label>Fichier rapport</Label>
                                <p>{rapport.file}</p>
                              </div>
                            </div>
                            {rapport.commentChefService && (
                              <div className="mt-3 p-2 rounded" style={{ backgroundColor: '#E3F2FD' }}>
                                <Label className="text-xs">Commentaire Chef Service:</Label>
                                <p className="text-sm">{rapport.commentChefService}</p>
                              </div>
                            )}
                          </div>
                          <Button
                            size="sm"
                            onClick={() => setSelectedRapport(rapport)}
                            style={{ backgroundColor: '#003366' }}
                          >
                            <FileText className="h-4 w-4 mr-2" />
                            Examiner
                          </Button>
                        </div>
                      </div>
                    ))}
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

      <Dialog open={!!selectedRapport} onOpenChange={() => setSelectedRapport(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Validation du rapport - {selectedRapport?.code}</DialogTitle>
            <DialogDescription>
              Niveau: {getRoleLabel()}
            </DialogDescription>
          </DialogHeader>
          {selectedRapport && (
            <div className="space-y-6">
              <div className="p-4 rounded-lg" style={{ backgroundColor: '#F5F5F5' }}>
                <h3 className="font-semibold mb-3">Informations</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <Label>Code échantillon</Label>
                    <p>{selectedRapport.code}</p>
                  </div>
                  <div>
                    <Label>Client</Label>
                    <p>{selectedRapport.clientName}</p>
                  </div>
                  <div>
                    <Label>Date réception</Label>
                    <p>{new Date(selectedRapport.dateEnvoi).toLocaleString('fr-FR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}</p>
                  </div>
                  <div>
                    <Label>Fichier rapport</Label>
                    <p>{selectedRapport.file}</p>
                  </div>
                </div>
              </div>

              {selectedRapport.commentChefService && (
                <div className="p-4 rounded-lg" style={{ backgroundColor: '#E3F2FD' }}>
                  <h3 className="font-semibold mb-2">Commentaire du Chef Service</h3>
                  <p className="text-sm">{selectedRapport.commentChefService}</p>
                </div>
              )}

              <div className="p-4 rounded-lg" style={{ backgroundColor: '#F5F5F5' }}>
                <h3 className="font-semibold mb-3">Essais réalisés</h3>
                <div className="space-y-3">
                  {selectedRapport.essais.map((essai, index) => {
                    const formatDate = (dateStr: string) => {
                      if (!dateStr || dateStr === '-') return '-';
                      try {
                        return new Date(dateStr).toLocaleDateString('fr-FR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric'
                        });
                      } catch (e) {
                        return dateStr;
                      }
                    };
                    
                    return (
                      <div key={index} className="p-3 border rounded" style={{ backgroundColor: '#FFFFFF' }}>
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant="outline" style={{ fontSize: '12px' }}>{essai.essaiType}</Badge>
                        </div>
                        <div className="text-xs space-y-1" style={{ color: '#6C757D' }}>
                          <div className="flex justify-between">
                            <span><strong>Date début:</strong></span>
                            <span>{formatDate(essai.dateDebut)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span><strong>Date fin:</strong></span>
                            <span>{formatDate(essai.dateFin)}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Rapport technique</Label>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      console.log('Tentative d\'ouverture du rapport:', selectedRapport.code);
                      console.log('FileData présent:', !!selectedRapport.fileData);
                      
                      if (selectedRapport.fileData) {
                        try {
                          // Vérifier si c'est une URL ou un data URI
                          if (selectedRapport.fileData.startsWith('http')) {
                            // C'est une URL, ouvrir directement
                            window.open(selectedRapport.fileData, '_blank');
                          } else if (selectedRapport.fileData.startsWith('data:')) {
                            // C'est un data URI, créer un blob et ouvrir
                            const newWindow = window.open();
                            if (newWindow) {
                              newWindow.document.write(`
                                <html>
                                  <head>
                                    <title>Rapport - ${selectedRapport.code}</title>
                                    <style>body { margin: 0; }</style>
                                  </head>
                                  <body>
                                    <embed src="${selectedRapport.fileData}" type="application/pdf" width="100%" height="100%" />
                                  </body>
                                </html>
                              `);
                              newWindow.document.close();
                            }
                          } else {
                            // Format inconnu, essayer quand même
                            const newWindow = window.open();
                            if (newWindow) {
                              newWindow.document.write(`
                                <html>
                                  <head><title>Rapport - ${selectedRapport.code}</title></head>
                                  <body style="margin:0;padding:20px;">
                                    <h2>Rapport: ${selectedRapport.code}</h2>
                                    <p>Fichier: ${selectedRapport.file}</p>
                                    <p style="color:red;">Format de fichier non reconnu. Veuillez télécharger le fichier.</p>
                                  </body>
                                </html>
                              `);
                              newWindow.document.close();
                            }
                            toast.warning('Format de fichier non reconnu');
                          }
                        } catch (error) {
                          console.error('Erreur ouverture rapport:', error);
                          toast.error('Erreur lors de l\'ouverture du rapport');
                        }
                      } else {
                        console.error('Aucun fileData disponible');
                        toast.error('Fichier non disponible');
                      }
                    }}
                  >
                    <FileText className="h-3 w-3 mr-1" />
                    Ouvrir le rapport
                  </Button>
                  {selectedRapport.fileData && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        try {
                          const link = document.createElement('a');
                          link.href = selectedRapport.fileData;
                          link.download = selectedRapport.file || 'rapport.pdf';
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                          toast.success('Téléchargement démarré');
                        } catch (error) {
                          toast.error('Erreur lors du téléchargement');
                        }
                      }}
                    >
                      Télécharger
                    </Button>
                  )}
                </div>
                {!selectedRapport.fileData ? (
                  <p className="text-sm text-red-500 mt-2">⚠️ Aucun fichier disponible</p>
                ) : (
                  <p className="text-sm text-gray-500 mt-2">✓ Fichier disponible: {selectedRapport.file}</p>
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
                />
              </div>

              <div className="flex gap-3 justify-end">
                <Button
                  variant="destructive"
                  onClick={() => handleValidation(selectedRapport.code, 'rejete')}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Rejeter
                </Button>
                <Button
                  style={{ backgroundColor: '#28A745', color: '#FFFFFF' }}
                  onClick={() => handleValidation(selectedRapport.code, 'valide')}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Valider
                  {getNextRole() === null && ' (Final)'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
