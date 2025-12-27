import { useState, useEffect } from 'react';
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Label } from '../ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { FileText, Upload, Send, CheckCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { workflowApi } from '../../lib/workflowApi';
import { EchantillonDetails } from './TraitementModule_components';

interface EssaiTraitement {
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
  dateRejet: string | null;
}

interface EchantillonGroupe {
  code: string;
  chefProjet: string;
  clientNom: string;
  essais: EssaiTraitement[];
}

interface ClientGroupe {
  clientNom: string;
  chefProjet: string;
  echantillons: EchantillonGroupe[];
  totalEssais: number;
  totalEchantillonsClient: number;
  echantillonsEnTraitement: number;
  tousEchantillonsPrets: boolean;
}

function ClientCard({ client, onSelect }: { client: ClientGroupe; onSelect: (client: ClientGroupe) => void }) {
  const [sentToChefProjet, setSentToChefProjet] = React.useState(false);
  const [isRejected, setIsRejected] = React.useState(false);
  const [rejectedEchantillons, setRejectedEchantillons] = React.useState<Set<string>>(new Set());

  React.useEffect(() => {
    const checkSentStatus = async () => {
      const rejected = new Set<string>();
      for (const echantillon of client.echantillons) {
        const workflow = await workflowApi.getByCode(echantillon.code);
        if (workflow) {
          if (workflow.statut_display === 'Rejeté') {
            setIsRejected(true);
            rejected.add(echantillon.code);
          }
          if (workflow.etape_actuelle !== 'traitement') {
            setSentToChefProjet(true);
          }
        }
      }
      setRejectedEchantillons(rejected);
    };
    checkSentStatus();
  }, [client.echantillons]);

  return (
    <div className="p-4 rounded-lg" style={{ backgroundColor: '#F5F5F5' }}>
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <span className="font-semibold text-lg">{client.clientNom}</span>
            {isRejected && (
              <>
                <Badge style={{ backgroundColor: '#DC3545', color: '#FFFFFF' }}>
                  Rejeté
                </Badge>
                <Badge style={{ backgroundColor: '#FF6B35', color: '#FFFFFF' }}>
                  PRIORITÉ
                </Badge>
              </>
            )}
            <Badge variant="outline" style={{ borderColor: '#28A745', color: '#28A745' }}>
              {client.echantillons.length} échantillon(s)
            </Badge>
            {!client.tousEchantillonsPrets && (
              <Badge style={{ backgroundColor: '#FFC107', color: '#000' }}>
                ⏳ {client.echantillonsEnTraitement}/{client.totalEchantillonsClient} prêts
              </Badge>
            )}
            {client.tousEchantillonsPrets && (
              <Badge style={{ backgroundColor: '#28A745', color: '#FFFFFF' }}>
                ✓ Tous prêts
              </Badge>
            )}
          </div>
          <div className="text-sm space-y-1 mb-3" style={{ color: '#6C757D' }}>
            <div className="flex items-center gap-2">
              <p>Chef de projet: {client.chefProjet}</p>
              {isRejected && (
                <Badge style={{ backgroundColor: '#DC3545', color: '#FFFFFF', fontSize: '11px' }}>
                  REJETÉ
                </Badge>
              )}
            </div>
            {!client.tousEchantillonsPrets && (
              <p className="text-xs" style={{ color: '#FD7E14' }}>
                ⚠️ En attente de {client.totalEchantillonsClient - client.echantillonsEnTraitement} échantillon(s) supplémentaire(s)
              </p>
            )}
            {isRejected ? (
              <Badge style={{ backgroundColor: '#DC3545', color: '#FFFFFF' }}>
                Rejeté
              </Badge>
            ) : sentToChefProjet ? (
              <Badge style={{ backgroundColor: '#003366', color: '#FFFFFF' }}>
                Envoyé au chef projet
              </Badge>
            ) : (
              <p>{client.totalEssais} essai(s) accepté(s)</p>
            )}
          </div>
          <div className="flex gap-2 flex-wrap">
            {client.echantillons.map((ech) => (
              <div key={ech.code} className="flex items-center gap-1">
                <Badge style={{ backgroundColor: '#6C757D', color: '#FFFFFF' }}>
                  {ech.code}
                </Badge>
                {rejectedEchantillons.has(ech.code) && (
                  <Badge style={{ backgroundColor: '#DC3545', color: '#FFFFFF', fontSize: '10px' }}>
                    Rejeté
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </div>
        <Button size="sm" variant="outline" onClick={() => onSelect(client)}>
          <FileText className="h-4 w-4 mr-2" />
          Voir détails
        </Button>
      </div>
    </div>
  );
}

function ClientRejetCard({ client, onSelect }: { client: ClientGroupe; onSelect: (client: ClientGroupe) => void }) {
  return (
    <div className="p-4 rounded-lg" style={{ backgroundColor: '#FFF3CD', borderLeft: '4px solid #DC3545' }}>
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <span className="font-semibold text-lg">{client.clientNom}</span>
            <Badge style={{ backgroundColor: '#DC3545', color: '#FFFFFF' }}>
              Rejeté
            </Badge>
          </div>
          <div className="text-sm space-y-1 mb-3" style={{ color: '#6C757D' }}>
            <p>Chef de projet: {client.chefProjet}</p>
            <p>{client.echantillons.length} échantillon(s) rejeté(s)</p>
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
        <Button size="sm" variant="outline" onClick={() => onSelect(client)}>
          <FileText className="h-4 w-4 mr-2" />
          Voir détails
        </Button>
      </div>
    </div>
  );
}

export function TraitementModule() {
  const [clients, setClients] = useState<ClientGroupe[]>([]);
  const [clientsRejetes, setClientsRejetes] = useState<ClientGroupe[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClient, setSelectedClient] = useState<ClientGroupe | null>(null);

  const loadEssais = async () => {
    setLoading(true);
    try {
      console.log('\n🔍 Chargement module Traitement...');
      const response = await fetch('http://127.0.0.1:8000/api/echantillons/traitement_groupes_par_client/', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
      });
      const clientsData = await response.json();
      console.log('📦 Réponse backend:', clientsData);
      console.log(`✅ ${clientsData.length} client(s) reçu(s)`);
      
      setClients(clientsData);
      setClientsRejetes([]);
    } catch (error) {
      console.error('Erreur chargement:', error);
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEssais();
  }, []);

  return (
    <div className="p-8 bg-background">
      <div className="mb-8">
        <h1>Module Traitement</h1>
        <p style={{ color: '#A9A9A9' }}>
          Essais acceptés en traitement - Regroupés par client
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Clients en traitement</CardTitle>
              <CardDescription>
                {clients.length} client(s) avec échantillons en traitement
              </CardDescription>
            </div>
            <Button onClick={loadEssais} disabled={loading}>
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
                Aucun client en traitement
              </div>
            ) : (
              clients.map((client, index) => (
                <ClientCard key={`${client.clientNom}_${index}`} client={client} onSelect={setSelectedClient} />
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {clientsRejetes.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Traitements rejetés</CardTitle>
            <CardDescription>
              {clientsRejetes.length} client(s) avec traitements rejetés
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {clientsRejetes.map((client, index) => (
                <ClientRejetCard key={`${client.clientNom}_rejete_${index}`} client={client} onSelect={setSelectedClient} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={!!selectedClient} onOpenChange={() => setSelectedClient(null)}>
        <DialogContent style={{ width: '900px', maxWidth: '95vw' }} className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Traitement - {selectedClient?.clientNom}</DialogTitle>
            <DialogDescription>
              {selectedClient?.echantillons.length} échantillon(s) avec {selectedClient?.totalEssais} essai(s) accepté(s)
            </DialogDescription>
          </DialogHeader>
          {selectedClient && <ClientDetails client={selectedClient} onClose={() => setSelectedClient(null)} onSent={loadEssais} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ClientDetails({ client, onClose, onSent }: { client: ClientGroupe; onClose: () => void; onSent: () => void }) {
  const [traitementFile, setTraitementFile] = useState<File | null>(null);
  const [observations, setObservations] = useState<string>('');
  const [sentToChefProjet, setSentToChefProjet] = useState(false);
  const [selectedEchantillon, setSelectedEchantillon] = useState<EchantillonGroupe | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const checkIfAlreadySent = async () => {
      try {
        for (const echantillon of client.echantillons) {
          const workflow = await workflowApi.getByCode(echantillon.code);
          if (workflow && workflow.etape_actuelle !== 'chef_projet' && workflow.statut !== 'rejete') {
            setSentToChefProjet(true);
            break;
          }
        }
      } catch (error) {
        console.error('Erreur vérification workflow:', error);
      } finally {
        setLoading(false);
      }
    };
    checkIfAlreadySent();
  }, [client.echantillons]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setTraitementFile(file);
      toast.success(`Fichier "${file.name}" chargé`);
    }
  };

  const handleSendToChefProjet = async () => {
    if (!traitementFile) {
      toast.error('Veuillez charger un fichier avant d\'envoyer');
      return;
    }

    setIsSubmitting(true);

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64Data = e.target?.result as string;

        try {
          for (const echantillon of client.echantillons) {
            const echantillonResponse = await fetch(`http://127.0.0.1:8000/api/echantillons/?code=${echantillon.code}`, {
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('access_token')}`
              }
            });
            const echantillonData = await echantillonResponse.json();
            const echantillonObj = echantillonData.results[0];
            const echantillonId = echantillonObj?.id;

            if (!echantillonId) {
              toast.error(`Échantillon ${echantillon.code} introuvable`);
              setIsSubmitting(false);
              return;
            }

            const workflow = await workflowApi.create({
              echantillon: echantillonId,
              code_echantillon: echantillon.code,
              client_id: client.clientId,
              client_name: client.clientNom,
              etape_actuelle: 'chef_projet',
              statut: 'en_attente',
              file_data: base64Data,
              file_name: traitementFile.name,
              observations_traitement: observations
            });

            if (!workflow) {
              toast.error(`Erreur lors de l'envoi de ${echantillon.code}`);
              setIsSubmitting(false);
              return;
            }
          }

          setSentToChefProjet(true);
          toast.success(`Rapport envoyé au chef de projet pour ${client.echantillons.length} échantillon(s)`);
          onClose();
          onSent(); // Ceci va recharger la liste et mettre à jour les badges
        } catch (error) {
          console.error('Erreur:', error);
          toast.error('Erreur de connexion au serveur');
        } finally {
          setIsSubmitting(false);
        }
      };
      reader.readAsDataURL(traitementFile);
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur de connexion au serveur');
      setIsSubmitting(false);
    }
  };

  if (selectedEchantillon) {
    return <EchantillonDetails echantillon={selectedEchantillon} onBack={() => setSelectedEchantillon(null)} />;
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Client</Label>
        <p className="font-semibold">{client.clientNom}</p>
      </div>
      <div className="space-y-2">
        <Label>Chef de projet</Label>
        <p>{client.chefProjet}</p>
      </div>

      <div>
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
                  <div className="flex gap-2 flex-wrap">
                    {ech.essais.map((essai) => (
                      <div key={essai.essaiType} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <Badge 
                          style={{ backgroundColor: '#28A745', color: '#FFFFFF', fontSize: '11px' }}
                        >
                          {essai.essaiType}
                        </Badge>
                        {essai.estRepris && (
                          <Badge 
                            style={{ backgroundColor: '#FD7E14', color: '#FFFFFF', fontSize: '9px', padding: '2px 6px' }}
                          >
                            REPRIS
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                <Button size="sm" variant="outline" onClick={() => setSelectedEchantillon(ech)}>
                  Ouvrir
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4 pt-4 border-t">
        <h3 className="font-semibold">Rapport de traitement groupé</h3>
        <p className="text-sm" style={{ color: '#6C757D' }}>
          Ce rapport sera envoyé pour tous les échantillons de {client.clientNom}
        </p>
        
        <div className="space-y-2">
          <Label>Fichier rapport</Label>
          <input
            type="file"
            id="traitement-file"
            onChange={handleFileUpload}
            style={{ display: 'none' }}
            disabled={sentToChefProjet}
          />
          <Button 
            type="button"
            variant="outline" 
            size="sm" 
            onClick={() => document.getElementById('traitement-file')?.click()}
            disabled={sentToChefProjet}
          >
            <Upload className="h-4 w-4 mr-2" />
            {traitementFile ? 'Changer le fichier' : 'Sélectionner un fichier'}
          </Button>
          {traitementFile && (
            <p className="text-xs mt-1 text-green-600">
              ✓ {traitementFile.name}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Observations</Label>
          <textarea
            value={observations}
            onChange={(e) => setObservations(e.target.value)}
            placeholder="Renseignez vos observations sur le traitement..."
            disabled={sentToChefProjet}
            className="w-full min-h-[100px] p-3 border rounded-md resize-y"
            style={{ 
              borderColor: '#D1D5DB',
              fontSize: '14px'
            }}
          />
        </div>

        <Button
          onClick={handleSendToChefProjet}
          disabled={!traitementFile || sentToChefProjet || loading || !client.tousEchantillonsPrets || isSubmitting}
          style={{ 
            backgroundColor: sentToChefProjet ? '#6C757D' : (!client.tousEchantillonsPrets ? '#FFC107' : '#003366'),
            color: '#FFFFFF'
          }}
          className="w-full"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Envoi en cours...
            </>
          ) : (
            <>
              <Send className="h-4 w-4 mr-2" />
              {loading ? 'Vérification...' : 
               sentToChefProjet ? 'Déjà envoyé au chef de projet' : 
               !client.tousEchantillonsPrets ? `⏳ En attente de ${client.totalEchantillonsClient - client.echantillonsEnTraitement} échantillon(s)` :
               'Envoyer au chef de projet'}
            </>
          )}
        </Button>

        {!client.tousEchantillonsPrets && !sentToChefProjet && (
          <div className="p-3 rounded-lg" style={{ backgroundColor: '#FFF3CD', border: '1px solid #FFC107' }}>
            <p className="text-sm" style={{ color: '#856404' }}>
              ⚠️ <strong>Envoi bloqué :</strong> Tous les échantillons du client doivent être en traitement avant l'envoi.
            </p>
            <p className="text-xs mt-1" style={{ color: '#856404' }}>
              Actuellement : {client.echantillonsEnTraitement}/{client.totalEchantillonsClient} échantillons prêts
            </p>
          </div>
        )}

        {sentToChefProjet && !loading && (
          <div className="space-y-2">
            <p className="text-sm text-green-600">
              ✓ Rapport déjà envoyé au chef de projet
            </p>
            <div className="p-3 rounded-lg" style={{ backgroundColor: '#E8F5E8', border: '1px solid #28A745' }}>
              <Label className="text-sm font-semibold" style={{ color: '#28A745' }}>Date d'envoi au chef projet :</Label>
              <p className="text-sm mt-1" style={{ color: '#28A745' }}>
                {new Date().toLocaleDateString('fr-FR', {
                  day: '2-digit',
                  month: '2-digit', 
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

