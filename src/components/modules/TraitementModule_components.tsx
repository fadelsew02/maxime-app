import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Label } from '../ui/label';
import { FileText, Layers, Package } from 'lucide-react';
import { toast } from 'sonner';
import { formatDateFr } from '../../lib/dateUtils';
import { workflowApi } from '../../lib/workflowApi';

interface EssaiTraitement {
  echantillonCode: string;
  essaiType: string;
  dateReception: string;
  dateDebut: string;
  dateFin: string;
  operateur: string;
  resultats: any;
  commentaires: string;
  fichier: string;
  fichierData: string;
  validationComment: string;
  validationDate: string;
  dateRejet: string | null;
}

interface EchantillonGroupe {
  code: string;
  chefProjet: string;
  clientNom: string;
  essais: EssaiTraitement[];
}

interface EchantillonClient {
  id: string;
  code: string;
  nature: string;
  statut: string;
  date_reception: string;
  profondeur_debut: number;
  profondeur_fin: number;
  essais_count: number;
}

interface WorkflowEnvoye {
  id: number;
  code_echantillon: string;
  file_name: string;
  date_envoi_chef_projet: string;
  etape_actuelle: string;
  observations_traitement: string;
}

export function EchantillonDetails({ echantillon, onBack }: { echantillon: EchantillonGroupe; onBack: () => void }) {
  const [selectedEssai, setSelectedEssai] = useState<EssaiTraitement | null>(null);
  const [view, setView] = useState<'essais' | 'echantillons' | 'fichiers'>('essais');
  const [echantillonsClient, setEchantillonsClient] = useState<EchantillonClient[]>([]);
  const [workflowsEnvoyes, setWorkflowsEnvoyes] = useState<WorkflowEnvoye[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (view === 'echantillons') {
      loadEchantillonsClient();
    } else if (view === 'fichiers') {
      loadWorkflowsEnvoyes();
    }
  }, [view]);

  const loadEchantillonsClient = async () => {
    setLoading(true);
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/echantillons/?client_nom=${encodeURIComponent(echantillon.clientNom)}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      
      // Charger le nombre d'essais pour chaque échantillon
      const echantillonsAvecEssais = await Promise.all(
        data.results.map(async (ech: any) => {
          const essaisResponse = await fetch(`http://127.0.0.1:8000/api/essais/?echantillon=${ech.id}`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
            },
          });
          const essaisData = await essaisResponse.json();
          return {
            id: ech.id,
            code: ech.code,
            nature: ech.nature,
            statut: ech.statut,
            date_reception: ech.date_reception,
            profondeur_debut: ech.profondeur_debut,
            profondeur_fin: ech.profondeur_fin,
            essais_count: essaisData.results?.length || 0
          };
        })
      );
      
      setEchantillonsClient(echantillonsAvecEssais);
    } catch (error) {
      console.error('Erreur chargement échantillons:', error);
      toast.error('Erreur lors du chargement des échantillons');
    } finally {
      setLoading(false);
    }
  };

  const loadWorkflowsEnvoyes = async () => {
    setLoading(true);
    try {
      // Récupérer tous les workflows pour ce client
      const response = await fetch(`http://127.0.0.1:8000/api/echantillons/?client_nom=${encodeURIComponent(echantillon.clientNom)}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
      });
      const data = await response.json();
      
      const workflows: WorkflowEnvoye[] = [];
      for (const ech of data.results) {
        const workflow = await workflowApi.getByCode(ech.code);
        if (workflow && workflow.date_envoi_chef_projet && workflow.id) {
          workflows.push({
            id: workflow.id,
            code_echantillon: workflow.code_echantillon,
            file_name: workflow.file_name || '',
            date_envoi_chef_projet: workflow.date_envoi_chef_projet,
            etape_actuelle: workflow.etape_actuelle,
            observations_traitement: workflow.observations_traitement || ''
          });
        }
      }
      
      setWorkflowsEnvoyes(workflows.sort((a, b) => 
        new Date(b.date_envoi_chef_projet).getTime() - new Date(a.date_envoi_chef_projet).getTime()
      ));
    } catch (error) {
      console.error('Erreur chargement workflows:', error);
      toast.error('Erreur lors du chargement des fichiers');
    } finally {
      setLoading(false);
    }
  };

  const getStatutBadge = (statut: string) => {
    const statutConfig: Record<string, { bg: string; text: string; label: string }> = {
      'attente': { bg: '#FFC107', text: '#000', label: 'En attente' },
      'stockage': { bg: '#17A2B8', text: '#FFF', label: 'En stockage' },
      'essais': { bg: '#007BFF', text: '#FFF', label: 'En essais' },
      'decodification': { bg: '#6F42C1', text: '#FFF', label: 'Décodification' },
      'traitement': { bg: '#FD7E14', text: '#FFF', label: 'Traitement' },
      'validation': { bg: '#20C997', text: '#FFF', label: 'Validation' },
      'valide': { bg: '#28A745', text: '#FFF', label: 'Validé' },
      'rejete': { bg: '#DC3545', text: '#FFF', label: 'Rejeté' },
    };
    const config = statutConfig[statut] || { bg: '#6C757D', text: '#FFF', label: statut };
    return <Badge style={{ backgroundColor: config.bg, color: config.text }}>{config.label}</Badge>;
  };

  const getEtapeBadge = (etape: string) => {
    const etapeConfig: Record<string, { bg: string; text: string; label: string }> = {
      'chef_projet': { bg: '#007BFF', text: '#FFF', label: 'Chef Projet' },
      'chef_service': { bg: '#17A2B8', text: '#FFF', label: 'Chef Service' },
      'directeur_technique': { bg: '#6F42C1', text: '#FFF', label: 'Dir. Technique' },
      'directeur_snertp': { bg: '#FD7E14', text: '#FFF', label: 'Dir. SNERTP' },
      'marketing': { bg: '#20C997', text: '#FFF', label: 'Marketing' },
      'client': { bg: '#28A745', text: '#FFF', label: 'Envoyé Client' },
    };
    const config = etapeConfig[etape] || { bg: '#6C757D', text: '#FFF', label: etape };
    return <Badge style={{ backgroundColor: config.bg, color: config.text }}>{config.label}</Badge>;
  };

  if (selectedEssai) {
    return <EssaiDetails essai={selectedEssai} onBack={() => setSelectedEssai(null)} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <Button variant="outline" size="sm" onClick={onBack}>
          ← Retour
        </Button>
        <h3 className="font-semibold">Client: {echantillon.clientNom}</h3>
      </div>

      {/* Onglets de navigation */}
      <div className="flex gap-2 border-b pb-2">
        <Button
          variant={view === 'essais' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setView('essais')}
        >
          <Layers className="h-4 w-4 mr-2" />
          Essais en traitement
        </Button>
        <Button
          variant={view === 'echantillons' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setView('echantillons')}
        >
          <Package className="h-4 w-4 mr-2" />
          Tous les échantillons
        </Button>
        <Button
          variant={view === 'fichiers' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setView('fichiers')}
        >
          <FileText className="h-4 w-4 mr-2" />
          Fichiers envoyés
        </Button>
      </div>

      {/* Vue Essais en traitement */}
      {view === 'essais' && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Code échantillon</Label>
            <p>{echantillon.code}</p>
          </div>
          <div className="space-y-2">
            <Label>Chef de projet</Label>
            <p>{echantillon.chefProjet}</p>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Essais acceptés ({echantillon.essais.length})</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {echantillon.essais.map((essai) => {
                const estRepris = essai.dateRejet && essai.dateRejet !== null && essai.dateRejet !== '-';
                return (
                  <div key={essai.essaiType} className="relative">
                    <Button
                      variant="outline"
                      className="h-20 flex flex-col justify-center p-4 w-full"
                      onClick={() => setSelectedEssai(essai)}
                      style={{
                        borderColor: '#28A745',
                        backgroundColor: '#28A745' + '20'
                      }}
                    >
                      <span className="font-semibold">{essai.essaiType}</span>
                      <span className="text-xs text-green-600">
                        Accepté ✓
                      </span>
                    </Button>
                    {estRepris && (
                      <div 
                        className="absolute top-2 right-2"
                        style={{ 
                          backgroundColor: '#FD7E14', 
                          color: '#FFFFFF', 
                          fontSize: '9px', 
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontWeight: 'bold'
                        }}
                      >
                        REPRIS
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Vue Tous les échantillons */}
      {view === 'echantillons' && (
        <div className="space-y-4">
          <h3 className="font-semibold">Tous les échantillons de {echantillon.clientNom}</h3>
          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              <p className="mt-2 text-gray-500">Chargement...</p>
            </div>
          ) : echantillonsClient.length === 0 ? (
            <p className="text-center py-8 text-gray-500">Aucun échantillon trouvé</p>
          ) : (
            <div className="space-y-3">
              {echantillonsClient.map((ech) => (
                <div key={ech.id} className="p-4 rounded-lg border" style={{ backgroundColor: '#F5F5F5' }}>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-semibold">{ech.code}</span>
                        {getStatutBadge(ech.statut)}
                      </div>
                      <div className="text-sm space-y-1" style={{ color: '#6C757D' }}>
                        <p>Nature: {ech.nature}</p>
                        <p>Profondeur: {ech.profondeur_debut}m - {ech.profondeur_fin}m</p>
                        <p>Date réception: {formatDateFr(ech.date_reception)}</p>
                        <p>Essais: {ech.essais_count}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Vue Fichiers envoyés */}
      {view === 'fichiers' && (
        <div className="space-y-4">
          <h3 className="font-semibold">Fichiers de traitement envoyés</h3>
          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              <p className="mt-2 text-gray-500">Chargement...</p>
            </div>
          ) : workflowsEnvoyes.length === 0 ? (
            <p className="text-center py-8 text-gray-500">Aucun fichier envoyé</p>
          ) : (
            <div className="space-y-3">
              {workflowsEnvoyes.map((workflow) => (
                <div key={workflow.id} className="p-4 rounded-lg border" style={{ backgroundColor: '#F5F5F5' }}>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <FileText className="h-5 w-5" style={{ color: '#003366' }} />
                        <span className="font-semibold">{workflow.file_name}</span>
                      </div>
                      <div className="text-sm space-y-1" style={{ color: '#6C757D' }}>
                        <p>Échantillon: {workflow.code_echantillon}</p>
                        <p>Date d'envoi: {new Date(workflow.date_envoi_chef_projet).toLocaleString('fr-FR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs">Étape actuelle:</span>
                          {getEtapeBadge(workflow.etape_actuelle)}
                        </div>
                        {workflow.observations_traitement && (
                          <div className="mt-2 pt-2 border-t">
                            <p className="text-xs font-semibold">Observations:</p>
                            <p className="text-xs mt-1">{workflow.observations_traitement}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function EssaiDetails({ essai, onBack }: { essai: EssaiTraitement; onBack: () => void }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <Button variant="outline" size="sm" onClick={onBack}>
          ← Retour
        </Button>
        <h3 className="font-semibold">Essai {essai.essaiType} - {essai.echantillonCode}</h3>
      </div>
      
      {essai.dateRejet && (
        <div className="p-4 rounded-lg" style={{ backgroundColor: '#FFF3CD', border: '1px solid #FFC107' }}>
          <div className="flex items-center gap-2 mb-2">
            <Badge style={{ backgroundColor: '#FD7E14', color: '#FFFFFF' }}>ESSAI REPRIS</Badge>
          </div>
          <p className="text-sm" style={{ color: '#856404' }}>
            Cet essai a été rejeté le {essai.dateRejet} puis repris et corrigé par l'opérateur.
          </p>
          {essai.validationComment && essai.validationComment !== '-' && (
            <div className="mt-2 pt-2 border-t" style={{ borderColor: '#FFC107' }}>
              <p className="text-xs font-semibold" style={{ color: '#856404' }}>Motif du rejet:</p>
              <p className="text-xs mt-1" style={{ color: '#856404' }}>{essai.validationComment}</p>
            </div>
          )}
        </div>
      )}
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Code échantillon</Label>
          <p>{essai.echantillonCode}</p>
        </div>
        <div className="space-y-2">
          <Label>Type d'essai</Label>
          <Badge style={{ backgroundColor: '#28A745', color: '#FFFFFF' }}>
            {essai.essaiType}
          </Badge>
        </div>
        <div className="space-y-2">
          <Label>Date réception</Label>
          <p>{essai.dateReception}</p>
        </div>
        <div className="space-y-2">
          <Label>Opérateur</Label>
          <p>{essai.operateur}</p>
        </div>
        <div className="space-y-2">
          <Label>Date début</Label>
          <p>{essai.dateDebut}</p>
        </div>
        <div className="space-y-2">
          <Label>Date fin</Label>
          <p>{essai.dateFin}</p>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="font-semibold">Résultats</h3>
        
        {essai.essaiType === 'AG' && essai.resultats && (
          <>
            <div className="space-y-2">
              <Label>% passant à 2mm</Label>
              <p>{essai.resultats.pourcent_inf_2mm}</p>
            </div>
            <div className="space-y-2">
              <Label>% passant à 80µm</Label>
              <p>{essai.resultats.pourcent_inf_80um}</p>
            </div>
            <div className="space-y-2">
              <Label>Coefficient d'uniformité (Cu)</Label>
              <p>{essai.resultats.coefficient_uniformite}</p>
            </div>
          </>
        )}

        {essai.essaiType === 'Proctor' && essai.resultats && (
          <>
            <div className="space-y-2">
              <Label>Type Proctor</Label>
              <p>{essai.resultats.type_proctor}</p>
            </div>
            <div className="space-y-2">
              <Label>Densité sèche optimale (g/cm³)</Label>
              <p>{essai.resultats.densite_opt}</p>
            </div>
            <div className="space-y-2">
              <Label>Teneur en eau optimale (%)</Label>
              <p>{essai.resultats.teneur_eau_opt}</p>
            </div>
          </>
        )}

        {essai.essaiType === 'CBR' && essai.resultats && (
          <>
            <div className="space-y-2">
              <Label>CBR à 95% OPM (%)</Label>
              <p>{essai.resultats.cbr_95}</p>
            </div>
            <div className="space-y-2">
              <Label>CBR à 98% OPM (%)</Label>
              <p>{essai.resultats.cbr_98}</p>
            </div>
            <div className="space-y-2">
              <Label>CBR à 100% OPM (%)</Label>
              <p>{essai.resultats.cbr_100}</p>
            </div>
            <div className="space-y-2">
              <Label>Gonflement (%)</Label>
              <p>{essai.resultats.gonflement}</p>
            </div>
          </>
        )}

        {essai.essaiType === 'Oedometre' && essai.resultats && (
          <>
            <div className="space-y-2">
              <Label>Indice de compression (Cc)</Label>
              <p>{essai.resultats.cc}</p>
            </div>
            <div className="space-y-2">
              <Label>Indice de gonflement (Cs)</Label>
              <p>{essai.resultats.cs}</p>
            </div>
            <div className="space-y-2">
              <Label>Contrainte de préconsolidation (kPa)</Label>
              <p>{essai.resultats.gp}</p>
            </div>
          </>
        )}

        {essai.essaiType === 'Cisaillement' && essai.resultats && (
          <>
            <div className="space-y-2">
              <Label>Cohésion (kPa)</Label>
              <p>{essai.resultats.cohesion}</p>
            </div>
            <div className="space-y-2">
              <Label>Angle de frottement φ (°)</Label>
              <p>{essai.resultats.phi}</p>
            </div>
          </>
        )}

        <div className="space-y-2">
          <Label>Commentaires</Label>
          <p>{essai.commentaires}</p>
        </div>

        {essai.fichier && essai.fichier !== '-' && (
          <div className="space-y-2">
            <Label>Fichier de l'essai</Label>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const fichierUrl = essai.fichier.startsWith('http') ? essai.fichier : `http://127.0.0.1:8000${essai.fichier}`;
                window.open(fichierUrl, '_blank');
                toast.success(`Consultation de ${essai.fichier}`);
              }}
            >
              <FileText className="h-4 w-4 mr-2" />
              Télécharger le fichier
            </Button>
          </div>
        )}
      </div>

      <div className="space-y-4 pt-4 border-t">
        <h3 className="font-semibold">Validation</h3>
        <div className="space-y-2">
          <Label>Date de validation</Label>
          <p>{essai.validationDate ? (
            typeof essai.validationDate === 'string' && essai.validationDate.includes('T') 
              ? new Date(essai.validationDate).toLocaleString('fr-FR', { 
                  day: '2-digit', 
                  month: '2-digit', 
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })
              : essai.validationDate
          ) : '-'}</p>
        </div>
        <div className="space-y-2">
          <Label>Commentaire de validation</Label>
          <p>{essai.validationComment}</p>
        </div>
        <div className="space-y-2">
          <Label>Statut</Label>
          <Badge style={{ backgroundColor: '#28A745', color: '#FFFFFF' }}>
            Accepté ✓
          </Badge>
        </div>
      </div>
    </div>
  );
}
