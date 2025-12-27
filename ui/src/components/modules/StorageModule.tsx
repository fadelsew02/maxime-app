import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Calendar } from '../ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { CalendarIcon, Send, AlertTriangle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { getEchantillons, updateEchantillon, addEssai, Echantillon as MockEchantillon, calculateReturnDate } from '../../lib/mockData';
import { getEchantillonsByStatut, Echantillon as APIEchantillon, updateEchantillon as updateAPIEchantillon, changeEchantillonStatut } from '../../lib/echantillonService';
import { updateEssai, getEssaisByEchantillon } from '../../lib/essaiService';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useNotifications } from '../../contexts/NotificationContext';
import { formatDateFr } from '../../lib/dateUtils';

// Type unifié pour les échantillons
type Echantillon = MockEchantillon | (APIEchantillon & { essais: string[] });

export function StorageModule() {
  const { addNotification } = useNotifications();
  const [echantillons, setEchantillons] = useState<Echantillon[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEchantillon, setSelectedEchantillon] = useState<string | null>(null);
  const [dateEnvoiParEssai, setDateEnvoiParEssai] = useState<Record<string, Date>>({});
  const [sectionsSelectionnees, setSectionsSelectionnees] = useState<string[]>([]);
  const [priorite, setPriorite] = useState<'normale' | 'urgente'>('normale');
  const [dateRetourEstimeeParEssai, setDateRetourEstimeeParEssai] = useState<Record<string, string>>({});
  const [aiSuggestions, setAiSuggestions] = useState<Record<string, { date: Date; message: string }>>({});
  const [delayDaysParEssai, setDelayDaysParEssai] = useState<Record<string, number>>({});
  const [originalEstimatedDateParEssai, setOriginalEstimatedDateParEssai] = useState<Record<string, Date>>({});
  const [essaisEnvoyes, setEssaisEnvoyes] = useState<Record<string, boolean>>({});
  const [essaisAjustesManuel, setEssaisAjustesManuel] = useState<Record<string, boolean>>({});

  const refreshEchantillons = async () => {
    try {
      setLoading(true);
      const apiEchantillons = await getEchantillonsByStatut('stockage');
      // Convertir les échantillons API au format attendu
      const formattedEchantillons = apiEchantillons.map((e: APIEchantillon) => ({
        ...e,
        id: e.id,
        code: e.code,
        clientCode: e.client_code || '',
        nature: e.nature,
        profondeurDebut: e.profondeur_debut.toString(),
        profondeurFin: e.profondeur_fin.toString(),
        sondage: e.sondage,
        nappe: e.nappe || '',
        qrCode: e.qr_code,
        photo: e.photo,
        dateReception: e.date_reception,
        statut: e.statut as any,
        priorite: e.priorite as any,
        chefProjet: e.chef_projet || '',
        essais: e.essais_types || [],
      }));
      setEchantillons(formattedEchantillons as any);
      
      // Charger les essais envoyés depuis l'API
      const essaisEnvoyesTemp: Record<string, boolean> = {};
      const datesEnvoiTemp: Record<string, Date> = {};
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      for (const ech of formattedEchantillons) {
        const essais = await getEssaisByEchantillon(ech.id);
        console.log(`📦 Échantillon ${ech.code}, essais:`, essais);
        essais.forEach(essai => {
          if (essai.date_reception) {
            console.log(`📅 Essai ${essai.type} a date_reception:`, essai.date_reception);
            const dateReception = new Date(essai.date_reception);
            dateReception.setHours(0, 0, 0, 0);
            // Charger la date d'envoi avec clé unique par échantillon
            const cle = `${ech.code}_${essai.type}`;
            datesEnvoiTemp[cle] = dateReception;
            // Marquer comme envoyé seulement si la date est passée ou aujourd'hui
            if (dateReception <= today) {
              essaisEnvoyesTemp[cle] = true;
              console.log(`✅ Essai ${essai.type} marqué comme envoyé`);
            } else {
              console.log(`⏳ Essai ${essai.type} en attente (date future)`);
            }
          }
        });
      }
      console.log('📅 Dates chargées:', datesEnvoiTemp);
      setEssaisEnvoyes(essaisEnvoyesTemp);
      // Ne pas écraser dateEnvoiParEssai ici, il sera rempli quand on sélectionne l'échantillon
    } catch (error) {
      console.error('Erreur chargement échantillons:', error);
      toast.error('Erreur lors du chargement des échantillons');
    } finally {
      setLoading(false);
    }
  };

  // Charger les échantillons au montage
  useEffect(() => {
    refreshEchantillons();
  }, []);

  // Vérifier automatiquement si les dates d'envoi sont arrivées
  useEffect(() => {
    const interval = setInterval(async () => {
      const now = new Date();
      
      for (const ech of echantillons) {
        // Vérifier si tous les essais ont une date d'envoi passée ET ne sont pas ajustés manuellement
        const essaisAvecDatePassee = ech.essais.filter(essaiType => {
          const dateEnvoi = dateEnvoiParEssai[essaiType];
          const estAjusteManuel = essaisAjustesManuel[essaiType];
          return dateEnvoi && dateEnvoi <= now && !estAjusteManuel;
        });
        
        // Si tous les essais ont leur date d'envoi passée, envoyer l'échantillon
        if (essaisAvecDatePassee.length === ech.essais.length && ech.essais.length > 0) {
          try {
            await changeEchantillonStatut(ech.id, 'essais');
            toast.success(`Échantillon ${ech.code} envoyé automatiquement`);
            
            // Retirer de la liste
            setEchantillons(prev => prev.filter(e => e.id !== ech.id));
            if (selectedEchantillon === ech.code) {
              setSelectedEchantillon(null);
            }
          } catch (error) {
            console.error('Erreur envoi auto:', error);
          }
        }
      }
      
      // Rafraîchir la liste si aucun échantillon sélectionné
      if (!selectedEchantillon) {
        refreshEchantillons();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [selectedEchantillon, echantillons, dateEnvoiParEssai, essaisAjustesManuel]);

  const echantillon = echantillons.find(e => e.code === selectedEchantillon);

  // Vérifier les suggestions IA expirées et déclencher l'envoi automatique (désactivé pour éviter l'oscillation)
  // useEffect(() => {
  //   const interval = setInterval(() => {
  //     const now = new Date();
  //     Object.entries(aiSuggestions).forEach(([code, suggestion]) => {
  //       if (suggestion.date <= now) {
  //         // La date/heure est arrivée, déclencher l'envoi automatique
  //         const ech = echantillons.find(e => e.code === code);
  //         if (ech) {
  //           // Envoyer automatiquement aux sections appropriées
  //           const aEssaisRoute = ech.essais.some(e => ['AG', 'Proctor', 'CBR'].includes(e));
  //           const aEssaisMeca = ech.essais.some(e => ['Oedometre', 'Cisaillement'].includes(e));

  //           if (aEssaisRoute) {
  //             ech.essais.filter(e => ['AG', 'Proctor', 'CBR'].includes(e)).forEach(essaiType => {
  //               if (dateEnvoiParEssai[essaiType]) {
  //                 handleEnvoiEssai(essaiType);
  //               }
  //             });
  //           }
  //           if (aEssaisMeca) {
  //             ech.essais.filter(e => ['Oedometre', 'Cisaillement'].includes(e)).forEach(essaiType => {
  //               if (dateEnvoiParEssai[essaiType]) {
  //                 handleEnvoiEssai(essaiType);
  //               }
  //             });
  //           }

  //           // Supprimer la suggestion traitée
  //           setAiSuggestions(prev => {
  //             const newSuggestions = { ...prev };
  //             delete newSuggestions[code];
  //             return newSuggestions;
  //           });
  //         }
  //       }
  //     });
  //   }, 60000); // Vérifier chaque minute

  //   return () => clearInterval(interval);
  // }, [aiSuggestions, echantillons]);

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
  const handleDateEnvoiEssaiChange = async (essaiType: string, date: Date | undefined, skipAutoSend = false) => {
    console.log('📅 handleDateEnvoiEssaiChange:', essaiType, date);
    setDateEnvoiParEssai(prev => ({ ...prev, [essaiType]: date! }));
    if (date && echantillon) {
      const dateRetour = calculateReturnDate(
        format(date, 'yyyy-MM-dd'),
        [essaiType],
        priorite
      );
      setDateRetourEstimeeParEssai(prev => ({ ...prev, [essaiType]: dateRetour }));
      
      // Sauvegarder dans le backend
      try {
        const essais = await getEssaisByEchantillon(echantillon.id);
        const essai = essais.find(e => e.type === essaiType);
        console.log('💾 Essai trouvé:', essai);
        if (essai) {
          const dateStr = format(date, 'yyyy-MM-dd');
          console.log('💾 Sauvegarde date:', dateStr, 'pour essai ID:', essai.id);
          await updateEssai(essai.id, {
            date_reception: dateStr
          });
          console.log('✅ Date sauvegardée avec succès');
        }
      } catch (error) {
        console.error('❌ Erreur sauvegarde date:', error);
      }
      
      // Vérifier immédiatement si cet essai a une date passée ou aujourd'hui
      // MAIS seulement si l'essai n'a PAS été ajusté manuellement ET skipAutoSend est false
      const estAjusteManuel = essaisAjustesManuel[essaiType];
      
      if (!estAjusteManuel && !skipAutoSend) {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const selectedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        
        if (selectedDate <= today) {
          console.log('⚡ Envoi automatique de l\'essai', essaiType);
          toast.info(`Envoi automatique de ${essaiType} dans 2 secondes...`);
          // Envoyer après 2 secondes
          setTimeout(async () => {
            await handleEnvoiEssai(essaiType);
          }, 2000);
        }
      }
    }
  };

  // Gérer le changement du nombre de jours de retard pour un essai spécifique
  const handleDelayEssaiChange = async (essaiType: string, days: number) => {
    // Limiter à max 5 jours de retard
    if (days > 5) {
      toast.error('Maximum 5 jours de retard autorisés');
      return;
    }
    
    // Appliquer le délai UNIQUEMENT à cet essai
    setDelayDaysParEssai(prev => ({ ...prev, [essaiType]: days }));
    setEssaisAjustesManuel(prev => ({ ...prev, [essaiType]: true }));
    
    // Mettre à jour la date pour cet essai
    if (echantillon) {
      const originalDate = originalEstimatedDateParEssai[essaiType];
      if (originalDate) {
        const delayedDate = new Date(originalDate);
        delayedDate.setDate(delayedDate.getDate() + days);
        await handleDateEnvoiEssaiChange(essaiType, delayedDate, true); // skipAutoSend = true
      }
      
      // Persister dans le backend
      try {
        const essais = await getEssaisByEchantillon(echantillon.id);
        const essai = essais.find(e => e.type === essaiType);
        if (essai && originalDate) {
          const delayedDate = new Date(originalDate);
          delayedDate.setDate(delayedDate.getDate() + days);
          await updateEssai(essai.id, {
            date_reception: format(delayedDate, 'yyyy-MM-dd')
          });
        }
        toast.success(`Date ${essaiType} mise à jour`);
      } catch (error) {
        console.error('Erreur sauvegarde:', error);
        toast.error('Erreur lors de la sauvegarde');
      }
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

  const handleEnvoiEssai = async (essaiType: string, skipNotification = false) => {
    const dateEnvoi = dateEnvoiParEssai[essaiType];
    const dateRetourEstimee = dateRetourEstimeeParEssai[essaiType];

    if (!selectedEchantillon || !dateEnvoi) {
      toast.error('Veuillez sélectionner une date d\'envoi');
      return;
    }

    const ech = echantillons.find(e => e.code === selectedEchantillon);
    if (!ech) return;

    // Utiliser la date d'aujourd'hui si on envoie manuellement (accéléré)
    const today = new Date();
    const dateEnvoiStr = format(today, 'yyyy-MM-dd');

    // Vérifier la capacité du laboratoire pour ce type d'essai à cette date
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/capacites/check/?type_essai=${essaiType}&date=${dateEnvoiStr}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const capaciteData = await response.json();
        if (!capaciteData.disponible) {
          toast.error('Capacité atteinte', {
            description: `Le laboratoire a atteint sa capacité pour ${essaiType} le ${formatDateFr(dateEnvoiStr)}. Veuillez choisir une autre date.`,
          });
          return;
        }
      }
    } catch (error) {
      console.warn('Impossible de vérifier la capacité, envoi autorisé:', error);
    }

    try {
      // Récupérer les essais de l'échantillon depuis l'API
      const essais = await getEssaisByEchantillon(ech.id);
      
      // Trouver l'essai correspondant au type
      const essai = essais.find(e => e.type === essaiType);
      
      if (essai) {
        // Mettre à jour la date_reception de l'essai via l'API avec la date d'aujourd'hui
        await updateEssai(essai.id, {
          date_reception: dateEnvoiStr
        });
        
        if (!skipNotification) {
          toast.success(`Essai ${essaiType} envoyé`, {
            description: `Date d'envoi: ${formatDateFr(dateEnvoiStr)}`,
          });
        }
      } else {
        toast.error(`Essai ${essaiType} non trouvé`);
        return;
      }

      // Mettre à jour la priorité de l'échantillon si nécessaire
      if (priorite !== ech.priorite) {
        await updateAPIEchantillon(ech.id, { priorite });
      }
    } catch (error) {
      console.error('Erreur lors de la planification:', error);
      toast.error('Erreur lors de la planification de l\'essai');
      return;
    }

    // Vérifier si tous les essais ont été envoyés (incluant celui qu'on vient d'envoyer)
    const cle = `${ech.code}_${essaiType}`;
    const essaisEnvoyesMisAJour = { ...essaisEnvoyes, [cle]: true };
    
    // Mettre à jour l'état immédiatement
    setEssaisEnvoyes(essaisEnvoyesMisAJour);
    
    const tousEssaisEnvoyes = ech.essais.every(essai => essaisEnvoyesMisAJour[`${ech.code}_${essai}`]);

    if (tousEssaisEnvoyes) {
      try {
        // Changer le statut à 'essais' seulement quand TOUS les essais sont envoyés
        await changeEchantillonStatut(ech.id, 'essais');
        
        toast.success(`Échantillon ${selectedEchantillon} envoyé`, {
          description: 'Tous les essais ont été planifiés',
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

        // Mettre à jour localement la liste des échantillons
        setEchantillons(prev => prev.filter(e => e.id !== ech.id));

        // Reset seulement quand tous les essais sont envoyés
        setSelectedEchantillon(null);
        setDateEnvoiParEssai({});
        setSectionsSelectionnees([]);
        setPriorite('normale');
        setDateRetourEstimeeParEssai({});
        setEssaisEnvoyes({});
      } catch (error) {
        console.error('Erreur changement statut:', error);
        toast.error('Erreur lors du changement de statut');
      }
    } else {
      // Ne pas désélectionner l'échantillon, garder le panneau ouvert
      // Notification pour l'essai spécifique
      const section = ['AG', 'Proctor', 'CBR'].includes(essaiType) ? 'Route' : 'Mécanique';
      const operateurRole = ['AG', 'Proctor', 'CBR'].includes(essaiType) ? 'operateur_route' : 'operateur_mecanique';

      addNotification({
        type: 'info',
        title: `Nouvel essai ${essaiType} planifié`,
        message: `L'essai ${essaiType} pour l'échantillon ${selectedEchantillon} est planifié pour le ${formatDateFr(dateEnvoiStr)}`,
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
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Échantillons en stockage</CardTitle>
                  <CardDescription>
                    {echantillons.length} échantillon(s) en attente d'envoi
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.location.reload()}
                >
                  <RefreshCw className="h-4 w-4" />
                  Actualiser
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {loading ? (
                  <p style={{ color: '#A9A9A9' }}>Chargement...</p>
                ) : echantillons.length === 0 ? (
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
                        // Ne réinitialiser que si c'est un nouvel échantillon
                        if (selectedEchantillon !== ech.code) {
                          setSelectedEchantillon(ech.code);
                          setSectionsSelectionnees([]);
                          setDateRetourEstimeeParEssai({});
                          setDelayDaysParEssai({});
                          setEssaisAjustesManuel({});
                          
                          // Charger les dates depuis le backend pour cet échantillon
                          const loadDatesForEchantillon = async () => {
                            const essais = await getEssaisByEchantillon(ech.id);
                            const datesTemp: Record<string, Date> = {};
                            const originalesTemp: Record<string, Date> = {};
                            
                            // Pour chaque essai, charger ou calculer la date
                            for (const essaiType of ech.essais) {
                              const essai = essais.find(e => e.type === essaiType);
                              
                              if (essai && essai.date_reception) {
                                // Si une date existe déjà, l'utiliser
                                const dateReception = new Date(essai.date_reception);
                                datesTemp[essaiType] = dateReception;
                                originalesTemp[essaiType] = dateReception;
                                console.log(`🔄 Chargé date existante pour ${essaiType}:`, dateReception);
                              } else {
                                // Sinon, calculer la prochaine date disponible via l'API
                                try {
                                  const response = await fetch(
                                    `http://127.0.0.1:8000/api/capacites/prochaine_date_disponible/?type_essai=${essaiType}`,
                                    {
                                      headers: {
                                        'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
                                      },
                                    }
                                  );
                                  
                                  if (response.ok) {
                                    const data = await response.json();
                                    const dateSuggeree = new Date(data.date_disponible);
                                    datesTemp[essaiType] = dateSuggeree;
                                    originalesTemp[essaiType] = dateSuggeree;
                                    console.log(`✨ Date suggérée pour ${essaiType}:`, dateSuggeree, `(capacité: ${data.capacite_restante}/${data.capacite_totale})`);
                                  }
                                } catch (error) {
                                  console.error(`Erreur calcul date pour ${essaiType}:`, error);
                                }
                              }
                            }
                            
                            setDateEnvoiParEssai(datesTemp);
                            setOriginalEstimatedDateParEssai(originalesTemp);
                            
                            // Calculer les dates de retour
                            Object.entries(datesTemp).forEach(([type, date]) => {
                              const dateRetour = calculateReturnDate(
                                format(date, 'yyyy-MM-dd'),
                                [type],
                                priorite
                              );
                              setDateRetourEstimeeParEssai(prev => ({ ...prev, [type]: dateRetour }));
                            });
                          };
                          
                          loadDatesForEchantillon();
                        }
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
                            {ech.nature} - {(ech as any).profondeurDebut || (ech as any).profondeur_debut}m à {(ech as any).profondeurFin || (ech as any).profondeur_fin}m
                          </p>
                          <div className="flex gap-2 mt-2">
                            {ech.essais.map((essai) => (
                              <Badge 
                                key={essai} 
                                variant="outline"
                                style={essaisEnvoyes[`${ech.code}_${essai}`] ? { backgroundColor: '#28A745', color: '#FFFFFF', borderColor: '#28A745' } : {}}
                              >
                                {essai}
                              </Badge>
                            ))}
                          </div>
                          <p className="text-xs mt-2" style={{ color: '#A9A9A9' }}>
                            Chef projet: {(ech as any).chefProjet || (ech as any).chef_projet || '-'}
                          </p>
                          {aiSuggestions[ech.code] && (
                            <div className="mt-2 p-2 rounded" style={{ backgroundColor: '#E3F2FD', color: '#003366' }}>
                              <p className="text-xs font-medium">💡 {aiSuggestions[ech.code].message}</p>
                            </div>
                          )}
                        </div>
                        <div className="text-xs text-right" style={{ color: '#A9A9A9' }}>
                          <p>Reçu le</p>
                          <p>{formatDateFr((ech as any).dateReception || (ech as any).date_reception)}</p>
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
                  {echantillon.essais.filter(essaiType => !essaisEnvoyes[`${echantillon.code}_${essaiType}`]).map((essaiType) => (
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
                        <Label>Ajuster la date d'envoi {essaiType}</Label>
                        <div className="flex gap-2 items-center">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const currentDelay = delayDaysParEssai[essaiType] || 0;
                              handleDelayEssaiChange(essaiType, currentDelay - 1);
                            }}
                            className="flex-1"
                          >
                            ⚡ Accélérer
                          </Button>
                          <span className="text-sm font-semibold px-2">
                            {delayDaysParEssai[essaiType] === 0 || !delayDaysParEssai[essaiType] 
                              ? 'Suggéré' 
                              : delayDaysParEssai[essaiType] > 0 
                                ? `+${delayDaysParEssai[essaiType]}j` 
                                : `${delayDaysParEssai[essaiType]}j`}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const currentDelay = delayDaysParEssai[essaiType] || 0;
                              handleDelayEssaiChange(essaiType, currentDelay + 1);
                            }}
                            className="flex-1"
                          >
                            🕐 Retarder
                          </Button>
                        </div>
                      </div>

                      {dateRetourEstimeeParEssai[essaiType] && (
                        <div className="p-2 rounded" style={{ backgroundColor: ['AG', 'Proctor', 'CBR'].includes(essaiType) ? '#E3F2FD' : '#F8D7DA' }}>
                          <Label className="text-xs">Date retour {essaiType} estimée</Label>
                          <p className="font-semibold text-sm" style={{ color: ['AG', 'Proctor', 'CBR'].includes(essaiType) ? '#003366' : '#721C24' }}>
                            {format(new Date(dateRetourEstimeeParEssai[essaiType]), 'PPP', { locale: fr })}
                          </p>
                        </div>
                      )}

                      {(() => {
                        const dateEnvoi = dateEnvoiParEssai[essaiType];
                        if (!dateEnvoi) return null;
                        
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        const selectedDate = new Date(dateEnvoi);
                        selectedDate.setHours(0, 0, 0, 0);
                        
                        const isToday = selectedDate.getTime() === today.getTime();
                        const isPast = selectedDate < today;
                        
                        // Le bouton "Envoyer maintenant" apparaît UNIQUEMENT si :
                        // - La date est aujourd'hui OU dans le passé
                        if (isToday || isPast) {
                          return (
                            <Button
                              className="w-full"
                              onClick={() => handleEnvoiEssai(essaiType)}
                              style={{ backgroundColor: '#28A745' }}
                            >
                              <Send className="h-4 w-4 mr-2" />
                              ⚡ Envoyer maintenant {essaiType}
                            </Button>
                          );
                        }
                        
                        // Pas de bouton pour les dates futures
                        return null;
                      })()}
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
