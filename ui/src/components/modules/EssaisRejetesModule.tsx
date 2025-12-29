import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Calendar } from '../ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Upload, CheckCircle, CalendarIcon, Send, RotateCcw, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { essaiApi } from '../../lib/essaiApi';
import { getEchantillons } from '../../lib/echantillonService';
import { format, addDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useNotifications } from '../../contexts/NotificationContext';

interface FormData {
  dateReception: Date;
  dateDebut: Date;
  dateFin: Date;
  dateRejet: Date;
  operateur: string;
  commentaires: string;
  pourcent_inf_2mm: string;
  pourcent_inf_80um: string;
  coefficient_uniformite: string;
  type_proctor: string;
  densite_opt: string;
  teneur_eau_opt: string;
  cbr_95: string;
  cbr_98: string;
  cbr_100: string;
  gonflement: string;
}

export function EssaisRejetesModule() {
  const { addNotification } = useNotifications();
  const [essais, setEssais] = useState<any[]>([]);

  const refreshEssais = async () => {
    try {
      const echantillons = await getEchantillons();
      const rejectedEssais = [];
      
      for (const ech of echantillons) {
        const essaisEch = await essaiApi.getByEchantillon(ech.id);
        // Traçabilité indélébile: tous les essais qui ont eu une date_rejet restent visibles
        const essaisRejetes = essaisEch.filter(e => e.date_rejet && (e.type === 'AG' || e.type === 'Proctor' || e.type === 'CBR'));
        
        for (const essai of essaisRejetes) {
          const dureeEstimee = essai.type === 'AG' ? 5 : 
                              essai.type === 'Proctor' ? 4 : 
                              essai.type === 'CBR' ? 5 :
                              essai.type === 'Oedometre' ? 18 : 8;
          
          rejectedEssais.push({
            id: essai.id,
            type: essai.type,
            echantillonId: ech.id,
            echantillonCode: ech.code,
            statut: essai.statut,
            dateReception: essai.date_reception,
            dateDebut: essai.date_debut,
            dateFin: essai.date_fin,
            dateRejet: essai.date_rejet,
            operateur: essai.operateur,
            dureeEstimee: dureeEstimee,
            commentaires: essai.commentaires,
            resultats: essai.resultats || {},
            commentairesValidation: essai.commentaires_validation,
          });
        }
      }
      
      setEssais(rejectedEssais);
    } catch (error) {
      console.error('Erreur chargement essais rejetés:', error);
      toast.error('Erreur lors du chargement');
    }
  };

  useEffect(() => {
    refreshEssais();
  }, []);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1>Essais Rejetés - Traçabilité Indélébile</h1>
        <p style={{ color: '#A9A9A9' }}>
          Historique permanent de tous les essais ayant été rejetés - Traçabilité complète
        </p>
        <div className="mt-2 p-3 rounded-lg" style={{ backgroundColor: '#FFF3CD', border: '1px solid #FFEAA7' }}>
          <p className="text-sm font-semibold" style={{ color: '#856404' }}>
            ⚠️ Cette interface maintient la trace indélébile de tous les essais rejetés, même après correction et acceptation.
          </p>
        </div>
      </div>

      <div className="space-y-8">
        {/* Analyse granulométrique */}
        {essais.filter(e => e.type === 'AG').length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-4">Analyse granulométrique par tamisage ({essais.filter(e => e.type === 'AG').length})</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {essais.filter(e => e.type === 'AG').map((essai) => (
                <EssaiRejeteCard key={essai.id} essai={essai} onUpdate={refreshEssais} />
              ))}
            </div>
          </div>
        )}

        {/* CBR */}
        {essais.filter(e => e.type === 'CBR').length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-4">CBR ({essais.filter(e => e.type === 'CBR').length})</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {essais.filter(e => e.type === 'CBR').map((essai) => (
                <EssaiRejeteCard key={essai.id} essai={essai} onUpdate={refreshEssais} />
              ))}
            </div>
          </div>
        )}

        {/* Proctor */}
        {essais.filter(e => e.type === 'Proctor').length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-4">Proctor ({essais.filter(e => e.type === 'Proctor').length})</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {essais.filter(e => e.type === 'Proctor').map((essai) => (
                <EssaiRejeteCard key={essai.id} essai={essai} onUpdate={refreshEssais} />
              ))}
            </div>
          </div>
        )}

        {essais.length === 0 && (
          <div className="text-center py-12" style={{ color: '#A9A9A9' }}>
            Aucun essai rejeté à afficher
          </div>
        )}
      </div>
    </div>
  );
}

function EssaiRejeteCard({ essai, onUpdate }: { essai: any; onUpdate: () => void }) {
  const [isOpen, setIsOpen] = useState(false);

  const handleCardClick = () => {
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
            <div className="flex flex-col gap-1">
              <Badge style={{ backgroundColor: '#DC3545', color: '#FFFFFF' }}>Rejeté le {essai.dateRejet}</Badge>
              {essai.statut === 'attente' && essai.statut_validation === 'rejected' && <Badge style={{ backgroundColor: '#FFC107', color: '#FFFFFF' }}>En attente</Badge>}
              {essai.statut === 'en_cours' && <Badge style={{ backgroundColor: '#003366', color: '#FFFFFF' }}>En cours</Badge>}
              {essai.statut === 'termine' && essai.statut_validation === 'accepted' && <Badge style={{ backgroundColor: '#28A745', color: '#FFFFFF' }}>Accepté</Badge>}
              {essai.statut === 'termine' && essai.statut_validation !== 'accepted' && <Badge style={{ backgroundColor: '#FD7E14', color: '#FFFFFF' }}>Terminé</Badge>}
            </div>
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
            {essai.commentairesValidation && (
              <div className="mt-2 p-2 rounded" style={{ backgroundColor: '#FFF5F5', border: '1px solid #FED7D7' }}>
                <span className="text-xs font-semibold" style={{ color: '#DC3545' }}>Motif de rejet:</span>
                <p className="text-xs mt-1" style={{ color: '#DC3545' }}>{essai.commentairesValidation}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Essai Rejeté {essai.type} - {essai.echantillonCode}</DialogTitle>
            <DialogDescription>
              Modification des valeurs et re-téléchargement des documents
            </DialogDescription>
          </DialogHeader>
          <EssaiRejeteForm essai={essai} onClose={() => { setIsOpen(false); onUpdate(); }} />
        </DialogContent>
      </Dialog>
    </>
  );
}

function EssaiRejeteForm({ essai, onClose }: { essai: any; onClose: () => void }) {
  const today = new Date();

  // Calculer la date de fin estimée automatiquement
  const calculateDateFin = (dateDebut: Date, dureeEstimee: number) => {
    return addDays(dateDebut, dureeEstimee);
  };

  const [formData, setFormData] = useState({
    dateReception: essai.dateReception ? new Date(essai.dateReception) : today,
    dateDebut: essai.dateDebut ? new Date(essai.dateDebut) : today,
    dateFin: essai.dateFin ? new Date(essai.dateFin) : calculateDateFin(today, essai.dureeEstimee),
    dateRejet: essai.dateRejet ? new Date(essai.dateRejet) : today,
    operateur: essai.operateur || 'Jean Dupont',
    commentaires: essai.commentaires || 'Essai corrigé suite au rejet lors de la décodification.',
    // Résultats spécifiques selon le type d'essai
    pourcent_inf_2mm: essai.resultats?.pourcent_inf_2mm || '',
    pourcent_inf_80um: essai.resultats?.pourcent_inf_80um || '',
    coefficient_uniformite: essai.resultats?.coefficient_uniformite || '',
    type_proctor: essai.resultats?.type_proctor || 'Normal',
    densite_opt: essai.resultats?.densite_opt || '',
    teneur_eau_opt: essai.resultats?.teneur_eau_opt || '',
    cbr_95: essai.resultats?.cbr_95 || '',
    cbr_98: essai.resultats?.cbr_98 || '',
    cbr_100: essai.resultats?.cbr_100 || '',
    gonflement: essai.resultats?.gonflement || '',
  });
  
  const [newFileSelected, setNewFileSelected] = useState(false);

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

  const handleDemarrer = async () => {
    if (!formData.dateDebut) {
      toast.error('Veuillez saisir la date de début');
      return;
    }

    try {
      const response = await fetch(`https://snertp.onrender.com/api/essais/${essai.id}/`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          statut: 'en_cours',
          date_debut: format(formData.dateDebut, 'yyyy-MM-dd'),
          date_fin: format(formData.dateFin, 'yyyy-MM-dd'),
          operateur: formData.operateur,
          resultats: getResultats(),
          commentaires: formData.commentaires,
          date_rejet: null
        })
      });

      if (response.ok) {
        toast.success('Essai corrigé et renvoyé à la décodification');
        onClose();
      } else {
        toast.error('Erreur lors de la correction');
      }
    } catch (error) {
      toast.error('Erreur de connexion');
    }
  };

  const handleTerminer = async () => {
    if (!formData.dateFin) {
      toast.error('Veuillez saisir la date de fin');
      return;
    }

    try {
      const response = await fetch(`https://snertp.onrender.com/api/essais/${essai.id}/`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          statut: 'termine',
          date_fin: format(formData.dateFin, 'yyyy-MM-dd'),
          resultats: getResultats(),
          commentaires: formData.commentaires,
          statut_validation: null,
          commentaires_validation: null
        })
      });

      if (response.ok) {
        toast.success('Correction terminée - Échantillon renvoyé à la décodification');
        onClose();
      } else {
        toast.error('Erreur lors de la correction');
      }
    } catch (error) {
      toast.error('Erreur de connexion');
    }
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

  return (
    <div className="space-y-6">
      {/* Afficher le motif de rejet */}
      {essai.commentairesValidation && (
        <div className="p-4 rounded-lg" style={{ backgroundColor: '#FFF5F5', border: '1px solid #FED7D7' }}>
          <h3 className="font-semibold text-sm" style={{ color: '#DC3545' }}>Motif de rejet</h3>
          <p className="text-sm mt-1" style={{ color: '#DC3545' }}>{essai.commentairesValidation}</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="dateReception">Date réception *</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-left"
                disabled={essai.statut === 'termine'}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formData.dateReception ? (
                  format(formData.dateReception, 'PPP', { locale: fr })
                ) : (
                  <span>Sélectionner</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={formData.dateReception}
                onSelect={(date: Date | undefined) => date && setFormData({ ...formData, dateReception: date })}
                initialFocus
                disabled={(date: Date) => date > today}
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <Label>Date rejet</Label>
          <Input
            value={essai.dateRejet || format(today, 'yyyy-MM-dd')}
            disabled
          />
        </div>

        <div className="space-y-2">
          <Label>Traçabilité (Historique indélébile)</Label>
          <div className="space-y-1">
            <Badge style={{ backgroundColor: '#DC3545', color: '#FFFFFF' }}>REJETÉ LE {essai.dateRejet} - TRACE PERMANENTE</Badge>
            <div>
              {essai.statut === 'attente' && essai.statut_validation === 'rejected' && <Badge style={{ backgroundColor: '#FFC107', color: '#FFFFFF' }}>Statut actuel: En attente de correction</Badge>}
              {essai.statut === 'en_cours' && <Badge style={{ backgroundColor: '#003366', color: '#FFFFFF' }}>Statut actuel: Correction en cours</Badge>}
              {essai.statut === 'termine' && essai.statut_validation === 'accepted' && <Badge style={{ backgroundColor: '#28A745', color: '#FFFFFF' }}>Statut actuel: Corrigé et accepté</Badge>}
              {essai.statut === 'termine' && essai.statut_validation !== 'accepted' && <Badge style={{ backgroundColor: '#FD7E14', color: '#FFFFFF' }}>Statut actuel: Corrigé, en attente validation</Badge>}
            </div>
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
                onSelect={(date: Date | undefined) => date && setFormData({ ...formData, dateDebut: date })}
                initialFocus
                disabled={(date: Date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
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
                onSelect={(date: Date | undefined) => date && setFormData({ ...formData, dateFin: date })}
                initialFocus
                disabled={(date: Date) => date < (formData.dateDebut || today)}
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

      {/* Résultats modifiables même en attente */}
      <div className="space-y-4">
        <h3 className="font-semibold">Résultats (Modification autorisée)</h3>

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
          <Label>Nouveau fichier (Word/Excel)</Label>
          <div>
            <input
              type="file"
              id="new-file-upload"
              accept=".docx,.xlsx,.pdf"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setNewFileSelected(true);
                  toast.success('Nouveau fichier sélectionné');
                }
              }}
              style={{ display: 'none' }}
              disabled={essai.statut === 'termine'}
            />
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => document.getElementById('new-file-upload')?.click()}
              disabled={essai.statut === 'termine'}
            >
              <Upload className="h-4 w-4 mr-2" />
              Charger un nouveau fichier
            </Button>
          </div>
          <p className="text-xs" style={{ color: '#A9A9A9' }}>
            Formats acceptés: .docx, .xlsx - Remplace le fichier précédent
          </p>
        </div>
      </div>

      {essai.statut !== 'attente' && (
        <div className="space-y-4">
          <h3 className="font-semibold">Résultats (Modification autorisée)</h3>

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
            <Label>Re-téléchargement des fichiers (Word/Excel)</Label>
            <Button variant="outline" size="sm" disabled={essai.statut === 'termine'}>
              <Upload className="h-4 w-4 mr-2" />
              Importer un nouveau fichier
            </Button>
            <p className="text-xs" style={{ color: '#A9A9A9' }}>
              Formats acceptés: .docx, .xlsx - Remplace les fichiers précédents
            </p>
            {essai.fichiers && essai.fichiers.length > 0 && (
              <div className="mt-2">
                <p className="text-xs font-semibold">Fichiers actuels:</p>
                {essai.fichiers.map((fichier, index) => (
                  <Badge key={index} variant="outline" className="mr-2">
                    <FileText className="h-3 w-3 mr-1" />
                    {fichier}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex gap-3 justify-end pt-4">
        {essai.statut === 'attente' && newFileSelected && (
          <Button 
            onClick={handleDemarrer}
            disabled={!formData.operateur || !formData.dateDebut}
            style={{ backgroundColor: '#003366' }}
          >
            <Send className="h-4 w-4 mr-2" />
            Envoyer à la décodification
          </Button>
        )}

        {essai.statut === 'en_cours' && formData.dateFin && (
          <Button onClick={handleTerminer} style={{ backgroundColor: '#28A745' }}>
            <CheckCircle className="h-4 w-4 mr-2" />
            Terminer et corriger
          </Button>
        )}

        {essai.statut === 'termine' && (
          <Button onClick={handleTerminer} style={{ backgroundColor: '#28A745' }}>
            <Send className="h-4 w-4 mr-2" />
            Renvoyer à la décodification
          </Button>
        )}
      </div>
    </div>
  );
}
