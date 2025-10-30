import { useState } from 'react';
import { UserRole } from '../../App';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { CheckCircle, XCircle, FileText, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { getEchantillons, getClient, getEssaisByEchantillon, updateEchantillon, Echantillon } from '../../lib/mockData';

interface ValidationModuleProps {
  userRole: UserRole;
}

export function ValidationModule({ userRole }: ValidationModuleProps) {
  const [echantillons] = useState(() =>
    getEchantillons().filter(e => e.statut === 'validation')
  );
  const [selectedEchantillon, setSelectedEchantillon] = useState<Echantillon | null>(null);
  const [observations, setObservations] = useState('');

  // Grouper les échantillons par chef de projet
  const echantillonsParChef = echantillons.reduce((acc, ech) => {
    const chef = ech.chefProjet || 'Non assigné';
    if (!acc[chef]) {
      acc[chef] = [];
    }
    acc[chef].push(ech);
    return acc;
  }, {} as Record<string, Echantillon[]>);

  const getRoleLabel = () => {
    const labels: Record<string, string> = {
      chef_projet: 'Chef de Projet',
      chef_service: 'Chef Service Génie Civil',
      directeur_technique: 'Directeur Technique',
      directeur_general: 'Directeur Général',
    };
    return labels[userRole] || 'Validateur';
  };

  const getNextRole = () => {
    const hierarchy = ['chef_projet', 'chef_service', 'directeur_technique', 'directeur_general'];
    const currentIndex = hierarchy.indexOf(userRole);
    return currentIndex < hierarchy.length - 1 ? hierarchy[currentIndex + 1] : null;
  };

  const handleValidation = (code: string, action: 'valide' | 'rejete') => {
    if (action === 'valide') {
      const nextRole = getNextRole();
      
      if (nextRole === null) {
        // DG - Validation finale
        updateEchantillon(code, { statut: 'valide' });
        toast.success('Validation finale effectuée. Le rapport sera envoyé au client.');
      } else {
        // Transfert au niveau suivant
        toast.success(`Validé et transféré au niveau suivant`, {
          description: observations || 'Aucune observation',
        });
      }
    } else {
      updateEchantillon(code, { statut: 'rejete' });
      toast.error('Rapport rejeté', {
        description: observations || 'Aucune observation',
      });
    }

    setSelectedEchantillon(null);
    setObservations('');
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1>Module Validation</h1>
        <p style={{ color: '#A9A9A9' }}>
          Niveau: {getRoleLabel()}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Rapports en attente de validation</CardTitle>
          <CardDescription>
            {echantillons.length} rapport(s) à valider
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {Object.keys(echantillonsParChef).length === 0 ? (
              <div className="text-center py-12" style={{ color: '#A9A9A9' }}>
                Aucun rapport en attente de validation
              </div>
            ) : (
              Object.entries(echantillonsParChef).map(([chef, echantillonsChef]) => (
                <div key={chef} className="space-y-4">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold" style={{ color: '#003366' }}>
                      Chef de Projet: {chef}
                    </h3>
                    <Badge variant="outline">
                      {echantillonsChef.length} rapport(s)
                    </Badge>
                  </div>

                  <div className="space-y-4 pl-4 border-l-2" style={{ borderColor: '#003366' }}>
                    {echantillonsChef.map((ech) => {
                      const client = getClient(ech.clientCode);

                      return (
                        <div
                          key={ech.id}
                          className="p-4 rounded-lg"
                          style={{ backgroundColor: '#F5F5F5' }}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-3">
                                <Badge
                                  style={{ backgroundColor: '#FFC107', color: '#FFFFFF' }}
                                >
                                  <AlertCircle className="h-3 w-3 mr-1" />
                                  En attente
                                </Badge>
                              </div>
                              <div className="grid grid-cols-2 gap-4 text-sm">
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
                                  <Label>Nature échantillon</Label>
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
                            <Button
                              size="sm"
                              onClick={() => setSelectedEchantillon(ech)}
                              style={{ backgroundColor: '#003366' }}
                            >
                              <FileText className="h-4 w-4 mr-2" />
                              Examiner
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!selectedEchantillon} onOpenChange={() => setSelectedEchantillon(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Validation du rapport</DialogTitle>
            <DialogDescription>
              Niveau: {getRoleLabel()}
            </DialogDescription>
          </DialogHeader>
          {selectedEchantillon && (
            <div className="space-y-6">
              <div className="p-4 rounded-lg" style={{ backgroundColor: '#F5F5F5' }}>
                <h3 className="font-semibold mb-3">Informations client</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {(() => {
                    const client = getClient(selectedEchantillon.clientCode);
                    return (
                      <>
                        <div>
                          <Label>Client</Label>
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
                      </>
                    );
                  })()}
                </div>
              </div>

              <div className="p-4 rounded-lg" style={{ backgroundColor: '#F5F5F5' }}>
                <h3 className="font-semibold mb-3">Détails échantillon</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <Label>Nature</Label>
                    <p>{selectedEchantillon.nature}</p>
                  </div>
                  <div>
                    <Label>Profondeurs</Label>
                    <p>{selectedEchantillon.profondeurDebut}m - {selectedEchantillon.profondeurFin}m</p>
                  </div>
                  <div>
                    <Label>Type sondage</Label>
                    <p>{selectedEchantillon.sondage === 'carotte' ? 'Carotté' : 'Vrac'}</p>
                  </div>
                  <div>
                    <Label>Nappe</Label>
                    <p>{selectedEchantillon.nappe || 'Non spécifiée'}</p>
                  </div>
                </div>
                <div className="mt-3">
                  <Label>Essais réalisés</Label>
                  <div className="flex gap-2 mt-2">
                    {selectedEchantillon.essais.map((essai) => (
                      <Badge key={essai} variant="outline">
                        {essai}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Rapport technique</Label>
                <div className="p-4 rounded-lg border-2 border-dashed" style={{ borderColor: '#A9A9A9' }}>
                  <div className="flex items-center gap-3">
                    <FileText className="h-8 w-8" style={{ color: '#A9A9A9' }} />
                    <div>
                      <p className="text-sm">Rapport_Echantillon_{selectedEchantillon.code}.pdf</p>
                      <p className="text-xs" style={{ color: '#A9A9A9' }}>
                        Cliquer pour visualiser le rapport complet
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="observations">Observations</Label>
                <Textarea
                  id="observations"
                  value={observations}
                  onChange={(e) => setObservations(e.target.value)}
                  placeholder="Ajouter des observations ou remarques..."
                  rows={4}
                />
              </div>

              <div className="flex gap-3 justify-end">
                <Button
                  variant="destructive"
                  onClick={() => handleValidation(selectedEchantillon.code, 'rejete')}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Rejeter
                </Button>
                <Button
                  style={{ backgroundColor: '#28A745', color: '#FFFFFF' }}
                  onClick={() => handleValidation(selectedEchantillon.code, 'valide')}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Valider
                  {getNextRole() === null && ' (Final)'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
