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
from django.utils.dateparse import parse_date
from django_filters.rest_framework import DjangoFilterBackend

from .models import Client, Echantillon, Essai, Notification, ValidationHistory, Rapport, PlanificationEssai, CapaciteLaboratoire, TacheProgrammee, RapportMarketing, WorkflowValidation
from .serializers import (
    UserSerializer, UserCreateSerializer, ClientSerializer,
    EchantillonSerializer, EchantillonListSerializer, EssaiSerializer,
    NotificationSerializer, ValidationHistorySerializer, DashboardStatsSerializer,
    RapportSerializer, PlanificationEssaiSerializer, CapaciteLaboratoireSerializer,
    RapportMarketingSerializer, WorkflowValidationSerializer
)
from .permissions import (
    CanManageClients, CanManageEchantillons, CanManageEssais,
    IsAdmin, IsValidateur
)
from .utils import (
    calculer_date_envoi_et_retour,
    generer_dates_envoi_par_type,
    compter_echantillons_en_attente
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
    filterset_fields = ['statut', 'priorite', 'nature', 'sondage', 'code', 'client']
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
    
    @action(detail=False, methods=['get'])
    def grouped_by_client(self, request):
        """Retourne les échantillons groupés par client"""
        echantillons = self.get_queryset().select_related('client')
        
        # Grouper par client
        clients_data = {}
        for echantillon in echantillons:
            client_nom = echantillon.client.nom if echantillon.client else 'Sans client'
            if client_nom not in clients_data:
                clients_data[client_nom] = {
                    'client_nom': client_nom,
                    'echantillons': [],
                    'nombre_echantillons': 0
                }
            
            clients_data[client_nom]['echantillons'].append({
                'id': str(echantillon.id),
                'code': echantillon.code,
                'date_reception': echantillon.date_reception,
                'statut': echantillon.statut,
                'essais_types': echantillon.essais_types or [],
                'date_retour_predite': echantillon.date_retour_predite
            })
            clients_data[client_nom]['nombre_echantillons'] += 1
        
        return Response(list(clients_data.values()))
    
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
    
    @action(detail=True, methods=['post'])
    def update_dates_envoi(self, request, pk=None):
        """Mettre à jour les dates d'envoi par type d'essai"""
        echantillon = self.get_object()
        
        # Mettre à jour les dates d'envoi selon les types d'essais
        if 'date_envoi_ag' in request.data:
            echantillon.date_envoi_ag = request.data['date_envoi_ag']
        if 'date_envoi_proctor' in request.data:
            echantillon.date_envoi_proctor = request.data['date_envoi_proctor']
        if 'date_envoi_cbr' in request.data:
            echantillon.date_envoi_cbr = request.data['date_envoi_cbr']
        if 'date_envoi_oedometre' in request.data:
            echantillon.date_envoi_oedometre = request.data['date_envoi_oedometre']
        if 'date_envoi_cisaillement' in request.data:
            echantillon.date_envoi_cisaillement = request.data['date_envoi_cisaillement']
        if 'date_retour_predite' in request.data:
            echantillon.date_retour_predite = request.data['date_retour_predite']
        if 'essais_types' in request.data:
            echantillon.essais_types = request.data['essais_types']
        
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
    
    @action(detail=True, methods=['get'])
    def prediction_dates(self, request, pk=None):
        """Retourne la prédiction des dates d'envoi et de retour"""
        echantillon = self.get_object()
        prediction = calculer_date_envoi_et_retour(echantillon)
        return Response(prediction)
    
    @action(detail=False, methods=['get'])
    def dashboard_meca(self, request):
        """Dashboard pour les essais mécaniques avec ordre strict d'envoi"""
        echantillons = self.get_queryset().filter(
            essais_types__overlap=['Oedometre', 'Cisaillement']
        ).order_by('date_envoi_essais', 'created_at')  # Ordre strict d'envoi
        
        data = []
        for ech in echantillons:
            ech_data = EchantillonListSerializer(ech).data
            
            # Vérifier la priorité (essais rejetés)
            essais_prioritaires = ech.essais.filter(
                type__in=['Oedometre', 'Cisaillement'],
                priorite='urgente'
            ).exists()
            
            ech_data['prioritaire'] = essais_prioritaires
            data.append(ech_data)
        
        # Trier : prioritaires d'abord, puis ordre d'envoi
        data.sort(key=lambda x: (not x.get('prioritaire', False), x.get('date_envoi_essais', '')))
        
        return Response(data)
    
    @action(detail=False, methods=['get'])
    def with_essais_meca_envoyes(self, request):
        """Retourne les échantillons avec au moins un essai mécanique envoyé"""
        # Récupérer tous les échantillons
        echantillons = self.get_queryset()
        
        result = []
        for ech in echantillons:
            # Vérifier si au moins un essai mécanique a été envoyé
            essais_meca = ech.essais.filter(
                type__in=['Oedometre', 'Cisaillement'],
                date_reception__isnull=False
            )
            
            if essais_meca.exists():
                ech_data = EchantillonListSerializer(ech).data
                # Ajouter uniquement les essais mécaniques envoyés
                ech_data['essais_meca_envoyes'] = list(essais_meca.values_list('type', flat=True))
                result.append(ech_data)
        
        return Response(result)
    
    @action(detail=False, methods=['get'])
    def dashboard_route(self, request):
        """Dashboard pour les essais route avec ordre strict d'envoi"""
        echantillons = self.get_queryset().filter(
            essais_types__overlap=['AG', 'Proctor', 'CBR']
        ).order_by('date_envoi_essais', 'created_at')  # Ordre strict d'envoi
        
        data = []
        for ech in echantillons:
            ech_data = EchantillonListSerializer(ech).data
            
            # Vérifier la priorité (essais rejetés)
            essais_prioritaires = ech.essais.filter(
                type__in=['AG', 'Proctor', 'CBR'],
                priorite='urgente'
            ).exists()
            
            ech_data['prioritaire'] = essais_prioritaires
            data.append(ech_data)
        
        # Trier : prioritaires d'abord, puis ordre d'envoi
        data.sort(key=lambda x: (not x.get('prioritaire', False), x.get('date_envoi_essais', '')))
        
        return Response(data)
    
    @action(detail=False, methods=['get'])
    def with_essais_route_envoyes(self, request):
        """Retourne les échantillons avec au moins un essai route envoyé"""
        # Récupérer tous les échantillons
        echantillons = self.get_queryset()
        
        result = []
        for ech in echantillons:
            # Vérifier si au moins un essai route a été envoyé
            essais_route = ech.essais.filter(
                type__in=['AG', 'Proctor', 'CBR'],
                date_reception__isnull=False
            )
            
            if essais_route.exists():
                ech_data = EchantillonListSerializer(ech).data
                # Ajouter uniquement les essais route envoyés
                ech_data['essais_route_envoyes'] = list(essais_route.values_list('type', flat=True))
                result.append(ech_data)
        
        return Response(result)
    
    @action(detail=False, methods=['get'])
    def traitement_groupes_par_client(self, request):
        """Retourne les échantillons en traitement groupés par client avec flag estRepris"""
        echantillons = self.get_queryset().filter(statut='traitement').select_related('client').prefetch_related('essais')
        
        clients_data = {}
        for echantillon in echantillons:
            client_key = str(echantillon.client.id) if echantillon.client else 'sans_client'
            client_nom = echantillon.client_nom or 'Client inconnu'
            if client_key not in clients_data:
                clients_data[client_key] = {
                    'clientNom': client_nom,
                    'chefProjet': echantillon.chef_projet or '-',
                    'echantillons': [],
                    'totalEssais': 0
                }
            
            # Récupérer les essais acceptés
            essais_acceptes = echantillon.essais.filter(statut='termine', statut_validation='accepted')
            
            # Garder seulement le dernier essai de chaque type
            essais_uniques = {}
            for essai in essais_acceptes:
                if essai.type not in essais_uniques or essai.date_fin > essais_uniques[essai.type].date_fin:
                    essais_uniques[essai.type] = essai
            
            essais_list = []
            for essai in essais_uniques.values():
                essais_list.append({
                    'echantillonCode': echantillon.code,
                    'essaiType': essai.type,
                    'dateReception': str(essai.date_reception) if essai.date_reception else '-',
                    'dateDebut': str(essai.date_debut) if essai.date_debut else '-',
                    'dateFin': str(essai.date_fin) if essai.date_fin else '-',
                    'operateur': essai.operateur or '-',
                    'resultats': essai.resultats or {},
                    'commentaires': essai.commentaires or '-',
                    'fichier': essai.fichier.url if essai.fichier else '-',
                    'validationComment': essai.commentaires_validation or '-',
                    'validationDate': str(essai.date_validation) if hasattr(essai, 'date_validation') and essai.date_validation else '-',
                    'dateRejet': str(essai.date_rejet) if essai.date_rejet else None,
                    'estRepris': bool(essai.date_rejet)  # Flag calculé côté serveur
                })
            
            if essais_list:
                clients_data[client_key]['echantillons'].append({
                    'code': echantillon.code,
                    'chefProjet': echantillon.chef_projet or '-',
                    'clientNom': client_nom,
                    'essais': essais_list
                })
                clients_data[client_key]['totalEssais'] += len(essais_list)
        
        return Response(list(clients_data.values()))
    
    @action(detail=False, methods=['get'])
    def dashboard_traitement(self, request):
        """Dashboard pour le traitement groupé par client"""
        echantillons = self.get_queryset().select_related('client')
        
        clients_data = {}
        for echantillon in echantillons:
            client_nom = echantillon.client.nom if echantillon.client else 'Sans client'
            if client_nom not in clients_data:
                clients_data[client_nom] = {
                    'client_nom': client_nom,
                    'echantillons': [],
                    'nombre_echantillons': 0
                }
            
            clients_data[client_nom]['echantillons'].append({
                'id': str(echantillon.id),
                'code': echantillon.code,
                'date_reception': echantillon.date_reception,
                'statut': echantillon.statut,
                'essais_types': echantillon.essais_types or [],
                'date_retour_predite': echantillon.date_retour_predite
            })
            clients_data[client_nom]['nombre_echantillons'] += 1
        
        result = []
        for client_data in clients_data.values():
            echantillons_list = client_data['echantillons']
            date_reception = echantillons_list[0]['date_reception'] if echantillons_list else None
            
            date_traitement = '-'
            ech_with_traitement = next((e for e in echantillons_list if e['statut'] == 'traitement'), None)
            if ech_with_traitement:
                date_traitement = 'En traitement'
            
            date_retour_client = '-'
            ech_with_date = next((e for e in echantillons_list if e.get('date_retour_predite')), None)
            if ech_with_date and ech_with_date['date_retour_predite']:
                date_retour_client = ech_with_date['date_retour_predite']
            
            result.append({
                'clientName': client_data['client_nom'],
                'nombreEchantillons': client_data['nombre_echantillons'],
                'dateReception': date_reception.strftime('%d/%m/%Y') if date_reception else '-',
                'dateTraitement': date_traitement,
                'dateRetourClient': date_retour_client
            })
        
        return Response(result)
    
    @action(detail=False, methods=['get'])
    def dashboard_chef_projet(self, request):
        """Dashboard pour chef de projet avec date traitement = envoi vers chef projet"""
        echantillons = self.get_queryset().select_related('client')
        
        clients_data = {}
        for echantillon in echantillons:
            client_nom = echantillon.client.nom if echantillon.client else 'Sans client'
            if client_nom not in clients_data:
                clients_data[client_nom] = []
            clients_data[client_nom].append(echantillon)
        
        result = []
        for client_nom, echs in clients_data.items():
            date_reception = echs[0].date_reception if echs else None
            date_traitement = echs[0].date_envoi_chef_projet.strftime('%d/%m/%Y') if echs and echs[0].date_envoi_chef_projet else '-'
            date_retour_client = '-'
            
            if echs:
                prediction = calculer_date_envoi_et_retour(echs[0])
                date_retour_client = prediction['date_retour']
            
            result.append({
                'clientName': client_nom,
                'nombreEchantillons': len(echs),
                'dateReception': date_reception.strftime('%d/%m/%Y') if date_reception else '-',
                'dateTraitement': date_traitement,
                'dateRetourClient': date_retour_client
            })
        
        return Response(result)
    
    @action(detail=False, methods=['get'])
    def dashboard_directeur_technique(self, request):
        """Dashboard pour directeur technique avec toutes les dates correctes"""
        echantillons = self.get_queryset().select_related('client')
        
        clients_data = {}
        for echantillon in echantillons:
            client_nom = echantillon.client.nom if echantillon.client else 'Sans client'
            if client_nom not in clients_data:
                clients_data[client_nom] = []
            clients_data[client_nom].append(echantillon)
        
        result = []
        for client_nom, echs in clients_data.items():
            date_reception = echs[0].date_reception if echs else None
            date_traitement = echs[0].date_envoi_chef_projet.strftime('%d/%m/%Y') if echs and echs[0].date_envoi_chef_projet else '-'
            date_chef_projet = echs[0].date_envoi_chef_service.strftime('%d/%m/%Y') if echs and echs[0].date_envoi_chef_service else '-'
            date_chef_service = echs[0].date_envoi_directeur_technique.strftime('%d/%m/%Y') if echs and echs[0].date_envoi_directeur_technique else '-'
            date_retour_client = '-'
            
            if echs:
                ech_with_date = next((e for e in echs if e.date_retour_predite), None)
                if ech_with_date:
                    date_retour_client = ech_with_date.date_retour_predite
                else:
                    prediction = calculer_date_envoi_et_retour(echs[0])
                    date_retour_client = prediction['date_retour']
            
            result.append({
                'clientName': client_nom,
                'nombreEchantillons': len(echs),
                'dateReception': date_reception.strftime('%d/%m/%Y') if date_reception else '-',
                'dateTraitement': date_traitement,
                'dateChefProjet': date_chef_projet,
                'dateChefService': date_chef_service,
                'dateRetourClient': date_retour_client
            })
        
        return Response(result)


from .views_essais_rejetes import EssaiRejetesViewSet
from .views_workflows_rejetes import WorkflowRejetesViewSet

# Mixin pour les essais rejetés
class EssaiViewSet(viewsets.ModelViewSet, EssaiRejetesViewSet):
    """ViewSet pour les essais"""
    
    queryset = Essai.objects.select_related('echantillon', 'echantillon__client')
    serializer_class = EssaiSerializer
    permission_classes = [IsAuthenticated, CanManageEssais]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['statut', 'type', 'section', 'statut_validation', 'echantillon']
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
        
        # Mettre à jour le statut de l'échantillon si c'est le premier essai démarré
        echantillon = essai.echantillon
        if echantillon.statut == 'stockage':
            echantillon.statut = 'essais'
            echantillon.save()
        
        serializer = self.get_serializer(essai)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def terminer(self, request, pk=None):
        """Terminer un essai"""
        import logging
        logger = logging.getLogger(__name__)
        
        essai = self.get_object()
        
        if essai.statut not in ['en_cours', 'attente']:
            return Response(
                {'error': 'Cet essai n\'est pas en cours ou en attente'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        essai.statut = 'termine'
        essai.date_fin = request.data.get('date_fin', timezone.now().date())
        
        # Gérer les résultats (peut être JSON string ou dict)
        resultats = request.data.get('resultats', '{}')
        if isinstance(resultats, str):
            import json
            try:
                essai.resultats = json.loads(resultats)
            except:
                essai.resultats = {}
        else:
            essai.resultats = resultats
            
        essai.commentaires = request.data.get('commentaires', '')
        
        # Gérer le statut de validation
        if 'statut_validation' in request.data:
            essai.statut_validation = request.data.get('statut_validation')
        
        # Gérer le fichier si présent
        logger.info(f"FILES dans request: {request.FILES}")
        logger.info(f"DATA dans request: {request.data}")
        if 'fichier' in request.FILES:
            essai.fichier = request.FILES['fichier']
            logger.info(f"Fichier sauvegardé: {essai.fichier.name}")
        else:
            logger.warning("Aucun fichier dans request.FILES")
        
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
    
    @action(detail=True, methods=['post'])
    def retarder(self, request, pk=None):
        """Retarder un essai et programmer son envoi automatique"""
        essai = self.get_object()
        date_execution = request.data.get('date_execution')
        
        if not date_execution:
            return Response(
                {'error': 'Date d\'execution requise'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Créer une tâche programmée
        tache = TacheProgrammee.objects.create(
            type_tache='envoi_essai',
            date_execution=date_execution,
            essai=essai,
            echantillon=essai.echantillon,
            created_by=request.user
        )
        
        return Response({
            'message': 'Essai retardé avec succès',
            'tache_id': str(tache.id),
            'date_execution': tache.date_execution
        })
    
    @action(detail=True, methods=['post', 'patch'])
    def update_resultats(self, request, pk=None):
        """Mettre à jour les résultats d'un essai"""
        essai = self.get_object()
        
        if 'resultats' in request.data:
            essai.resultats = request.data['resultats']
        if 'operateur' in request.data:
            essai.operateur = request.data['operateur']
        if 'commentaires' in request.data:
            essai.commentaires = request.data['commentaires']
        if 'fichier' in request.FILES:
            essai.fichier = request.FILES['fichier']
        
        essai.save()
        serializer = self.get_serializer(essai)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def create_with_file(self, request):
        """Créer un essai avec fichier"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        essai = serializer.save()
        
        if 'fichier' in request.FILES:
            essai.fichier = request.FILES['fichier']
            essai.save()
        
        return Response(serializer.data, status=status.HTTP_201_CREATED)


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
    
    @action(detail=False, methods=['get'])
    def charge_laboratoire(self, request):
        """Retourne la charge actuelle du laboratoire par type d'essai"""
        charge = compter_echantillons_en_attente()
        return Response(charge)
    
    @action(detail=False, methods=['post'])
    def sync_localStorage(self, request):
        """Synchronise les données localStorage avec le backend"""
        try:
            data = request.data
            sync_count = 0
            
            # Traiter les données de planification
            planning_data = data.get('planning', {})
            for code_echantillon, planning in planning_data.items():
                try:
                    echantillon = Echantillon.objects.get(code=code_echantillon)
                    updates = {}
                    
                    if planning.get('dateEnvoiAG') and not echantillon.date_envoi_ag:
                        updates['date_envoi_ag'] = planning['dateEnvoiAG']
                    if planning.get('dateEnvoiProctor') and not echantillon.date_envoi_proctor:
                        updates['date_envoi_proctor'] = planning['dateEnvoiProctor']
                    if planning.get('dateEnvoiCBR') and not echantillon.date_envoi_cbr:
                        updates['date_envoi_cbr'] = planning['dateEnvoiCBR']
                    if planning.get('dateRetour') and not echantillon.date_retour_predite:
                        updates['date_retour_predite'] = planning['dateRetour']
                    if planning.get('essais') and not echantillon.essais_types:
                        updates['essais_types'] = planning['essais']
                    
                    if updates:
                        for field, value in updates.items():
                            setattr(echantillon, field, value)
                        echantillon.save()
                        sync_count += 1
                        
                except Echantillon.DoesNotExist:
                    continue
            
            # Traiter les données d'envoi au chef service
            sent_data = data.get('sent_to_chef', {})
            for code_echantillon, sent_info in sent_data.items():
                try:
                    echantillon = Echantillon.objects.get(code=code_echantillon)
                    
                    if sent_info.get('sent') == True:
                        # Créer le rapport s'il n'existe pas
                        rapport, created = Rapport.objects.get_or_create(
                            echantillon=echantillon,
                            defaults={
                                'contenu': f'Rapport pour l\'échantillon {code_echantillon}',
                                'statut': 'chef_service',
                                'date_envoi_chef_service': sent_info.get('date', timezone.now()),
                            }
                        )
                        
                        # Mettre à jour le statut de l'échantillon
                        if echantillon.statut != 'traitement':
                            echantillon.statut = 'traitement'
                            echantillon.save()
                            
                        if created:
                            sync_count += 1
                            
                except Echantillon.DoesNotExist:
                    continue
            
            return Response({
                'success': True,
                'sync_count': sync_count,
                'message': f'{sync_count} éléments synchronisés'
            })
            
        except Exception as e:
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class RapportViewSet(viewsets.ModelViewSet):
    """ViewSet pour les rapports"""
    
    queryset = Rapport.objects.select_related('echantillon', 'echantillon__client')
    serializer_class = RapportSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['statut', 'echantillon']
    ordering_fields = ['created_at', 'date_envoi_chef_service']
    
    @action(detail=True, methods=['post'])
    def envoyer_chef_service(self, request, pk=None):
        """Envoyer le rapport au chef service"""
        rapport = self.get_object()
        rapport.statut = 'chef_service'
        rapport.date_envoi_chef_service = timezone.now()
        rapport.save()
        
        serializer = self.get_serializer(rapport)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def valider_chef_service(self, request, pk=None):
        """Valider le rapport par le chef service"""
        rapport = self.get_object()
        action = request.data.get('action')  # 'accepter' ou 'rejeter'
        observations = request.data.get('observations', '')
        
        if action == 'accepter':
            rapport.statut = 'directeur_technique'
            rapport.date_validation_chef_service = timezone.now()
            rapport.date_envoi_directeur_technique = timezone.now()
        else:
            rapport.statut = 'rejete'
        
        rapport.observations_chef_service = observations
        rapport.save()
        
        serializer = self.get_serializer(rapport)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def valider_directeur_technique(self, request, pk=None):
        """Valider le rapport par le directeur technique"""
        rapport = self.get_object()
        action = request.data.get('action')
        observations = request.data.get('observations', '')
        
        if action == 'accepter':
            rapport.statut = 'directeur_snertp'
            rapport.date_validation_directeur_technique = timezone.now()
            rapport.date_envoi_directeur_snertp = timezone.now()
        else:
            rapport.statut = 'rejete'
        
        rapport.observations_directeur_technique = observations
        rapport.save()
        
        serializer = self.get_serializer(rapport)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def envoyer_traitement(self, request, pk=None):
        """Envoyer le rapport de traitement au chef de service"""
        rapport = self.get_object()
        fichier = request.FILES.get('fichier')
        
        if not fichier:
            return Response(
                {'error': 'Fichier requis'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        rapport.fichier_traitement = fichier
        rapport.statut = 'chef_service'
        rapport.date_envoi_chef_service = timezone.now()
        rapport.save()
        
        serializer = self.get_serializer(rapport)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def envoyer_client(self, request, pk=None):
        """Envoyer le rapport au client avec signature"""
        rapport = self.get_object()
        signature = request.data.get('signature')
        observations = request.data.get('observations', '')
        
        if not signature:
            return Response(
                {'error': 'Signature requise'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        rapport.signature_directeur = signature
        rapport.observations_directeur_snertp = observations
        rapport.statut = 'envoye_client'
        rapport.date_envoi_client = timezone.now()
        rapport.save()
        
        serializer = self.get_serializer(rapport)
        return Response(serializer.data)


class PlanificationEssaiViewSet(viewsets.ModelViewSet):
    """ViewSet pour la planification des essais"""
    
    queryset = PlanificationEssai.objects.select_related('essai', 'essai__echantillon')
    serializer_class = PlanificationEssaiSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['essai__type', 'date_planifiee', 'contraintes_respectees']
    ordering_fields = ['date_planifiee', 'created_at']
    
    @action(detail=False, methods=['post'])
    def planifier_automatique(self, request):
        """Planification automatique des essais avec contraintes"""
        essais_ids = request.data.get('essais_ids', [])
        
        if not essais_ids:
            return Response(
                {'error': 'Liste des essais requise'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        essais = Essai.objects.filter(id__in=essais_ids, statut='attente')
        planifications = []
        
        for essai in essais:
            # Logique de planification simplifiée
            capacite = CapaciteLaboratoire.objects.filter(type_essai=essai.type).first()
            if capacite:
                date_planifiee = timezone.now().date()
                date_fin = date_planifiee + timedelta(days=capacite.duree_standard_jours)
                
                planification = PlanificationEssai.objects.create(
                    essai=essai,
                    date_planifiee=date_planifiee,
                    date_fin_planifiee=date_fin,
                    capacite_utilisee=1,
                    contraintes_respectees=True
                )
                planifications.append(planification)
        
        serializer = self.get_serializer(planifications, many=True)
        return Response(serializer.data)


class CapaciteLaboratoireViewSet(viewsets.ModelViewSet):
    """ViewSet pour les capacités du laboratoire"""
    
    queryset = CapaciteLaboratoire.objects.all()
    serializer_class = CapaciteLaboratoireSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['type_essai']
    
    @action(detail=False, methods=['get'])
    def capacites_disponibles(self, request):
        """Retourne les capacités disponibles par date"""
        date_str = request.query_params.get('date')
        if not date_str:
            return Response(
                {'error': 'Date requise'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            date_obj = timezone.datetime.strptime(date_str, '%Y-%m-%d').date()
        except ValueError:
            return Response(
                {'error': 'Format de date invalide (YYYY-MM-DD)'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        capacites = {}
        for capacite in self.get_queryset():
            # Calculer la capacité utilisée pour cette date
            utilise = PlanificationEssai.objects.filter(
                essai__type=capacite.type_essai,
                date_planifiee=date_obj
            ).count()
            
            capacites[capacite.type_essai] = {
                'capacite_totale': capacite.capacite_quotidienne,
                'capacite_utilisee': utilise,
                'capacite_disponible': capacite.capacite_quotidienne - utilise
            }
        
        return Response(capacites)
    
    @action(detail=False, methods=['get'])
    def check(self, request):
        """Vérifie si la capacité est disponible pour un type d'essai à une date donnée"""
        type_essai = request.query_params.get('type_essai')
        date_str = request.query_params.get('date')
        
        if not type_essai or not date_str:
            return Response(
                {'error': 'Type d\'essai et date requis'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            date_obj = parse_date(date_str)
            if not date_obj:
                raise ValueError
        except ValueError:
            return Response(
                {'error': 'Format de date invalide (YYYY-MM-DD)'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Récupérer la capacité pour ce type d'essai
        capacite = CapaciteLaboratoire.objects.filter(type_essai=type_essai).first()
        
        if not capacite:
            # Si pas de capacité définie, autoriser l'envoi
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
            'message': 'Capacité disponible' if disponible else 'Capacité atteinte'
        })


# Mixin pour les workflows rejetés
class WorkflowValidationViewSet(viewsets.ModelViewSet, WorkflowRejetesViewSet):
    """ViewSet pour le workflow de validation"""
    
    queryset = WorkflowValidation.objects.select_related('echantillon', 'created_by')
    serializer_class = WorkflowValidationSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['etape_actuelle', 'statut', 'code_echantillon']
    ordering_fields = ['created_at', 'updated_at']
    
    @action(detail=False, methods=['get'])
    def par_etape(self, request):
        """Retourne les workflows par étape"""
        etape = request.query_params.get('etape')
        if etape:
            workflows = self.get_queryset().filter(etape_actuelle=etape, statut='en_attente')
        else:
            workflows = self.get_queryset().filter(statut='en_attente')
        
        serializer = self.get_serializer(workflows, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def valider_chef_projet(self, request, pk=None):
        workflow = self.get_object()
        action = request.data.get('action')
        comment = request.data.get('comment', '')
        
        workflow.date_validation_chef_projet = timezone.now()
        workflow.commentaire_chef_projet = comment
        
        if action == 'accepter':
            workflow.validation_chef_projet = True
            workflow.etape_actuelle = 'chef_service'
            workflow.date_envoi_chef_service = timezone.now()
            workflow.statut = 'en_attente'
            workflow.rejet_chef_projet = False
        else:
            workflow.statut = 'rejete'
            workflow.rejet_chef_projet = True
            workflow.raison_rejet = comment
            workflow.date_rejet = timezone.now()
            # Renvoyer au traitement
            workflow.etape_actuelle = 'traitement'
        
        workflow.save()
        serializer = self.get_serializer(workflow)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def valider_chef_service(self, request, pk=None):
        workflow = self.get_object()
        action = request.data.get('action')
        comment = request.data.get('comment', '')
        
        workflow.date_validation_chef_service = timezone.now()
        workflow.commentaire_chef_service = comment
        
        if action == 'accepter':
            workflow.validation_chef_service = True
            workflow.etape_actuelle = 'directeur_technique'
            workflow.date_envoi_directeur_technique = timezone.now()
            workflow.statut = 'en_attente'
            workflow.rejet_chef_service = False
        else:
            workflow.statut = 'rejete'
            workflow.rejet_chef_service = True
            workflow.raison_rejet = comment
            workflow.date_rejet = timezone.now()
            # Renvoyer au traitement
            workflow.etape_actuelle = 'traitement'
        
        workflow.save()
        serializer = self.get_serializer(workflow)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def valider_directeur_technique(self, request, pk=None):
        workflow = self.get_object()
        action = request.data.get('action')
        comment = request.data.get('comment', '')
        
        workflow.date_validation_directeur_technique = timezone.now()
        workflow.commentaire_directeur_technique = comment
        
        if action == 'accepter':
            workflow.validation_directeur_technique = True
            workflow.etape_actuelle = 'directeur_snertp'
            workflow.date_envoi_directeur_snertp = timezone.now()
            workflow.statut = 'en_attente'
            workflow.rejet_directeur_technique = False
        else:
            workflow.statut = 'rejete'
            workflow.rejet_directeur_technique = True
            workflow.raison_rejet = comment
            workflow.date_rejet = timezone.now()
            # Renvoyer au traitement
            workflow.etape_actuelle = 'traitement'
        
        workflow.save()
        serializer = self.get_serializer(workflow)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def aviser_directeur_snertp(self, request, pk=None):
        workflow = self.get_object()
        observations = request.data.get('observations', '')
        signature = request.data.get('signature', '')
        
        workflow.date_validation_directeur_snertp = timezone.now()
        workflow.observations_directeur_snertp = observations
        workflow.signature_directeur_snertp = signature
        workflow.avise_by_directeur_snertp = True
        workflow.etape_actuelle = 'marketing'
        workflow.date_envoi_marketing = timezone.now()
        workflow.statut = 'accepte'
        
        workflow.save()
        serializer = self.get_serializer(workflow)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def envoyer_client(self, request, pk=None):
        workflow = self.get_object()
        email_client = request.data.get('email_client', '')
        
        workflow.processed_by_marketing = True
        workflow.etape_actuelle = 'client'
        workflow.date_envoi_client = timezone.now()
        workflow.email_client = email_client
        
        workflow.save()
        serializer = self.get_serializer(workflow)
        return Response(serializer.data)


class RapportMarketingViewSet(viewsets.ModelViewSet):
    """ViewSet pour les rapports marketing"""
    
    queryset = RapportMarketing.objects.select_related('echantillon', 'echantillon__client')
    serializer_class = RapportMarketingSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['statut', 'code_echantillon']
    ordering_fields = ['created_at', 'date_envoi_marketing']
    
    @action(detail=False, methods=['get'])
    def en_attente(self, request):
        """Retourne les rapports en attente d'envoi"""
        rapports = self.get_queryset().filter(statut='en_attente')
        serializer = self.get_serializer(rapports, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def create_from_workflow(self, request):
        """Créer un rapport marketing depuis un workflow validé"""
        workflow_id = request.data.get('workflow_id')
        signature = request.data.get('signature_directeur_snertp')
        
        if not workflow_id:
            return Response(
                {'error': 'workflow_id requis'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            workflow = WorkflowValidation.objects.get(id=workflow_id)
        except WorkflowValidation.DoesNotExist:
            return Response(
                {'error': 'Workflow non trouvé'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Créer le rapport marketing
        rapport = RapportMarketing.objects.create(
            echantillon=workflow.echantillon,
            code_echantillon=workflow.code_echantillon,
            client_name=workflow.client_name,
            file_name=workflow.file_name,
            file_data=workflow.file_data,
            signature_directeur_snertp=signature or '',
            statut='en_attente'
        )
        
        # Mettre à jour le workflow
        workflow.etape_actuelle = 'marketing'
        workflow.date_envoi_marketing = timezone.now()
        workflow.signature_directeur_snertp = signature or ''
        workflow.save()
        
        serializer = self.get_serializer(rapport)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['post'])
    def envoyer_client(self, request, pk=None):
        """Marquer le rapport comme envoyé au client"""
        rapport = self.get_object()
        email_client = request.data.get('email_client')
        
        if not email_client:
            return Response(
                {'error': 'Email client requis'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        rapport.statut = 'envoye'
        rapport.email_client = email_client
        rapport.date_envoi_client = timezone.now()
        rapport.save()
        
        # Mettre à jour le workflow associé
        workflow = WorkflowValidation.objects.filter(
            code_echantillon=rapport.code_echantillon
        ).first()
        if workflow:
            workflow.etape_actuelle = 'client'
            workflow.date_envoi_client = timezone.now()
            workflow.email_client = email_client
            workflow.save()
        
        serializer = self.get_serializer(rapport)
        return Response(serializer.data)
