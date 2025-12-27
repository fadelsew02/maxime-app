import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Calendar } from '../ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Upload, CheckCircle, CalendarIcon, Send } from 'lucide-react';
import { toast } from 'sonner';
import { getEchantillons, Echantillon as APIEchantillon } from '../../lib/echantillonService';
import { essaiApi } from '../../lib/essaiApi';
import { updateEssaiResultats } from '../../lib/essaiService';
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

interface EssaiMecanique {
  id?: string;
  type: string;
  statut: string;
  statut_validation?: string;
  date_debut?: string;
  date_fin?: string;
  date_reception?: string;
  operateur?: string;
  resultats?: any;
  commentaires?: string;
  fichier?: string;
}

export function EssaisMecaniqueModule() {
  const { addNotification } = useNotifications();
  const [echantillons, setEchantillons] = useState<EchantillonAvecEssais[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterEssai, setFilterEssai] = useState('all');
  const [filterCode, setFilterCode] = useState('');

  const loadEchantillons = async () => {
    try {
      setLoading(true);
      
      // Utiliser l'endpoint backend qui filtre les échantillons avec essais mécaniques envoyés
      const response = await fetch('http://127.0.0.1:8000/api/echantillons/with_essais_meca_envoyes/', {
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
        essaisRoute: e.essais_meca_envoyes || []
      }));
      
      // Trier : essais rejetés en PREMIER, puis par date de réception (FIFO)
      echantillonsFormates.sort((a, b) => {
        const aRejete = a.essaisRoute.some((e: any) => e.statut_validation === 'rejected');
        const bRejete = b.essaisRoute.some((e: any) => e.statut_validation === 'rejected');
        
        if (aRejete && !bRejete) return -1;
        if (!aRejete && bRejete) return 1;
        
        const dateA = new Date(a.dateReception).getTime();
        const dateB = new Date(b.dateReception).getTime();
        return dateA - dateB;
      });
      
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

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1>Section Mécanique des Sols</h1>
        <p style={{ color: '#A9A9A9' }}>
          Essais de laboratoire - Mécanique ({filteredEchantillons.length} échantillon{filteredEchantillons.length > 1 ? 's' : ''} affiché{filteredEchantillons.length > 1 ? 's' : ''})
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
              <SelectItem value="Oedometre">Essai œdométrique</SelectItem>
              <SelectItem value="Cisaillement">Essai de cisaillement direct</SelectItem>
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
        <div className="space-y-6">
          {filteredEchantillons.map((echantillon) => (
            <EchantillonCard key={`${echantillon.id}-${echantillon.code}`} echantillon={echantillon} onUpdate={loadEchantillons} echantillons={filteredEchantillons} />
          ))}

          {filteredEchantillons.length === 0 && echantillons.length > 0 && (
            <div className="text-center py-12" style={{ color: '#A9A9A9' }}>
              Aucun échantillon avec l'essai sélectionné
            </div>
          )}

          {echantillons.length === 0 && (
            <div className="text-center py-12" style={{ color: '#A9A9A9' }}>
              Aucun échantillon avec essais mécaniques
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function EchantillonCard({ echantillon, onUpdate, echantillons }: { echantillon: EchantillonAvecEssais; onUpdate: () => void; echantillons: EchantillonAvecEssais[] }) {
  const [selectedEssai, setSelectedEssai] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [essaisData, setEssaisData] = useState<Record<string, EssaiMecanique>>({});
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let isMounted = true;
    const loadEssaisData = async () => {
      const essaisMap: Record<string, EssaiMecanique> = {};
      const essais = await essaiApi.getByEchantillon(echantillon.id);
      
      for (const essaiType of echantillon.essaisRoute) {
        const essai = essais.find(e => e.type === essaiType);
        if (essai) {
          essaisMap[essaiType] = {
            id: essai.id,
            type: essai.type,
            statut: essai.statut || 'attente',
            statut_validation: essai.statut_validation,
            date_debut: essai.date_debut,
            date_fin: essai.date_fin,
            operateur: essai.operateur,
            resultats: essai.resultats,
            commentaires: essai.commentaires,
            date_reception: essai.date_reception,
          };
        } else {
          essaisMap[essaiType] = {
            type: essaiType,
            statut: 'attente',
          };
        }
      }
      
      if (isMounted) {
        setEssaisData(essaisMap);
      }
    };
    loadEssaisData();
    return () => { isMounted = false; };
  }, [echantillon.id, refreshKey]);

  const handleEssaiClick = async (essaiType: string) => {
    // Vérifier s'il y a des échantillons arrivés avant qui n'ont pas encore démarré LE MÊME TYPE d'essai
    const echantillonIndex = echantillons.findIndex(e => e.id === echantillon.id);
    if (echantillonIndex > 0) {
      // Il y a des échantillons avant celui-ci
      const echantillonsAvant = echantillons.slice(0, echantillonIndex);
      
      // Vérifier si l'essai actuel est rejeté (prioritaire)
      const essaiActuelResponse = await fetch(`http://127.0.0.1:8000/api/essais/?echantillon=${echantillon.id}&type=${essaiType}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
      });
      const essaiActuelData = await essaiActuelResponse.json();
      const essaiActuel = essaiActuelData.results?.[0];
      const estRejete = essaiActuel?.statut_validation === 'rejected';
      
      // Si l'essai est rejeté, il est prioritaire et peut être traité immédiatement
      if (estRejete) {
        console.log(`🔴 Essai ${essaiType} rejeté - Priorité absolue`);
        // Ne pas vérifier l'ordre FIFO pour les essais rejetés
      } else {
        // Vérifier si un des échantillons avant a le même type d'essai non démarré
        for (const echAvant of echantillonsAvant) {
          if (echAvant.essaisRoute.includes(essaiType)) {
            // Charger les essais de cet échantillon
            try {
              const essaisResponse = await fetch(`http://127.0.0.1:8000/api/essais/?echantillon=${echAvant.id}&type=${essaiType}`, {
                headers: {
                  'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
                  'Content-Type': 'application/json',
                },
              });
              const essaisData = await essaisResponse.json();
              const essaiAvant = essaisData.results?.[0];
              
              // Si l'essai n'a pas encore démarré (pas de date_debut)
              if (essaiAvant && !essaiAvant.date_debut) {
                toast.error(`Ordre de traitement non respecté pour ${essaiType}`, {
                  description: `Vous devez d'abord traiter l'essai ${essaiType} de l'échantillon ${echAvant.code} arrivé avant.`,
                  duration: 5000
                });
                return;
              }
            } catch (error) {
              console.error('Erreur vérification ordre:', error);
            }
          }
        }
      }
    }
    
    setSelectedEssai(essaiType);
    setIsDialogOpen(true);
  };

  const getEssaiData = (essaiType: string) => {
    const essai = essaisData[essaiType];
    if (essai) {
      return {
        statut: essai.statut,
        dateDebut: essai.date_debut,
        dateFin: essai.date_fin,
        dateReception: essai.date_reception,
        operateur: essai.operateur
      };
    }
    return { statut: 'attente', dateDebut: null, dateFin: null, dateReception: null, operateur: null };
  };

  const getStatutColor = (statut: string) => {
    switch (statut) {
      case 'attente': return '#FFC107';
      case 'en_cours': return '#003366';
      case 'pret_envoi': return '#FD7E14';
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
                  const { statut: statutEssai, dateDebut, dateFin, dateReception, operateur } = essaiData;
                  const essaiComplet = essaisData[essaiType];
                  const isRejete = essaiComplet?.statut_validation === 'rejected';
                  const isTermine = statutEssai === 'termine' && !isRejete;
                  const isEnvoye = dateReception !== null && dateReception !== undefined;
                  
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
                            backgroundColor: isRejete ? '#DC3545' : isTermine ? '#28A745' : isEnvoye ? '#FFC107' : '#17A2B8',
                            color: '#FFFFFF'
                          }}
                        >
                          {isRejete ? 'À refaire' : isTermine ? 'Terminé' : isEnvoye ? 'En cours' : 'Stockage'}
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
                          Ouvrir
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
                setRefreshKey(prev => prev + 1);
              }} 
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function EssaiForm({ echantillon, essaiType, onClose }: { echantillon: EchantillonAvecEssais; essaiType: string; onClose: () => void }) {
  const [essaiBackend, setEssaiBackend] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const today = new Date();
  
  const calculateDateFin = (dateDebut: Date, dureeEstimee: number) => {
    return addDays(dateDebut, dureeEstimee);
  };

  const [formData, setFormData] = useState({
    dateDebut: today,
    dateFin: calculateDateFin(today, essaiType === 'Oedometre' ? 18 : 8),
    operateur: '',
    commentaires: '',
    fichier: null,
    fichierFile: null,
    cc: '',
    cs: '',
    gp: '',
    cohesion: '',
    phi: '',
  });

  useEffect(() => {
    const loadEssai = async () => {
      const essais = await essaiApi.getByEchantillon(echantillon.id);
      const essai = essais.find(e => e.type === essaiType);
      if (essai) {
        setEssaiBackend(essai);
        setFormData({
          dateDebut: essai.date_debut ? new Date(essai.date_debut) : today,
          dateFin: essai.date_fin ? new Date(essai.date_fin) : calculateDateFin(today, essaiType === 'Oedometre' ? 18 : 8),
          operateur: essai.operateur || '',
          commentaires: essai.commentaires || '',
          fichier: null,
          ...(essai.resultats || {}),
        });
      } else {
        const newEssai = await essaiApi.create({
          echantillon: echantillon.id,
          type: essaiType,
          section: 'mecanique',
          statut: 'attente',
          duree_estimee: essaiType === 'Oedometre' ? 18 : 8,
        });
        setEssaiBackend(newEssai);
      }
      setLoading(false);
    };
    loadEssai();
  }, [echantillon.id, essaiType]);

  if (loading || !essaiBackend) {
    return <div className="text-center py-8">Chargement...</div>;
  }
  
  const essai = {
    id: essaiBackend.id,
    type: essaiType,
    echantillonCode: echantillon.code,
    statut: essaiBackend.statut || 'attente',
    dateReception: echantillon.dateReception,
    dureeEstimee: essaiType === 'Oedometre' ? 18 : 8,
    dateDebut: essaiBackend.date_debut || null,
    dateFin: essaiBackend.date_fin || null,
    operateur: essaiBackend.operateur || '',
    commentaires: essaiBackend.commentaires || '',
    resultats: essaiBackend.resultats || {}
  };
  
  const updateFormData = async (newData: any) => {
    const updatedData = { ...formData, ...newData };
    setFormData(updatedData);
    
    // Mettre à jour dans le backend
    await essaiApi.update(essai.id, {
      operateur: updatedData.operateur,
      commentaires: updatedData.commentaires,
      resultats: getResultats(updatedData),
    });
  };



  const handleDemarrer = async () => {
    if (!formData.dateDebut) {
      toast.error('Veuillez saisir la date de début');
      return;
    }

    const dateDebutFormatted = format(formData.dateDebut, 'yyyy-MM-dd');
    const dateFinFormatted = formData.dateFin ? format(formData.dateFin, 'yyyy-MM-dd') : format(calculateDateFin(formData.dateDebut, essai.dureeEstimee), 'yyyy-MM-dd');

    await essaiApi.update(essai.id, {
      statut: 'en_cours',
      date_debut: dateDebutFormatted,
      date_fin: dateFinFormatted,
      operateur: formData.operateur,
    });
    
    toast.success('Essai démarré');
    onClose();
  };

  const handleTerminer = async () => {
    if (!formData.dateFin) {
      toast.error('Veuillez saisir la date de fin');
      return;
    }

    await essaiApi.update(essai.id, {
      statut: 'termine',
      date_fin: format(formData.dateFin, 'yyyy-MM-dd'),
      resultats: getResultats(),
      commentaires: formData.commentaires,
    });

    toast.success('Essai terminé et envoyé à la décodification');
    onClose();
  };

  const getResultats = (data = formData) => {
    if (essai.type === 'Oedometre') {
      return {
        cc: data.cc || '',
        cs: data.cs || '',
        gp: data.gp || '',
      };
    }
    if (essai.type === 'Cisaillement') {
      return {
        cohesion: data.cohesion || '',
        phi: data.phi || '',
      };
    }
    return {};
  };
  
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    setFormData(prev => ({ ...prev, fichier: file.name, fichierFile: file }));
    toast.success(`Fichier "${file.name}" sélectionné`);
  };

  const isRejete = essaiBackend.statut_validation === 'rejected';
  const commentaireRejet = essaiBackend.commentaires_validation;
  
  console.log('🔍 Essai modal:', {
    type: essai.type,
    statut: essai.statut,
    statut_validation: essai.statut_validation,
    isRejete,
    disabled: essai.statut === 'termine' && !isRejete
  });

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
            {essai.statut === 'attente' && <Badge className="text-xs" style={{ backgroundColor: '#FFC107', color: '#FFFFFF' }}>En attente</Badge>}
            {essai.statut === 'en_cours' && !isRejete && <Badge className="text-xs" style={{ backgroundColor: '#003366', color: '#FFFFFF' }}>En cours</Badge>}
            {essai.statut === 'en_cours' && isRejete && <Badge className="text-xs" style={{ backgroundColor: '#DC3545', color: '#FFFFFF' }}>À refaire</Badge>}
            {essai.statut === 'pret_envoi' && <Badge className="text-xs" style={{ backgroundColor: '#FD7E14', color: '#FFFFFF' }}>Prêt</Badge>}
            {essai.statut === 'termine' && <Badge className="text-xs" style={{ backgroundColor: '#28A745', color: '#FFFFFF' }}>Terminé</Badge>}
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
            disabled={essai.statut === 'termine' && !isRejete}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="dateDebut">Date début *</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-left"
                disabled={essai.statut === 'termine' && !isRejete}
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

        <div className="space-y-2">
          <Label htmlFor="dateFin">Date fin estimée</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left"
                  disabled={essai.statut === 'termine' && !isRejete}
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
      </div>

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
                  onChange={(e) => updateFormData({ cc: e.target.value })}
                  placeholder="Ex: 0.245"
                  disabled={essai.statut === 'termine' && !isRejete}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cs">Indice de gonflement (Cs)</Label>
                <Input
                  id="cs"
                  type="number"
                  step="0.001"
                  value={formData.cs || ''}
                  onChange={(e) => updateFormData({ cs: e.target.value })}
                  placeholder="Ex: 0.045"
                  disabled={essai.statut === 'termine' && !isRejete}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gp">Contrainte de préconsolidation (kPa)</Label>
                <Input
                  id="gp"
                  type="number"
                  value={formData.gp || ''}
                  onChange={(e) => updateFormData({ gp: e.target.value })}
                  placeholder="Ex: 150"
                  disabled={essai.statut === 'termine' && !isRejete}
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
                  onChange={(e) => updateFormData({ cohesion: e.target.value })}
                  placeholder="Ex: 25"
                  disabled={essai.statut === 'termine' && !isRejete}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phi">Angle de frottement φ (°)</Label>
                <Input
                  id="phi"
                  type="number"
                  step="0.1"
                  value={formData.phi || ''}
                  onChange={(e) => updateFormData({ phi: e.target.value })}
                  placeholder="Ex: 28.5"
                  disabled={essai.statut === 'termine' && !isRejete}
                />
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="commentaires">Commentaires</Label>
            <Textarea
              id="commentaires"
              value={formData.commentaires}
              onChange={(e) => updateFormData({ commentaires: e.target.value })}
              placeholder="Observations et remarques"
              rows={3}
              disabled={essai.statut === 'termine' && !isRejete}
            />
          </div>

          <div className="space-y-2">
            <Label>Fichier Excel *</Label>
            <input
              type="file"
              id="file-upload"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
              disabled={essai.statut === 'termine' && !isRejete}
            />
            <Button 
              type="button"
              variant="outline" 
              size="sm" 
              onClick={() => document.getElementById('file-upload')?.click()}
              disabled={essai.statut === 'termine' && !isRejete}
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
        {(essai.statut === 'attente' || essai.statut === 'en_cours' || isRejete) && (() => {
          const resultats = getResultats();
          const hasResults = Object.values(resultats).some(val => val !== '');
          const canSend = isRejete ? hasResults : (hasResults && formData.fichier);
          
          console.log('🔵 Bouton:', { hasResults, fichier: formData.fichier, canSend, isRejete });
          
          return canSend ? (
            <Button 
              onClick={async () => {
                const resultats = getResultats();
                
                if (essai.statut === 'attente') {
                  await essaiApi.update(essai.id, {
                    statut: 'en_cours',
                    date_debut: format(formData.dateDebut, 'yyyy-MM-dd'),
                    operateur: formData.operateur,
                  });
                }
                
                // Utiliser updateEssaiResultats pour envoyer le fichier
                if (formData.fichierFile) {
                  await updateEssaiResultats(essai.id, {
                    resultats: resultats,
                    commentaires: formData.commentaires,
                    operateur: formData.operateur,
                  }, formData.fichierFile);
                }
                
                await essaiApi.update(essai.id, {
                  statut: 'termine',
                  statut_validation: 'pending',
                  date_fin: format(formData.dateFin || new Date(), 'yyyy-MM-dd'),
                  resultats: resultats,
                  commentaires: formData.commentaires,
                  operateur: formData.operateur,
                });
                
                // Mettre à jour le statut de l'échantillon pour la décodification
                await fetch(`http://127.0.0.1:8000/api/echantillons/${echantillon.id}/`, {
                  method: 'PATCH',
                  headers: {
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({ statut: 'decodification' })
                });
                
                toast.success(`Essai ${essai.type} ${isRejete ? 'renvoyé' : 'envoyé'} à la décodification`);
                onClose();
              }}
              style={{ backgroundColor: '#28A745' }}
            >
              {isRejete ? 'Renvoyer à la décodification' : 'Envoyer à la décodification'}
            </Button>
          ) : null;
        })()}
        
        {essai.statut === 'termine' && !isRejete && (
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
