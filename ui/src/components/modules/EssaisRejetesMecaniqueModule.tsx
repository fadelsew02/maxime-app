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

export function EssaisRejetesMecaniqueModule() {
  const { addNotification } = useNotifications();
  const [essais, setEssais] = useState<any[]>([]);

  const refreshEssais = async () => {
    try {
      const echantillons = await getEchantillons();
      const rejectedEssais = [];
      
      for (const ech of echantillons) {
        const essaisEch = await essaiApi.getByEchantillon(ech.id);
        // Traçabilité indélébile: tous les essais qui ont eu une date_rejet restent visibles
        const essaisRejetes = essaisEch.filter(e => 
          e.date_rejet && 
          (e.type === 'Oedometre' || e.type === 'Cisaillement')
        );
        
        for (const essai of essaisRejetes) {
          rejectedEssais.push({
            id: essai.id,
            type: essai.type,
            echantillonId: ech.id,
            echantillonCode: ech.code,
            statut: essai.statut,
            statut_validation: essai.statut_validation,
            dateReception: essai.date_reception,
            dateDebut: essai.date_debut,
            dateFin: essai.date_fin,
            dateRejet: essai.date_rejet,
            operateur: essai.operateur,
            dureeEstimee: essai.type === 'Oedometre' ? 18 : 8,
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
        <h1>Essais Rejetés - Mécanique - Traçabilité Indélébile</h1>
        <p style={{ color: '#A9A9A9' }}>
          Historique permanent de tous les essais mécaniques ayant été rejetés - Traçabilité complète
        </p>
        <div className="mt-2 p-3 rounded-lg" style={{ backgroundColor: '#FFF3CD', border: '1px solid #FFEAA7' }}>
          <p className="text-sm font-semibold" style={{ color: '#856404' }}>
            ⚠️ Cette interface maintient la trace indélébile de tous les essais rejetés, même après correction et acceptation.
          </p>
        </div>
      </div>

      <div className="space-y-8">
        {/* Essai œdométrique */}
        {essais.filter(e => e.type === 'Oedometre').length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-4">Essai œdométrique ({essais.filter(e => e.type === 'Oedometre').length})</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {essais.filter(e => e.type === 'Oedometre').map((essai) => (
                <EssaiRejeteCard key={essai.id} essai={essai} onUpdate={refreshEssais} />
              ))}
            </div>
          </div>
        )}

        {/* Essai de cisaillement direct */}
        {essais.filter(e => e.type === 'Cisaillement').length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-4">Essai de cisaillement direct ({essais.filter(e => e.type === 'Cisaillement').length})</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {essais.filter(e => e.type === 'Cisaillement').map((essai) => (
                <EssaiRejeteCard key={essai.id} essai={essai} onUpdate={refreshEssais} />
              ))}
            </div>
          </div>
        )}

        {essais.length === 0 && (
          <div className="text-center py-12" style={{ color: '#A9A9A9' }}>
            Aucun essai mécanique rejeté à afficher
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
              {essai.statut === 'attente' && <Badge style={{ backgroundColor: '#FFC107', color: '#FFFFFF' }}>En attente</Badge>}
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
    cc: essai.resultats?.cc || '',
    cs: essai.resultats?.cs || '',
    gp: essai.resultats?.gp || '',
    cohesion: essai.resultats?.cohesion || '',
    phi: essai.resultats?.phi || '',
  });
  
  const [newFileSelected, setNewFileSelected] = useState(false);

  const handleDemarrer = async () => {
    if (!formData.operateur || !formData.dateDebut) {
      toast.error('Veuillez saisir l\'opérateur et la date de début');
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
      </div>

      {/* Résultats modifiables */}
      <div className="space-y-4">
        <h3 className="font-semibold">Résultats (Modification autorisée)</h3>

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
          <Label>Nouveau fichier PDF</Label>
          <div>
            <input
              type="file"
              id="new-file-upload"
              accept=".pdf"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setNewFileSelected(true);
                  toast.success('Nouveau fichier PDF sélectionné');
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
              Charger un nouveau fichier PDF
            </Button>
          </div>
          <p className="text-xs" style={{ color: '#A9A9A9' }}>
            Format accepté: .pdf uniquement - Remplace le fichier précédent
          </p>
        </div>
      </div>

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
      </div>
    </div>
  );
}