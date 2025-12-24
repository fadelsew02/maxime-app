from rest_framework import status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from django.utils import timezone
from .models import WorkflowValidation
from .serializers_workflow_data import WorkflowValidationSerializer

class WorkflowRejetesViewSet:
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