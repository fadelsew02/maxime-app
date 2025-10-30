import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Label } from '../ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Textarea } from '../ui/textarea';
import { AlertCircle, CheckCircle, XCircle, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { getEchantillons, getEssaisByEchantillon, updateEchantillon, updateEssai, Echantillon } from '../../lib/mockData';

export function DecodificationModule() {
  const [echantillons, setEchantillons] = useState(() =>
    getEchantillons().filter(e => {
      const essais = getEssaisByEchantillon(e.code);
      return essais.length > 0 && essais.every(essai => essai.statut === 'termine');
    })
  );
  const [selectedEchantillon, setSelectedEchantillon] = useState<Echantillon | null>(null);

  // Ces fonctions ne sont plus utilisées car la validation se fait maintenant dans le détail
  // const handleAccept = (code: string) => {
  //   updateEchantillon(code, { statut: 'traitement' });
  //   toast.success(`Échantillon ${code} accepté et transféré au traitement`);
  //   refreshEchantillons();
  //   setSelectedEchantillon(null);
  // };

  // const handleReject = (code: string) => {
  //   updateEchantillon(code, { statut: 'rejete' });
  //   toast.error(`Échantillon ${code} rejeté`);
  //   refreshEchantillons();
  //   setSelectedEchantillon(null);
  // };

  const refreshEchantillons = () => {
    setEchantillons(
      getEchantillons().filter(e => {
        const essais = getEssaisByEchantillon(e.code);
        return essais.length > 0 && essais.every(essai => essai.statut === 'termine');
      })
    );
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1>Module Décodification</h1>
        <p style={{ color: '#A9A9A9' }}>
          Validation des résultats avant traitement
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Échantillons prêts pour décodification</CardTitle>
          <CardDescription>
            {echantillons.length} échantillon(s) en attente de validation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {echantillons.length === 0 ? (
              <div className="text-center py-12" style={{ color: '#A9A9A9' }}>
                Aucun échantillon en attente de décodification
              </div>
            ) : (
              echantillons.map((ech) => {
                const essais = getEssaisByEchantillon(ech.code);
                
                return (
                  <div
                    key={ech.id}
                    className="p-4 rounded-lg"
                    style={{ backgroundColor: '#F5F5F5' }}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span>{ech.code}</span>
                          <Badge
                            style={{ backgroundColor: '#FFC107', color: '#FFFFFF' }}
                          >
                            <AlertCircle className="h-3 w-3 mr-1" />
                            En attente
                          </Badge>
                        </div>
                        <p className="text-sm mb-3" style={{ color: '#A9A9A9' }}>
                          {ech.nature} - {ech.profondeurDebut} - {ech.profondeurFin}
                        </p>
                        <div className="flex gap-2 mb-3">
                          {essais.map((essai) => (
                            <Badge key={essai.id} variant="outline" style={{ borderColor: '#28A745' }}>
                              {essai.type} ✓
                            </Badge>
                          ))}
                        </div>
                        <p className="text-xs" style={{ color: '#A9A9A9' }}>
                          Tous les essais sont terminés
                        </p>
                      </div>
                      <div className="flex gap-2">
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
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!selectedEchantillon} onOpenChange={() => setSelectedEchantillon(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Détails de l'échantillon {selectedEchantillon?.code}</DialogTitle>
            <DialogDescription>
              Vérification des résultats avant validation
            </DialogDescription>
          </DialogHeader>
          {selectedEchantillon && <EchantillonDetails echantillon={selectedEchantillon} onUpdate={refreshEchantillons} onClose={() => setSelectedEchantillon(null)} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function EchantillonDetails({ echantillon, onUpdate, onClose }: { echantillon: Echantillon; onUpdate: () => void; onClose: () => void }) {
  const [essaiComments, setEssaiComments] = useState<Record<string, string>>({});
  const [essaiStatuses, setEssaiStatuses] = useState<Record<string, 'accepted' | 'rejected' | null>>({});

  const essais = getEssaisByEchantillon(echantillon.code);

  const handleEssaiValidation = (essaiId: string, status: 'accepted' | 'rejected') => {
    const comment = essaiComments[essaiId] || '';
    setEssaiStatuses(prev => ({ ...prev, [essaiId]: status }));

    // Mettre à jour l'essai avec le commentaire et le statut
    updateEssai(essaiId, {
      commentairesValidation: comment,
      statutValidation: status
    });

    toast.success(`Essai ${essais.find(e => e.id === essaiId)?.type} ${status === 'accepted' ? 'accepté' : 'rejeté'}`);
  };

  const handleGlobalAccept = () => {
    // Vérifier si tous les essais ont été validés
    const allValidated = essais.every(essai => essaiStatuses[essai.id]);
    if (!allValidated) {
      toast.error('Veuillez valider tous les essais avant d\'accepter l\'échantillon');
      return;
    }

    // Vérifier s'il y a des rejets
    const hasRejections = Object.values(essaiStatuses).some(status => status === 'rejected');
    if (hasRejections) {
      // Si des essais sont rejetés, marquer l'échantillon comme rejeté
      updateEchantillon(echantillon.code, { statut: 'rejete' });
      toast.error(`Échantillon ${echantillon.code} rejeté (certains essais rejetés)`);
    } else {
      // Tous les essais acceptés, marquer comme validé
      updateEchantillon(echantillon.code, { statut: 'traitement' });
      toast.success(`Échantillon ${echantillon.code} validé avec succès`);
      onUpdate();
      onClose();
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Code échantillon</Label>
          <p>{echantillon.code}</p>
        </div>
        <div>
          <Label>QR Code</Label>
          <p>{echantillon.qrCode}</p>
        </div>
        <div>
          <Label>Nature</Label>
          <p>{echantillon.nature}</p>
        </div>
        <div>
          <Label>Profondeurs</Label>
          <p>{echantillon.profondeurDebut} - {echantillon.profondeurFin}</p>
        </div>
        <div>
          <Label>Type de sondage</Label>
          <p>{echantillon.sondage === 'carotte' ? 'Carotté' : 'Vrac'}</p>
        </div>
        <div>
          <Label>Nappe phréatique</Label>
          <p>{echantillon.nappe || 'Non spécifiée'}</p>
        </div>
      </div>

      <div>
        <h3 className="font-semibold mb-4">Résultats des essais</h3>
        <div className="space-y-4">
          {essais.map((essai) => (
            <Card key={essai.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-base">{essai.type}</CardTitle>
                  <Badge style={{ backgroundColor: '#28A745', color: '#FFFFFF' }}>
                    Terminé
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <Label>Opérateur</Label>
                    <p>{essai.operateur || '-'}</p>
                  </div>
                  <div>
                    <Label>Date fin</Label>
                    <p>{essai.dateFin || '-'}</p>
                  </div>

                  {essai.resultats && Object.keys(essai.resultats).length > 0 && (
                    <>
                      {Object.entries(essai.resultats).map(([key, value]) => (
                        <div key={key}>
                          <Label className="capitalize">{key.replace(/_/g, ' ')}</Label>
                          <p>{value || '-'}</p>
                        </div>
                      ))}
                    </>
                  )}

                  {essai.commentaires && (
                    <div className="col-span-2">
                      <Label>Commentaires de l'opérateur</Label>
                      <p className="text-sm" style={{ color: '#A9A9A9' }}>
                        {essai.commentaires}
                      </p>
                    </div>
                  )}

                  {essai.commentairesValidation && (
                    <div className="col-span-2">
                      <Label>Commentaires de validation</Label>
                      <p className="text-sm" style={{ color: '#28A745' }}>
                        {essai.commentairesValidation}
                      </p>
                    </div>
                  )}
                </div>

                {essai.fichiers && essai.fichiers.length > 0 && (
                  <div className="mt-3">
                    <Label>Fichiers attachés</Label>
                    <div className="flex gap-2 mt-2">
                      {essai.fichiers.map((fichier, index) => (
                        <Badge key={index} variant="outline">
                          <FileText className="h-3 w-3 mr-1" />
                          {fichier}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Section commentaires et validation pour chaque essai */}
                <div className="mt-4 pt-3 border-t">
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor={`comment-${essai.id}`}>Commentaires de validation</Label>
                      <Textarea
                        id={`comment-${essai.id}`}
                        placeholder="Ajouter un commentaire pour cet essai..."
                        value={essaiComments[essai.id] || ''}
                        onChange={(e) => setEssaiComments(prev => ({ ...prev, [essai.id]: e.target.value }))}
                        className="mt-1"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Statut de validation:</span>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          style={{
                            borderColor: essaiStatuses[essai.id] === 'accepted' ? '#28A745' : '#28A745',
                            backgroundColor: essaiStatuses[essai.id] === 'accepted' ? '#D4EDDA' : 'transparent',
                            color: essaiStatuses[essai.id] === 'accepted' ? '#155724' : '#28A745'
                          }}
                          onClick={() => handleEssaiValidation(essai.id, 'accepted')}
                        >
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Accepter
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          style={{
                            borderColor: essaiStatuses[essai.id] === 'rejected' ? '#DC3545' : '#DC3545',
                            backgroundColor: essaiStatuses[essai.id] === 'rejected' ? '#F8D7DA' : 'transparent',
                            color: essaiStatuses[essai.id] === 'rejected' ? '#721C24' : '#DC3545'
                          }}
                          onClick={() => handleEssaiValidation(essai.id, 'rejected')}
                        >
                          <XCircle className="h-3 w-3 mr-1" />
                          Rejeter
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Boutons de validation globale */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button
          variant="outline"
          onClick={() => {
            updateEchantillon(echantillon.code, { statut: 'rejete' });
            toast.error(`Échantillon ${echantillon.code} rejeté globalement`);
            onUpdate();
            onClose();
          }}
          style={{ borderColor: '#DC3545', color: '#DC3545' }}
        >
          <XCircle className="h-4 w-4 mr-2" />
          Rejeter tout
        </Button>
        <Button
          onClick={handleGlobalAccept}
          style={{ backgroundColor: '#28A745', color: '#FFFFFF' }}
        >
          <CheckCircle className="h-4 w-4 mr-2" />
          Valider et transférer
        </Button>
      </div>
    </div>
  );
}
