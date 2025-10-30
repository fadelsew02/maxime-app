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
import { Upload, Play, CheckCircle, CalendarIcon } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { getEssaisBySection, updateEssai, EssaiTest, getEssaisByEchantillon, updateEchantillon } from '../../lib/mockData';
import { format, addDays } from 'date-fns';
import { fr } from 'date-fns/locale';

export function EssaisMecaniqueModule() {
  const [essais, setEssais] = useState(() => getEssaisBySection('mecanique'));
  const [filter, setFilter] = useState<'all' | 'attente' | 'en_cours' | 'termine'>('all');

  const filteredEssais = essais.filter(e => {
    if (filter === 'all') return true;
    return e.statut === filter;
  });

  const refreshEssais = () => {
    setEssais(getEssaisBySection('mecanique'));
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
        <h1>Section Mécanique des Sols</h1>
        <p style={{ color: '#A9A9A9' }}>
          Essais de laboratoire - Mécanique
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
        <DialogContent className="max-w-2xl">
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
    const todayFormatted = format(today, 'yyyy-MM-dd');
    const dateFinFormatted = formData.dateFin ? format(formData.dateFin, 'yyyy-MM-dd') : format(calculateDateFin(today, essai.dureeEstimee), 'yyyy-MM-dd');
    
    updateEssai(essai.id, {
      statut: 'en_cours',
      dateDebut: todayFormatted,
      dateFin: dateFinFormatted,
      operateur: formData.operateur,
    });
    toast.success('Essai démarré');
    onClose();
  };

  const handleTerminer = () => {
    const todayFormatted = format(today, 'yyyy-MM-dd');
    updateEssai(essai.id, {
      statut: 'termine',
      dateFin: todayFormatted,
      resultats: getResultats(),
      commentaires: formData.commentaires,
    });

    // Vérifier si tous les essais de l'échantillon sont terminés
    const essaisEchantillon = getEssaisByEchantillon(essai.echantillonCode);
    const tousFinis = essaisEchantillon.every((e: EssaiTest) => e.statut === 'termine');

    if (tousFinis) {
      // Changer le statut de l'échantillon à 'decodification'
      updateEchantillon(essai.echantillonCode, { statut: 'decodification' });
      toast.success(`Essai terminé - Échantillon ${essai.echantillonCode} envoyé automatiquement à la décodification`);
    } else {
      toast.success('Essai terminé');
    }

    onClose();
  };

  const getResultats = () => {
    if (essai.type === 'Oedometre') {
      return {
        cc: formData.cc || '',
        cs: formData.cs || '',
        gp: formData.gp || '',
      };
    }
    if (essai.type === 'Cisaillement') {
      return {
        cohesion: formData.cohesion || '',
        phi: formData.phi || '',
      };
    }
    return {};
  };

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
          <Label htmlFor="operateur">Opérateur</Label>
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
          <Label htmlFor="dateDebut">Date début</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-left"
                disabled={essai.statut !== 'attente'}
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
            <Label htmlFor="dateFin">Date fin estimée</Label>
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
          
          {essai.type === 'Oedometre' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="cc">Indice de compression (Cc)</Label>
                <Input
                  id="cc"
                  type="number"
                  step="0.001"
                  value={formData.cc || ''}
                  onChange={(e) => setFormData({ ...formData, cc: e.target.value })}
                  placeholder="Ex: 0.245"
                  disabled={essai.statut === 'termine'}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cs">Indice de gonflement (Cs)</Label>
                <Input
                  id="cs"
                  type="number"
                  step="0.001"
                  value={formData.cs || ''}
                  onChange={(e) => setFormData({ ...formData, cs: e.target.value })}
                  placeholder="Ex: 0.045"
                  disabled={essai.statut === 'termine'}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gp">Contrainte de préconsolidation (kPa)</Label>
                <Input
                  id="gp"
                  type="number"
                  value={formData.gp || ''}
                  onChange={(e) => setFormData({ ...formData, gp: e.target.value })}
                  placeholder="Ex: 150"
                  disabled={essai.statut === 'termine'}
                />
              </div>
            </>
          )}

          {essai.type === 'Cisaillement' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="cohesion">Cohésion (kPa)</Label>
                <Input
                  id="cohesion"
                  type="number"
                  value={formData.cohesion || ''}
                  onChange={(e) => setFormData({ ...formData, cohesion: e.target.value })}
                  placeholder="Ex: 25"
                  disabled={essai.statut === 'termine'}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phi">Angle de frottement φ (°)</Label>
                <Input
                  id="phi"
                  type="number"
                  step="0.1"
                  value={formData.phi || ''}
                  onChange={(e) => setFormData({ ...formData, phi: e.target.value })}
                  placeholder="Ex: 28.5"
                  disabled={essai.statut === 'termine'}
                />
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="commentaires">Commentaires</Label>
            <Textarea
              id="commentaires"
              value={formData.commentaires}
              onChange={(e) => setFormData({ ...formData, commentaires: e.target.value })}
              placeholder="Observations et remarques"
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
        {essai.statut === 'attente' && formData.operateur && (
          <Button onClick={handleDemarrer} style={{ backgroundColor: '#003366' }}>
            <Play className="h-4 w-4 mr-2" />
            Démarrer l'essai
          </Button>
        )}

        {essai.statut === 'en_cours' && (
          <Button onClick={handleTerminer} style={{ backgroundColor: '#28A745' }}>
            <CheckCircle className="h-4 w-4 mr-2" />
            Terminer l'essai
          </Button>
        )}
      </div>
    </div>
  );
}
