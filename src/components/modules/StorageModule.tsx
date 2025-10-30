import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Calendar } from '../ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { CalendarIcon, Send, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { getEchantillons, updateEchantillon, addEssai, Echantillon, calculateReturnDate } from '../../lib/mockData';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useNotifications } from '../../contexts/NotificationContext';

export function StorageModule() {
  const { addNotification } = useNotifications();
  const [echantillons, setEchantillons] = useState(() => getEchantillons().filter(e => e.statut === 'stockage'));
  const [selectedEchantillon, setSelectedEchantillon] = useState<string | null>(null);
  const [dateEnvoiParEssai, setDateEnvoiParEssai] = useState<Record<string, Date>>({});
  const [sectionsSelectionnees, setSectionsSelectionnees] = useState<string[]>([]);
  const [priorite, setPriorite] = useState<'normale' | 'urgente'>('normale');
  const [dateRetourEstimeeParEssai, setDateRetourEstimeeParEssai] = useState<Record<string, string>>({});
  const [aiSuggestions, setAiSuggestions] = useState<Record<string, { date: Date; message: string }>>({});
  const [delayDaysParEssai, setDelayDaysParEssai] = useState<Record<string, number>>({});
  const [originalEstimatedDateParEssai, setOriginalEstimatedDateParEssai] = useState<Record<string, Date>>({});

  const refreshEchantillons = () => {
    setEchantillons(getEchantillons().filter(e => e.statut === 'stockage'));
  };

  // Rafraîchir automatiquement les données toutes les 5 secondes
  useEffect(() => {
    const interval = setInterval(() => {
      refreshEchantillons();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const echantillon = echantillons.find(e => e.code === selectedEchantillon);

  // Vérifier les suggestions IA expirées et déclencher l'envoi automatique
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      Object.entries(aiSuggestions).forEach(([code, suggestion]) => {
        if (suggestion.date <= now) {
          // La date/heure est arrivée, déclencher l'envoi automatique
          const ech = echantillons.find(e => e.code === code);
          if (ech) {
            // Envoyer automatiquement aux sections appropriées
            const aEssaisRoute = ech.essais.some(e => ['AG', 'Proctor', 'CBR'].includes(e));
            const aEssaisMeca = ech.essais.some(e => ['Oedometre', 'Cisaillement'].includes(e));

            if (aEssaisRoute) {
              ech.essais.filter(e => ['AG', 'Proctor', 'CBR'].includes(e)).forEach(essaiType => {
                if (dateEnvoiParEssai[essaiType]) {
                  handleEnvoiEssai(essaiType);
                }
              });
            }
            if (aEssaisMeca) {
              ech.essais.filter(e => ['Oedometre', 'Cisaillement'].includes(e)).forEach(essaiType => {
                if (dateEnvoiParEssai[essaiType]) {
                  handleEnvoiEssai(essaiType);
                }
              });
            }

            // Supprimer la suggestion traitée
            setAiSuggestions(prev => {
              const newSuggestions = { ...prev };
              delete newSuggestions[code];
              return newSuggestions;
            });
          }
        }
      });
    }, 60000); // Vérifier chaque minute

    return () => clearInterval(interval);
  }, [aiSuggestions, echantillons]);

  // Simulation d'IA pour la planification par contraintes
  const simulateAIScheduling = (echantillon: Echantillon) => {
    // Simulation de contraintes : disponibilité des équipements, charge de travail, etc.
    const contraintes = {
      capaciteRoute: Math.floor(Math.random() * 5) + 1, // 1-5 échantillons par jour
      capaciteMeca: Math.floor(Math.random() * 3) + 1, // 1-3 échantillons par jour
      joursFermes: ['samedi', 'dimanche'],
      chargeActuelle: Math.random() * 0.8, // 0-80% de charge
    };

    const today = new Date();
    let joursAjoutes = 1; // Commencer par demain
    let dateProposee = new Date(today);

    // Trouver le prochain jour ouvrable disponible (simplifié)
    while (joursAjoutes < 14) { // Maximum 2 semaines
      dateProposee = new Date(today);
      dateProposee.setDate(today.getDate() + joursAjoutes);

      const jourSemaine = dateProposee.toLocaleDateString('fr-FR', { weekday: 'long' }).toLowerCase();
      const estJourFerme = contraintes.joursFermes.includes(jourSemaine);

      if (!estJourFerme) {
        // Ajouter une heure aléatoire entre 8h et 17h
        const heureAleatoire = 8 + Math.floor(Math.random() * 9); // 8h à 17h
        const minuteAleatoire = Math.floor(Math.random() * 4) * 15; // 0, 15, 30, 45 minutes
        dateProposee.setHours(heureAleatoire, minuteAleatoire, 0, 0);

        // Vérifier si la date proposée n'est pas dans le passé
        if (dateProposee > today) {
          break;
        }
      }

      joursAjoutes++;
    }

    return dateProposee;
  };

  // Calculer la date de retour pour un essai spécifique
  const handleDateEnvoiEssaiChange = (essaiType: string, date: Date | undefined) => {
    setDateEnvoiParEssai(prev => ({ ...prev, [essaiType]: date! }));
    if (date && echantillon) {
      const dateRetour = calculateReturnDate(
        format(date, 'yyyy-MM-dd'),
        [essaiType],
        priorite
      );
      setDateRetourEstimeeParEssai(prev => ({ ...prev, [essaiType]: dateRetour }));
    }
  };

  // Gérer le changement du nombre de jours de retard pour un essai spécifique
  const handleDelayEssaiChange = (essaiType: string, days: number) => {
    setDelayDaysParEssai(prev => ({ ...prev, [essaiType]: days }));
    if (originalEstimatedDateParEssai[essaiType] && echantillon) {
      const delayedDate = new Date(originalEstimatedDateParEssai[essaiType]);
      delayedDate.setDate(delayedDate.getDate() + days);
      handleDateEnvoiEssaiChange(essaiType, delayedDate);
    }
  };

  const handlePrioriteChange = (newPriorite: 'normale' | 'urgente') => {
    setPriorite(newPriorite);
    // Recalculer les dates de retour pour tous les essais
    Object.entries(dateEnvoiParEssai).forEach(([essaiType, date]) => {
      if (date && echantillon) {
        const dateRetour = calculateReturnDate(
          format(date, 'yyyy-MM-dd'),
          [essaiType],
          newPriorite
        );
        setDateRetourEstimeeParEssai(prev => ({ ...prev, [essaiType]: dateRetour }));
      }
    });
  };

  const handleEnvoiEssai = (essaiType: string) => {
    const dateEnvoi = dateEnvoiParEssai[essaiType];
    const dateRetourEstimee = dateRetourEstimeeParEssai[essaiType];

    if (!selectedEchantillon || !dateEnvoi) {
      toast.error('Veuillez sélectionner une date d\'envoi');
      return;
    }

    const ech = echantillons.find(e => e.code === selectedEchantillon);
    if (!ech) return;

    const dateEnvoiStr = format(dateEnvoi, 'yyyy-MM-dd');
    const section = ['AG', 'Proctor', 'CBR'].includes(essaiType) ? 'route' : 'mecanique';

    const durees: Record<string, number> = {
      AG: 5,
      Proctor: 4,
      CBR: 5,
      Oedometre: 18,
      Cisaillement: 8,
    };

    // Créer l'essai spécifique
    addEssai({
      id: Date.now().toString() + Math.random(),
      echantillonCode: selectedEchantillon,
      type: essaiType as any,
      section: section,
      dateReception: dateEnvoiStr,
      statut: 'attente',
      dureeEstimee: durees[essaiType] || 5,
    });

    // Mettre à jour la priorité et les dates selon l'essai
    const updateData: any = { priorite };
    updateData[`dateEnvoi${essaiType}`] = dateEnvoiStr;
    updateData[`dateRetourEstimee${essaiType}`] = dateRetourEstimee;
    updateEchantillon(selectedEchantillon, updateData);

    // Vérifier si tous les essais ont été envoyés
    const tousEssaisEnvoyes = ech.essais.every(essai => dateEnvoiParEssai[essai]);

    if (tousEssaisEnvoyes) {
      updateEchantillon(selectedEchantillon, { statut: 'essais' });
      toast.success(`Échantillon ${selectedEchantillon} envoyé`, {
        description: 'Tous les essais ont été envoyés',
      });

      // Notifications pour les opérateurs de labo
      addNotification({
        type: 'info',
        title: 'Nouvel échantillon en attente',
        message: `L'échantillon ${selectedEchantillon} a été envoyé aux laboratoires pour les essais: ${ech.essais.join(', ')}`,
        userRole: 'operateur_route',
        module: 'Stockage',
        actionRequired: true,
      });

      addNotification({
        type: 'info',
        title: 'Nouvel échantillon en attente',
        message: `L'échantillon ${selectedEchantillon} a été envoyé aux laboratoires pour les essais: ${ech.essais.join(', ')}`,
        userRole: 'operateur_mecanique',
        module: 'Stockage',
        actionRequired: true,
      });

      // Notification pour le responsable matériaux
      addNotification({
        type: 'success',
        title: 'Échantillon envoyé aux labos',
        message: `L'échantillon ${selectedEchantillon} (${ech.essais.join(', ')}) a été envoyé aux laboratoires`,
        userRole: 'responsable_materiaux',
        module: 'Stockage',
      });

      // Reset
      setSelectedEchantillon(null);
      setDateEnvoiParEssai({});
      setSectionsSelectionnees([]);
      setPriorite('normale');
      setDateRetourEstimeeParEssai({});
    } else {
      toast.success(`Essai ${essaiType} envoyé`, {
        description: `Date retour estimée: ${dateRetourEstimee}`,
      });

      // Notification pour l'essai spécifique
      const section = ['AG', 'Proctor', 'CBR'].includes(essaiType) ? 'Route' : 'Mécanique';
      const operateurRole = ['AG', 'Proctor', 'CBR'].includes(essaiType) ? 'operateur_route' : 'operateur_mecanique';

      addNotification({
        type: 'info',
        title: `Nouvel essai ${essaiType} en attente`,
        message: `L'essai ${essaiType} pour l'échantillon ${selectedEchantillon} est prêt dans la section ${section}`,
        userRole: operateurRole,
        module: 'Stockage',
        actionRequired: true,
      });
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1>Module Stockage</h1>
        <p style={{ color: '#A9A9A9' }}>
          Gestion et planification des essais
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Échantillons en stockage</CardTitle>
              <CardDescription>
                {echantillons.length} échantillon(s) en attente d'envoi
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {echantillons.length === 0 ? (
                  <p style={{ color: '#A9A9A9' }}>Aucun échantillon en stockage</p>
                ) : (
                  echantillons.map((ech) => (
                    <div
                      key={ech.id}
                      className={`p-4 rounded-lg cursor-pointer transition-colors ${
                        selectedEchantillon === ech.code
                          ? 'ring-2'
                          : ''
                      }`}
                      style={{
                        backgroundColor: '#F5F5F5',
                      }}
                      onClick={() => {
                        setSelectedEchantillon(ech.code);
                        setSectionsSelectionnees([]);
                        setDateRetourEstimeeParEssai({});
                        setDelayDaysParEssai({});

                        // Générer des suggestions IA pour chaque essai de cet échantillon
                        ech.essais.forEach(essaiType => {
                          const suggestionDate = simulateAIScheduling(ech);
                          setOriginalEstimatedDateParEssai(prev => ({ ...prev, [essaiType]: suggestionDate }));
                          setAiSuggestions(prev => ({
                            ...prev,
                            [`${ech.code}_${essaiType}`]: {
                              date: suggestionDate,
                              message: `Envoi ${essaiType} prévu pour le ${format(suggestionDate, 'PPP \'à\' p', { locale: fr })}`
                            }
                          }));
                          handleDateEnvoiEssaiChange(essaiType, suggestionDate);
                        });
                      }}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span>{ech.code}</span>
                            {ech.priorite === 'urgente' && (
                              <Badge
                                style={{ backgroundColor: '#DC3545', color: '#FFFFFF' }}
                              >
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                Urgent
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm" style={{ color: '#A9A9A9' }}>
                            {ech.nature} - {ech.profondeurDebut}m à {ech.profondeurFin}m
                          </p>
                          <div className="flex gap-2 mt-2">
                            {ech.essais.map((essai) => (
                              <Badge key={essai} variant="outline">
                                {essai}
                              </Badge>
                            ))}
                          </div>
                          <p className="text-xs mt-2" style={{ color: '#A9A9A9' }}>
                            Chef projet: {ech.chefProjet}
                          </p>
                          {aiSuggestions[ech.code] && (
                            <div className="mt-2 p-2 rounded" style={{ backgroundColor: '#E3F2FD', color: '#003366' }}>
                              <p className="text-xs font-medium">💡 {aiSuggestions[ech.code].message}</p>
                            </div>
                          )}
                        </div>
                        <div className="text-xs text-right" style={{ color: '#A9A9A9' }}>
                          <p>Reçu le</p>
                          <p>{ech.dateReception}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Planification</CardTitle>
              <CardDescription>
                {selectedEchantillon ? `Envoi ${selectedEchantillon}` : 'Sélectionnez un échantillon'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {echantillon && (
                <>
                  <div className="space-y-2">
                    <Label>Priorité *</Label>
                    <Select value={priorite} onValueChange={(v: 'normale' | 'urgente') => handlePrioriteChange(v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="normale">Normale</SelectItem>
                        <SelectItem value="urgente">Urgente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Essais individuels */}
                  {echantillon.essais.map((essaiType) => (
                    <div key={essaiType} className="space-y-3 p-4 rounded-lg border" style={{ backgroundColor: ['AG', 'Proctor', 'CBR'].includes(essaiType) ? '#F8F9FA' : '#FFF3CD' }}>
                      <h4 className="font-semibold text-sm">{essaiType}</h4>
                      <div className="space-y-2">
                        <Label>Date d'envoi {essaiType} *</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className="w-full justify-start text-left"
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {dateEnvoiParEssai[essaiType] ? (
                                format(dateEnvoiParEssai[essaiType], 'PPP', { locale: fr })
                              ) : (
                                <span>Sélectionner une date</span>
                              )}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={dateEnvoiParEssai[essaiType]}
                              onSelect={(date?: Date) => handleDateEnvoiEssaiChange(essaiType, date)}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>

                      <div className="space-y-2">
                        <Label>Retarder l'envoi {essaiType} (jours)</Label>
                        <input
                          type="number"
                          min="0"
                          value={delayDaysParEssai[essaiType] || 0}
                          onChange={(e) => handleDelayEssaiChange(essaiType, parseInt(e.target.value) || 0)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="0"
                        />
                        {(delayDaysParEssai[essaiType] || 0) > 0 && (
                          <p className="text-xs" style={{ color: '#A9A9A9' }}>
                            Retardé de {delayDaysParEssai[essaiType]} jour(s)
                          </p>
                        )}
                      </div>

                      {dateRetourEstimeeParEssai[essaiType] && (
                        <div className="p-2 rounded" style={{ backgroundColor: ['AG', 'Proctor', 'CBR'].includes(essaiType) ? '#E3F2FD' : '#F8D7DA' }}>
                          <Label className="text-xs">Date retour {essaiType} estimée</Label>
                          <p className="font-semibold text-sm" style={{ color: ['AG', 'Proctor', 'CBR'].includes(essaiType) ? '#003366' : '#721C24' }}>
                            {format(new Date(dateRetourEstimeeParEssai[essaiType]), 'PPP', { locale: fr })}
                          </p>
                        </div>
                      )}

                      {!dateEnvoiParEssai[essaiType] && (
                        <Button
                          className="w-full"
                          onClick={() => handleEnvoiEssai(essaiType)}
                          style={{ backgroundColor: '#003366' }}
                          disabled={!dateEnvoiParEssai[essaiType]}
                        >
                          <Send className="h-4 w-4 mr-2" />
                          Envoyer {essaiType}
                        </Button>
                      )}

                      {dateEnvoiParEssai[essaiType] && (
                        <div className="p-2 rounded" style={{ backgroundColor: '#D4EDDA', color: '#155724' }}>
                          ✓ {essaiType} envoyé
                        </div>
                      )}
                    </div>
                  ))}
                </>
              )}

              {!echantillon && (
                <div className="text-center py-8" style={{ color: '#A9A9A9' }}>
                  Sélectionnez un échantillon pour planifier l'envoi
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
