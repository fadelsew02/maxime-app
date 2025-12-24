from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters

from .models_archive import RapportArchive
from .serializers_archive import RapportArchiveSerializer


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
