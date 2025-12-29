import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { FileText, Send, CheckCircle, Mail, Printer } from 'lucide-react';
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
  clientId?: string;
}

interface GroupeClient {
  clientId: string;
  clientName: string;
  clientEmail: string;
  rapports: RapportMarketing[];
}

export function ServiceMarketingModule() {
  const [groupesClients, setGroupesClients] = useState<GroupeClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGroupe, setSelectedGroupe] = useState<GroupeClient | null>(null);
  const [emailAddress, setEmailAddress] = useState('');
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const loadRapports = async () => {
    setLoading(true);
    const rapportsMarketing: RapportMarketing[] = [];

    try {
      const response = await fetch('https://snertp.onrender.com/api/rapports-marketing/en_attente/', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // Charger tous les clients pour récupérer les emails
        let clientsMap = new Map();
        try {
          const clientsResponse = await fetch('https://snertp.onrender.com/api/clients/', {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
              'Content-Type': 'application/json',
            },
          });
          const clientsData = await clientsResponse.json();
          clientsData.results.forEach((c: any) => {
            clientsMap.set(c.nom, { email: c.email || '', id: c.id });
          });
        } catch (error) {
          console.error('Erreur chargement clients:', error);
        }
        
        for (const rapport of data) {
          const clientInfo = clientsMap.get(rapport.client_name) || {};
          const clientEmail = rapport.email_client || clientInfo.email || '';
          const clientId = rapport.client_id || clientInfo.id || rapport.client_name;
          
          rapportsMarketing.push({
            id: rapport.id,
            code: rapport.code_echantillon,
            clientName: rapport.client_name,
            file: rapport.file_name,
            fileData: rapport.file_data,
            dateEnvoi: rapport.date_envoi_marketing,
            avisDirecteurSNERTP: rapport.avis_directeur_snertp || '',
            signatureDirecteurSNERTP: rapport.signature_directeur_snertp || '',
            clientEmail,
            clientId
          });
        }
      } else {
        toast.error('Erreur lors du chargement des rapports');
      }
    } catch (error) {
      console.error('Erreur chargement backend:', error);
      toast.error('Erreur de connexion au serveur');
    }

    // Regrouper par client_id
    const groupesMap = new Map<string, GroupeClient>();
    
    rapportsMarketing.forEach(rapport => {
      const clientId = rapport.clientId || rapport.clientName;
      if (!groupesMap.has(clientId)) {
        groupesMap.set(clientId, {
          clientId,
          clientName: rapport.clientName,
          clientEmail: rapport.clientEmail || '',
          rapports: []
        });
      }
      groupesMap.get(clientId)!.rapports.push(rapport);
    });

    setGroupesClients(Array.from(groupesMap.values()));
    setLoading(false);
  };

  useEffect(() => {
    loadRapports();
  }, []);

  const handlePrepareEmail = (groupe: GroupeClient) => {
    setSelectedGroupe(groupe);
    setEmailAddress(groupe.clientEmail || '');
    setShowEmailDialog(true);
  };

  const handleEnvoyerClient = async () => {
    if (!selectedGroupe || !emailAddress) {
      toast.error('Adresse email requise');
      return;
    }

    setIsSending(true);
    try {
      let successCount = 0;
      let errorCount = 0;

      // Envoyer tous les rapports du groupe
      for (const rapport of selectedGroupe.rapports) {
        try {
          const response = await fetch(`https://snertp.onrender.com/api/rapports-marketing/${rapport.id}/envoyer_client/`, {
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
        toast.success(`${successCount} rapport(s) envoyé(s) à ${emailAddress}`);
        setShowEmailDialog(false);
        setSelectedGroupe(null);
        setEmailAddress('');
        loadRapports();
      }
      
      if (errorCount > 0) {
        toast.error(`${errorCount} rapport(s) n'ont pas pu être envoyés`);
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de l\'envoi au client');
    } finally {
      setIsSending(false);
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
                {groupesClients.length} rapport(s) en attente d'envoi
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
            ) : groupesClients.length === 0 ? (
              <div className="text-center py-12" style={{ color: '#A9A9A9' }}>
                Aucun rapport à envoyer
              </div>
            ) : (
              groupesClients.map((groupe) => (
                <div
                  key={groupe.clientId}
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
                        <div className="flex gap-2">
                          {groupe.rapports.map((rapport) => (
                            <Badge key={rapport.code} style={{ backgroundColor: '#003366', color: '#FFFFFF' }}>
                              {rapport.code}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="text-sm space-y-1" style={{ color: '#1565C0' }}>
                        <p>Client: {groupe.clientName}</p>
                        <p>Reçu le: {new Date(groupe.rapports[0].dateEnvoi).toLocaleString('fr-FR')}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedGroupe(groupe)}
                        style={{ borderColor: '#2196F3', color: '#1565C0' }}
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Voir
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handlePrepareEmail(groupe)}
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

      <Dialog open={!!selectedGroupe && !showEmailDialog} onOpenChange={() => setSelectedGroupe(null)}>
        <DialogContent style={{ maxWidth: '90vw', width: '90vw', maxHeight: '90vh' }}>
          <DialogHeader>
            <DialogTitle>
              Rapport Signé - {selectedGroupe?.rapports.map(r => r.code).join(', ')}
            </DialogTitle>
          </DialogHeader>
          {selectedGroupe && (
            <div className="space-y-4">
              <div className="border rounded-lg" style={{ height: '70vh', overflow: 'auto', backgroundColor: '#FFFFFF' }}>
                <div style={{ padding: '20px' }}>
                  <div style={{ textAlign: 'center', marginBottom: '20px', borderBottom: '2px solid #003366', paddingBottom: '15px' }}>
                    <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#003366' }}>Rapport d'Essai</h2>
                    <p style={{ fontSize: '16px', marginTop: '5px' }}>
                      <strong>Codes:</strong> {selectedGroupe.rapports.map(r => r.code).join(', ')}
                    </p>
                    <p style={{ fontSize: '16px' }}><strong>Client:</strong> {selectedGroupe.clientName}</p>
                  </div>

                  {selectedGroupe.rapports[0].fileData && (
                    <div style={{ marginBottom: '20px', border: '2px solid #003366', borderRadius: '8px' }}>
                      <iframe
                        src={selectedGroupe.rapports[0].fileData}
                        style={{ width: '100%', height: '500px', border: 'none' }}
                        title="Rapport PDF"
                      />
                    </div>
                  )}

                  <div style={{ borderTop: '2px solid #003366', paddingTop: '20px', backgroundColor: '#f9f9f9', padding: '20px', borderRadius: '8px' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '15px' }}>Signature du Directeur SNERTP</h3>
                    <p style={{ fontSize: '14px', marginBottom: '10px' }}>
                      <strong>Date:</strong> {new Date(selectedGroupe.rapports[0].dateEnvoi).toLocaleString('fr-FR')}
                    </p>
                    {selectedGroupe.rapports[0].signatureDirecteurSNERTP && (
                      <div style={{ marginTop: '15px' }}>
                        <img 
                          src={selectedGroupe.rapports[0].signatureDirecteurSNERTP} 
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
                    if (selectedGroupe && selectedGroupe.rapports[0].fileData) {
                      // Ouvrir dans une nouvelle fenêtre et déclencher l'impression
                      const printWindow = window.open(selectedGroupe.rapports[0].fileData, '_blank');
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
                    if (selectedGroupe && selectedGroupe.rapports[0].fileData) {
                      window.open(selectedGroupe.rapports[0].fileData, '_blank');
                    }
                  }}
                >
                  Ouvrir en plein écran
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setSelectedGroupe(null)}
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
              <p className="text-sm font-medium mt-1">{selectedGroupe?.clientName}</p>
            </div>
            <div>
              <Label>Codes échantillons</Label>
              <p className="text-sm font-medium mt-1">
                {selectedGroupe?.rapports.map(r => r.code).join(', ')}
              </p>
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
                disabled={!emailAddress || isSending}
              >
                <Send className="h-4 w-4 mr-2" />
                {isSending ? 'Envoi...' : 'Envoyer'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
