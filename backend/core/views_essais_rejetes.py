from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from django.utils import timezone
from .models import Essai
from .serializers import EssaiSerializer

class EssaiRejetesViewSet(viewsets.ViewSet):
    """API pour gérer les essais rejetés"""
    
    @action(detail=False, methods=['get'])
    def rejetes(self, request):
        """Récupérer tous les essais rejetés"""
        essais_rejetes = Essai.objects.filter(
            date_rejet__isnull=False
        ).select_related('echantillon')
        
        serializer = EssaiSerializer(essais_rejetes, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def rejetes_mecanique(self, request):
        """Récupérer les essais mécaniques rejetés"""
        essais_rejetes = Essai.objects.filter(
            date_rejet__isnull=False,
            type__in=['Oedometre', 'Cisaillement']
        ).select_related('echantillon')
        
        serializer = EssaiSerializer(essais_rejetes, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['patch'])
    def corriger(self, request, pk=None):
        """Corriger un essai rejeté"""
        try:
            essai = Essai.objects.get(pk=pk)
            
            # Mettre à jour les données
            essai.statut = request.data.get('statut', essai.statut)
            essai.date_debut = request.data.get('date_debut', essai.date_debut)
            essai.date_fin = request.data.get('date_fin', essai.date_fin)
            essai.operateur = request.data.get('operateur', essai.operateur)
            essai.resultats = request.data.get('resultats', essai.resultats)
            essai.commentaires = request.data.get('commentaires', essai.commentaires)
            
            # Supprimer le rejet si corrigé et marquer comme prioritaire
            if request.data.get('date_rejet') is None:
                essai.date_rejet = None
                essai.commentaires_validation = None
                essai.statut_validation = None
                # Marquer comme prioritaire pour reprise
                essai.priorite = 'urgente'
            
            essai.save()
            
            # Mettre à jour l'échantillon pour priorité
            echantillon = essai.echantillon
            if echantillon.priorite != 'urgente':
                echantillon.priorite = 'urgente'
                echantillon.save()
            
            serializer = EssaiSerializer(essai)
            return Response(serializer.data)
            
        except Essai.DoesNotExist:
            return Response(
                {'error': 'Essai non trouvé'}, 
                status=status.HTTP_404_NOT_FOUND
            )