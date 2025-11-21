"""
Views pour le module scheduler
"""

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters

from .models import Ressource, ContrainteTemporelle, Planning, AffectationEssai
from .serializers import (
    RessourceSerializer, ContrainteTemporelleSerializer,
    PlanningSerializer, PlanningListSerializer, AffectationEssaiSerializer,
    OptimizationRequestSerializer
)
from .optimizer import SchedulerOptimizer
from core.permissions import IsAdmin, IsResponsableMateriaux


class RessourceViewSet(viewsets.ModelViewSet):
    """ViewSet pour les ressources"""
    
    queryset = Ressource.objects.all()
    serializer_class = RessourceSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['type', 'section', 'disponible']
    search_fields = ['nom']
    ordering_fields = ['nom', 'section']
    
    @action(detail=False, methods=['get'])
    def disponibles(self, request):
        """Retourne uniquement les ressources disponibles"""
        section = request.query_params.get('section')
        ressources = self.get_queryset().filter(disponible=True)
        
        if section:
            ressources = ressources.filter(section=section)
        
        serializer = self.get_serializer(ressources, many=True)
        return Response(serializer.data)


class ContrainteTemporelleViewSet(viewsets.ModelViewSet):
    """ViewSet pour les contraintes temporelles"""
    
    queryset = ContrainteTemporelle.objects.all()
    serializer_class = ContrainteTemporelleSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['type', 'active']
    ordering_fields = ['date_debut', 'date_fin']
    
    @action(detail=False, methods=['get'])
    def actives(self, request):
        """Retourne uniquement les contraintes actives"""
        contraintes = self.get_queryset().filter(active=True)
        serializer = self.get_serializer(contraintes, many=True)
        return Response(serializer.data)


class PlanningViewSet(viewsets.ModelViewSet):
    """ViewSet pour les plannings"""
    
    queryset = Planning.objects.prefetch_related('affectations__essai__echantillon')
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['statut']
    search_fields = ['nom']
    ordering_fields = ['date_debut', 'created_at']
    
    def get_serializer_class(self):
        if self.action == 'list':
            return PlanningListSerializer
        return PlanningSerializer
    
    @action(detail=False, methods=['post'])
    def optimiser(self, request):
        """
        Crée un nouveau planning optimisé
        
        POST /api/scheduler/plannings/optimiser/
        {
            "nom": "Planning Semaine 45",
            "date_debut": "2025-11-10",
            "date_fin": "2025-11-24",
            "section": "route"  // optional: "route", "mecanique", or "all"
        }
        """
        serializer = OptimizationRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        data = serializer.validated_data
        section = None if data.get('section') == 'all' else data.get('section')
        
        try:
            # Créer l'optimiseur
            optimizer = SchedulerOptimizer(
                date_debut=data['date_debut'],
                date_fin=data['date_fin'],
                section=section
            )
            
            # Créer le planning
            planning = optimizer.creer_planning(data['nom'])
            
            # Retourner le planning créé
            result_serializer = PlanningSerializer(planning)
            return Response(result_serializer.data, status=status.HTTP_201_CREATED)
            
        except ValueError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return Response(
                {'error': f'Erreur lors de l\'optimisation: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['post'])
    def activer(self, request, pk=None):
        """Active un planning (désactive les autres)"""
        planning = self.get_object()
        
        # Archiver tous les autres plannings actifs
        Planning.objects.filter(statut='active').update(statut='archived')
        
        # Activer ce planning
        planning.statut = 'active'
        planning.save()
        
        serializer = self.get_serializer(planning)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def archiver(self, request, pk=None):
        """Archive un planning"""
        planning = self.get_object()
        planning.statut = 'archived'
        planning.save()
        
        serializer = self.get_serializer(planning)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def affectations(self, request, pk=None):
        """Retourne les affectations d'un planning"""
        planning = self.get_object()
        affectations = planning.affectations.all()
        serializer = AffectationEssaiSerializer(affectations, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def actif(self, request):
        """Retourne le planning actif"""
        try:
            planning = Planning.objects.get(statut='active')
            serializer = self.get_serializer(planning)
            return Response(serializer.data)
        except Planning.DoesNotExist:
            return Response(
                {'message': 'Aucun planning actif'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=False, methods=['post'])
    def optimiser_hebdomadaire(self, request):
        """
        Crée automatiquement un planning pour les 2 prochaines semaines
        
        POST /api/scheduler/plannings/optimiser_hebdomadaire/
        """
        from .optimizer import optimiser_planning_hebdomadaire
        
        try:
            planning = optimiser_planning_hebdomadaire()
            serializer = PlanningSerializer(planning)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response(
                {'error': f'Erreur lors de l\'optimisation: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class AffectationEssaiViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet pour les affectations (lecture seule)"""
    
    queryset = AffectationEssai.objects.select_related('planning', 'essai', 'essai__echantillon')
    serializer_class = AffectationEssaiSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['planning', 'essai']
    ordering_fields = ['date_debut_planifiee', 'priorite_calculee']
