"""
Serializer pour le stockage des données
"""

from rest_framework import serializers
from .models_storage import DataStorage


class DataStorageSerializer(serializers.ModelSerializer):
    """Serializer pour le stockage clé-valeur"""
    
    class Meta:
        model = DataStorage
        fields = ['id', 'key', 'value', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']
