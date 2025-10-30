import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Calendar } from '../ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Upload, CheckCircle, CalendarIcon, Send } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { getEssaisBySection, updateEssai, updateEchantillon, EssaiTest, getEssaisByEchantillon } from '../../lib/mockData';
import { format, addDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useNotifications } from '../../contexts/NotificationContext';

export function EssaisRouteModule() {
  const { addNotification } = useNotifications();
  const [essais, setEssais] = useState(() => getEssaisBySection('route'));
  const [filter, setFilter] = useState<'all' | 'attente' | 'en_cours' | 'termine'>('all');

  const filteredEssais = essais.filter(e => {
    if (filter === 'all') return true;
    return e.statut === filter;
  });

  const refreshEssais = () => {
    setEssais(getEssaisBySection('route'));
  };

  // Rafraîchir automatiquement les données toutes les 5 secondes
  useEffect(() => {
    const interval = setInterval(() => {
      refreshEssais();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1>Section Route</h1>
        <p style={{ color: '#A9A9A9' }}>
          Essais de laboratoire - Route
        </p>
      </div>

      <Tabs value={filter} onValueChange={(v: any) => setFilter(v)} className="space-y-6">
        <TabsList>
          <TabsTrigger value="all">Tous ({essais.length})</TabsTrigger>
          <TabsTrigger value="attente">
            En attente ({essais.filter(e => e.statut === 'attente').length})
          </TabsTrigger>
          <TabsTrigger value="en_cours">
            En cours ({essais.filter(e => e.statut === 'en_cours').length})
          </TabsTrigger>
          <TabsTrigger value="termine">
            Terminés ({essais.filter(e => e.statut === 'termine').length})
          </TabsTrigger>
        </TabsList>

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredEssais.map((essai) => (
            <EssaiCard key={essai.id} essai={essai} onUpdate={refreshEssais} />
          ))}

          {filteredEssais.length === 0 && (
            <div className="col-span-full text-center py-12" style={{ color: '#A9A9A9' }}>
              Aucun essai à afficher
            </div>
          )}
        </div>
      </Tabs>
    </div>
  );
}

function EssaiCard({ essai, onUpdate }: { essai: EssaiTest; onUpdate: () => void }) {
  const [isOpen, setIsOpen] = useState(false);

  const handleCardClick = () => {
    // Si l'essai est en attente et n'a pas de date de réception, on la met à jour automatiquement
    if (essai.statut === 'attente' && !essai.dateReception) {
      const today = new Date();
      const dateReceptionFormatted = format(today, 'yyyy-MM-dd');
      
      // Mise à jour automatique de la date de réception
      updateEssai(essai.id, {
        dateReception: dateReceptionFormatted
      });
      
      // Rafraîchir les données après mise à jour
      setTimeout(onUpdate, 100);
    }
    setIsOpen(true);
  };

  return (
    <>
      <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={handleCardClick}>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-base">{essai.type}</CardTitle>
              <CardDescription>Code: {essai.echantillonCode}</CardDescription>
            </div>
            {essai.statut === 'attente' && <Badge style={{ backgroundColor: '#FFC107', color: '#FFFFFF' }}>En attente</Badge>}
            {essai.statut === 'en_cours' && <Badge style={{ backgroundColor: '#003366', color: '#FFFFFF' }}>En cours</Badge>}
            {essai.statut === 'termine' && <Badge style={{ backgroundColor: '#28A745', color: '#FFFFFF' }}>Terminé</Badge>}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            {essai.dateReception && (
              <div className="flex justify-between">
                <span style={{ color: '#A9A9A9' }}>Réception:</span>
                <span>{essai.dateReception}</span>
              </div>
            )}
            {essai.dateDebut && (
              <div className="flex justify-between">
                <span style={{ color: '#A9A9A9' }}>Début:</span>
                <span>{essai.dateDebut}</span>
              </div>
            )}
            {essai.dateFin && (
              <div className="flex justify-between">
                <span style={{ color: '#A9A9A9' }}>Fin:</span>
                <span>{essai.dateFin}</span>
              </div>
            )}
            {essai.operateur && (
              <div className="flex justify-between">
                <span style={{ color: '#A9A9A9' }}>Opérateur:</span>
                <span>{essai.operateur}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span style={{ color: '#A9A9A9' }}>Durée estimée:</span>
              <span>{essai.dureeEstimee} jours</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Essai {essai.type} - {essai.echantillonCode}</DialogTitle>
            <DialogDescription>
              Fiche détaillée de l'essai
            </DialogDescription>
          </DialogHeader>
          <EssaiForm essai={essai} onClose={() => { setIsOpen(false); onUpdate(); }} />
        </DialogContent>
      </Dialog>
    </>
  );
}

function EssaiForm({ essai, onClose }: { essai: EssaiTest; onClose: () => void }) {
  const today = new Date();
  
  // Calculer la date de fin estimée automatiquement
  const calculateDateFin = (dateDebut: Date, dureeEstimee: number) => {
    return addDays(dateDebut, dureeEstimee);
  };

  const [formData, setFormData] = useState({
    dateDebut: essai.dateDebut ? new Date(essai.dateDebut) : today,
    dateFin: essai.dateFin ? new Date(essai.dateFin) : calculateDateFin(today, essai.dureeEstimee),
    operateur: essai.operateur || '',
    commentaires: essai.commentaires || '',
    // Résultats spécifiques selon le type d'essai
    ...(essai.resultats || {}),
  });

  // Mettre à jour automatiquement la date de réception si elle n'existe pas
  useEffect(() => {
    if (!essai.dateReception) {
      const dateReceptionFormatted = format(today, 'yyyy-MM-dd');
      updateEssai(essai.id, {
        dateReception: dateReceptionFormatted
      });
    }
  }, [essai.dateReception, essai.id, today]);

  // Mettre à jour automatiquement la date de fin quand la date de début change
  useEffect(() => {
    if (formData.dateDebut && essai.statut === 'attente') {
      const newDateFin = calculateDateFin(formData.dateDebut, essai.dureeEstimee);
      setFormData(prev => ({
        ...prev,
        dateFin: newDateFin
      }));
    }
  }, [formData.dateDebut, essai.dureeEstimee, essai.statut]);

  const handleDemarrer = () => {
    if (!formData.dateDebut) {
      toast.error('Veuillez saisir la date de début');
      return;
    }

    const dateDebutFormatted = format(formData.dateDebut, 'yyyy-MM-dd');
    const dateFinFormatted = formData.dateFin ? format(formData.dateFin, 'yyyy-MM-dd') : format(calculateDateFin(formData.dateDebut, essai.dureeEstimee), 'yyyy-MM-dd');

    updateEssai(essai.id, {
      statut: 'en_cours',
      dateDebut: dateDebutFormatted,
      dateFin: dateFinFormatted,
      operateur: formData.operateur,
    });
    toast.success('Essai démarré');
    onClose();
  };

  const handleTerminer = () => {
    if (!formData.dateFin) {
      toast.error('Veuillez saisir la date de fin');
      return;
    }

    updateEssai(essai.id, {
      statut: 'termine',
      dateFin: format(formData.dateFin, 'yyyy-MM-dd'),
      resultats: getResultats(),
      commentaires: formData.commentaires,
    });

    // Vérifier si tous les essais de l'échantillon sont terminés
    const essaisEchantillon = getEssaisByEchantillon(essai.echantillonCode);
    const tousFinis = essaisEchantillon.every(e => e.statut === 'termine');

    if (tousFinis) {
      // Changer le statut de l'échantillon à 'decodification'
      updateEchantillon(essai.echantillonCode, { statut: 'decodification' });
      toast.success(`Essai terminé - Échantillon ${essai.echantillonCode} envoyé automatiquement à la décodification`);

      // Notifications pour les différents rôles
      addNotification({
        type: 'success',
        title: 'Essais terminés',
        message: `Tous les essais de l'échantillon ${essai.echantillonCode} sont terminés et envoyés à la décodification`,
        userRole: 'operateur_route',
        module: 'Essais Route',
      });

      addNotification({
        type: 'success',
        title: 'Essais terminés',
        message: `Tous les essais de l'échantillon ${essai.echantillonCode} sont terminés et envoyés à la décodification`,
        userRole: 'operateur_mecanique',
        module: 'Essais Route',
      });

      addNotification({
        type: 'info',
        title: 'Échantillon prêt pour décodification',
        message: `L'échantillon ${essai.echantillonCode} avec tous ses essais terminés est prêt pour la décodification`,
        userRole: 'receptionniste',
        module: 'Essais Route',
        actionRequired: true,
      });

      addNotification({
        type: 'info',
        title: 'Échantillon prêt pour décodification',
        message: `L'échantillon ${essai.echantillonCode} avec tous ses essais terminés est prêt pour la décodification`,
        userRole: 'responsable_traitement',
        module: 'Essais Route',
        actionRequired: true,
      });
    } else {
      toast.success('Essai terminé');

      // Notification pour l'essai spécifique terminé
      addNotification({
        type: 'success',
        title: `Essai ${essai.type} terminé`,
        message: `L'essai ${essai.type} pour l'échantillon ${essai.echantillonCode} a été terminé`,
        userRole: 'operateur_route',
        module: 'Essais Route',
      });
    }

    onClose();
  };

  const handleEnvoyerDecodification = () => {
    // Vérifier si tous les essais de l'échantillon sont terminés
    const essaisEchantillon = getEssaisByEchantillon(essai.echantillonCode);
    const tousFinis = essaisEchantillon.every(e => e.statut === 'termine');

    if (!tousFinis) {
      toast.error('Tous les essais doivent être terminés avant l\'envoi à la décodification');
      return;
    }

    updateEchantillon(essai.echantillonCode, { statut: 'decodification' });
    toast.success(`Échantillon ${essai.echantillonCode} envoyé à la décodification`);
    onClose();
  };

  const getResultats = () => {
    if (essai.type === 'AG') {
      return {
        pourcent_inf_2mm: formData.pourcent_inf_2mm || '',
        pourcent_inf_80um: formData.pourcent_inf_80um || '',
        coefficient_uniformite: formData.coefficient_uniformite || '',
      };
    }
    if (essai.type === 'Proctor') {
      return {
        densite_opt: formData.densite_opt || '',
        teneur_eau_opt: formData.teneur_eau_opt || '',
        type_proctor: formData.type_proctor || 'Normal',
      };
    }
    if (essai.type === 'CBR') {
      return {
        cbr_95: formData.cbr_95 || '',
        cbr_98: formData.cbr_98 || '',
        cbr_100: formData.cbr_100 || '',
        gonflement: formData.gonflement || '',
      };
    }
    return {};
  };

  const essaisEchantillon = getEssaisByEchantillon(essai.echantillonCode);
  const tousEssaisFinis = essaisEchantillon.every(e => e.statut === 'termine');

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Date réception</Label>
          <Input 
            value={essai.dateReception || format(today, 'yyyy-MM-dd')} 
            disabled 
          />
        </div>

        <div className="space-y-2">
          <Label>Statut</Label>
          <div>
            {essai.statut === 'attente' && <Badge style={{ backgroundColor: '#FFC107', color: '#FFFFFF' }}>En attente</Badge>}
            {essai.statut === 'en_cours' && <Badge style={{ backgroundColor: '#003366', color: '#FFFFFF' }}>En cours</Badge>}
            {essai.statut === 'termine' && <Badge style={{ backgroundColor: '#28A745', color: '#FFFFFF' }}>Terminé</Badge>}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="operateur">Opérateur *</Label>
          <Input
            id="operateur"
            value={formData.operateur}
            onChange={(e) => setFormData({ ...formData, operateur: e.target.value })}
            placeholder="Nom de l'opérateur"
            disabled={essai.statut === 'termine'}
          />
        </div>

        <div className="space-y-2">
          <Label>Durée estimée</Label>
          <Input value={`${essai.dureeEstimee} jours`} disabled />
        </div>

        <div className="space-y-2">
          <Label htmlFor="dateDebut">Date début *</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-left"
                disabled={essai.statut === 'termine'}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formData.dateDebut ? (
                  format(formData.dateDebut, 'PPP', { locale: fr })
                ) : (
                  <span>Sélectionner</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={formData.dateDebut}
                onSelect={(date) => setFormData({ ...formData, dateDebut: date })}
                initialFocus
                disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
              />
            </PopoverContent>
          </Popover>
        </div>

        {essai.statut !== 'attente' && (
          <div className="space-y-2">
            <Label htmlFor="dateFin">Date fin estimée *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left"
                  disabled={essai.statut === 'termine'}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.dateFin ? (
                    format(formData.dateFin, 'PPP', { locale: fr })
                  ) : (
                    <span>Sélectionner</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={formData.dateFin}
                  onSelect={(date) => setFormData({ ...formData, dateFin: date })}
                  initialFocus
                  disabled={(date) => date < (formData.dateDebut || today)}
                />
              </PopoverContent>
            </Popover>
          </div>
        )}

        {/* Affichage de la date de fin calculée automatiquement pour les essais en attente */}
        {essai.statut === 'attente' && formData.dateDebut && (
          <div className="space-y-2">
            <Label>Date fin estimée (calculée)</Label>
            <Input 
              value={format(formData.dateFin || calculateDateFin(formData.dateDebut, essai.dureeEstimee), 'PPP', { locale: fr })} 
              disabled 
            />
            <p className="text-xs" style={{ color: '#A9A9A9' }}>
              Calculée automatiquement: début + {essai.dureeEstimee} jours
            </p>
          </div>
        )}
      </div>

      {essai.statut !== 'attente' && (
        <div className="space-y-4">
          <h3 className="font-semibold">Résultats</h3>
          
          {essai.type === 'AG' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="pourcent_inf_2mm">% passant à 2mm *</Label>
                <Input
                  id="pourcent_inf_2mm"
                  type="number"
                  step="0.1"
                  value={formData.pourcent_inf_2mm || ''}
                  onChange={(e) => setFormData({ ...formData, pourcent_inf_2mm: e.target.value })}
                  placeholder="Ex: 85.5"
                  disabled={essai.statut === 'termine'}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pourcent_inf_80um">% passant à 80µm</Label>
                <Input
                  id="pourcent_inf_80um"
                  type="number"
                  step="0.1"
                  value={formData.pourcent_inf_80um || ''}
                  onChange={(e) => setFormData({ ...formData, pourcent_inf_80um: e.target.value })}
                  placeholder="Ex: 45.2"
                  disabled={essai.statut === 'termine'}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="coefficient_uniformite">Coefficient d'uniformité (Cu)</Label>
                <Input
                  id="coefficient_uniformite"
                  type="number"
                  step="0.01"
                  value={formData.coefficient_uniformite || ''}
                  onChange={(e) => setFormData({ ...formData, coefficient_uniformite: e.target.value })}
                  placeholder="Ex: 6.5"
                  disabled={essai.statut === 'termine'}
                />
              </div>
            </>
          )}

          {essai.type === 'Proctor' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="type_proctor">Type Proctor</Label>
                <Input
                  id="type_proctor"
                  value={formData.type_proctor || 'Normal'}
                  onChange={(e) => setFormData({ ...formData, type_proctor: e.target.value })}
                  placeholder="Normal ou Modifié"
                  disabled={essai.statut === 'termine'}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="densite_opt">Densité sèche optimale (g/cm³) *</Label>
                <Input
                  id="densite_opt"
                  type="number"
                  step="0.01"
                  value={formData.densite_opt || ''}
                  onChange={(e) => setFormData({ ...formData, densite_opt: e.target.value })}
                  placeholder="Ex: 1.95"
                  disabled={essai.statut === 'termine'}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="teneur_eau_opt">Teneur en eau optimale (%) *</Label>
                <Input
                  id="teneur_eau_opt"
                  type="number"
                  step="0.1"
                  value={formData.teneur_eau_opt || ''}
                  onChange={(e) => setFormData({ ...formData, teneur_eau_opt: e.target.value })}
                  placeholder="Ex: 12.5"
                  disabled={essai.statut === 'termine'}
                />
              </div>
            </>
          )}

          {essai.type === 'CBR' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="cbr_95">CBR à 95% OPM (%) *</Label>
                <Input
                  id="cbr_95"
                  type="number"
                  value={formData.cbr_95 || ''}
                  onChange={(e) => setFormData({ ...formData, cbr_95: e.target.value })}
                  placeholder="Ex: 45"
                  disabled={essai.statut === 'termine'}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cbr_98">CBR à 98% OPM (%)</Label>
                <Input
                  id="cbr_98"
                  type="number"
                  value={formData.cbr_98 || ''}
                  onChange={(e) => setFormData({ ...formData, cbr_98: e.target.value })}
                  placeholder="Ex: 65"
                  disabled={essai.statut === 'termine'}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cbr_100">CBR à 100% OPM (%)</Label>
                <Input
                  id="cbr_100"
                  type="number"
                  value={formData.cbr_100 || ''}
                  onChange={(e) => setFormData({ ...formData, cbr_100: e.target.value })}
                  placeholder="Ex: 85"
                  disabled={essai.statut === 'termine'}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gonflement">Gonflement (%)</Label>
                <Input
                  id="gonflement"
                  type="number"
                  step="0.01"
                  value={formData.gonflement || ''}
                  onChange={(e) => setFormData({ ...formData, gonflement: e.target.value })}
                  placeholder="Ex: 0.5"
                  disabled={essai.statut === 'termine'}
                />
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="commentaires">Commentaires et observations</Label>
            <Textarea
              id="commentaires"
              value={formData.commentaires}
              onChange={(e) => setFormData({ ...formData, commentaires: e.target.value })}
              placeholder="Observations et remarques sur l'essai..."
              rows={3}
              disabled={essai.statut === 'termine'}
            />
          </div>

          <div className="space-y-2">
            <Label>Fichiers (Word/Excel)</Label>
            <Button variant="outline" size="sm" disabled={essai.statut === 'termine'}>
              <Upload className="h-4 w-4 mr-2" />
              Importer un fichier
            </Button>
            <p className="text-xs" style={{ color: '#A9A9A9' }}>
              Formats acceptés: .docx, .xlsx
            </p>
          </div>
        </div>
      )}

      <div className="flex gap-3 justify-end pt-4">
        {essai.statut === 'attente' && formData.operateur && formData.dateDebut && (
          <Button onClick={handleDemarrer} style={{ backgroundColor: '#003366' }}>
            Démarrer l'essai
          </Button>
        )}

        {essai.statut === 'en_cours' && formData.dateFin && (
          <Button onClick={handleTerminer} style={{ backgroundColor: '#28A745' }}>
            <CheckCircle className="h-4 w-4 mr-2" />
            Terminer l'essai
          </Button>
        )}

        {essai.statut === 'termine' && tousEssaisFinis && (
          <Button onClick={handleEnvoyerDecodification} style={{ backgroundColor: '#003366' }}>
            <Send className="h-4 w-4 mr-2" />
            Envoyer à la décodification
          </Button>
        )}
      </div>
    </div>
  );
}