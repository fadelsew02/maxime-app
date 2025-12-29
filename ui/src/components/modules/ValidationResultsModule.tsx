import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { CheckCircle, FileText, X, Eraser, Send, Printer } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { addBordereauPage } from '../../lib/addBordereauPage';

interface RapportValide {
  code: string;
  clientName: string;
  file: string;
  fileData: string;
  validationDate: string;
  comment: string;
  workflowId: string;
  clientId: string;
  nature?: string;
  essaisTypes?: string[];
  dateReception?: string;
  clientContact?: string;
}

interface GroupeClient {
  clientId: string;
  clientName: string;
  rapports: RapportValide[];
}

interface ValidationResultsModuleProps {
  userRole?: string;
}

export function ValidationResultsModule({ userRole }: ValidationResultsModuleProps = {}) {
  const [groupesClients, setGroupesClients] = useState<GroupeClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRapport, setSelectedRapport] = useState<RapportValide | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSigning, setIsSigning] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [signedDocumentUrl, setSignedDocumentUrl] = useState<string>('');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [selectedGroupe, setSelectedGroupe] = useState<GroupeClient | null>(null);

  const loadRapportsValides = async () => {
    setLoading(true);
    const rapports: RapportValide[] = [];

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
          rapports.push({
            code: workflow.code_echantillon,
            clientName: workflow.client_name || '-',
            file: workflow.file_name || '-',
            fileData: workflow.file_data || '',
            validationDate: workflow.date_validation_directeur_technique,
            comment: workflow.commentaire_directeur_technique || '',
            workflowId: workflow.id,
            clientId: workflow.client_id || workflow.client_name || 'unknown',
            nature: workflow.nature || 'Échantillon',
            essaisTypes: workflow.essais_types || [],
            dateReception: workflow.date_reception,
            clientContact: workflow.client_contact || workflow.client_name
          });
        }
      }
    } catch (e) {
      console.error('Erreur chargement rapports validés:', e);
    }

    // Regrouper par client_id
    const groupesMap = new Map<string, GroupeClient>();
    
    rapports.forEach(rapport => {
      if (!groupesMap.has(rapport.clientId)) {
        groupesMap.set(rapport.clientId, {
          clientId: rapport.clientId,
          clientName: rapport.clientName,
          rapports: []
        });
      }
      groupesMap.get(rapport.clientId)!.rapports.push(rapport);
    });

    setGroupesClients(Array.from(groupesMap.values()));
    setLoading(false);
  };

  useEffect(() => {
    loadRapportsValides();
    loadCurrentUser();
  }, []);

  const loadCurrentUser = async () => {
    try {
      const response = await fetch('https://snertp.onrender.com/api/users/me/', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
      });
      if (response.ok) {
        const userData = await response.json();
        setCurrentUser(userData);
      }
    } catch (error) {
      console.error('Erreur chargement utilisateur:', error);
    }
  };

  const initCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const generateSignedDocument = async () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      toast.error('Signature non disponible');
      return;
    }

    if (!selectedRapport?.fileData) {
      toast.error('PDF non disponible');
      return;
    }

    const signatureData = canvas.toDataURL('image/png');
    
    try {
      setIsSigning(true);
      toast.info('Génération du document signé...');
      
      // Préparer les données du bordereau
      const now = new Date();
      const dateStr = now.toLocaleDateString('fr-FR', { 
        day: '2-digit', 
        month: 'short', 
        year: 'numeric' 
      }).toUpperCase();
      
      const bordereauData = {
        numero: `${Math.floor(Math.random() * 10000)} / CNER-TP/DG`,
        date: dateStr,
        essaisRealises: selectedRapport.nature || 'Échantillon de sol',
        demandePar: selectedRapport.clientName,
        compteDe: selectedRapport.clientName,
        dateEssais: selectedRapport.dateReception ? 
          new Date(selectedRapport.dateReception).toLocaleDateString('fr-FR') : 
          now.toLocaleDateString('fr-FR'),
        lieuEssais: 'Laboratoire Essais Spéciaux',
        natureEssais: Array.isArray(selectedRapport.essaisTypes) && selectedRapport.essaisTypes.length > 0 ? 
          selectedRapport.essaisTypes.join(', ') : 
          'Essais géotechniques',
        adresseRecepteur: selectedRapport.clientContact || selectedRapport.clientName,
        observations: selectedRapport.comment || 'R.A.S.',
        directeurNom: currentUser ? `${currentUser.first_name} ${currentUser.last_name}` : 'Directeur SNERTP'
      };
      
      // Utiliser addBordereauPage pour ajouter la page de signature au début
      const signedPdfUrl = await addBordereauPage(selectedRapport.fileData, signatureData, bordereauData);
      
      setSignedDocumentUrl(signedPdfUrl);
      setShowPreview(true);
      toast.success('Document signé généré avec succès');
    } catch (error) {
      console.error('Erreur génération document signé:', error);
      toast.error('Erreur lors de la génération du document signé');
    } finally {
      setIsSigning(false);
    }
  };

  const handleSendToMarketing = async () => {
    if (!selectedGroupe || !selectedGroupe.rapports.length) return;
    
    const canvas = canvasRef.current;
    if (!canvas) {
      toast.error('Canvas de signature non disponible');
      return;
    }

    if (!signedDocumentUrl) {
      toast.error('Veuillez d\'abord générer le document signé');
      return;
    }

    const signatureData = canvas.toDataURL('image/png');
    
    setIsSending(true);
    try {
      // Convertir le PDF signé en base64
      const signedPdfBlob = await fetch(signedDocumentUrl).then(r => r.blob());
      const signedPdfBase64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(signedPdfBlob);
      });

      // Envoyer TOUS les rapports du groupe au marketing
      let successCount = 0;
      let errorCount = 0;

      for (const rapport of selectedGroupe.rapports) {
        try {
          const response = await fetch('https://snertp.onrender.com/api/rapports-marketing/create_from_workflow/', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              workflow_id: rapport.workflowId,
              signature_directeur_snertp: signatureData,
              signed_report_data: signedPdfBase64, // Envoyer le PDF signé
            }),
          });

          if (response.ok) {
            successCount++;
          } else {
            errorCount++;
            const error = await response.json();
            console.error(`Erreur pour ${rapport.code}:`, error);
          }
        } catch (error) {
          errorCount++;
          console.error(`Erreur pour ${rapport.code}:`, error);
        }
      }

      if (successCount > 0) {
        toast.success(`${successCount} rapport(s) envoyé(s) au service marketing`);
        setIsModalOpen(false);
        setSelectedRapport(null);
        setSelectedGroupe(null);
        loadRapportsValides();
      }
      
      if (errorCount > 0) {
        toast.error(`${errorCount} rapport(s) n'ont pas pu être envoyés`);
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de l\'envoi au marketing');
    } finally {
      setIsSending(false);
    }
  };

  const openModal = (groupe: GroupeClient) => {
    // Sélectionner le premier rapport du groupe pour l'affichage
    setSelectedRapport(groupe.rapports[0]);
    setSelectedGroupe(groupe);
    setIsModalOpen(true);
    setShowPreview(false);
    setSignedDocumentUrl('');
    setTimeout(initCanvas, 100);
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1>{userRole === 'directeur_snertp' ? 'Rapports Validés' : 'Validation'}</h1>
        <p style={{ color: '#A9A9A9' }}>
          Rapports validés par le Directeur Technique
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Rapports validés</CardTitle>
              <CardDescription>
                {groupesClients.length} rapport(s) validé(s)
              </CardDescription>
            </div>
            <Button onClick={loadRapportsValides} disabled={loading}>
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
            ) : groupesClients.length === 0 ? (
              <div className="text-center py-12" style={{ color: '#A9A9A9' }}>
                Aucun rapport validé
              </div>
            ) : (
              groupesClients.map((groupe) => (
                <div
                  key={groupe.clientId}
                  className="p-4 rounded-lg border"
                  style={{ backgroundColor: '#D4EDDA', borderColor: '#28A745' }}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Badge style={{ backgroundColor: '#28A745', color: '#FFFFFF' }}>
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Validé
                        </Badge>
                        <div className="flex gap-2">
                          {groupe.rapports.map((rapport) => (
                            <Badge key={rapport.code} style={{ backgroundColor: '#003366', color: '#FFFFFF' }}>
                              {rapport.code}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="text-sm space-y-1" style={{ color: '#155724' }}>
                        <p>Client: {groupe.clientName}</p>
                        <p>Validé le: {groupe.rapports[0]?.validationDate ? new Date(groupe.rapports[0].validationDate).toLocaleString('fr-FR') : '-'}</p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openModal(groupe)}
                      style={{ borderColor: '#28A745', color: '#28A745' }}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Voir rapport
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>
                Rapport {selectedGroupe ? 
                  selectedGroupe.rapports.map(r => r.code).join(', ') : 
                  selectedRapport?.code}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsModalOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>

          {selectedRapport && (
            <div className="space-y-6">
              {/* PDF Viewer */}
              <div className="border rounded-lg p-4">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-semibold">Fichier PDF</h3>
                  {selectedRapport.fileData && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(selectedRapport.fileData, '_blank')}
                    >
                      Ouvrir en plein écran
                    </Button>
                  )}
                </div>
                {selectedRapport.fileData ? (
                  <iframe
                    src={selectedRapport.fileData}
                    className="w-full h-[400px] border rounded"
                    title={`Rapport ${selectedRapport.code}`}
                  />
                ) : (
                  <p className="text-gray-500">Fichier non disponible</p>
                )}
              </div>

              {/* Signature Canvas */}
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-3">Signature numérique</h3>
                <div className="space-y-3">
                  <canvas
                    ref={canvasRef}
                    width={600}
                    height={200}
                    className="border rounded bg-white cursor-crosshair w-full"
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearCanvas}
                  >
                    <Eraser className="h-4 w-4 mr-2" />
                    Effacer
                  </Button>
                </div>
              </div>

              {/* Preview Section */}
              {showPreview && signedDocumentUrl && (
                <div className="border rounded-lg p-4 bg-green-50">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-semibold text-green-800">Aperçu du document signé</h3>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(signedDocumentUrl, '_blank')}
                    >
                      Ouvrir en plein écran
                    </Button>
                  </div>
                  <iframe
                    src={signedDocumentUrl}
                    className="w-full h-[500px] border rounded bg-white"
                    title="Document signé"
                  />
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end gap-3">
                {!showPreview ? (
                  <Button
                    onClick={generateSignedDocument}
                    disabled={isSigning}
                    style={{ backgroundColor: '#28A745' }}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    {isSigning ? 'Génération...' : 'Prévisualiser le document signé'}
                  </Button>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => {
                        if (signedDocumentUrl) {
                          // Ouvrir dans une nouvelle fenêtre et déclencher l'impression
                          const printWindow = window.open(signedDocumentUrl, '_blank');
                          if (printWindow) {
                            printWindow.onload = () => {
                              printWindow.print();
                            };
                          }
                        }
                      }}
                      style={{ borderColor: '#003366', color: '#003366' }}
                    >
                      <Printer className="h-4 w-4 mr-2" />
                      Imprimer
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowPreview(false);
                        if (signedDocumentUrl) {
                          URL.revokeObjectURL(signedDocumentUrl);
                          setSignedDocumentUrl('');
                        }
                      }}
                    >
                      Modifier la signature
                    </Button>
                    <Button
                      onClick={handleSendToMarketing}
                      disabled={isSending}
                      style={{ backgroundColor: '#003366' }}
                    >
                      <Send className="h-4 w-4 mr-2" />
                      {isSending ? 'Envoi...' : 'Envoyer au service marketing'}
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}