import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { FileText } from 'lucide-react';
import { BordereauData, generateBordereauHTML, printBordereau } from '../../lib/bordereauGenerator';
import { toast } from 'sonner';

interface BordereauDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  echantillon: {
    code: string;
    clientNom: string;
    date_reception?: string;
    essais_types?: string[];
    nature?: string;
  };
  signature: string;
}

export function BordereauDialog({ open, onOpenChange, echantillon, signature }: BordereauDialogProps) {
  const now = new Date();
  const dateStr = now.toLocaleDateString('fr-FR', { 
    day: '2-digit', 
    month: 'short', 
    year: 'numeric' 
  }).toUpperCase();

  const [formData, setFormData] = useState<BordereauData>({
    numero: `${Math.floor(Math.random() * 10000)} / CNER-TP/DG`,
    date: dateStr,
    essaisRealises: echantillon.nature || 'Échantillon de sol',
    demandePar: echantillon.clientNom || 'Client',
    compteDe: echantillon.clientNom || 'Client',
    dateEssais: echantillon.date_reception ? 
      new Date(echantillon.date_reception).toLocaleDateString('fr-FR') : 
      now.toLocaleDateString('fr-FR'),
    lieuEssais: 'Laboratoire Essais Spéciaux',
    natureEssais: Array.isArray(echantillon.essais_types) ? 
      echantillon.essais_types.join(', ') : 
      'Essais géotechniques',
    adresseRecepteur: echantillon.clientNom || 'Client',
    observations: 'R.A.S.',
    signature
  });

  const handleGenerate = () => {
    const html = generateBordereauHTML(formData);
    printBordereau(html);
    toast.success('Bordereau de transmission généré');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bordereau de transmission - {echantillon.code}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="numero">N° de bordereau</Label>
              <Input
                id="numero"
                value={formData.numero}
                onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="essaisRealises">Essais réalisés sur</Label>
            <Textarea
              id="essaisRealises"
              value={formData.essaisRealises}
              onChange={(e) => setFormData({ ...formData, essaisRealises: e.target.value })}
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="demandePar">À la demande de</Label>
              <Input
                id="demandePar"
                value={formData.demandePar}
                onChange={(e) => setFormData({ ...formData, demandePar: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="compteDe">Pour le compte de</Label>
              <Input
                id="compteDe"
                value={formData.compteDe}
                onChange={(e) => setFormData({ ...formData, compteDe: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="dateEssais">Date des essais</Label>
              <Input
                id="dateEssais"
                value={formData.dateEssais}
                onChange={(e) => setFormData({ ...formData, dateEssais: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="lieuEssais">Lieu des essais</Label>
              <Input
                id="lieuEssais"
                value={formData.lieuEssais}
                onChange={(e) => setFormData({ ...formData, lieuEssais: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="natureEssais">Nature des essais</Label>
            <Textarea
              id="natureEssais"
              value={formData.natureEssais}
              onChange={(e) => setFormData({ ...formData, natureEssais: e.target.value })}
              rows={2}
            />
          </div>

          <div>
            <Label htmlFor="adresseRecepteur">Adresse du récepteur</Label>
            <Textarea
              id="adresseRecepteur"
              value={formData.adresseRecepteur}
              onChange={(e) => setFormData({ ...formData, adresseRecepteur: e.target.value })}
              rows={2}
            />
          </div>

          <div>
            <Label htmlFor="observations">Observations</Label>
            <Textarea
              id="observations"
              value={formData.observations}
              onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
              rows={2}
            />
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button 
              onClick={handleGenerate}
              style={{ backgroundColor: '#003366', color: '#FFFFFF' }}
            >
              <FileText className="h-4 w-4 mr-2" />
              Générer le bordereau
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
