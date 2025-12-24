"""
Helper pour la reprogrammation automatique des échantillons retardés
"""
from datetime import timedelta
from django.utils import timezone
from core.models import Echantillon, TacheProgrammee

def reprogrammer_echantillon_retarde(echantillon_id, jours_retard):
    """
    Reprogramme automatiquement un échantillon retardé
    - Calcule la nouvelle date d'envoi
    - Déclasse l'ordre d'envoi
    - Met à jour la date de retour prédite
    """
    try:
        echantillon = Echantillon.objects.get(id=echantillon_id)
        
        # Calculer la nouvelle date d'envoi
        nouvelle_date_envoi = timezone.now().date() + timedelta(days=jours_retard)
        
        # Mettre à jour les dates d'envoi selon les types d'essais
        durees = {'AG': 5, 'Proctor': 5, 'CBR': 9, 'Oedometre': 18, 'Cisaillement': 4}
        
        if 'AG' in (echantillon.essais_types or []):
            echantillon.date_envoi_ag = nouvelle_date_envoi
        if 'Proctor' in (echantillon.essais_types or []):
            echantillon.date_envoi_proctor = nouvelle_date_envoi
        if 'CBR' in (echantillon.essais_types or []):
            echantillon.date_envoi_cbr = nouvelle_date_envoi
        if 'Oedometre' in (echantillon.essais_types or []):
            echantillon.date_envoi_oedometre = nouvelle_date_envoi
        if 'Cisaillement' in (echantillon.essais_types or []):
            echantillon.date_envoi_cisaillement = nouvelle_date_envoi
        
        # Recalculer la date de retour prédite
        duree_max = max([durees.get(essai, 0) for essai in (echantillon.essais_types or [])] or [0])
        echantillon.date_retour_predite = nouvelle_date_envoi + timedelta(days=duree_max + 2)
        
        # Créer une tâche programmée pour l'envoi automatique
        TacheProgrammee.objects.create(
            type_tache='envoi_essai',
            date_execution=timezone.make_aware(
                timezone.datetime.combine(nouvelle_date_envoi, timezone.datetime.min.time())
            ),
            echantillon=echantillon,
            statut='en_attente'
        )
        
        echantillon.save()
        
        return {
            'success': True,
            'nouvelle_date_envoi': nouvelle_date_envoi,
            'nouvelle_date_retour': echantillon.date_retour_predite,
            'message': f'Échantillon reprogrammé avec succès pour le {nouvelle_date_envoi}'
        }
        
    except Echantillon.DoesNotExist:
        return {
            'success': False,
            'error': 'Échantillon non trouvé'
        }
    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }
