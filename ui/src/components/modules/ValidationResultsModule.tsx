import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { CheckCircle, FileText, X, Eraser, Send } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';

interface RapportValide {
  code: string;
  clientName: string;
  file: string;
  fileData: string;
  validationDate: string;
  comment: string;
  workflowId: string;
  clientId: string;
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

  const loadRapportsValides = async () => {
    setLoading(true);
    const rapports: RapportValide[] = [];

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
          rapports.push({
            code: workflow.code_echantillon,
            clientName: workflow.client_name || '-',
            file: workflow.file_name || '-',
            fileData: workflow.file_data || '',
            validationDate: workflow.date_validation_directeur_technique,
            comment: workflow.commentaire_directeur_technique || '',
            workflowId: workflow.id,
            clientId: workflow.client_id || workflow.client_name || 'unknown'
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
  }, []);

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

  const generateSignedDocument = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      toast.error('Signature non disponible');
      return;
    }

    const signatureData = canvas.toDataURL('image/png');
    
    // Créer un document HTML avec PDF et signature
    const signedHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Rapport Signé - ${selectedRapport?.code}</title>
          <style>
            body { margin: 0; padding: 20px; font-family: Arial; }
            .container { max-width: 900px; margin: 0 auto; }
            .header { text-align: center; margin-bottom: 20px; }
            .pdf-container { border: 2px solid #003366; margin-bottom: 20px; }
            .signature-section { border-top: 2px solid #003366; padding: 20px; background: #f9f9f9; }
            .signature-img { max-width: 300px; border: 1px solid #ccc; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>Rapport d'Essai - ${selectedRapport?.code}</h2>
              <p>Client: ${selectedRapport?.clientName}</p>
            </div>
            <div class="pdf-container">
              <iframe src="${selectedRapport?.fileData}" width="100%" height="600px"></iframe>
            </div>
            <div class="signature-section">
              <h3>Signature du Directeur SNERTP</h3>
              <p>Date: ${new Date().toLocaleString('fr-FR')}</p>
              <img src="${signatureData}" class="signature-img" alt="Signature" />
            </div>
          </div>
        </body>
      </html>
    `;
    
    const blob = new Blob([signedHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    setSignedDocumentUrl(url);
    setShowPreview(true);
  };

  const handleSendToMarketing = async () => {
    if (!selectedRapport) return;
    
    const canvas = canvasRef.current;
    if (!canvas) {
      toast.error('Canvas de signature non disponible');
      return;
    }

    const signatureData = canvas.toDataURL('image/png');
    
    setIsSending(true);
    try {
      const response = await fetch('http://127.0.0.1:8000/api/rapports-marketing/create_from_workflow/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workflow_id: selectedRapport.workflowId,
          signature_directeur_snertp: signatureData,
        }),
      });

      if (response.ok) {
        toast.success('Rapport envoyé au service marketing');
        setIsModalOpen(false);
        setSelectedRapport(null);
        loadRapportsValides();
      } else {
        const error = await response.json();
        toast.error(error.detail || 'Erreur lors de l\'envoi');
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de l\'envoi au marketing');
    } finally {
      setIsSending(false);
    }
  };

  const openModal = (rapport: RapportValide) => {
    setSelectedRapport(rapport);
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
                      onClick={() => openModal(groupe.rapports[0])}
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
              <span>Rapport {selectedRapport?.code}</span>
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
                    style={{ backgroundColor: '#28A745' }}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Prévisualiser le document signé
                  </Button>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => setShowPreview(false)}
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