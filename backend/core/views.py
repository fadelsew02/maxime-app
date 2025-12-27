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

from .models import (
    Client, Echantillon, Essai, Notification, ValidationHistory, Rapport, 
    PlanificationEssai, CapaciteLaboratoire, TacheProgrammee, RapportMarketing, 
    WorkflowValidation, ActionLog, DataStorage, RapportValidation, EssaiData, 
    PlanificationData, RapportArchive
)
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
    
    @action(detail=False, methods=['get'])
    def chefs_projet(self, request):
        """Retourne la liste des chefs de projet"""
        chefs = User.objects.filter(role='chef_projet', is_active=True).order_by('first_name', 'last_name')
        data = [
            {
                'id': str(chef.id),
                'username': chef.username,
                'full_name': f"{chef.first_name} {chef.last_name}".strip() or chef.username,
                'email': chef.email
            }
            for chef in chefs
        ]
        return Response(data)


class ClientViewSet(viewsets.ModelViewSet):
    """ViewSet pour les clients"""
    
    queryset = Client.objects.all()
    serializer_class = ClientSerializer
    permission_classes = [IsAuthenticated, CanManageClients]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['code', 'nom', 'contact', 'projet', 'email']
    ordering_fields = ['created_at', 'nom']
    
    def get_queryset(self):
        """Filtrer les clients selon les paramètres de requête"""
        queryset = super().get_queryset()
        
        # Filtrer par clients récents (dernières 24h)
        recent_only = self.request.query_params.get('recent', None)
        if recent_only and recent_only.lower() in ['true', '1', 'yes']:
            twenty_four_hours_ago = timezone.now() - timedelta(hours=24)
            queryset = queryset.filter(created_at__gte=twenty_four_hours_ago)
        
        return queryset
    
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
        # Vérifier le délai de 24h pour le client
        client = serializer.validated_data.get('client')
        if client:
            derniers_echantillons = Echantillon.objects.filter(
                client=client
            ).order_by('-created_at').first()
            
            if derniers_echantillons:
                delai = timezone.now() - derniers_echantillons.created_at
                if delai > timedelta(hours=24):
                    from rest_framework.exceptions import ValidationError
                    raise ValidationError({
                        'client': 'Impossible d\'ajouter un échantillon pour ce client après 24h. Veuillez créer un nouveau client.'
                    })
        
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
    
    @action(detail=True, methods=['post'])
    def retarder(self, request, pk=None):
        """Retarder un échantillon et reprogrammer automatiquement"""
        from .reprogrammation_helper import reprogrammer_echantillon_retarde
        
        echantillon = self.get_object()
        jours_retard = request.data.get('jours_retard', 4)
        
        result = reprogrammer_echantillon_retarde(str(echantillon.id), jours_retard)
        
        if result['success']:
            serializer = self.get_serializer(echantillon)
            return Response({
                **result,
                'echantillon': serializer.data
            })
        else:
            return Response(result, status=status.HTTP_400_BAD_REQUEST)
    
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
        print(f"\n🔍 TRAITEMENT: {echantillons.count()} échantillons avec statut='traitement'")
        
        clients_data = {}
        for echantillon in echantillons:
            print(f"\n📦 {echantillon.code}:")
            client_key = str(echantillon.client.id) if echantillon.client else 'sans_client'
            client_nom = echantillon.client_nom or 'Client inconnu'
            if client_key not in clients_data:
                clients_data[client_key] = {
                    'clientNom': client_nom,
                    'chefProjet': echantillon.chef_projet or '-',
                    'echantillons': [],
                    'totalEssais': 0
                }
            
            # Récupérer uniquement les essais acceptés
            essais_acceptes = echantillon.essais.filter(statut='termine', statut_validation='accepted')
            total_essais = echantillon.essais.count()
            print(f"  - Total essais: {total_essais}")
            print(f"  - Essais acceptés: {essais_acceptes.count()}")
            for e in echantillon.essais.all():
                print(f"    • {e.type}: statut={e.statut}, validation={e.statut_validation}")
            
            # Vérifier que TOUS les essais sont acceptés
            if essais_acceptes.count() != total_essais:
                print(f"  ❌ Ignoré: tous les essais ne sont pas acceptés")
                continue
            
            # Garder seulement le dernier essai de chaque type
            essais_uniques = {}
            for essai in essais_acceptes:
                if essai.type not in essais_uniques or essai.date_fin > essais_uniques[essai.type].date_fin:
                    essais_uniques[essai.type] = essai
            
            print(f"  - Essais uniques retenus: {len(essais_uniques)}")
            
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



# Mixin pour les essais rejetés
class EssaiViewSet(viewsets.ModelViewSet):
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
        
        # Permettre de re-terminer un essai rejeté
        est_rejete = essai.statut_validation == 'rejected'
        
        if essai.statut not in ['en_cours', 'attente', 'termine'] or (essai.statut == 'termine' and not est_rejete):
            return Response(
                {'error': 'Cet essai n\'est pas en cours ou en attente'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        essai.statut = 'termine'
        essai.date_fin = request.data.get('date_fin', timezone.now().date())
        
        # Si l'essai était rejeté, réinitialiser les champs de rejet
        if est_rejete:
            essai.date_rejet = None
            essai.was_resumed = True  # Marquer comme repris
        
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
        essai.priorite = 'urgente'  # Marquer automatiquement comme prioritaire
        essai.save()
        
        # Marquer l'échantillon comme prioritaire aussi
        echantillon = essai.echantillon
        if echantillon.priorite != 'urgente':
            echantillon.priorite = 'urgente'
            echantillon.save()
        
        serializer = self.get_serializer(essai)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def accepter(self, request, pk=None):
        """Accepter un essai et vérifier si tous les essais sont acceptés pour envoyer au traitement"""
        essai = self.get_object()
        
        essai.statut_validation = 'accepted'
        essai.commentaires_validation = request.data.get('commentaires', '')
        essai.date_validation = timezone.now().date()
        essai.save()
        
        # Vérifier si tous les essais de l'échantillon sont terminés et acceptés
        echantillon = essai.echantillon
        tous_les_essais = echantillon.essais.all()
        
        # Compter les essais terminés
        essais_termines = tous_les_essais.filter(statut='termine')
        
        # Vérifier si tous les essais terminés sont acceptés
        essais_acceptes = essais_termines.filter(statut_validation='accepted')
        
        # Si tous les essais sont terminés ET tous acceptés, envoyer au traitement
        if essais_termines.count() > 0 and essais_termines.count() == essais_acceptes.count():
            echantillon.statut = 'traitement'
            echantillon.save()
            
            # Créer une notification pour le responsable traitement
            from django.contrib.auth import get_user_model
            User = get_user_model()
            
            responsables_traitement = User.objects.filter(
                role='responsable_traitement',
                is_active=True
            )
            
            for responsable in responsables_traitement:
                Notification.objects.create(
                    user=responsable,
                    type='success',
                    title='Nouvel échantillon en traitement',
                    message=f'L\'échantillon {echantillon.code} a été envoyé au traitement. Tous les essais ont été acceptés.',
                    module='Validation',
                    action_required=True,
                    echantillon=echantillon
                )
            
            return Response({
                **self.get_serializer(essai).data,
                'echantillon_envoye_traitement': True,
                'message': 'Essai accepté. Tous les essais sont acceptés, échantillon envoyé au traitement.'
            })
        
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
    
    @action(detail=False, methods=['get'])
    def prochaine_date_disponible(self, request):
        """Calcule la prochaine date disponible pour un type d'essai en fonction de la capacité"""
        type_essai = request.query_params.get('type_essai')
        
        if not type_essai:
            return Response(
                {'error': 'Type d\'essai requis'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Récupérer la capacité pour ce type d'essai
        capacite = CapaciteLaboratoire.objects.filter(type_essai=type_essai).first()
        
        if not capacite:
            # Si pas de capacité définie, retourner demain
            demain = timezone.now().date() + timedelta(days=1)
            return Response({
                'date_disponible': demain.strftime('%Y-%m-%d'),
                'message': 'Aucune limite de capacité définie'
            })
        
        # Commencer à partir de demain
        date_test = timezone.now().date() + timedelta(days=1)
        max_jours = 30  # Chercher jusqu'à 30 jours dans le futur
        
        for _ in range(max_jours):
            # Ignorer les weekends
            if date_test.weekday() >= 5:  # 5 = samedi, 6 = dimanche
                date_test += timedelta(days=1)
                continue
            
            # Compter les essais déjà planifiés pour cette date
            essais_planifies = Essai.objects.filter(
                type=type_essai,
                date_reception=date_test
            ).count()
            
            # Vérifier si la capacité est disponible
            if essais_planifies < capacite.capacite_quotidienne:
                return Response({
                    'date_disponible': date_test.strftime('%Y-%m-%d'),
                    'capacite_totale': capacite.capacite_quotidienne,
                    'capacite_utilisee': essais_planifies,
                    'capacite_restante': capacite.capacite_quotidienne - essais_planifies,
                    'message': f'Prochaine date disponible trouvée'
                })
            
            date_test += timedelta(days=1)
        
        # Si aucune date trouvée dans les 30 jours, retourner dans 30 jours
        return Response({
            'date_disponible': date_test.strftime('%Y-%m-%d'),
            'message': 'Aucune date disponible dans les 30 prochains jours, date suggérée par défaut'
        })


# Mixin pour les workflows rejetés
class WorkflowValidationViewSet(viewsets.ModelViewSet):
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
"""
Views pour les logs d'actions
"""

from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Count, Avg, Q
from django.utils import timezone
from datetime import timedelta
from .serializers import ActionLogSerializer, ActionLogStatsSerializer


class ActionLogViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet pour consulter les logs d'actions
    Lecture seule - les logs sont créés automatiquement par le middleware
    """
    
    queryset = ActionLog.objects.all()
    serializer_class = ActionLogSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filtrer les logs selon les paramètres de requête"""
        queryset = ActionLog.objects.all()
        
        # Filtrer par utilisateur
        user_id = self.request.query_params.get('user_id')
        if user_id:
            queryset = queryset.filter(user_id=user_id)
        
        username = self.request.query_params.get('username')
        if username:
            queryset = queryset.filter(username__icontains=username)
        
        # Filtrer par type d'action
        action_type = self.request.query_params.get('action_type')
        if action_type:
            queryset = queryset.filter(action_type=action_type)
        
        # Filtrer par méthode HTTP
        http_method = self.request.query_params.get('http_method')
        if http_method:
            queryset = queryset.filter(http_method=http_method)
        
        # Filtrer par succès/échec
        success = self.request.query_params.get('success')
        if success is not None:
            queryset = queryset.filter(success=success.lower() == 'true')
        
        # Filtrer par échantillon
        echantillon_id = self.request.query_params.get('echantillon_id')
        if echantillon_id:
            queryset = queryset.filter(echantillon_id=echantillon_id)
        
        echantillon_code = self.request.query_params.get('echantillon_code')
        if echantillon_code:
            queryset = queryset.filter(echantillon_code__icontains=echantillon_code)
        
        # Filtrer par essai
        essai_id = self.request.query_params.get('essai_id')
        if essai_id:
            queryset = queryset.filter(essai_id=essai_id)
        
        # Filtrer par client
        client_id = self.request.query_params.get('client_id')
        if client_id:
            queryset = queryset.filter(client_id=client_id)
        
        # Filtrer par période
        date_from = self.request.query_params.get('date_from')
        if date_from:
            queryset = queryset.filter(created_at__gte=date_from)
        
        date_to = self.request.query_params.get('date_to')
        if date_to:
            queryset = queryset.filter(created_at__lte=date_to)
        
        # Filtrer par période prédéfinie
        period = self.request.query_params.get('period')
        if period:
            now = timezone.now()
            if period == 'today':
                queryset = queryset.filter(created_at__date=now.date())
            elif period == 'week':
                queryset = queryset.filter(created_at__gte=now - timedelta(days=7))
            elif period == 'month':
                queryset = queryset.filter(created_at__gte=now - timedelta(days=30))
            elif period == 'year':
                queryset = queryset.filter(created_at__gte=now - timedelta(days=365))
        
        return queryset.order_by('-created_at')
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Obtenir des statistiques sur les logs d'actions"""
        
        # Appliquer les mêmes filtres que get_queryset
        queryset = self.get_queryset()
        
        # Total d'actions
        total_actions = queryset.count()
        
        # Actions par type
        actions_by_type = dict(
            queryset.values('action_type')
            .annotate(count=Count('id'))
            .values_list('action_type', 'count')
        )
        
        # Actions par utilisateur
        actions_by_user = dict(
            queryset.values('username')
            .annotate(count=Count('id'))
            .order_by('-count')[:10]
            .values_list('username', 'count')
        )
        
        # Actions par jour (derniers 7 jours)
        now = timezone.now()
        actions_by_day = {}
        for i in range(7):
            day = (now - timedelta(days=i)).date()
            count = queryset.filter(created_at__date=day).count()
            actions_by_day[str(day)] = count
        
        # Taux de succès
        success_count = queryset.filter(success=True).count()
        success_rate = (success_count / total_actions * 100) if total_actions > 0 else 0
        
        # Durée moyenne
        avg_duration = queryset.filter(duration_ms__isnull=False).aggregate(
            avg=Avg('duration_ms')
        )['avg'] or 0
        
        stats_data = {
            'total_actions': total_actions,
            'actions_by_type': actions_by_type,
            'actions_by_user': actions_by_user,
            'actions_by_day': actions_by_day,
            'success_rate': round(success_rate, 2),
            'average_duration_ms': round(avg_duration, 2),
        }
        
        serializer = ActionLogStatsSerializer(stats_data)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def recent(self, request):
        """Obtenir les actions récentes (dernières 24h)"""
        now = timezone.now()
        yesterday = now - timedelta(days=1)
        
        recent_logs = self.get_queryset().filter(created_at__gte=yesterday)[:50]
        serializer = self.get_serializer(recent_logs, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def by_user(self, request):
        """Obtenir les actions d'un utilisateur spécifique"""
        user_id = request.query_params.get('user_id')
        if not user_id:
            return Response(
                {'error': 'user_id parameter is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        logs = self.get_queryset().filter(user_id=user_id)[:100]
        serializer = self.get_serializer(logs, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def by_echantillon(self, request):
        """Obtenir toutes les actions liées à un échantillon"""
        echantillon_id = request.query_params.get('echantillon_id')
        if not echantillon_id:
            return Response(
                {'error': 'echantillon_id parameter is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        logs = self.get_queryset().filter(echantillon_id=echantillon_id)
        serializer = self.get_serializer(logs, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def errors(self, request):
        """Obtenir les actions qui ont échoué"""
        error_logs = self.get_queryset().filter(success=False)[:100]
        serializer = self.get_serializer(error_logs, many=True)
        return Response(serializer.data)
"""
Vues pour le stockage des données (remplace localStorage)
"""

from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .serializers import DataStorageSerializer


class DataStorageViewSet(viewsets.ModelViewSet):
    """ViewSet pour gérer le stockage clé-valeur"""
    
    serializer_class = DataStorageSerializer
    permission_classes = []
    
    def get_queryset(self):
        if self.request.user.is_authenticated:
            return DataStorage.objects.filter(user=self.request.user)
        return DataStorage.objects.none()
    
    def create(self, request, *args, **kwargs):
        """Créer ou mettre à jour une entrée"""
        try:
            if not request.user.is_authenticated:
                return Response(
                    {'error': 'Authentification requise'},
                    status=status.HTTP_401_UNAUTHORIZED
                )
            
            key = request.data.get('key')
            value = request.data.get('value')
            
            if not key:
                return Response(
                    {'error': 'La clé est requise'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Mettre à jour si existe, créer sinon
            storage, created = DataStorage.objects.update_or_create(
                user=request.user,
                key=key,
                defaults={'value': value}
            )
            
            serializer = self.get_serializer(storage)
            return Response(
                serializer.data,
                status=status.HTTP_201_CREATED if created else status.HTTP_200_OK
            )
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def retrieve(self, request, pk=None):
        """Récupérer une valeur par clé"""
        if not request.user.is_authenticated:
            return Response(
                {'error': 'Authentification requise'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        try:
            storage = DataStorage.objects.get(user=request.user, key=pk)
            serializer = self.get_serializer(storage)
            return Response(serializer.data)
        except DataStorage.DoesNotExist:
            return Response(
                {'value': None},
                status=status.HTTP_200_OK
            )
    
    @action(detail=False, methods=['get'], url_path='(?P<key>[^/.]+)')
    def get_by_key(self, request, key=None):
        """Récupérer une valeur par clé (route alternative)"""
        if not request.user.is_authenticated:
            return Response(
                {'error': 'Authentification requise'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        try:
            storage = DataStorage.objects.get(user=request.user, key=key)
            return Response({'key': storage.key, 'value': storage.value})
        except DataStorage.DoesNotExist:
            return Response({'value': None}, status=status.HTTP_200_OK)
    
    def destroy(self, request, pk=None):
        """Supprimer une entrée par clé"""
        try:
            storage = DataStorage.objects.get(user=request.user, key=pk)
            storage.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except DataStorage.DoesNotExist:
            return Response(
                {'error': 'Clé non trouvée'},
                status=status.HTTP_404_NOT_FOUND
            )
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from .serializers import RapportValidationSerializer, EssaiDataSerializer, PlanificationDataSerializer


class RapportValidationViewSet(viewsets.ModelViewSet):
    queryset = RapportValidation.objects.all()
    serializer_class = RapportValidationSerializer
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['get'])
    def by_etape(self, request):
        """Récupérer les rapports par étape"""
        etape = request.query_params.get('etape')
        status_filter = request.query_params.get('status', 'pending')
        
        queryset = self.queryset.filter(etape_actuelle=etape, status=status_filter)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def by_code(self, request):
        """Récupérer les rapports par code échantillon"""
        code = request.query_params.get('code')
        queryset = self.queryset.filter(code_echantillon=code)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def valider_chef_projet(self, request, pk=None):
        """Valider par chef de projet"""
        rapport = self.get_object()
        rapport.validated_by_chef_projet = True
        rapport.status = 'accepted'
        rapport.comment_chef_projet = request.data.get('comment', '')
        rapport.date_validation_chef_projet = timezone.now()
        rapport.etape_actuelle = 'chef_service'
        rapport.save()
        return Response({'status': 'validated'})
    
    @action(detail=True, methods=['post'])
    def rejeter_chef_projet(self, request, pk=None):
        """Rejeter par chef de projet"""
        rapport = self.get_object()
        rapport.rejected_by_chef_projet = True
        rapport.status = 'rejected'
        rapport.comment_chef_projet = request.data.get('comment', '')
        rapport.date_rejet = timezone.now()
        rapport.save()
        return Response({'status': 'rejected'})
    
    @action(detail=True, methods=['post'])
    def valider_chef_service(self, request, pk=None):
        """Valider par chef de service"""
        rapport = self.get_object()
        rapport.validated_by_chef_service = True
        rapport.status = 'accepted'
        rapport.comment_chef_service = request.data.get('comment', '')
        rapport.date_validation_chef_service = timezone.now()
        rapport.etape_actuelle = 'directeur_technique'
        rapport.save()
        return Response({'status': 'validated'})
    
    @action(detail=True, methods=['post'])
    def rejeter_chef_service(self, request, pk=None):
        """Rejeter par chef de service"""
        rapport = self.get_object()
        rapport.rejected_by_chef_service = True
        rapport.status = 'rejected'
        rapport.comment_chef_service = request.data.get('comment', '')
        rapport.date_rejet = timezone.now()
        rapport.save()
        return Response({'status': 'rejected'})
    
    @action(detail=True, methods=['post'])
    def valider_directeur_technique(self, request, pk=None):
        """Valider par directeur technique"""
        rapport = self.get_object()
        rapport.validated_by_directeur_technique = True
        rapport.status = 'accepted'
        rapport.comment_directeur_technique = request.data.get('comment', '')
        rapport.date_validation_directeur_technique = timezone.now()
        rapport.etape_actuelle = 'directeur_snertp'
        rapport.save()
        return Response({'status': 'validated'})
    
    @action(detail=True, methods=['post'])
    def rejeter_directeur_technique(self, request, pk=None):
        """Rejeter par directeur technique"""
        rapport = self.get_object()
        rapport.rejected_by_directeur_technique = True
        rapport.status = 'rejected'
        rapport.comment_directeur_technique = request.data.get('comment', '')
        rapport.date_rejet = timezone.now()
        rapport.save()
        return Response({'status': 'rejected'})
    
    @action(detail=True, methods=['post'])
    def aviser_directeur_snertp(self, request, pk=None):
        """Aviser par directeur SNERTP"""
        rapport = self.get_object()
        rapport.validated_by_directeur_snertp = True
        rapport.status = 'accepted'
        rapport.avis_directeur_snertp = request.data.get('avis', '')
        rapport.signature_directeur_snertp = request.data.get('signature', '')
        rapport.date_validation_directeur_snertp = timezone.now()
        rapport.etape_actuelle = 'marketing'
        rapport.save()
        return Response({'status': 'avisé'})
    
    @action(detail=True, methods=['post'])
    def envoyer_client(self, request, pk=None):
        """Envoyer au client par marketing"""
        rapport = self.get_object()
        rapport.processed_by_marketing = True
        rapport.date_envoi_client = timezone.now()
        rapport.email_client = request.data.get('email', '')
        rapport.etape_actuelle = 'client'
        rapport.save()
        return Response({'status': 'envoyé'})
    
    @action(detail=False, methods=['get'])
    def rejetes(self, request):
        """Récupérer tous les rapports rejetés"""
        queryset = self.queryset.filter(status='rejected')
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def valides(self, request):
        """Récupérer tous les rapports validés"""
        queryset = self.queryset.filter(
            validated_by_directeur_technique=True,
            status='accepted'
        )
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


class EssaiDataViewSet(viewsets.ModelViewSet):
    queryset = EssaiData.objects.all()
    serializer_class = EssaiDataSerializer
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['get'])
    def by_echantillon(self, request):
        """Récupérer les essais par code échantillon"""
        code = request.query_params.get('code')
        queryset = self.queryset.filter(echantillon_code=code)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def by_essai_id(self, request):
        """Récupérer un essai par son ID"""
        essai_id = request.query_params.get('essai_id')
        try:
            essai = self.queryset.get(essai_id=essai_id)
            serializer = self.get_serializer(essai)
            return Response(serializer.data)
        except EssaiData.DoesNotExist:
            return Response({'error': 'Essai non trouvé'}, status=404)
    
    @action(detail=True, methods=['post'])
    def update_data(self, request, pk=None):
        """Mettre à jour les données d'un essai"""
        essai = self.get_object()
        essai.data.update(request.data.get('data', {}))
        essai.statut = request.data.get('statut', essai.statut)
        essai.validation_status = request.data.get('validation_status', essai.validation_status)
        essai.envoye = request.data.get('envoye', essai.envoye)
        essai.resultats = request.data.get('resultats', essai.resultats)
        essai.commentaires = request.data.get('commentaires', essai.commentaires)
        essai.save()
        return Response({'status': 'updated'})


class PlanificationDataViewSet(viewsets.ModelViewSet):
    queryset = PlanificationData.objects.all()
    serializer_class = PlanificationDataSerializer
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['get'])
    def by_echantillon(self, request):
        """Récupérer les planifications par code échantillon"""
        code = request.query_params.get('code')
        queryset = self.queryset.filter(echantillon_code=code)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def by_date(self, request):
        """Récupérer les planifications par date"""
        date = request.query_params.get('date')
        queryset = self.queryset.filter(date_planifiee=date)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def marquer_complete(self, request, pk=None):
        """Marquer une planification comme complétée"""
        planification = self.get_object()
        planification.completed = True
        planification.statut = 'complete'
        planification.save()
        return Response({'status': 'completed'})
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend

from .serializers import RapportArchiveSerializer


class RapportArchiveViewSet(viewsets.ModelViewSet):
    """ViewSet pour l'archivage des rapports"""
    
    queryset = RapportArchive.objects.select_related('envoye_par')
    serializer_class = RapportArchiveSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['etape_envoi', 'code_echantillon', 'envoye_par']
    search_fields = ['code_echantillon', 'client_name']
    ordering_fields = ['date_envoi', 'created_at']
    
    def get_queryset(self):
        """Filtrer selon le rôle de l'utilisateur"""
        user = self.request.user
        
        # Chef projet voit ses propres rapports archivés
        if user.role == 'chef_projet':
            return self.queryset.filter(envoye_par=user)
        
        # Autres rôles voient tous les rapports
        return self.queryset
    
    @action(detail=False, methods=['post'])
    def archiver_rapport(self, request):
        """Archiver un rapport lors de l'envoi au chef service"""
        code_echantillon = request.data.get('code_echantillon')
        client_name = request.data.get('client_name')
        file_name = request.data.get('file_name')
        file_data = request.data.get('file_data')
        etape_envoi = request.data.get('etape_envoi', 'chef_service')
        commentaires = request.data.get('commentaires', '')
        
        if not all([code_echantillon, client_name, file_name, file_data]):
            return Response(
                {'error': 'Données manquantes'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        archive = RapportArchive.objects.create(
            code_echantillon=code_echantillon,
            client_name=client_name,
            file_name=file_name,
            file_data=file_data,
            etape_envoi=etape_envoi,
            commentaires=commentaires,
            envoye_par=request.user
        )
        
        serializer = self.get_serializer(archive)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=False, methods=['get'])
    def mes_archives(self, request):
        """Retourne les archives de l'utilisateur connecté"""
        archives = self.get_queryset().filter(envoye_par=request.user)
        serializer = self.get_serializer(archives, many=True)
        return Response(serializer.data)
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

from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from django.utils import timezone
from .models import WorkflowValidation
from .serializers import WorkflowValidationSerializer

class WorkflowRejetesViewSet(viewsets.ViewSet):
    """API pour gérer les workflows rejetés"""
    
    @action(detail=False, methods=['get'])
    def chef_projet_rejetes(self, request):
        """Récupérer les workflows rejetés par le chef de projet"""
        workflows_rejetes = WorkflowValidation.objects.filter(
            etape_actuelle='chef_projet',
            statut='rejected'
        )
        
        data = []
        for workflow in workflows_rejetes:
            data.append({
                'echantillonCode': workflow.code_echantillon,
                'essaiType': workflow.type_essai or 'Rapport',
                'chefProjet': workflow.chef_projet or '-',
                'dateSent': workflow.date_envoi_chef_projet,
                'dateRejected': workflow.date_rejet_chef_projet,
                'rejectionReason': workflow.commentaires_rejet or '-',
                'file': workflow.file_name or '-'
            })
        
        return Response({'results': data})
    
    @action(detail=False, methods=['get'])
    def chef_service_rejetes(self, request):
        """Récupérer les workflows rejetés par le chef de service"""
        workflows_rejetes = WorkflowValidation.objects.filter(
            etape_actuelle='chef_service',
            statut='rejected'
        )
        
        serializer = WorkflowValidationSerializer(workflows_rejetes, many=True)
        return Response({'results': serializer.data})
    
    @action(detail=True, methods=['patch'])
    def valider_chef_service(self, request, pk=None):
        """Valider un workflow par le chef de service"""
        try:
            workflow = WorkflowValidation.objects.get(pk=pk)
            
            workflow.statut = 'validated'
            workflow.etape_actuelle = 'directeur_technique'
            workflow.date_validation_chef_service = timezone.now()
            workflow.commentaires_chef_service = request.data.get('commentaires', '')
            
            workflow.save()
            
            serializer = WorkflowValidationSerializer(workflow)
            return Response(serializer.data)
            
        except WorkflowValidation.DoesNotExist:
            return Response(
                {'error': 'Workflow non trouvé'}, 
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=True, methods=['patch'])
    def rejeter_chef_service(self, request, pk=None):
        """Rejeter un workflow par le chef de service"""
        try:
            workflow = WorkflowValidation.objects.get(pk=pk)
            
            workflow.statut = 'rejected'
            workflow.etape_actuelle = 'traitement'
            workflow.date_rejet_chef_service = timezone.now()
            workflow.commentaires_rejet = request.data.get('commentaires', '')
            
            workflow.save()
            
            serializer = WorkflowValidationSerializer(workflow)
            return Response(serializer.data)
            
        except WorkflowValidation.DoesNotExist:
            return Response(
                {'error': 'Workflow non trouvé'}, 
                status=status.HTTP_404_NOT_FOUND
            )