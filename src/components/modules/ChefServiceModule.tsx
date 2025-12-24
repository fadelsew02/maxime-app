import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Label } from '../ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Textarea } from '../ui/textarea';
import { FileText, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';
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

export function ChefServiceModule() {
  const [echantillons, setEchantillons] = useState<EchantillonRapport[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEchantillon, setSelectedEchantillon] = useState<EchantillonRapport | null>(null);

  const loadRapports = async () => {
    setLoading(true);
    const rapports: EchantillonRapport[] = [];

    const workflows = await workflowApi.getByEtape('chef_service');
    
    for (const workflow of workflows) {
      const code = workflow.code_echantillon;
      
      let clientName = '-';
      try {
        const response = await fetch('http://127.0.0.1:8000/api/echantillons/', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
            'Content-Type': 'application/json',
          },
        });
        const apiData = await response.json();
        const echantillon = apiData.results.find((e: any) => e.code === code);
        if (echantillon && echantillon.client_nom) {
          clientName = echantillon.client_nom;
        }
      } catch (e) {}

      const essais: EssaiResult[] = [];
      for (let j = 0; j < localStorage.length; j++) {
        const essaiKey = localStorage.key(j);
        if (essaiKey && essaiKey.startsWith(code + '_') && !essaiKey.includes('sent_to_chef') && !essaiKey.includes('treatment_')) {
          const essaiData = localStorage.getItem(essaiKey);
          if (essaiData) {
            try {
              const essai = JSON.parse(essaiData);
              if (essai.validationStatus === 'accepted' && essai.envoye) {
                const parts = essaiKey.split('_');
                const essaiType = parts[parts.length - 1];
                
                let dateDebut = essai.dateDebut || essai.date_debut || essai.dateReception || essai.date_reception || '-';
                let dateFin = essai.dateFin || essai.date_fin || essai.dateValidation || essai.date_validation || '-';
                
                const dureesStandard: Record<string, number> = {
                  AG: 5,
                  Proctor: 5,
                  CBR: 9,
                  Oedometre: 18,
                  Cisaillement: 4
                };
                
                if (dateDebut === '-' && dateFin === '-' && workflow.date_validation_chef_projet) {
                  try {
                    const dateEnvoi = new Date(workflow.date_validation_chef_projet);
                    const duree = dureesStandard[essaiType] || 5;
                    dateFin = dateEnvoi.toISOString().split('T')[0];
                    const debut = new Date(dateEnvoi);
                    debut.setDate(debut.getDate() - duree);
                    dateDebut = debut.toISOString().split('T')[0];
                  } catch (e) {}
                }
                else if (dateDebut === '-' && dateFin !== '-') {
                  try {
                    const fin = new Date(dateFin);
                    const duree = dureesStandard[essaiType] || 5;
                    const debut = new Date(fin);
                    debut.setDate(debut.getDate() - duree);
                    dateDebut = debut.toISOString().split('T')[0];
                  } catch (e) {}
                }
                else if (dateFin === '-' && dateDebut !== '-') {
                  try {
                    const debut = new Date(dateDebut);
                    const duree = dureesStandard[essaiType] || 5;
                    const fin = new Date(debut);
                    fin.setDate(fin.getDate() + duree);
                    dateFin = fin.toISOString().split('T')[0];
                  } catch (e) {}
                }
                
                let dureeJours = undefined;
                if (dateDebut !== '-' && dateFin !== '-') {
                  try {
                    const debut = new Date(dateDebut);
                    const fin = new Date(dateFin);
                    dureeJours = Math.ceil((fin.getTime() - debut.getTime()) / (1000 * 60 * 60 * 24));
                  } catch (e) {}
                }
                
                essais.push({
                  essaiType,
                  resultats: essai.resultats || {},
                  dateDebut,
                  dateFin,
                  dureeJours
                });
              }
            } catch (e) {}
          }
        }
      }

      rapports.push({
        code,
        clientName,
        dateEnvoi: workflow.date_validation_chef_projet || new Date().toISOString(),
        file: workflow.file_name || '-',
        fileData: workflow.file_data || '',
        essais
      });
    }

    setEchantillons(rapports);
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
                {echantillons.length} rapport(s) reçu(s)
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
            ) : echantillons.length === 0 ? (
              <div className="text-center py-12" style={{ color: '#A9A9A9' }}>
                Aucun rapport reçu
              </div>
            ) : (
              echantillons.map((ech) => {
                // Vérifier si le rapport a été envoyé au DT
                const sendKeyDT = `sent_to_directeur_technique_${ech.code}`;
                const sentToDT = localStorage.getItem(sendKeyDT);
                const isEnvoyeDT = sentToDT ? JSON.parse(sentToDT).sentByChefService === true : false;
                
                return (
                  <div
                    key={ech.code}
                    className="p-4 rounded-lg"
                    style={{ backgroundColor: '#F5F5F5' }}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="font-semibold">{ech.clientName}</span>
                          <Badge style={{ backgroundColor: '#003366', color: '#FFFFFF' }}>
                            {ech.code}
                          </Badge>
                          {isEnvoyeDT && (
                            <Badge style={{ backgroundColor: '#28A745', color: '#FFFFFF' }}>
                              Envoyé au DT
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm space-y-1 mb-3" style={{ color: '#6C757D' }}>
                          <p>Date réception: {new Date(ech.dateEnvoi).toLocaleString('fr-FR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}</p>
                          <p>Fichier rapport: {ech.file}</p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedEchantillon(ech)}
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Voir détails
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!selectedEchantillon} onOpenChange={() => setSelectedEchantillon(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Détails du rapport - {selectedEchantillon?.code}</DialogTitle>
            <DialogDescription>
              Rapport envoyé par le chef de projet
            </DialogDescription>
          </DialogHeader>
          {selectedEchantillon && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Code échantillon</Label>
                <p>{selectedEchantillon.code}</p>
              </div>
              <div className="space-y-2">
                <Label>Client</Label>
                <p>{selectedEchantillon.clientName}</p>
              </div>
              <div className="space-y-2">
                <Label>Date de réception</Label>
                <p>{new Date(selectedEchantillon.dateEnvoi).toLocaleString('fr-FR', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}</p>
              </div>
              <div className="space-y-2">
                <Label>Fichier rapport</Label>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (selectedEchantillon.fileData) {
                        // Vérifier si c'est une URL ou un data URL
                        if (selectedEchantillon.fileData.startsWith('http') || selectedEchantillon.fileData.startsWith('data:')) {
                          window.open(selectedEchantillon.fileData, '_blank');
                        } else {
                          toast.error('Format de fichier non valide');
                        }
                      } else {
                        toast.error('Fichier non disponible');
                      }
                    }}
                  >
                    <FileText className="h-3 w-3 mr-1" />
                    Ouvrir le rapport
                  </Button>
                  {selectedEchantillon.fileData && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        try {
                          const link = document.createElement('a');
                          link.href = selectedEchantillon.fileData;
                          link.download = selectedEchantillon.file || 'rapport.pdf';
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
                {!selectedEchantillon.fileData && (
                  <p className="text-sm text-gray-500 mt-2">Aucun fichier disponible</p>
                )}
              </div>
              
              {selectedEchantillon.essais && selectedEchantillon.essais.length > 0 && (
                <div className="space-y-2">
                  <Label>Essais réalisés</Label>
                  <div className="space-y-2">
                    {selectedEchantillon.essais.map((essai, index) => {
                      // Formater les dates si elles existent
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
                            {essai.resultats && Object.keys(essai.resultats).length > 0 && (
                              <div className="mt-2 pt-2 border-t">
                                <p className="font-semibold mb-1">Résultats:</p>
                                {Object.entries(essai.resultats).slice(0, 3).map(([key, value]) => (
                                  <p key={key} className="ml-2">
                                    {key}: {String(value)}
                                  </p>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              
              <ValidationSection echantillon={selectedEchantillon} onClose={() => setSelectedEchantillon(null)} />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ValidationSection({ echantillon, onClose }: { echantillon: EchantillonRapport; onClose: () => void }) {
  const [comment, setComment] = useState('');
  const [validated, setValidated] = useState(() => {
    const sendKey = `sent_to_chef_service_${echantillon.code}`;
    const sentData = localStorage.getItem(sendKey);
    if (sentData) {
      const data = JSON.parse(sentData);
      return data.acceptedByChefService === true || data.rejectedByChefService === true;
    }
    return false;
  });
  const [isAccepted, setIsAccepted] = useState(() => {
    const sendKey = `sent_to_chef_service_${echantillon.code}`;
    const sentData = localStorage.getItem(sendKey);
    if (sentData) {
      const data = JSON.parse(sentData);
      return data.acceptedByChefService === true;
    }
    return false;
  });

  const handleAccept = async () => {
    const workflow = await workflowApi.getByCode(echantillon.code);
    if (workflow?.id) {
      const success = await workflowApi.validerChefService(workflow.id, comment);
      if (success) {
        setValidated(true);
        setIsAccepted(true);
        toast.success('Rapport accepté et envoyé au Directeur Technique');
        setTimeout(() => onClose(), 1000);
      } else {
        toast.error('Erreur lors de la validation');
      }
    }
  };

  const handleReject = async () => {
    if (!comment.trim()) {
      toast.error('Veuillez indiquer la raison du rejet');
      return;
    }

    const workflow = await workflowApi.getByCode(echantillon.code);
    if (workflow?.id) {
      const success = await workflowApi.rejeterChefService(workflow.id, comment);
      if (success) {
        setValidated(true);
        toast.success('Rapport rejeté et renvoyé au responsable traitement');
        setTimeout(() => onClose(), 1000);
      } else {
        toast.error('Erreur lors du rejet');
      }
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
