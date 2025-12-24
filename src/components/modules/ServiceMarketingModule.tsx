import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { FileText, Send, CheckCircle, Mail } from 'lucide-react';
import { toast } from 'sonner';

interface RapportMarketing {
  id: string;
  code: string;
  clientName: string;
  file: string;
  fileData: string;
  dateEnvoi: string;
  avisDirecteurSNERTP: string;
  signatureDirecteurSNERTP: string;
  clientEmail?: string;
}

export function ServiceMarketingModule() {
  const [rapports, setRapports] = useState<RapportMarketing[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRapport, setSelectedRapport] = useState<RapportMarketing | null>(null);
  const [emailAddress, setEmailAddress] = useState('');
  const [showEmailDialog, setShowEmailDialog] = useState(false);

  const loadRapports = async () => {
    setLoading(true);
    const rapportsMarketing: RapportMarketing[] = [];

    try {
      const response = await fetch('http://127.0.0.1:8000/api/rapports-marketing/en_attente/', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        for (const rapport of data) {
          let clientEmail = rapport.email_client || '';
          
          if (!clientEmail) {
            try {
              const clientsResponse = await fetch('http://127.0.0.1:8000/api/clients/', {
                headers: {
                  'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
                  'Content-Type': 'application/json',
                },
              });
              const clientsData = await clientsResponse.json();
              const client = clientsData.results.find((c: any) => c.nom === rapport.client_name);
              if (client) clientEmail = client.email || '';
            } catch (error) {}
          }
          
          rapportsMarketing.push({
            id: rapport.id,
            code: rapport.code_echantillon,
            clientName: rapport.client_name,
            file: rapport.file_name,
            fileData: rapport.file_data,
            dateEnvoi: rapport.date_envoi_marketing,
            avisDirecteurSNERTP: rapport.avis_directeur_snertp || '',
            signatureDirecteurSNERTP: rapport.signature_directeur_snertp || '',
            clientEmail
          });
        }
      } else {
        toast.error('Erreur lors du chargement des rapports');
      }
    } catch (error) {
      console.error('Erreur chargement backend:', error);
      toast.error('Erreur de connexion au serveur');
    }

    setRapports(rapportsMarketing);
    setLoading(false);
  };

  useEffect(() => {
    loadRapports();
  }, []);

  const handlePrepareEmail = (rapport: RapportMarketing) => {
    setSelectedRapport(rapport);
    setEmailAddress(rapport.clientEmail || '');
    setShowEmailDialog(true);
  };

  const handleEnvoyerClient = async () => {
    if (!selectedRapport || !emailAddress) {
      toast.error('Adresse email requise');
      return;
    }

    try {
      const response = await fetch(`http://127.0.0.1:8000/api/rapports-marketing/${selectedRapport.id}/envoyer_client/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email_client: emailAddress,
        }),
      });

      if (response.ok) {
        toast.success(`Rapport envoyé à ${emailAddress}`);
        setShowEmailDialog(false);
        setSelectedRapport(null);
        setEmailAddress('');
        loadRapports();
      } else {
        const error = await response.json();
        toast.error(error.detail || 'Erreur lors de l\'envoi');
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de l\'envoi au client');
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1>Service Marketing</h1>
        <p style={{ color: '#A9A9A9' }}>
          Rapports avisés en attente d'envoi aux clients
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Rapports à envoyer</CardTitle>
              <CardDescription>
                {rapports.length} rapport(s) en attente d'envoi
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
                Aucun rapport à envoyer
              </div>
            ) : (
              rapports.map((rapport) => (
                <div
                  key={rapport.code}
                  className="p-4 rounded-lg border"
                  style={{ backgroundColor: '#E3F2FD', borderColor: '#2196F3' }}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Badge style={{ backgroundColor: '#2196F3', color: '#FFFFFF' }}>
                          <Send className="h-3 w-3 mr-1" />
                          À envoyer
                        </Badge>
                        <Badge style={{ backgroundColor: '#003366', color: '#FFFFFF' }}>
                          {rapport.code}
                        </Badge>
                      </div>
                      <div className="text-sm space-y-1" style={{ color: '#1565C0' }}>
                        <p>Client: {rapport.clientName}</p>
                        <p>Reçu le: {new Date(rapport.dateEnvoi).toLocaleString('fr-FR')}</p>
                        {rapport.avisDirecteurSNERTP && (
                          <p>Avis: {rapport.avisDirecteurSNERTP}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedRapport(rapport)}
                        style={{ borderColor: '#2196F3', color: '#1565C0' }}
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Voir
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handlePrepareEmail(rapport)}
                        style={{ backgroundColor: '#28A745', color: '#FFFFFF' }}
                      >
                        <Mail className="h-4 w-4 mr-2" />
                        Envoyer
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!selectedRapport && !showEmailDialog} onOpenChange={() => setSelectedRapport(null)}>
        <DialogContent style={{ maxWidth: '90vw', width: '90vw', maxHeight: '90vh' }}>
          <DialogHeader>
            <DialogTitle>Rapport Signé - {selectedRapport?.code}</DialogTitle>
          </DialogHeader>
          {selectedRapport && (
            <div className="space-y-4">
              <div className="border rounded-lg" style={{ height: '70vh', overflow: 'auto', backgroundColor: '#FFFFFF' }}>
                <div style={{ padding: '20px' }}>
                  <div style={{ textAlign: 'center', marginBottom: '20px', borderBottom: '2px solid #003366', paddingBottom: '15px' }}>
                    <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#003366' }}>Rapport d'Essai</h2>
                    <p style={{ fontSize: '16px', marginTop: '5px' }}><strong>Code:</strong> {selectedRapport.code}</p>
                    <p style={{ fontSize: '16px' }}><strong>Client:</strong> {selectedRapport.clientName}</p>
                  </div>

                  {selectedRapport.fileData && (
                    <div style={{ marginBottom: '20px', border: '2px solid #003366', borderRadius: '8px' }}>
                      <iframe
                        src={selectedRapport.fileData}
                        style={{ width: '100%', height: '500px', border: 'none' }}
                        title="Rapport PDF"
                      />
                    </div>
                  )}

                  <div style={{ borderTop: '2px solid #003366', paddingTop: '20px', backgroundColor: '#f9f9f9', padding: '20px', borderRadius: '8px' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '15px' }}>Signature du Directeur SNERTP</h3>
                    <p style={{ fontSize: '14px', marginBottom: '10px' }}><strong>Date:</strong> {new Date(selectedRapport.dateEnvoi).toLocaleString('fr-FR')}</p>
                    {selectedRapport.avisDirecteurSNERTP && (
                      <p style={{ fontSize: '14px', marginBottom: '15px' }}><strong>Avis:</strong> {selectedRapport.avisDirecteurSNERTP}</p>
                    )}
                    {selectedRapport.signatureDirecteurSNERTP && (
                      <div style={{ marginTop: '15px' }}>
                        <img 
                          src={selectedRapport.signatureDirecteurSNERTP} 
                          alt="Signature" 
                          style={{ maxWidth: '300px', border: '1px solid #ccc', borderRadius: '4px', backgroundColor: '#fff', padding: '10px' }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    const signedHtml = `
                      <!DOCTYPE html>
                      <html>
                        <head>
                          <title>Rapport Signé - ${selectedRapport.code}</title>
                          <style>body { margin: 0; padding: 20px; font-family: Arial; }</style>
                        </head>
                        <body>
                          <div style="max-width: 900px; margin: 0 auto;">
                            <div style="text-align: center; margin-bottom: 20px; border-bottom: 2px solid #003366; padding-bottom: 15px;">
                              <h2>Rapport d'Essai - ${selectedRapport.code}</h2>
                              <p>Client: ${selectedRapport.clientName}</p>
                            </div>
                            <div style="border: 2px solid #003366; margin-bottom: 20px;">
                              <iframe src="${selectedRapport.fileData}" width="100%" height="600px"></iframe>
                            </div>
                            <div style="border-top: 2px solid #003366; padding: 20px; background: #f9f9f9;">
                              <h3>Signature du Directeur SNERTP</h3>
                              <p>Date: ${new Date(selectedRapport.dateEnvoi).toLocaleString('fr-FR')}</p>
                              ${selectedRapport.avisDirecteurSNERTP ? `<p>Avis: ${selectedRapport.avisDirecteurSNERTP}</p>` : ''}
                              ${selectedRapport.signatureDirecteurSNERTP ? `<img src="${selectedRapport.signatureDirecteurSNERTP}" style="max-width: 300px; border: 1px solid #ccc;" />` : ''}
                            </div>
                          </div>
                        </body>
                      </html>
                    `;
                    const blob = new Blob([signedHtml], { type: 'text/html' });
                    const url = URL.createObjectURL(blob);
                    window.open(url, '_blank');
                  }}
                >
                  Ouvrir en plein écran
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setSelectedRapport(null)}
                >
                  Fermer
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Envoyer le rapport par email</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Client</Label>
              <p className="text-sm font-medium mt-1">{selectedRapport?.clientName}</p>
            </div>
            <div>
              <Label>Code échantillon</Label>
              <p className="text-sm font-medium mt-1">{selectedRapport?.code}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Adresse email</Label>
              <Input
                id="email"
                type="email"
                value={emailAddress}
                onChange={(e) => setEmailAddress(e.target.value)}
                placeholder="email@exemple.com"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setShowEmailDialog(false);
                  setEmailAddress('');
                }}
              >
                Annuler
              </Button>
              <Button
                style={{ backgroundColor: '#28A745', color: '#FFFFFF' }}
                onClick={handleEnvoyerClient}
                disabled={!emailAddress}
              >
                <Send className="h-4 w-4 mr-2" />
                Envoyer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
