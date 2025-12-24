import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Calendar } from '../ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Upload, CheckCircle, CalendarIcon, Send } from 'lucide-react';
import { toast } from 'sonner';
import { getEssaisBySection, updateEssai, updateEchantillon, EssaiTest, getEssaisByEchantillon } from '../../lib/mockData';
import { getEchantillons, Echantillon as APIEchantillon, updateEchantillon as updateEchantillonAPI } from '../../lib/echantillonService';
import { getEssaisByEchantillon as getEssaisAPI, createEssai, terminerEssai, demarrerEssai } from '../../lib/essaiService';
import { format, addDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useNotifications } from '../../contexts/NotificationContext';
import { formatDateFr } from '../../lib/dateUtils';

interface EchantillonAvecEssais {
  id: string;
  code: string;
  nature: string;
  dateReception: string;
  statut: string;
  essaisRoute: string[];
}

export function EssaisRouteModule() {
  const { addNotification } = useNotifications();
  const [echantillons, setEchantillons] = useState<EchantillonAvecEssais[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterEssai, setFilterEssai] = useState('all');
  const [filterCode, setFilterCode] = useState('');

  const loadEchantillons = async () => {
    try {
      setLoading(true);
      
      // Utiliser l'endpoint backend qui filtre les échantillons avec essais route envoyés
      const response = await fetch('http://127.0.0.1:8000/api/echantillons/with_essais_route_envoyes/', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Erreur lors du chargement');
      }
      
      const apiEchantillons = await response.json();
      
      if (!apiEchantillons || !Array.isArray(apiEchantillons)) {
        console.warn('Aucun échantillon reçu de l\'API');
        setEchantillons([]);
        return;
      }
      
      // Formater les données
      const echantillonsFormates = apiEchantillons.map((e: any) => ({
        id: e.id,
        code: e.code,
        nature: e.nature,
        dateReception: e.date_reception,
        statut: e.statut,
        essaisRoute: e.essais_route_envoyes || []
      }));
      
      setEchantillons(echantillonsFormates);
    } catch (error) {
      console.error('Erreur chargement échantillons:', error);
      toast.error('Erreur lors du chargement des échantillons');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEchantillons();
  }, []);

  // Filtrage des échantillons par type d'essai et code
  const filteredEchantillons = echantillons.filter(echantillon => {
    const matchEssai = filterEssai === 'all' || echantillon.essaisRoute.includes(filterEssai);
    const matchCode = filterCode === '' || echantillon.code.toLowerCase().includes(filterCode.toLowerCase());
    return matchEssai && matchCode;
  });

  const getEssaiStatut = (echantillonId: string, essaiType: string) => {
    // Lire depuis le backend via essaisData
    return '-';
  };

  const getStatutColor = (statut: string) => {
    if (statut === 'Terminé') return '#28A745';
    if (statut === 'En cours') return '#003366';
    return '#6C757D';
  };

  // Rafraîchissement automatique désactivé pour éviter l'oscillation
  // useEffect(() => {
  //   const interval = setInterval(() => {
  //     loadEchantillons();
  //   }, 30000);

  //   return () => clearInterval(interval);
  // }, []);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1>Section Route</h1>
        <p style={{ color: '#A9A9A9' }}>
          Essais de laboratoire - Route ({filteredEchantillons.length} échantillon{filteredEchantillons.length > 1 ? 's' : ''})
        </p>
        <p className="text-xs mt-1" style={{ color: '#6C757D' }}>
          Les essais terminés restent visibles en lecture seule
        </p>
      </div>

      {/* Filtres */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="filter-code">Filtrer par code échantillon</Label>
          <Input
            id="filter-code"
            value={filterCode}
            onChange={(e) => setFilterCode(e.target.value)}
            placeholder="Rechercher un code..."
            className="mt-2"
          />
        </div>
        <div>
          <Label htmlFor="filter-essai">Filtrer par type d'essai</Label>
          <Select value={filterEssai} onValueChange={setFilterEssai}>
            <SelectTrigger className="mt-2">
              <SelectValue placeholder="Tous les essais" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les essais</SelectItem>
              <SelectItem value="AG">Analyse granulométrique par tamisage</SelectItem>
              <SelectItem value="CBR">CBR</SelectItem>
              <SelectItem value="Proctor">Proctor</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <p className="mt-2 text-gray-500">Chargement des échantillons...</p>
        </div>
      ) : (
        <>
          <div className="space-y-6">
          {filteredEchantillons.map((echantillon) => (
            <EchantillonCard key={echantillon.id} echantillon={echantillon} onUpdate={loadEchantillons} />
          ))}

          {filteredEchantillons.length === 0 && echantillons.length > 0 && (
            <div className="text-center py-12" style={{ color: '#A9A9A9' }}>
              Aucun échantillon avec l'essai sélectionné
            </div>
          )}

          {echantillons.length === 0 && (
            <div className="text-center py-12" style={{ color: '#A9A9A9' }}>
              Aucun échantillon avec essais route
            </div>
          )}
          </div>
        </>
      )}
    </div>
  );
}

function EchantillonCard({ echantillon, onUpdate }: { echantillon: EchantillonAvecEssais; onUpdate: () => void }) {
  const [selectedEssai, setSelectedEssai] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [essaisData, setEssaisData] = useState<Record<string, any>>({});

  useEffect(() => {
    const loadEssais = async () => {
      try {
        const essais = await getEssaisAPI(echantillon.id);
        const data: Record<string, any> = {};
        essais.forEach(e => {
          data[e.type] = {
            id: e.id,
            statut: e.statut,
            statut_validation: e.statut_validation,
            dateDebut: e.date_debut,
            dateFin: e.date_fin,
            operateur: e.operateur,
            commentaires_validation: e.commentaires_validation
          };
        });
        setEssaisData(data);
      } catch (error) {
        console.error('Erreur chargement essais:', error);
      }
    };
    loadEssais();
  }, [echantillon.id]);

  const handleEssaiClick = async (essaiType: string) => {
    setSelectedEssai(essaiType);
    setIsDialogOpen(true);
    
    if (!essaisData[essaiType]) {
      try {
        await createEssai({
          echantillon: echantillon.id,
          type: essaiType,
          section: 'route',
          duree_estimee: essaiType === 'AG' ? 5 : essaiType === 'Proctor' ? 4 : 5,
          statut: 'attente'
        });
      } catch (error) {
        console.error('Erreur création essai:', error);
      }
    }
  };

  const getEssaiData = (essaiType: string) => {
    return essaisData[essaiType] || { statut: 'attente', dateDebut: null, dateFin: null, operateur: null };
  };

  const getStatutColor = (statut: string) => {
    switch (statut) {
      case 'attente': return '#FFC107';
      case 'en_cours': return '#003366';
      case 'pret_envoi': return '#FD7E14'; // Orange pour prêt à envoyer
      case 'termine': return '#28A745';
      default: return '#6C757D';
    }
  };

  const getStatutText = (statut: string, essaiType?: string) => {
    switch (statut) {
      case 'attente': return 'En attente';
      case 'en_cours': return 'En cours';
      case 'pret_envoi': return 'Prêt à envoyer';
      case 'termine': return 'Terminé';
      case 'stockage': return echantillon.statut === 'urgente' ? 'Urgent' : 'Normal';
      default: return echantillon.statut === 'urgente' ? 'Urgent' : 'Normal';
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-xl">{echantillon.code}</CardTitle>
              <CardDescription>
                {echantillon.nature} - Reçu le {formatDateFr(echantillon.dateReception)}
              </CardDescription>
            </div>
            <Badge 
              style={{ 
                backgroundColor: getStatutColor(echantillon.statut), 
                color: '#FFFFFF' 
              }}
            >
              {getStatutText(echantillon.statut)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '2px solid #E5E7EB' }}>
                  <th className="text-left p-3 font-semibold">Type d'essai</th>
                  <th className="text-left p-3 font-semibold">Statut</th>
                  <th className="text-left p-3 font-semibold">Opérateur</th>
                  <th className="text-left p-3 font-semibold">Dates</th>
                  <th className="text-left p-3 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {echantillon.essaisRoute.map((essaiType) => {
                  const essaiData = getEssaiData(essaiType);
                  const { statut: statutEssai, dateDebut, dateFin, operateur } = essaiData;
                  const isRejete = essaisData[essaiType]?.statut_validation === 'rejected' && statutEssai !== 'termine';
                  const isEnvoye = statutEssai === 'termine';
                  
                  return (
                    <tr key={essaiType} style={{ borderBottom: '1px solid #E5E7EB' }}>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{essaiType}</span>
                          {isRejete && (
                            <Badge style={{ backgroundColor: '#DC3545', color: '#FFFFFF', fontSize: '10px' }}>
                              REJETÉ
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="p-3">
                        <Badge 
                          style={{ 
                            backgroundColor: isEnvoye ? '#28A745' : isRejete ? '#DC3545' : statutEssai === 'en_cours' ? '#003366' : '#FFC107',
                            color: '#FFFFFF'
                          }}
                        >
                          {isEnvoye ? 'Terminé' : isRejete ? 'À refaire' : statutEssai === 'en_cours' ? 'En cours' : 'En cours'}
                        </Badge>
                      </td>
                      <td className="p-3 text-sm" style={{ color: '#6C757D' }}>
                        {operateur || '-'}
                      </td>
                      <td className="p-3 text-xs" style={{ color: '#6C757D' }}>
                        {dateDebut && <div>Début: {formatDateFr(dateDebut)}</div>}
                        {dateFin && <div>Fin: {formatDateFr(dateFin)}</div>}
                        {!dateDebut && !dateFin && '-'}
                      </td>
                      <td className="p-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEssaiClick(essaiType)}
                        >
                          {isEnvoye ? 'Voir' : 'Ouvrir'}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto" style={{ backgroundColor: '#f0f0f0', width: '700px', minWidth: '700px', maxWidth: '700px' }}>
          <DialogHeader>
            <DialogTitle>Essai {selectedEssai} - {echantillon.code}</DialogTitle>
            <DialogDescription>
              Fiche détaillée de l'essai
            </DialogDescription>
          </DialogHeader>
          {selectedEssai && (
            <EssaiForm 
              echantillon={echantillon}
              essaiType={selectedEssai}
              onClose={() => { 
                setIsDialogOpen(false); 
                setSelectedEssai(null);
                onUpdate();
              }} 
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function EssaiForm({ echantillon, essaiType, onClose }: { echantillon: EchantillonAvecEssais; essaiType: string; onClose: () => void }) {
  const today = new Date();
  const [essaiData, setEssaiData] = useState<any>(null);
  const [essaiStatut, setEssaiStatut] = useState('attente');
  const [isRejete, setIsRejete] = useState(false);
  const [commentaireRejet, setCommentaireRejet] = useState('');
  const [formData, setFormData] = useState<any>({
    dateDebut: today,
    dateFin: addDays(today, 5),
    operateur: '',
    commentaires: '',
    fichier: null,
    fichierFile: null,
  });
  const [envoye, setEnvoye] = useState(false);
  
  useEffect(() => {
    const loadEssai = async () => {
      try {
        const essais = await getEssaisAPI(echantillon.id);
        const essai = essais.find(e => e.type === essaiType);
        if (essai) {
          setEssaiData(essai);
          setEssaiStatut(essai.statut || 'attente');
          setIsRejete(essai.statut_validation === 'rejected');
          setCommentaireRejet(essai.commentaires_validation || '');
          setEnvoye(essai.statut === 'termine');
          const dureeEstimee = essaiType === 'AG' ? 5 : essaiType === 'Proctor' ? 4 : 5;
          setFormData({
            dateDebut: essai.date_debut ? new Date(essai.date_debut) : today,
            dateFin: essai.date_fin ? new Date(essai.date_fin) : addDays(today, dureeEstimee),
            operateur: essai.operateur || '',
            commentaires: essai.commentaires || '',
            fichier: essai.fichier || null,
            ...(essai.resultats || {}),
          });
        }
      } catch (error) {
        console.error('Erreur chargement essai:', error);
      }
    };
    loadEssai();
  }, [echantillon.id, essaiType]);
  
  if (!essaiData) return <div>Chargement...</div>;
  
  const essai = {
    id: essaiData.id,
    type: essaiType,
    echantillonCode: echantillon.code,
    statut: essaiData.statut || 'attente',
    dateReception: echantillon.dateReception,
    dureeEstimee: essaiType === 'AG' ? 5 : essaiType === 'Proctor' ? 4 : 5,
    dateDebut: essaiData.date_debut || null,
    dateFin: essaiData.date_fin || null,
    operateur: essaiData.operateur || '',
    commentaires: essaiData.commentaires || '',
    resultats: essaiData.resultats || {}
  };
  
  const calculateDateFin = (dateDebut: Date, dureeEstimee: number) => {
    return addDays(dateDebut, dureeEstimee);
  };
  
  const updateFormData = (newData: any) => {
    setFormData({ ...formData, ...newData });
  };



  const handleTerminer = () => {
    if (!formData.dateFin) {
      toast.error('Veuillez saisir la date de fin');
      return;
    }

    // TODO: Sauvegarder via l'API backend
    const updatedData = {
      statut: 'termine',
      dateFin: format(formData.dateFin, 'yyyy-MM-dd'),
      resultats: getResultats(),
      commentaires: formData.commentaires,
    };
    console.log('Données à envoyer à l\'API:', updatedData);

    // Synchroniser avec mockData
    updateEssai(essai.id, {
      statut: 'termine',
      dateFin: format(formData.dateFin, 'yyyy-MM-dd'),
      resultats: getResultats(),
      commentaires: formData.commentaires,
      operateur: formData.operateur,
      dateDebut: formData.dateDebut ? format(formData.dateDebut, 'yyyy-MM-dd') : null,
    });

    // Changer le statut de l'échantillon à 'decodification'
    updateEchantillon(essai.echantillonCode, { statut: 'decodification' });
    toast.success(`Essai terminé - Échantillon ${essai.echantillonCode} envoyé à la décodification`);

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

  const getResultats = (data = formData) => {
    if (essai.type === 'AG') {
      return {
        pourcent_inf_2mm: data.pourcent_inf_2mm || '',
        pourcent_inf_80um: data.pourcent_inf_80um || '',
        coefficient_uniformite: data.coefficient_uniformite || '',
      };
    }
    if (essai.type === 'Proctor') {
      return {
        densite_opt: data.densite_opt || '',
        teneur_eau_opt: data.teneur_eau_opt || '',
        type_proctor: data.type_proctor || 'Normal',
      };
    }
    if (essai.type === 'CBR') {
      return {
        cbr_95: data.cbr_95 || '',
        cbr_98: data.cbr_98 || '',
        cbr_100: data.cbr_100 || '',
        gonflement: data.gonflement || '',
      };
    }
    return {};
  };
  
  // Gestion du fichier
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    setFormData(prev => ({ ...prev, fichier: file.name, fichierFile: file }));
    toast.success(`Fichier "${file.name}" sélectionné`);
  };

  const essaisEchantillon = getEssaisByEchantillon(essai.echantillonCode);
  const tousEssaisFinis = essaisEchantillon.every(e => e.statut === 'termine');

  return (
    <div className="space-y-2">
      {isRejete && (
        <div className="p-3 rounded" style={{ backgroundColor: '#DC354520', borderLeft: '4px solid #DC3545' }}>
          <div className="flex items-center gap-2 mb-2">
            <Badge style={{ backgroundColor: '#DC3545', color: '#FFFFFF' }}>ESSAI REJETÉ</Badge>
          </div>
          <p className="text-sm font-semibold mb-1">Raison du rejet :</p>
          <p className="text-sm" style={{ color: '#DC3545' }}>{commentaireRejet || 'Aucun commentaire'}</p>
          <p className="text-xs mt-2" style={{ color: '#6C757D' }}>Veuillez corriger et renvoyer l'essai</p>
        </div>
      )}
      
      <div className="grid grid-cols-1 gap-2">
        <div className="space-y-1">
          <Label className="text-xs">Statut</Label>
          <div>
            {essaiStatut === 'attente' && <Badge className="text-xs" style={{ backgroundColor: '#FFC107', color: '#FFFFFF' }}>Attente</Badge>}
            {essaiStatut === 'en_cours' && !isRejete && <Badge className="text-xs" style={{ backgroundColor: '#003366', color: '#FFFFFF' }}>En cours</Badge>}
            {essaiStatut === 'en_cours' && isRejete && <Badge className="text-xs" style={{ backgroundColor: '#DC3545', color: '#FFFFFF' }}>À refaire</Badge>}
            {essaiStatut === 'pret_envoi' && <Badge className="text-xs" style={{ backgroundColor: '#FD7E14', color: '#FFFFFF' }}>Prêt</Badge>}
            {essaiStatut === 'termine' && <Badge className="text-xs" style={{ backgroundColor: '#28A745', color: '#FFFFFF' }}>Terminé</Badge>}
          </div>
        </div>

        <div className="space-y-1">
          <Label htmlFor="operateur" className="text-xs">Opérateur</Label>
          <Input
            id="operateur"
            className="text-xs h-6"
            value={formData.operateur}
            onChange={(e) => updateFormData({ operateur: e.target.value })}
            placeholder="Nom"
            disabled={essaiStatut === 'termine'}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="dateDebut">Date début *</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-left"
                disabled={essaiStatut === 'termine'}
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

        {essaiStatut !== 'attente' && (
          <div className="space-y-2">
            <Label htmlFor="dateFin">Date fin estimée *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left"
                  disabled={essaiStatut === 'termine'}
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
      </div>

      <div className="space-y-1">
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
                  onChange={(e) => updateFormData({ pourcent_inf_2mm: e.target.value })}
                  placeholder="Ex: 85.5"
                  disabled={essaiStatut === 'termine'}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pourcent_inf_80um">% passant à 80µm</Label>
                <Input
                  id="pourcent_inf_80um"
                  type="number"
                  step="0.1"
                  value={formData.pourcent_inf_80um || ''}
                  onChange={(e) => updateFormData({ pourcent_inf_80um: e.target.value })}
                  placeholder="Ex: 45.2"
                  disabled={essaiStatut === 'termine'}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="coefficient_uniformite">Coefficient d'uniformité (Cu)</Label>
                <Input
                  id="coefficient_uniformite"
                  type="number"
                  step="0.01"
                  value={formData.coefficient_uniformite || ''}
                  onChange={(e) => updateFormData({ coefficient_uniformite: e.target.value })}
                  placeholder="Ex: 6.5"
                  disabled={essaiStatut === 'termine'}
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
                  onChange={(e) => updateFormData({ type_proctor: e.target.value })}
                  placeholder="Normal ou Modifié"
                  disabled={essaiStatut === 'termine'}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="densite_opt">Densité sèche optimale (g/cm³) *</Label>
                <Input
                  id="densite_opt"
                  type="number"
                  step="0.01"
                  value={formData.densite_opt || ''}
                  onChange={(e) => updateFormData({ densite_opt: e.target.value })}
                  placeholder="Ex: 1.95"
                  disabled={essaiStatut === 'termine'}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="teneur_eau_opt">Teneur en eau optimale (%) *</Label>
                <Input
                  id="teneur_eau_opt"
                  type="number"
                  step="0.1"
                  value={formData.teneur_eau_opt || ''}
                  onChange={(e) => updateFormData({ teneur_eau_opt: e.target.value })}
                  placeholder="Ex: 12.5"
                  disabled={essaiStatut === 'termine'}
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
                  onChange={(e) => updateFormData({ cbr_95: e.target.value })}
                  placeholder="Ex: 45"
                  disabled={essaiStatut === 'termine'}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cbr_98">CBR à 98% OPM (%)</Label>
                <Input
                  id="cbr_98"
                  type="number"
                  value={formData.cbr_98 || ''}
                  onChange={(e) => updateFormData({ cbr_98: e.target.value })}
                  placeholder="Ex: 65"
                  disabled={essaiStatut === 'termine'}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cbr_100">CBR à 100% OPM (%)</Label>
                <Input
                  id="cbr_100"
                  type="number"
                  value={formData.cbr_100 || ''}
                  onChange={(e) => updateFormData({ cbr_100: e.target.value })}
                  placeholder="Ex: 85"
                  disabled={essaiStatut === 'termine'}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gonflement">Gonflement (%)</Label>
                <Input
                  id="gonflement"
                  type="number"
                  step="0.01"
                  value={formData.gonflement || ''}
                  onChange={(e) => updateFormData({ gonflement: e.target.value })}
                  placeholder="Ex: 0.5"
                  disabled={essaiStatut === 'termine'}
                />
              </div>
            </>
          )}

        <div className="space-y-2">
            <Label htmlFor="commentaires">Commentaires et observations</Label>
            <Textarea
              id="commentaires"
              value={formData.commentaires}
              onChange={(e) => updateFormData({ commentaires: e.target.value })}
              placeholder="Observations et remarques sur l'essai..."
              rows={3}
              disabled={essaiStatut === 'termine'}
            />
          </div>

          <div className="space-y-2">
            <Label>Fichier Excel *</Label>
            <input
              type="file"
              id="file-upload"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
              disabled={essaiStatut === 'termine'}
            />
            <Button 
              type="button"
              variant="outline" 
              size="sm" 
              onClick={() => document.getElementById('file-upload')?.click()}
              disabled={essaiStatut === 'termine'}
            >
              <Upload className="h-4 w-4 mr-2" />
              {formData.fichier ? 'Changer le fichier' : 'Sélectionner un fichier'}
            </Button>
            {formData.fichier && (
              <p className="text-xs mt-1" style={{ color: '#28A745' }}>
                ✓ {formData.fichier}
              </p>
            )}
            <p className="text-xs" style={{ color: '#A9A9A9' }}>
              Formats recommandés: .xlsx, .xls
            </p>
        </div>
      </div>

      <div className="flex gap-3 justify-end pt-4">
        {essaiStatut === 'termine' && (
          <div className="w-full text-center py-3">
            <Badge style={{ backgroundColor: '#28A745', color: '#FFFFFF', fontSize: '14px', padding: '8px 16px' }}>
              ✓ Essai terminé et envoyé à la décodification
            </Badge>
          </div>
        )}
        
        {formData.fichier && essaiStatut !== 'termine' && (
          <Button 
            onClick={async () => {
              const resultats = getResultats();
              const hasResults = Object.values(resultats).some(val => val !== '');
              
              if (!hasResults) {
                toast.error('Veuillez saisir les résultats avant d\'envoyer');
                return;
              }
              
              try {
                const resultats = getResultats();
                
                // Si l'essai est en attente, le démarrer d'abord
                if (essaiStatut === 'attente') {
                  await demarrerEssai(essai.id, {
                    date_debut: formData.dateDebut ? format(formData.dateDebut, 'yyyy-MM-dd') : format(today, 'yyyy-MM-dd'),
                    operateur: formData.operateur
                  });
                }
                
                // Terminer l'essai et réinitialiser le statut de validation
                console.log('Fichier à envoyer:', formData.fichierFile);
                await terminerEssai(essai.id, {
                  date_fin: formData.dateFin ? format(formData.dateFin, 'yyyy-MM-dd') : format(today, 'yyyy-MM-dd'),
                  resultats: resultats,
                  commentaires: formData.commentaires,
                  statut_validation: 'pending'
                }, formData.fichierFile);
                
                // Envoyer l'échantillon en décodification dès qu'un essai est terminé
                await updateEchantillonAPI(echantillon.id, { statut: 'decodification' });
                toast.success(`✓ Essai ${essai.type} ${isRejete ? 'renvoyé' : 'envoyé'} à la décodification`, {
                  duration: 3000,
                })
                
                setEssaiStatut('termine');
                onClose();
                setTimeout(() => {
                  window.location.reload();
                }, 2000);
              } catch (error) {
                console.error('Erreur:', error);
                toast.error('Erreur lors de l\'envoi');
              }
            }}
            style={{ backgroundColor: '#28A745' }}
          >
            <Send className="h-4 w-4 mr-2" />
            Envoyer pour décodification
          </Button>
        )}
        

        
        {envoye && (
          <div className="text-center py-2">
            <Badge style={{ backgroundColor: '#28A745', color: '#FFFFFF' }}>
              ✓ Envoyé à la décodification
            </Badge>
          </div>
        )}
      </div>
    </div>
  );
}
