import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Label } from '../ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Textarea } from '../ui/textarea';
import { AlertCircle, CheckCircle, XCircle, FileText, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { getEchantillons as getAPIEchantillons } from '../../lib/echantillonService';
import { essaiApi } from '../../lib/essaiApi';

interface EchantillonWithEssais {
  id: string;
  code: string;
  nature: string;
  dateReception: string;
  essais: any[];
  totalEssais: number;
  statut?: string;
}

export function DecodificationModule() {
  const [echantillons, setEchantillons] = useState<EchantillonWithEssais[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEchantillon, setSelectedEchantillon] = useState<EchantillonWithEssais | null>(null);

  const refreshEchantillons = async () => {
    setLoading(true);

    try {
      const apiEchantillons = await getAPIEchantillons();
      console.log('Tous les échantillons:', apiEchantillons.length);
      
      const echantillonsAvecEssais: EchantillonWithEssais[] = [];
      const seenEchantillons = new Set<string>();

      for (const ech of apiEchantillons) {
        if (seenEchantillons.has(ech.id)) continue;
        seenEchantillons.add(ech.id);
        
        console.log(`Échantillon ${ech.code} - Statut: ${ech.statut}`);
        
        const essais = await essaiApi.getByEchantillon(ech.id);
        const essaisTermines = essais.filter(e => e.statut === 'termine');
        const essaisRejetes = essais.filter(e => e.statut_validation === 'rejected');
        
        console.log(`  -> ${essaisTermines.length} essais terminés:`, essaisTermines.map(e => e.type));
        
        // Afficher les échantillons avec des essais terminés OU des essais rejetés
        if (essaisTermines.length > 0 || essaisRejetes.length > 0) {
          echantillonsAvecEssais.push({
            id: ech.id,
            code: ech.code,
            nature: ech.nature,
            dateReception: ech.date_reception,
            essais: essaisTermines,
            totalEssais: (ech.essais_types || []).length,
            statut: ech.statut
          });
        }
      }

      console.log('Échantillons avec essais terminés:', echantillonsAvecEssais.length);
      setEchantillons(echantillonsAvecEssais);
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshEchantillons();
  }, []);

  return (
    <div className="p-8 bg-background">
      <div className="mb-8">
        <h1>Module Décodification</h1>
        <p style={{ color: '#A9A9A9' }}>
          Validation des résultats avant traitement
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Échantillons prêts pour décodification</CardTitle>
              <CardDescription>
                {echantillons.length} échantillon(s) en attente
              </CardDescription>
            </div>
            <Button onClick={refreshEchantillons} disabled={loading}>
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
                Aucun échantillon en attente
              </div>
            ) : (
              echantillons.map((ech) => (
                <div key={ech.id} className="p-4 rounded-lg" style={{ backgroundColor: '#F5F5F5' }}>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span>{ech.code}</span>
                        <Badge style={{ 
                          backgroundColor: ech.statut === 'traitement' ? '#17A2B8' : 
                                        ech.statut === 'decodification' ? '#007BFF' : '#28A745', 
                          color: '#FFFFFF' 
                        }}>
                          <CheckCircle className="h-3 w-3 mr-1" />
                          {ech.statut === 'traitement' ? 'Au traitement' : 
                           ech.statut === 'decodification' ? 'Au traitement' : 'Prêt'}
                        </Badge>
                      </div>
                      <p className="text-sm mb-3" style={{ color: '#A9A9A9' }}>
                        {ech.nature} - Reçu le {ech.dateReception}
                      </p>
                      <div className="flex gap-2 mb-3 flex-wrap">
                        {Array.from(new Set(ech.essais.map((e: any) => e.id))).map((essaiId) => {
                          const essai = ech.essais.find((e: any) => e.id === essaiId);
                          if (!essai) return null;
                          const validationStatus = essai.statut_validation || 'pending';
                          const isRejected = validationStatus === 'rejected';
                          const isAccepted = validationStatus === 'accepted';
                          const wasRejected = essai.date_rejet;
                          const isRepris = wasRejected && isAccepted;
                          
                          return (
                            <Badge 
                              key={essai.id}
                              style={{ 
                                backgroundColor: isAccepted ? '#28A745' : isRejected ? '#DC3545' : '#FFC107',
                                color: '#FFFFFF',
                                padding: '6px 12px',
                                fontSize: '13px'
                              }}
                            >
                              {essai.type} {isRepris ? 'repris' : isAccepted ? '✓' : isRejected ? 'REJETÉ' : '⏳'}
                            </Badge>
                          );
                        })}
                      </div>
                      <p className="text-xs" style={{ color: '#A9A9A9' }}>
                        {ech.essais.filter((e: any) => e.statut_validation === 'accepted').length}/{ech.totalEssais} essais validés
                      </p>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => setSelectedEchantillon(ech)}>
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

      <Dialog open={!!selectedEchantillon} onOpenChange={() => setSelectedEchantillon(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Détails de l'échantillon {selectedEchantillon?.code}</DialogTitle>
            <DialogDescription>Vérification des résultats</DialogDescription>
          </DialogHeader>
          {selectedEchantillon && (
            <EchantillonDetails 
              echantillon={selectedEchantillon} 
              onUpdate={refreshEchantillons} 
              onClose={() => setSelectedEchantillon(null)} 
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function EchantillonDetails({ echantillon, onUpdate, onClose }: { 
  echantillon: EchantillonWithEssais; 
  onUpdate: () => void; 
  onClose: () => void; 
}) {
  const [selectedEssaiId, setSelectedEssaiId] = useState<string | null>(null);
  const [envoyeAuTraitement, setEnvoyeAuTraitement] = useState(echantillon.statut === 'traitement');
  const selectedEssai = echantillon.essais.find(e => e.id === selectedEssaiId);

  if (selectedEssai) {
    return (
      <EssaiDetailsView 
        key={selectedEssai.id}
        essai={selectedEssai}
        echantillon={echantillon}
        onBack={() => setSelectedEssaiId(null)}
        onUpdate={onUpdate}
      />
    );
  }

  const acceptedCount = echantillon.essais.filter((e: any) => e.statut_validation === 'accepted').length;
  const allAccepted = acceptedCount === echantillon.totalEssais; // Vérifier contre le total demandé
  const isAlreadyInTraitement = echantillon.statut === 'traitement';

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Code échantillon</Label>
          <p>{echantillon.code}</p>
        </div>
        <div>
          <Label>Nature</Label>
          <p>{echantillon.nature}</p>
        </div>
      </div>

      <div>
        <h3 className="font-semibold mb-4">Essais terminés</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {echantillon.essais.map((essai: any) => {
            const isAccepted = essai.statut_validation === 'accepted';
            const isRejected = essai.statut_validation === 'rejected';
            const isPending = !isAccepted && !isRejected;
            const wasRejected = essai.date_rejet; // A été rejeté à un moment donné
            
            return (
              <Button
                key={essai.id}
                variant="outline"
                className="h-24 flex flex-col justify-center p-4 relative"
                onClick={() => setSelectedEssaiId(essai.id)}
                style={{
                  borderColor: isAccepted ? '#28A745' : isRejected ? '#DC3545' : '#FFC107',
                  backgroundColor: isAccepted ? '#28A745' : isRejected ? '#DC3545' : '#FFC10720',
                  color: (isRejected || isAccepted) ? '#FFFFFF' : 'inherit'
                }}
              >
                {wasRejected && isAccepted && (
                  <Badge 
                    className="absolute top-1 right-1 text-xs"
                    style={{ backgroundColor: '#FD7E14', color: '#FFFFFF', fontSize: '9px', padding: '2px 6px' }}
                  >
                    REPRIS
                  </Badge>
                )}
                <span className="font-semibold">{essai.type}</span>
                <span className="text-xs" style={{ color: (isRejected || isAccepted) ? '#FFFFFF' : undefined }}>
                  {isRejected ? 'Rejeté ✗' : isAccepted ? 'Accepté ✓' : 'En attente ⏳'}
                </span>
                {wasRejected && isAccepted && (
                  <span className="text-xs mt-1" style={{ color: '#FFFFFF', fontSize: '10px' }}>
                    (Corrigé après rejet)
                  </span>
                )}
              </Button>
            );
          })}
        </div>
        
        <p className="text-sm mt-4" style={{ color: allAccepted ? '#28A745' : '#FD7E14' }}>
          {acceptedCount}/{echantillon.totalEssais} essais acceptés
          {!allAccepted && ' - Tous les essais doivent être acceptés pour envoyer au traitement'}
        </p>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
        {envoyeAuTraitement || isAlreadyInTraitement ? (
          <Badge style={{ backgroundColor: '#FD7E14', color: '#FFFFFF', padding: '8px 16px' }}>
            Déjà envoyé au traitement
          </Badge>
        ) : (
          <Button
            onClick={async () => {
              try {
                const response = await fetch(`http://127.0.0.1:8000/api/echantillons/${echantillon.id}/`, {
                  method: 'PATCH',
                  headers: {
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({ statut: 'traitement' })
                });
                if (response.ok) {
                  setEnvoyeAuTraitement(true);
                  toast.success(`Échantillon ${echantillon.code} envoyé au traitement`);
                  await onUpdate();
                  onClose();
                } else {
                  toast.error('Erreur lors de l\'envoi');
                }
              } catch (error) {
                toast.error('Erreur lors de l\'envoi');
              }
            }}
            disabled={!allAccepted || envoyeAuTraitement || isAlreadyInTraitement}
            style={{ 
              backgroundColor: !allAccepted || envoyeAuTraitement || isAlreadyInTraitement ? '#6C757D' : '#28A745', 
              color: '#FFFFFF',
              opacity: !allAccepted || envoyeAuTraitement || isAlreadyInTraitement ? 0.5 : 1
            }}
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Envoyer au traitement
          </Button>
        )}
      </div>
    </div>
  );
}

function EssaiDetailsView({ essai, onBack, onUpdate, echantillon }: { 
  essai: any; 
  onBack: () => void; 
  onUpdate: () => void;
  echantillon: EchantillonWithEssais;
}) {
  const [validationComment, setValidationComment] = useState(essai.commentaires_validation || '');
  const [validationStatus, setValidationStatus] = useState(essai.statut_validation || 'pending');
  const [showSendModal, setShowSendModal] = useState(false);
  
  const handleValidation = async (status: 'accepted' | 'rejected') => {
    if (status === 'rejected') {
      if (!validationComment.trim()) {
        toast.error('Veuillez indiquer le motif du rejet');
        return;
      }
      
      // Remettre l'essai en attente avec statut rejeté
      await essaiApi.update(essai.id, {
        statut: 'attente',
        statut_validation: status,
        commentaires_validation: validationComment,
        date_rejet: new Date().toISOString().split('T')[0],
      });
      
      // Remettre l'échantillon en essais
      await fetch(`http://127.0.0.1:8000/api/echantillons/${echantillon.id}/`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ statut: 'essais' })
      });
      
      toast.error(`Essai ${essai.type} rejeté et renvoyé à l'opérateur`);
    } else {
      await essaiApi.update(essai.id, {
        statut_validation: status,
        commentaires_validation: validationComment,
      });
      toast.success('Essai accepté');
    }
    
    setValidationStatus(status);
    await onUpdate();
    
    if (status === 'accepted') {
      const updatedEssais = echantillon.essais.map(e => 
        e.id === essai.id ? { ...e, statut_validation: status } : e
      );
      const allAccepted = updatedEssais.every(e => e.statut_validation === 'accepted');
      
      if (allAccepted) {
        setShowSendModal(true);
      }
    }
    onBack();
  };
  
  return (
    <>
      <Dialog open={showSendModal} onOpenChange={setShowSendModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Envoyer au traitement</DialogTitle>
            <DialogDescription>
              Tous les essais de l'échantillon {echantillon.code} ont été validés
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <p>Voulez-vous envoyer cet échantillon au traitement maintenant ?</p>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => {
                setShowSendModal(false);
                onUpdate();
                onBack();
              }}>
                Plus tard
              </Button>
              <Button 
                onClick={async () => {
                  try {
                    const response = await fetch(`http://127.0.0.1:8000/api/echantillons/${echantillon.id}/`, {
                      method: 'PATCH',
                      headers: {
                        'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({ statut: 'traitement' })
                    });
                    if (response.ok) {
                      toast.success(`Échantillon ${echantillon.code} envoyé au traitement`);
                      setShowSendModal(false);
                      await onUpdate();
                      onBack();
                    } else {
                      toast.error('Erreur lors de l\'envoi');
                    }
                  } catch (error) {
                    toast.error('Erreur lors de l\'envoi');
                  }
                }}
                style={{ backgroundColor: '#28A745', color: '#FFFFFF' }}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Envoyer maintenant
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      <div className="space-y-6">
        <div className="flex items-center gap-2 mb-4">
          <Button variant="outline" size="sm" onClick={onBack}>← Retour</Button>
          <h3 className="font-semibold">Essai {essai.type}</h3>
        </div>
      
      {essai.date_rejet && (
        <div className="p-4 rounded-lg mb-4" style={{ backgroundColor: '#FFF3CD', border: '1px solid #FFC107' }}>
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="h-5 w-5" style={{ color: '#856404' }} />
            <span className="font-semibold" style={{ color: '#856404' }}>Essai repris après rejet</span>
          </div>
          <p className="text-sm" style={{ color: '#856404' }}>
            Cet essai a été rejeté le {essai.date_rejet} et a été repris par l'opérateur.
            Les valeurs ci-dessous sont les nouvelles valeurs corrigées.
          </p>
          {essai.commentaires_validation && (
            <div className="mt-2 pt-2 border-t" style={{ borderColor: '#FFC107' }}>
              <p className="text-xs font-semibold" style={{ color: '#856404' }}>Motif du rejet précédent:</p>
              <p className="text-xs mt-1" style={{ color: '#856404' }}>{essai.commentaires_validation}</p>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Statut</Label>
          <Badge style={{ backgroundColor: '#28A745', color: '#FFFFFF' }}>Terminé</Badge>
        </div>
        <div className="space-y-2">
          <Label>Opérateur</Label>
          <p>{essai.operateur}</p>
        </div>
        <div className="space-y-2">
          <Label>Date début</Label>
          <p>{essai.date_debut}</p>
        </div>
        <div className="space-y-2">
          <Label>Date fin</Label>
          <p>{essai.date_fin}</p>
        </div>
      </div>

      <div className="space-y-4">
        {console.log('Essai fichier:', essai.fichier)}
        {console.log('Essai complet:', essai)}
        <h3 className="font-semibold">Résultats</h3>
        
        {essai.type === 'AG' && essai.resultats && (
          <>
            <div className="space-y-2">
              <Label>% passant à 2mm</Label>
              <p>{essai.resultats.pourcent_inf_2mm || '-'}</p>
            </div>
            <div className="space-y-2">
              <Label>% passant à 80µm</Label>
              <p>{essai.resultats.pourcent_inf_80um || '-'}</p>
            </div>
            <div className="space-y-2">
              <Label>Coefficient d'uniformité (Cu)</Label>
              <p>{essai.resultats.coefficient_uniformite || '-'}</p>
            </div>
          </>
        )}

        {essai.type === 'Proctor' && essai.resultats && (
          <>
            <div className="space-y-2">
              <Label>Type Proctor</Label>
              <p>{essai.resultats.type_proctor || '-'}</p>
            </div>
            <div className="space-y-2">
              <Label>Densité sèche optimale (g/cm³)</Label>
              <p>{essai.resultats.densite_opt || '-'}</p>
            </div>
            <div className="space-y-2">
              <Label>Teneur en eau optimale (%)</Label>
              <p>{essai.resultats.teneur_eau_opt || '-'}</p>
            </div>
          </>
        )}

        {essai.type === 'CBR' && essai.resultats && (
          <>
            <div className="space-y-2">
              <Label>CBR à 95% OPM (%)</Label>
              <p>{essai.resultats.cbr_95 || '-'}</p>
            </div>
            <div className="space-y-2">
              <Label>CBR à 98% OPM (%)</Label>
              <p>{essai.resultats.cbr_98 || '-'}</p>
            </div>
            <div className="space-y-2">
              <Label>CBR à 100% OPM (%)</Label>
              <p>{essai.resultats.cbr_100 || '-'}</p>
            </div>
            <div className="space-y-2">
              <Label>Gonflement (%)</Label>
              <p>{essai.resultats.gonflement || '-'}</p>
            </div>
          </>
        )}

        {essai.type === 'Oedometre' && essai.resultats && (
          <>
            <div className="space-y-2">
              <Label>Indice de compression (Cc)</Label>
              <p>{essai.resultats.cc || '-'}</p>
            </div>
            <div className="space-y-2">
              <Label>Indice de gonflement (Cs)</Label>
              <p>{essai.resultats.cs || '-'}</p>
            </div>
            <div className="space-y-2">
              <Label>Contrainte de préconsolidation (kPa)</Label>
              <p>{essai.resultats.gp || '-'}</p>
            </div>
          </>
        )}

        {essai.type === 'Cisaillement' && essai.resultats && (
          <>
            <div className="space-y-2">
              <Label>Cohésion (kPa)</Label>
              <p>{essai.resultats.cohesion || '-'}</p>
            </div>
            <div className="space-y-2">
              <Label>Angle de frottement φ (°)</Label>
              <p>{essai.resultats.phi || '-'}</p>
            </div>
          </>
        )}

        <div className="space-y-2">
          <Label>Commentaires</Label>
          <p>{essai.commentaires || '-'}</p>
        </div>

        <div className="space-y-2">
          <Label>Fichier joint</Label>
          {essai.fichier ? (
            <div className="space-y-2">
              <p className="text-xs" style={{ color: '#6C757D' }}>Fichier: {essai.fichier}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const fichierUrl = essai.fichier.startsWith('http') 
                    ? essai.fichier 
                    : `http://127.0.0.1:8000${essai.fichier}`;
                  window.open(fichierUrl, '_blank');
                  toast.success('Ouverture du fichier');
                }}
              >
                <FileText className="h-4 w-4 mr-2" />
                Télécharger le fichier
              </Button>
            </div>
          ) : (
            <p className="text-sm" style={{ color: '#DC3545' }}>Aucun fichier joint (essai.fichier = {JSON.stringify(essai.fichier)})</p>
          )}
        </div>
      </div>
      
      <div className="space-y-4 pt-4 border-t">
        <h3 className="font-semibold">Validation</h3>
        
        <div className="space-y-2">
          <Label>Commentaire de validation</Label>
          <Textarea
            value={validationComment}
            onChange={(e) => setValidationComment(e.target.value)}
            placeholder="Ajouter un commentaire..."
          />
        </div>
        
        <div className="flex gap-2">
          <Button
            onClick={() => handleValidation('accepted')}
            style={{
              backgroundColor: '#28A745',
              color: '#FFFFFF'
            }}
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Accepter
          </Button>
          <Button
            onClick={() => handleValidation('rejected')}
            style={{
              backgroundColor: '#DC3545',
              color: '#FFFFFF'
            }}
          >
            <XCircle className="h-4 w-4 mr-2" />
            Rejeter et renvoyer
          </Button>
        </div>
      </div>
      </div>
    </>
  );
}
