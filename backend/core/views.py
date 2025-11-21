"""
Views et ViewSets pour l'API REST
"""

from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.contrib.auth import get_user_model
from django.db.models import Count, Q, Avg
from django.utils import timezone
from datetime import timedelta
from django_filters.rest_framework import DjangoFilterBackend

from .models import Client, Echantillon, Essai, Notification, ValidationHistory
from .serializers import (
    UserSerializer, UserCreateSerializer, ClientSerializer,
    EchantillonSerializer, EchantillonListSerializer, EssaiSerializer,
    NotificationSerializer, ValidationHistorySerializer, DashboardStatsSerializer
)
from .permissions import (
    CanManageClients, CanManageEchantillons, CanManageEssais,
    IsAdmin, IsValidateur
)

User = get_user_model()


class UserViewSet(viewsets.ModelViewSet):
    """ViewSet pour les utilisateurs"""
    
    queryset = User.objects.all()
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['role', 'is_active']
    search_fields = ['username', 'email', 'first_name', 'last_name']
    ordering_fields = ['created_at', 'username']
    
    def get_serializer_class(self):
        if self.action == 'create':
            return UserCreateSerializer
        return UserSerializer
    
    def get_permissions(self):
        if self.action == 'create':
            return [AllowAny()]
        return [IsAuthenticated()]
    
    @action(detail=False, methods=['get'])
    def me(self, request):
        """Retourne l'utilisateur connecté"""
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)


class ClientViewSet(viewsets.ModelViewSet):
    """ViewSet pour les clients"""
    
    queryset = Client.objects.all()
    serializer_class = ClientSerializer
    permission_classes = [IsAuthenticated, CanManageClients]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['code', 'nom', 'contact', 'projet', 'email']
    ordering_fields = ['created_at', 'nom']
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
    
    @action(detail=True, methods=['get'])
    def echantillons(self, request, pk=None):
        """Retourne les échantillons d'un client"""
        client = self.get_object()
        echantillons = client.echantillons.all()
        serializer = EchantillonListSerializer(echantillons, many=True)
        return Response(serializer.data)


class EchantillonViewSet(viewsets.ModelViewSet):
    """ViewSet pour les échantillons"""
    
    queryset = Echantillon.objects.select_related('client').prefetch_related('essais')
    permission_classes = [IsAuthenticated, CanManageEchantillons]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['statut', 'priorite', 'nature', 'sondage']
    search_fields = ['code', 'client__nom', 'qr_code', 'chef_projet']
    ordering_fields = ['created_at', 'date_reception', 'priorite']
    
    def get_serializer_class(self):
        if self.action == 'list':
            return EchantillonListSerializer
        return EchantillonSerializer
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
    
    @action(detail=False, methods=['get'])
    def by_statut(self, request):
        """Retourne les échantillons groupés par statut"""
        statut = request.query_params.get('statut')
        if statut:
            echantillons = self.get_queryset().filter(statut=statut)
        else:
            echantillons = self.get_queryset()
        
        serializer = self.get_serializer(echantillons, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def change_statut(self, request, pk=None):
        """Changer le statut d'un échantillon"""
        echantillon = self.get_object()
        new_statut = request.data.get('statut')
        
        if new_statut not in dict(Echantillon.STATUT_CHOICES):
            return Response(
                {'error': 'Statut invalide'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        echantillon.statut = new_statut
        echantillon.save()
        
        serializer = self.get_serializer(echantillon)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def essais(self, request, pk=None):
        """Retourne les essais d'un échantillon"""
        echantillon = self.get_object()
        essais = echantillon.essais.all()
        serializer = EssaiSerializer(essais, many=True)
        return Response(serializer.data)


class EssaiViewSet(viewsets.ModelViewSet):
    """ViewSet pour les essais"""
    
    queryset = Essai.objects.select_related('echantillon', 'echantillon__client')
    serializer_class = EssaiSerializer
    permission_classes = [IsAuthenticated, CanManageEssais]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['statut', 'type', 'section', 'statut_validation']
    search_fields = ['echantillon__code', 'operateur', 'type']
    ordering_fields = ['created_at', 'date_debut', 'date_fin']
    
    @action(detail=False, methods=['get'])
    def by_section(self, request):
        """Retourne les essais par section"""
        section = request.query_params.get('section')
        if section:
            essais = self.get_queryset().filter(section=section)
        else:
            essais = self.get_queryset()
        
        serializer = self.get_serializer(essais, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def demarrer(self, request, pk=None):
        """Démarrer un essai"""
        essai = self.get_object()
        
        if essai.statut != 'attente':
            return Response(
                {'error': 'Cet essai n\'est pas en attente'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        essai.statut = 'en_cours'
        essai.date_debut = request.data.get('date_debut', timezone.now().date())
        essai.operateur = request.data.get('operateur', '')
        essai.save()
        
        serializer = self.get_serializer(essai)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def terminer(self, request, pk=None):
        """Terminer un essai"""
        essai = self.get_object()
        
        if essai.statut != 'en_cours':
            return Response(
                {'error': 'Cet essai n\'est pas en cours'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        essai.statut = 'termine'
        essai.date_fin = request.data.get('date_fin', timezone.now().date())
        essai.resultats = request.data.get('resultats', {})
        essai.commentaires = request.data.get('commentaires', '')
        essai.save()
        
        # Vérifier si tous les essais de l'échantillon sont terminés
        echantillon = essai.echantillon
        tous_finis = echantillon.essais.exclude(statut='termine').count() == 0
        
        if tous_finis:
            echantillon.statut = 'decodification'
            echantillon.save()
        
        serializer = self.get_serializer(essai)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def rejeter(self, request, pk=None):
        """Rejeter un essai"""
        essai = self.get_object()
        
        essai.statut_validation = 'rejected'
        essai.commentaires_validation = request.data.get('commentaires', '')
        essai.date_rejet = timezone.now().date()
        essai.save()
        
        serializer = self.get_serializer(essai)
        return Response(serializer.data)


class NotificationViewSet(viewsets.ModelViewSet):
    """ViewSet pour les notifications"""
    
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['type', 'read', 'action_required']
    ordering_fields = ['created_at']
    
    def get_queryset(self):
        """Retourne uniquement les notifications de l'utilisateur connecté"""
        return Notification.objects.filter(user=self.request.user)
    
    @action(detail=True, methods=['post'])
    def mark_as_read(self, request, pk=None):
        """Marquer une notification comme lue"""
        notification = self.get_object()
        notification.mark_as_read()
        serializer = self.get_serializer(notification)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def mark_all_as_read(self, request):
        """Marquer toutes les notifications comme lues"""
        notifications = self.get_queryset().filter(read=False)
        for notification in notifications:
            notification.mark_as_read()
        return Response({'message': 'Toutes les notifications ont été marquées comme lues'})
    
    @action(detail=False, methods=['get'])
    def unread_count(self, request):
        """Retourne le nombre de notifications non lues"""
        count = self.get_queryset().filter(read=False).count()
        return Response({'count': count})


class ValidationHistoryViewSet(viewsets.ModelViewSet):
    """ViewSet pour l'historique des validations"""
    
    queryset = ValidationHistory.objects.select_related('echantillon', 'validateur')
    serializer_class = ValidationHistorySerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['echantillon', 'action', 'niveau']
    ordering_fields = ['created_at']


class DashboardViewSet(viewsets.ViewSet):
    """ViewSet pour les statistiques du dashboard"""
    
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Retourne les statistiques globales"""
        
        # Échantillons
        total_echantillons = Echantillon.objects.count()
        echantillons_en_cours = Echantillon.objects.filter(
            statut__in=['stockage', 'essais', 'decodification', 'traitement', 'validation']
        ).count()
        echantillons_termines = Echantillon.objects.filter(statut='valide').count()
        echantillons_urgents = Echantillon.objects.filter(priorite='urgente').count()
        
        # Essais
        essais_en_attente = Essai.objects.filter(statut='attente').count()
        essais_en_cours = Essai.objects.filter(statut='en_cours').count()
        essais_termines = Essai.objects.filter(statut='termine').count()
        
        # Clients
        clients_actifs = Client.objects.filter(
            echantillons__created_at__gte=timezone.now() - timedelta(days=30)
        ).distinct().count()
        
        # Délais
        echantillons_finis = Echantillon.objects.filter(
            statut='valide',
            date_fin_estimee__isnull=False
        )
        
        delai_moyen = 0
        taux_respect = 0
        
        if echantillons_finis.exists():
            delais = []
            respectes = 0
            
            for ech in echantillons_finis:
                if ech.created_at and ech.date_fin_estimee:
                    delai = (ech.date_fin_estimee - ech.created_at.date()).days
                    delais.append(delai)
                    
                    # Vérifier si le délai a été respecté
                    # (Simplifié ici, devrait comparer avec la date réelle de fin)
                    if delai <= 30:  # Exemple: 30 jours max
                        respectes += 1
            
            if delais:
                delai_moyen = sum(delais) / len(delais)
                taux_respect = (respectes / len(delais)) * 100
        
        stats = {
            'total_echantillons': total_echantillons,
            'echantillons_en_cours': echantillons_en_cours,
            'echantillons_termines': echantillons_termines,
            'echantillons_urgents': echantillons_urgents,
            'essais_en_attente': essais_en_attente,
            'essais_en_cours': essais_en_cours,
            'essais_termines': essais_termines,
            'clients_actifs': clients_actifs,
            'delai_moyen_traitement': round(delai_moyen, 2),
            'taux_respect_delais': round(taux_respect, 2),
        }
        
        serializer = DashboardStatsSerializer(stats)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def my_tasks(self, request):
        """Retourne les tâches de l'utilisateur connecté"""
        user = request.user
        tasks = []
        
        if user.role == 'receptionniste':
            # Échantillons à traiter
            count = Echantillon.objects.filter(statut='attente').count()
            tasks.append({
                'module': 'Réception',
                'count': count,
                'description': 'Échantillons à enregistrer'
            })
        
        elif user.role == 'responsable_materiaux':
            # Échantillons en stockage
            count = Echantillon.objects.filter(statut='stockage').count()
            tasks.append({
                'module': 'Stockage',
                'count': count,
                'description': 'Échantillons à planifier'
            })
        
        elif user.role in ['operateur_route', 'operateur_mecanique']:
            # Essais en attente
            section = 'route' if user.role == 'operateur_route' else 'mecanique'
            count = Essai.objects.filter(section=section, statut='attente').count()
            tasks.append({
                'module': 'Essais',
                'count': count,
                'description': f'Essais en attente - {section}'
            })
        
        elif user.role in ['chef_projet', 'chef_service', 'directeur_technique', 'directeur_general']:
            # Rapports à valider
            count = Echantillon.objects.filter(statut='validation').count()
            tasks.append({
                'module': 'Validation',
                'count': count,
                'description': 'Rapports à valider'
            })
        
        return Response(tasks)
