import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { FileDown, Send, FileText, Upload, CheckCircle, XCircle, Download } from 'lucide-react';
import { toast } from 'sonner';
import { getEchantillons, getClient, updateEchantillon, getEssaisByEchantillon, Echantillon } from '../../lib/mockData';

export function TraitementModule() {
  const [echantillons, setEchantillons] = useState(() =>
    getEchantillons().filter(e => e.statut === 'traitement')
  );
  const [selectedEchantillon, setSelectedEchantillon] = useState<Echantillon | null>(null);

  const handleEnvoiValidation = (code: string, chefProjet: string) => {
    updateEchantillon(code, { statut: 'validation' });
    toast.success(`Rapport envoyé en validation à ${chefProjet}`);
    refreshEchantillons();
    setSelectedEchantillon(null);
  };

  const handleReject = (code: string) => {
    updateEchantillon(code, { statut: 'decodification' });
    toast.error(`Échantillon ${code} rejeté et renvoyé à la décodification`);
    refreshEchantillons();
    setSelectedEchantillon(null);
  };

  const refreshEchantillons = () => {
    setEchantillons(getEchantillons().filter(e => e.statut === 'traitement'));
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1>Module Traitement</h1>
        <p style={{ color: '#A9A9A9' }}>
          
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Échantillons en traitement</CardTitle>
          <CardDescription>
            {echantillons.length} échantillon(s) à traiter
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {echantillons.length === 0 ? (
              <div className="text-center py-12" style={{ color: '#A9A9A9' }}>
                Aucun échantillon en traitement
              </div>
            ) : (
              echantillons.map((ech) => {
                const client = getClient(ech.clientCode);

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
                          <Badge style={{ backgroundColor: '#003366', color: '#FFFFFF' }}>
                            En traitement
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
                          <div>
                            <Label>Client</Label>
                            <p>{client?.nom || 'N/A'}</p>
                          </div>
                          <div>
                            <Label>Contact</Label>
                            <p>{client?.contact || 'N/A'}</p>
                          </div>
                          <div>
                            <Label>Projet</Label>
                            <p>{client?.projet || 'N/A'}</p>
                          </div>
                          <div>
                            <Label>Nature</Label>
                            <p>{ech.nature}</p>
                          </div>
                        </div>
                        <div className="flex gap-2 mt-3">
                          {ech.essais.map((essai) => (
                            <Badge key={essai} variant="outline">
                              {essai}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleReject(ech.code)}
                          style={{ borderColor: '#DC3545', color: '#DC3545' }}
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Rejeter
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => setSelectedEchantillon(ech)}
                          style={{ backgroundColor: '#003366' }}
                        >
                          <FileDown className="h-4 w-4 mr-2" />
                          Traiter
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
            <DialogTitle>Traitement de l'échantillon {selectedEchantillon?.code}</DialogTitle>
            <DialogDescription>
              Préparation du rapport et envoi au chef de projet
            </DialogDescription>
          </DialogHeader>
          {selectedEchantillon && (
            <TraitementDetails
              echantillon={selectedEchantillon}
              onEnvoi={handleEnvoiValidation}
              onClose={() => setSelectedEchantillon(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TraitementDetails({ echantillon, onEnvoi, onClose }: { echantillon: Echantillon; onEnvoi: (code: string, chef: string) => void; onClose: () => void }) {
  const client = getClient(echantillon.clientCode);
  const essais = getEssaisByEchantillon(echantillon.code);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [rejectionMotifs, setRejectionMotifs] = useState<Record<string, string>>({});

  return (
    <div className="space-y-6">
      {/* Informations client et échantillon */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Informations Client</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div>
              <Label>Nom</Label>
              <p>{client?.nom}</p>
            </div>
            <div>
              <Label>Contact</Label>
              <p>{client?.contact}</p>
            </div>
            <div>
              <Label>Projet</Label>
              <p>{client?.projet}</p>
            </div>
            <div>
              <Label>Email</Label>
              <p>{client?.email}</p>
            </div>
            <div>
              <Label>Téléphone</Label>
              <p>{client?.telephone}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Informations Échantillon</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div>
              <Label>Code</Label>
              <p>{echantillon.code}</p>
            </div>
            <div>
              <Label>Nature</Label>
              <p>{echantillon.nature}</p>
            </div>
            <div>
              <Label>Profondeurs</Label>
              <p>{echantillon.profondeurDebut}m - {echantillon.profondeurFin}m</p>
            </div>
            <div>
              <Label>Type sondage</Label>
              <p>{echantillon.sondage === 'carotte' ? 'Carotté' : 'Vrac'}</p>
            </div>
            <div>
              <Label>Nappe phréatique</Label>
              <p>{echantillon.nappe || 'Non spécifiée'}</p>
            </div>
            <div>
              <Label>Chef de projet</Label>
              <p className="font-semibold" style={{ color: '#003366' }}>
                {echantillon.chefProjet}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Résultats des essais */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Résultats des Essais</CardTitle>
          <CardDescription>
            {essais.length} essai(s) réalisé(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {essais.map((essai) => (
              <div key={essai.id} className="p-4 rounded-lg" style={{ backgroundColor: '#F5F5F5' }}>
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-semibold">{essai.type}</h4>
                    <p className="text-sm" style={{ color: '#A9A9A9' }}>
                      Opérateur: {essai.operateur}
                    </p>
                  </div>
                  <Badge style={{ backgroundColor: '#28A745', color: '#FFFFFF' }}>
                    Terminé
                  </Badge>
                </div>

                {essai.resultats && Object.keys(essai.resultats).length > 0 && (
                  <div className="grid grid-cols-2 gap-3 text-sm mt-3">
                    {Object.entries(essai.resultats).map(([key, value]) => (
                      <div key={key}>
                        <Label className="text-xs capitalize">
                          {key.replace(/_/g, ' ')}
                        </Label>
                        <p className="font-semibold">{value || '-'}</p>
                      </div>
                    ))}
                  </div>
                )}

                {essai.commentaires && (
                  <div className="mt-3 pt-3 border-t" style={{ borderColor: '#E0E0E0' }}>
                    <Label className="text-xs">Commentaires</Label>
                    <p className="text-sm mt-1" style={{ color: '#A9A9A9' }}>
                      {essai.commentaires}
                    </p>
                  </div>
                )}

                <div className="flex items-center gap-2 mt-3 text-xs" style={{ color: '#A9A9A9' }}>
                  <span>Dates: {essai.dateDebut} → {essai.dateFin}</span>
                </div>

                {essai.fichier && (
                  <div className="mt-3">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        // Simulation du téléchargement
                        toast.success(`Téléchargement de ${essai.fichier} démarré`);
                      }}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Télécharger {essai.fichier}
                    </Button>
                  </div>
                )}

                <div className="flex gap-2 mt-3">
                  <div className="flex-1">
                    <Label className="text-xs">Motif de rejet (optionnel)</Label>
                    <Input
                      placeholder="Raison du rejet..."
                      value={rejectionMotifs[essai.id] || ''}
                      onChange={(e) => setRejectionMotifs(prev => ({ ...prev, [essai.id]: e.target.value }))}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="flex gap-2 mt-3">
                  <Button
                    size="sm"
                    variant="outline"
                    style={{ borderColor: '#DC3545', color: '#DC3545' }}
                    onClick={() => {
                      const motif = rejectionMotifs[essai.id];
                      if (!motif) {
                        toast.error('Veuillez saisir un motif de rejet');
                        return;
                      }
                      // Logique pour rejeter cet essai spécifique
                      toast.error(`Essai ${essai.type} rejeté: ${motif}`);
                    }}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Rejeter
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    style={{ borderColor: '#28A745', color: '#28A745' }}
                    onClick={() => {
                      // Logique pour accepter cet essai spécifique
                      toast.success(`Essai ${essai.type} accepté`);
                    }}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Accepter
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Rapport technique</Label>
            <Button variant="outline" className="w-full">
              <FileDown className="h-4 w-4 mr-2" />
              Télécharger le modèle de rapport
            </Button>
            <p className="text-xs" style={{ color: '#A9A9A9' }}>
              Complétez le rapport avec les résultats ci-dessus
            </p>
          </div>

          <div className="space-y-2">
            <Label>Upload du rapport final</Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setUploadedFile(file);
                    toast.success(`Fichier ${file.name} sélectionné`);
                  }
                }}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <Upload className="h-8 w-8 mx-auto mb-2" style={{ color: '#003366' }} />
                <p className="text-sm">
                  {uploadedFile ? uploadedFile.name : 'Cliquez pour sélectionner un fichier'}
                </p>
                <p className="text-xs" style={{ color: '#A9A9A9' }}>
                  Formats acceptés: PDF, DOC, DOCX
                </p>
              </label>
            </div>
          </div>

          <div className="p-4 rounded-lg" style={{ backgroundColor: '#F5F5F5' }}>
            <div className="flex items-center gap-3 mb-2">
              <FileText className="h-5 w-5" style={{ color: '#003366' }} />
              <div className="flex-1">
                <p className="font-semibold">Chef de projet assigné</p>
                <p className="text-sm" style={{ color: '#A9A9A9' }}>
                  {echantillon.chefProjet}
                </p>
              </div>
            </div>
            <p className="text-xs" style={{ color: '#A9A9A9' }}>
              Le rapport sera envoyé à ce chef de projet pour validation
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                // Logique pour rejeter l'échantillon entier
                updateEchantillon(echantillon.code, { statut: 'decodification' });
                toast.error(`Échantillon ${echantillon.code} rejeté et renvoyé à la décodification`);
                onClose();
              }}
              style={{ borderColor: '#DC3545', color: '#DC3545' }}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Rejeter tout
            </Button>
            <Button
              className="flex-1"
              onClick={() => {
                if (!uploadedFile) {
                  toast.error('Veuillez uploader le rapport final');
                  return;
                }
                onEnvoi(echantillon.code, echantillon.chefProjet || '');
              }}
              style={{ backgroundColor: '#003366' }}
              disabled={!uploadedFile}
            >
              <Send className="h-4 w-4 mr-2" />
              Envoyer en validation
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
