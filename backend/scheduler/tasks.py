"""
Tâches Celery pour le module scheduler
"""

from celery import shared_task
from django.utils import timezone
from datetime import timedelta

from core.models import Echantillon, Essai, Notification
from .optimizer import optimiser_planning_hebdomadaire


@shared_task
def check_delayed_samples():
    """
    Tâche périodique pour vérifier les échantillons en retard
    """
    from django.contrib.auth import get_user_model
    User = get_user_model()
    
    today = timezone.now().date()
    
    # Échantillons dont la date de fin estimée est dépassée
    echantillons_retard = Echantillon.objects.filter(
        date_fin_estimee__lt=today,
        statut__in=['stockage', 'essais', 'decodification', 'traitement']
    )
    
    for echantillon in echantillons_retard:
        jours_retard = (today - echantillon.date_fin_estimee).days
        
        # Créer une notification pour les responsables
        responsables = User.objects.filter(
            role__in=['responsable_materiaux', 'chef_service', 'directeur_technique']
        )
        
        for responsable in responsables:
            Notification.objects.create(
                user=responsable,
                type='warning',
                title=f'Échantillon en retard: {echantillon.code}',
                message=f'L\'échantillon {echantillon.code} a {jours_retard} jour(s) de retard. '
                       f'Statut actuel: {echantillon.get_statut_display()}',
                module='Planification',
                action_required=True,
                echantillon=echantillon
            )
    
    return f"Vérifié {echantillons_retard.count()} échantillons en retard"


@shared_task
def optimize_daily_schedule():
    """
    Tâche quotidienne pour optimiser automatiquement le planning
    """
    try:
        planning = optimiser_planning_hebdomadaire()
        return f"Planning créé: {planning.nom} avec {planning.nombre_essais_planifies} essais"
    except Exception as e:
        return f"Erreur lors de l'optimisation: {str(e)}"


@shared_task
def send_daily_planning_report():
    """
    Envoie un rapport quotidien du planning aux responsables
    """
    from django.contrib.auth import get_user_model
    from .models import Planning
    
    User = get_user_model()
    
    # Récupérer le planning actif
    try:
        planning = Planning.objects.get(statut='active')
    except Planning.DoesNotExist:
        return "Aucun planning actif"
    
    today = timezone.now().date()
    
    # Récupérer les essais prévus aujourd'hui
    affectations_today = planning.affectations.filter(
        date_debut_planifiee=today
    ).select_related('essai', 'essai__echantillon')
    
    if affectations_today.exists():
        # Créer des notifications pour les opérateurs
        operateurs = User.objects.filter(
            role__in=['operateur_route', 'operateur_mecanique']
        )
        
        for operateur in operateurs:
            section = 'route' if operateur.role == 'operateur_route' else 'mecanique'
            essais_section = [
                a for a in affectations_today 
                if a.essai.section == section
            ]
            
            if essais_section:
                message = f"Vous avez {len(essais_section)} essai(s) planifié(s) aujourd'hui:\n"
                for affectation in essais_section:
                    message += f"- {affectation.essai.get_type_display()} ({affectation.essai.echantillon.code})\n"
                
                Notification.objects.create(
                    user=operateur,
                    type='info',
                    title='Essais planifiés aujourd\'hui',
                    message=message,
                    module='Planification',
                    action_required=True
                )
        
        return f"{affectations_today.count()} essais planifiés aujourd'hui"
    
    return "Aucun essai planifié aujourd'hui"


@shared_task
def cleanup_old_notifications():
    """
    Nettoie les anciennes notifications lues (plus de 30 jours)
    """
    cutoff_date = timezone.now() - timedelta(days=30)
    
    deleted_count, _ = Notification.objects.filter(
        read=True,
        read_at__lt=cutoff_date
    ).delete()
    
    return f"Supprimé {deleted_count} notifications anciennes"


@shared_task
def update_essai_status_from_planning():
    """
    Met à jour automatiquement le statut des essais en fonction du planning
    """
    from .models import Planning, AffectationEssai
    
    today = timezone.now().date()
    
    try:
        planning = Planning.objects.get(statut='active')
    except Planning.DoesNotExist:
        return "Aucun planning actif"
    
    updated_count = 0
    
    # Essais qui devraient commencer aujourd'hui
    affectations_a_demarrer = planning.affectations.filter(
        date_debut_planifiee=today,
        essai__statut='attente'
    )
    
    for affectation in affectations_a_demarrer:
        essai = affectation.essai
        essai.date_debut = today
        essai.statut = 'en_cours'
        essai.save()
        updated_count += 1
    
    return f"Statut mis à jour pour {updated_count} essais"


@shared_task
def auto_send_scheduled_essais():
    """
    Envoie automatiquement les essais dont la date_reception est arrivée
    Vérifie tous les échantillons en stockage et envoie les essais planifiés pour aujourd'hui ou avant
    """
    from django.contrib.auth import get_user_model
    User = get_user_model()
    
    today = timezone.now().date()
    
    # Récupérer tous les échantillons en stockage
    echantillons_stockage = Echantillon.objects.filter(statut='stockage')
    
    echantillons_envoyes = 0
    essais_envoyes = 0
    
    for echantillon in echantillons_stockage:
        # Récupérer tous les essais de cet échantillon
        essais = echantillon.essais.all()
        
        if not essais.exists():
            continue
        
        # Vérifier si tous les essais ont une date_reception <= aujourd'hui
        tous_prets = True
        for essai in essais:
            if not essai.date_reception or essai.date_reception > today:
                tous_prets = False
                break
        
        # Si tous les essais sont prêts, changer le statut de l'échantillon
        if tous_prets:
            echantillon.statut = 'essais'
            echantillon.save()
            echantillons_envoyes += 1
            essais_envoyes += essais.count()
            
            # Créer des notifications pour les opérateurs
            essais_route = essais.filter(type__in=['AG', 'Proctor', 'CBR'])
            essais_meca = essais.filter(type__in=['Oedometre', 'Cisaillement'])
            
            if essais_route.exists():
                operateurs_route = User.objects.filter(role='operateur_route', is_active=True)
                for operateur in operateurs_route:
                    Notification.objects.create(
                        user=operateur,
                        type='info',
                        title='Nouvel échantillon en attente',
                        message=f'L\'échantillon {echantillon.code} a été envoyé automatiquement au laboratoire Route pour les essais: {", ".join([e.type for e in essais_route])}',
                        module='Stockage',
                        action_required=True,
                        echantillon=echantillon
                    )
            
            if essais_meca.exists():
                operateurs_meca = User.objects.filter(role='operateur_mecanique', is_active=True)
                for operateur in operateurs_meca:
                    Notification.objects.create(
                        user=operateur,
                        type='info',
                        title='Nouvel échantillon en attente',
                        message=f'L\'échantillon {echantillon.code} a été envoyé automatiquement au laboratoire Mécanique pour les essais: {", ".join([e.type for e in essais_meca])}',
                        module='Stockage',
                        action_required=True,
                        echantillon=echantillon
                    )
            
            # Notification pour le responsable matériaux
            responsables = User.objects.filter(role='responsable_materiaux', is_active=True)
            for responsable in responsables:
                Notification.objects.create(
                    user=responsable,
                    type='success',
                    title='Échantillon envoyé automatiquement',
                    message=f'L\'échantillon {echantillon.code} a été envoyé automatiquement aux laboratoires (date planifiée atteinte)',
                    module='Stockage',
                    echantillon=echantillon
                )
    
    return f"Envoyé automatiquement {echantillons_envoyes} échantillon(s) ({essais_envoyes} essais)"
