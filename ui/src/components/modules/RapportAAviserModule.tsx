import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { CheckCircle, XCircle, FileText, AlertTriangle, PenTool } from 'lucide-react';
import { toast } from 'sonner';
import { useRef } from 'react';
import { workflowApi } from '../../lib/workflowApi';
import { addBordereauPage } from '../../lib/addBordereauPage';

interface RapportAAviser {
  code: string;
  clientName: string;
  file: string;
  fileData: string;
  validationDate: string;
  comment: string;
}

export function RapportAAviserModule() {
  const [rapports, setRapports] = useState<RapportAAviser[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRapport, setSelectedRapport] = useState<RapportAAviser | null>(null);
  const [observations, setObservations] = useState('');
  const [signature, setSignature] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [showSignatureMode, setShowSignatureMode] = useState(false);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const loadRapports = async () => {
    setLoading(true);
    const rapportsAAviser: RapportAAviser[] = [];

    const workflows = await workflowApi.getByEtape('directeur_snertp');
    
    for (const workflow of workflows) {
      rapportsAAviser.push({
        code: workflow.code_echantillon,
        clientName: '-',
        file: workflow.file_name || '-',
        fileData: workflow.file_data || '',
        validationDate: workflow.date_validation_directeur_technique || '',
        comment: workflow.commentaire_directeur_technique || ''
      });
    }

    setRapports(rapportsAAviser);
    setLoading(false);
  };

  useEffect(() => {
    loadRapports();
    
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'rapportAction') {
        const { code, action, observations, signature } = event.data.data;
        handleAction(code, action as 'refuse' | 'avise', observations, signature);
      }
    };
    
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    if ('touches' in e) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasEvent>) => {
    e.preventDefault();
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const coords = getCoordinates(e);
        ctx.beginPath();
        ctx.moveTo(coords.x, coords.y);
      }
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = '#000000';
        const coords = getCoordinates(e);
        ctx.lineTo(coords.x, coords.y);
        ctx.stroke();
      }
    }
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.closePath();
      }
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
    setSignature(null);
  };

  const saveSignature = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const dataURL = canvas.toDataURL('image/png');
      setSignature(dataURL);
      toast.success('Signature sauvegardée');
    }
  };

  const generateSignedReport = async (originalFileData: string, signatureData: string, code: string, clientName: string, observations: string) => {
    // Créer un document HTML avec le rapport et la signature
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Rapport Avisé - ${code}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #003366; padding-bottom: 20px; }
            .info { margin: 20px 0; }
            .signature-section { margin-top: 50px; border-top: 2px solid #003366; padding-top: 20px; }
            .signature-img { max-width: 300px; border: 1px solid #ccc; padding: 10px; }
            .footer { margin-top: 30px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>LABORATOIRE SNERTP</h1>
            <h2>Rapport d'Essai Avisé</h2>
          </div>
          
          <div class="info">
            <p><strong>Code Échantillon:</strong> ${code}</p>
            <p><strong>Client:</strong> ${clientName}</p>
            <p><strong>Date d'avis:</strong> ${new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
          </div>
          
          ${observations ? `
          <div class="info">
            <p><strong>Observations du Directeur SNERTP:</strong></p>
            <p>${observations}</p>
          </div>
          ` : ''}
          
          <div class="signature-section">
            <p><strong>Signature du Directeur SNERTP:</strong></p>
            <img src="${signatureData}" alt="Signature" class="signature-img" />
            <p><strong>Date:</strong> ${new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })}</p>
          </div>
          
          <div class="footer">
            <p>Ce document a été avisé électroniquement par le Directeur SNERTP</p>
            <p>Rapport original joint en annexe</p>
          </div>
        </body>
      </html>
    `;
    
    // Convertir le HTML en blob
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const reader = new FileReader();
    
    return new Promise<string>((resolve) => {
      reader.onloadend = () => {
        resolve(reader.result as string);
      };
      reader.readAsDataURL(blob);
    });
  };

  const handleAction = async (code: string, action: 'refuse' | 'accepte' | 'avise', obs?: string, sig?: string) => {
    const finalObservations = obs || observations;
    const finalSignature = sig || signature;
    
    const workflow = await workflowApi.getByCode(code);
    if (!workflow?.id) return;

    if (action === 'refuse') {
      const success = await workflowApi.rejeterDirecteurSNERTP(workflow.id, finalObservations || 'Rejeté par le Directeur SNERTP');
      if (success) {
        toast.success('Rapport refusé et envoyé au traitement');
      }
    } else if (action === 'avise') {
      const success = await workflowApi.aviserDirecteurSNERTP(workflow.id, finalObservations || '', finalSignature!);
      if (success) {
        toast.success('Rapport avisé et envoyé au service marketing');
      } else {
        toast.error('Erreur lors de l\'avis');
      }
    }

    setSelectedRapport(null);
    setObservations('');
    setSignature(null);
    clearCanvas();
    loadRapports();
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1>Rapports à aviser</h1>
        <p style={{ color: '#A9A9A9' }}>
          Rapports validés par le Directeur Technique en attente d'avis
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Rapports à traiter</CardTitle>
              <CardDescription>
                {rapports.length} rapport(s) en attente d'avis
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
            ) : rapports.length === 0 ? (
              <div className="text-center py-12" style={{ color: '#A9A9A9' }}>
                Aucun rapport à aviser
              </div>
            ) : (
              rapports.map((rapport) => (
                <div
                  key={rapport.code}
                  className="p-4 rounded-lg border"
                  style={{ backgroundColor: '#FFF3CD', borderColor: '#FFC107' }}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Badge style={{ backgroundColor: '#FFC107', color: '#FFFFFF' }}>
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          À aviser
                        </Badge>
                        <Badge style={{ backgroundColor: '#003366', color: '#FFFFFF' }}>
                          {rapport.code}
                        </Badge>
                      </div>
                      <div className="text-sm space-y-1" style={{ color: '#856404' }}>
                        <p>Client: {rapport.clientName}</p>
                        <p>Validé le: {rapport.validationDate ? new Date(rapport.validationDate).toLocaleString('fr-FR') : '-'}</p>
                        {rapport.comment && (
                          <p>Observation DT: {rapport.comment}</p>
                        )}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedRapport(rapport)}
                      style={{ borderColor: '#FFC107', color: '#856404' }}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Traiter
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!selectedRapport} onOpenChange={() => setSelectedRapport(null)}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Décision - {selectedRapport?.clientName}</DialogTitle>
          </DialogHeader>
          {selectedRapport && (
            <div className="space-y-4">
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', height: 'calc(90vh - 200px)' }}>
                <div className="border rounded-lg" style={{ backgroundColor: '#FFFFFF', overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
                  <div className="p-3" style={{ backgroundColor: '#003366', color: '#FFFFFF', position: 'sticky', top: 0, zIndex: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Label className="font-semibold">Document à examiner</Label>
                      <Button
                        size="sm"
                        onClick={() => {
                          if (selectedRapport.fileData) {
                            window.open(selectedRapport.fileData, '_blank');
                          }
                        }}
                        style={{ backgroundColor: '#FFFFFF', color: '#003366' }}
                      >
                        <FileText className="h-3 w-3 mr-1" />
                        Ouvrir
                      </Button>
                    </div>
                  </div>
                  <div style={{ flex: 1, padding: '20px', overflowY: 'auto', backgroundColor: '#FFFFFF', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    {signature ? (
                      <div style={{ textAlign: 'center' }}>
                        <h3 style={{ color: '#003366', marginBottom: '20px' }}>Signature enregistrée</h3>
                        <img src={signature} alt="Signature" style={{ maxWidth: '400px', border: '2px solid #003366', padding: '10px', borderRadius: '8px' }} />
                        <div style={{ marginTop: '20px', display: 'flex', gap: '10px', flexDirection: 'column' }}>
                          <Button
                            onClick={async () => {
                              if (!selectedRapport || !signature) return;
                              setIsGenerating(true);
                              try {
                                const url = await addBordereauPage(selectedRapport.fileData, signature);
                                window.open(url, '_blank');
                                toast.success('Document complet généré');
                              } catch (error) {
                                console.error(error);
                                toast.error('Erreur');
                              } finally {
                                setIsGenerating(false);
                              }
                            }}
                            disabled={isGenerating}
                            style={{ backgroundColor: '#003366', color: '#FFFFFF' }}
                          >
                            <FileText className="h-4 w-4 mr-2" />
                            {isGenerating ? 'Génération...' : 'Prévisualiser'}
                          </Button>
                          <Button
                            onClick={() => {
                              if (!selectedRapport || !signature) return;
                              const wordContent = `
                                <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
                                  <head>
                                    <meta charset='utf-8'>
                                    <title>Rapport Avisé - ${selectedRapport.code}</title>
                                    <style>
                                      body { font-family: Calibri, Arial, sans-serif; font-size: 11pt; line-height: 1.5; }
                                      .header { text-align: center; border-bottom: 3px solid #003366; padding-bottom: 20px; margin-bottom: 30px; }
                                      .header h1 { color: #003366; font-size: 18pt; margin: 10px 0; }
                                      .header h2 { color: #003366; font-size: 14pt; margin: 10px 0; }
                                      .info { margin: 20px 0; }
                                      .info p { margin: 8px 0; }
                                      .signature-section { margin-top: 50px; page-break-inside: avoid; }
                                      .signature-box { text-align: center; border: 2px solid #003366; padding: 20px; margin: 20px auto; max-width: 400px; }
                                      .signature-box img { max-width: 300px; display: block; margin: 10px auto; }
                                      .signature-info { text-align: center; font-weight: bold; color: #003366; margin-top: 10px; }
                                      hr { border: 0; border-top: 1px solid #ccc; margin: 30px 0; }
                                    </style>
                                  </head>
                                  <body>
                                    <div class='header'>
                                      <h1>LABORATOIRE SNERTP</h1>
                                      <h2>Rapport d'Essai Avisé</h2>
                                    </div>
                                    <div class='info'>
                                      <p><strong>Code Échantillon:</strong> ${selectedRapport.code}</p>
                                      <p><strong>Client:</strong> ${selectedRapport.clientName}</p>
                                      <p><strong>Fichier original:</strong> ${selectedRapport.file}</p>
                                      <p><strong>Date d'avis:</strong> ${new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })}</p>
                                      ${observations ? `
                                      <p><strong>Observations du Directeur SNERTP:</strong></p>
                                      <p style='margin-left: 20px; font-style: italic;'>${observations}</p>
                                      ` : ''}
                                    </div>
                                    <div class='signature-section'>
                                      <div class='signature-box'>
                                        <p style='margin: 0 0 10px 0;'><strong>Signature du Directeur SNERTP</strong></p>
                                        <img src='${signature}' alt='Signature Directeur SNERTP' />
                                        <div class='signature-info'>
                                          <p style='margin: 5px 0;'>Directeur SNERTP</p>
                                          <p style='margin: 5px 0;'>Date: ${new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })}</p>
                                        </div>
                                      </div>
                                    </div>
                                    <hr />
                                    <p style='text-align: center; font-size: 10pt; color: #666;'>
                                      <em>Ce document a été avisé électroniquement par le Directeur SNERTP</em><br/>
                                      <em>Rapport technique original: ${selectedRapport.file}</em>
                                    </p>
                                  </body>
                                </html>
                              `;
                              const blob = new Blob([wordContent], { type: 'application/msword' });
                              const url = URL.createObjectURL(blob);
                              const a = document.createElement('a');
                              a.href = url;
                              a.download = `Rapport_Avise_${selectedRapport.code}.doc`;
                              document.body.appendChild(a);
                              a.click();
                              document.body.removeChild(a);
                              URL.revokeObjectURL(url);
                              toast.success('Document Word téléchargé');
                            }}
                            style={{ backgroundColor: '#28A745', color: '#FFFFFF' }}
                          >
                            <FileText className="h-4 w-4 mr-2" />
                            Télécharger en Word
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ textAlign: 'center', color: '#666' }}>
                        <p>La signature apparaîtra ici après enregistrement</p>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="border rounded-lg p-4" style={{ backgroundColor: '#E8F5E9', overflowY: 'auto' }}>
                  <Label className="mb-2 block font-semibold">Signature</Label>
                  <p className="text-sm text-gray-600 mb-3">Examinez le rapport à gauche, puis signez ci-dessous</p>
                  <div style={{ width: '100%', height: '150px', border: '2px solid #003366', backgroundColor: '#FFFFFF' }}>
                    <canvas
                      ref={canvasRef}
                      width={400}
                      height={150}
                      style={{
                        width: '100%',
                        height: '100%',
                        cursor: 'crosshair',
                        touchAction: 'none'
                      }}
                      onMouseDown={startDrawing}
                      onMouseMove={draw}
                      onMouseUp={stopDrawing}
                      onMouseLeave={stopDrawing}
                      onTouchStart={startDrawing}
                      onTouchMove={draw}
                      onTouchEnd={stopDrawing}
                    />
                  </div>
                  <div className="flex gap-2 mt-2">
                    <Button size="sm" variant="outline" onClick={clearCanvas}>
                      Effacer
                    </Button>
                    <Button
                      size="sm"
                      style={{ backgroundColor: '#28A745', color: '#FFFFFF' }}
                      onClick={saveSignature}
                    >
                      <PenTool className="h-3 w-3 mr-1" />
                      Enregistrer
                    </Button>
                  </div>
                  
                  <div className="mt-4">
                    <Label htmlFor="observations">Observations</Label>
                    <Textarea
                      id="observations"
                      value={observations}
                      onChange={(e) => setObservations(e.target.value)}
                      placeholder="Ajouter des observations..."
                      rows={3}
                      className="mt-2"
                    />
                  </div>
                  
                  <div className="flex gap-2 mt-4">
                    <Button
                      variant="destructive"
                      onClick={() => handleAction(selectedRapport.code, 'refuse')}
                      disabled={!observations.trim()}
                      className="flex-1"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Rejeter
                    </Button>
                    <Button
                      style={{ backgroundColor: '#003366', color: '#FFFFFF' }}
                      onClick={() => handleAction(selectedRapport.code, 'avise')}
                      disabled={!signature}
                      className="flex-1"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Aviser
                    </Button>
                  </div>
                </div>
              </div>


            </div>
          )}
        </DialogContent>
      </Dialog>


    </div>
  );
}