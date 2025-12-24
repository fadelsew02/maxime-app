"""
Vues pour le stockage des données (remplace localStorage)
"""

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models_storage import DataStorage
from .serializers_storage import DataStorageSerializer


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
