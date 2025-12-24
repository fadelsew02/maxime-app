from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from .models_workflow_data import RapportValidation, EssaiData, PlanificationData
from .serializers_workflow_data import RapportValidationSerializer, EssaiDataSerializer, PlanificationDataSerializer


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
