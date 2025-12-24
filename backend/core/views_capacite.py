from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from datetime import timedelta, datetime
from .models import Echantillon, Essai, CapaciteLaboratoire, Notification
from .serializers import EchantillonSerializer

class CapaciteViewSet(viewsets.ViewSet):
    """API pour gérer la capacité des sections"""
    
    @action(detail=False, methods=['post'])
    def verifier_capacite(self, request):
        """Vérifier si la capacité est disponible pour un envoi"""
        type_essai = request.data.get('type_essai')
        date_envoi = request.data.get('date_envoi')
        
        if not type_essai or not date_envoi:
            return Response(
                {'error': 'Type d\'essai et date d\'envoi requis'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            date_obj = datetime.strptime(date_envoi, '%Y-%m-%d').date()
        except ValueError:
            return Response(
                {'error': 'Format de date invalide'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Récupérer la capacité pour ce type d'essai
        capacite = CapaciteLaboratoire.objects.filter(type_essai=type_essai).first()
        
        if not capacite:
            return Response({
                'disponible': True,
                'message': 'Aucune limite de capacité définie'
            })
        
        # Compter les essais déjà planifiés pour cette date
        essais_planifies = Essai.objects.filter(
            type=type_essai,
            date_reception=date_obj
        ).count()
        
        disponible = essais_planifies < capacite.capacite_quotidienne
        
        return Response({
            'disponible': disponible,
            'capacite_totale': capacite.capacite_quotidienne,
            'capacite_utilisee': essais_planifies,
            'capacite_restante': max(0, capacite.capacite_quotidienne - essais_planifies),
            'message': 'Capacité disponible' if disponible else 'Capacité atteinte, veuillez patienter.'
        })
    
    @action(detail=False, methods=['post'])
    def retarder_echantillon(self, request):
        """Retarder un échantillon et recalculer les dates"""
        echantillon_id = request.data.get('echantillon_id')
        nouveau_delai = request.data.get('nouveau_delai', 4)  # jours
        
        try:
            echantillon = Echantillon.objects.get(id=echantillon_id)
        except Echantillon.DoesNotExist:
            return Response(
                {'error': 'Échantillon non trouvé'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Calculer la nouvelle date d'envoi
        nouvelle_date = timezone.now().date() + timedelta(days=nouveau_delai)
        
        # Mettre à jour les dates d'envoi selon les types d'essais
        if 'AG' in (echantillon.essais_types or []):
            echantillon.date_envoi_ag = nouvelle_date
        if 'Proctor' in (echantillon.essais_types or []):
            echantillon.date_envoi_proctor = nouvelle_date
        if 'CBR' in (echantillon.essais_types or []):
            echantillon.date_envoi_cbr = nouvelle_date
        if 'Oedometre' in (echantillon.essais_types or []):
            echantillon.date_envoi_oedometre = nouvelle_date
        if 'Cisaillement' in (echantillon.essais_types or []):
            echantillon.date_envoi_cisaillement = nouvelle_date
        
        # Recalculer la date de retour prédite
        durees = {'AG': 5, 'Proctor': 5, 'CBR': 9, 'Oedometre': 18, 'Cisaillement': 4}
        duree_max = max([durees.get(essai, 0) for essai in (echantillon.essais_types or [])] or [0])
        echantillon.date_retour_predite = nouvelle_date + timedelta(days=duree_max + 2)
        
        echantillon.save()
        
        return Response({
            'success': True,
            'nouvelle_date_envoi': nouvelle_date,
            'nouvelle_date_retour': echantillon.date_retour_predite,
            'message': f'Échantillon retardé de {nouveau_delai} jours'
        })
    
    @action(detail=False, methods=['post'])
    def programmer_notification(self, request):
        """Programmer une notification 1 jour avant l'envoi"""
        echantillon_id = request.data.get('echantillon_id')
        
        try:
            echantillon = Echantillon.objects.get(id=echantillon_id)
        except Echantillon.DoesNotExist:
            return Response(
                {'error': 'Échantillon non trouvé'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Programmer les notifications pour chaque type d'essai
        notifications_creees = []
        
        for essai_type in (echantillon.essais_types or []):
            date_envoi = None
            if essai_type == 'AG' and echantillon.date_envoi_ag:
                date_envoi = echantillon.date_envoi_ag
            elif essai_type == 'Proctor' and echantillon.date_envoi_proctor:
                date_envoi = echantillon.date_envoi_proctor
            elif essai_type == 'CBR' and echantillon.date_envoi_cbr:
                date_envoi = echantillon.date_envoi_cbr
            elif essai_type == 'Oedometre' and echantillon.date_envoi_oedometre:
                date_envoi = echantillon.date_envoi_oedometre
            elif essai_type == 'Cisaillement' and echantillon.date_envoi_cisaillement:
                date_envoi = echantillon.date_envoi_cisaillement
            
            if date_envoi:
                # Programmer notification 1 jour avant à 8h30
                date_notification = datetime.combine(
                    date_envoi - timedelta(days=1),
                    datetime.min.time().replace(hour=8, minute=30)
                )
                
                # Créer la notification (simplifié - en production utiliser Celery)
                notification = Notification.objects.create(
                    user_id=request.user.id,
                    type='info',
                    title='Envoi imminent d\'échantillon',
                    message=f'L\'échantillon {echantillon.code} sera envoyé demain pour essai {essai_type}',
                    echantillon=echantillon,
                    module='Stockage'
                )
                notifications_creees.append(notification.id)
        
        return Response({
            'success': True,
            'notifications_creees': len(notifications_creees),
            'message': 'Notifications programmées avec succès'
        })