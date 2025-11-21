"""
Serializers pour l'API REST
"""

from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Client, Echantillon, Essai, Notification, ValidationHistory

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    """Serializer pour les utilisateurs"""
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'role', 'phone', 'created_at']
        read_only_fields = ['id', 'created_at']


class UserCreateSerializer(serializers.ModelSerializer):
    """Serializer pour créer un utilisateur"""
    
    password = serializers.CharField(write_only=True, min_length=8)
    
    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'first_name', 'last_name', 'role', 'phone']
    
    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)
        return user


class ClientSerializer(serializers.ModelSerializer):
    """Serializer pour les clients"""
    
    echantillons_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Client
        fields = [
            'id', 'code', 'nom', 'contact', 'projet', 'email', 
            'telephone', 'photo', 'created_at', 'updated_at',
            'echantillons_count'
        ]
        read_only_fields = ['id', 'code', 'created_at', 'updated_at']
    
    def get_echantillons_count(self, obj):
        return obj.echantillons.count()


class EssaiSerializer(serializers.ModelSerializer):
    """Serializer pour les essais"""
    
    echantillon_code = serializers.CharField(source='echantillon.code', read_only=True)
    type_display = serializers.CharField(source='get_type_display', read_only=True)
    section_display = serializers.CharField(source='get_section_display', read_only=True)
    statut_display = serializers.CharField(source='get_statut_display', read_only=True)
    
    class Meta:
        model = Essai
        fields = [
            'id', 'echantillon', 'echantillon_code', 'type', 'type_display',
            'section', 'section_display', 'date_reception', 'date_debut',
            'date_fin', 'date_rejet', 'duree_estimee', 'operateur',
            'statut', 'statut_display', 'statut_validation', 'resultats',
            'commentaires', 'commentaires_validation', 'fichier',
            'was_resumed', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class EchantillonSerializer(serializers.ModelSerializer):
    """Serializer pour les échantillons"""
    
    client_nom = serializers.CharField(source='client.nom', read_only=True)
    client_code = serializers.CharField(source='client.code', read_only=True)
    essais = EssaiSerializer(many=True, read_only=True)
    essais_types = serializers.ListField(
        child=serializers.CharField(),
        write_only=True,
        required=False,
        help_text="Liste des types d'essais à créer"
    )
    statut_display = serializers.CharField(source='get_statut_display', read_only=True)
    priorite_display = serializers.CharField(source='get_priorite_display', read_only=True)
    
    class Meta:
        model = Echantillon
        fields = [
            'id', 'code', 'client', 'client_nom', 'client_code',
            'nature', 'profondeur_debut', 'profondeur_fin', 'sondage',
            'nappe', 'qr_code', 'photo', 'date_reception', 'date_fin_estimee',
            'statut', 'statut_display', 'priorite', 'priorite_display',
            'chef_projet', 'essais', 'essais_types', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'code', 'qr_code', 'created_at', 'updated_at']
    
    def create(self, validated_data):
        essais_types = validated_data.pop('essais_types', [])
        echantillon = Echantillon.objects.create(**validated_data)
        
        # Créer les essais associés
        durees = {
            'AG': 5,
            'Proctor': 4,
            'CBR': 5,
            'Oedometre': 18,
            'Cisaillement': 8,
        }
        
        for essai_type in essais_types:
            section = 'route' if essai_type in ['AG', 'Proctor', 'CBR'] else 'mecanique'
            Essai.objects.create(
                echantillon=echantillon,
                type=essai_type,
                section=section,
                duree_estimee=durees.get(essai_type, 5)
            )
        
        return echantillon


class EchantillonListSerializer(serializers.ModelSerializer):
    """Serializer simplifié pour les listes d'échantillons"""
    
    client_nom = serializers.CharField(source='client.nom', read_only=True)
    essais_count = serializers.SerializerMethodField()
    essais_types = serializers.SerializerMethodField()
    
    class Meta:
        model = Echantillon
        fields = [
            'id', 'code', 'client_nom', 'nature', 'profondeur_debut',
            'profondeur_fin', 'statut', 'priorite', 'chef_projet',
            'date_reception', 'essais_count', 'essais_types'
        ]
    
    def get_essais_count(self, obj):
        return obj.essais.count()
    
    def get_essais_types(self, obj):
        return list(obj.essais.values_list('type', flat=True))


class NotificationSerializer(serializers.ModelSerializer):
    """Serializer pour les notifications"""
    
    echantillon_code = serializers.CharField(source='echantillon.code', read_only=True)
    essai_type = serializers.CharField(source='essai.type', read_only=True)
    
    class Meta:
        model = Notification
        fields = [
            'id', 'type', 'title', 'message', 'module',
            'action_required', 'read', 'echantillon', 'echantillon_code',
            'essai', 'essai_type', 'created_at', 'read_at'
        ]
        read_only_fields = ['id', 'created_at', 'read_at']


class ValidationHistorySerializer(serializers.ModelSerializer):
    """Serializer pour l'historique des validations"""
    
    echantillon_code = serializers.CharField(source='echantillon.code', read_only=True)
    validateur_name = serializers.CharField(source='validateur.get_full_name', read_only=True)
    
    class Meta:
        model = ValidationHistory
        fields = [
            'id', 'echantillon', 'echantillon_code', 'validateur',
            'validateur_name', 'action', 'observations', 'niveau', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class DashboardStatsSerializer(serializers.Serializer):
    """Serializer pour les statistiques du dashboard"""
    
    total_echantillons = serializers.IntegerField()
    echantillons_en_cours = serializers.IntegerField()
    echantillons_termines = serializers.IntegerField()
    echantillons_urgents = serializers.IntegerField()
    essais_en_attente = serializers.IntegerField()
    essais_en_cours = serializers.IntegerField()
    essais_termines = serializers.IntegerField()
    clients_actifs = serializers.IntegerField()
    delai_moyen_traitement = serializers.FloatField()
    taux_respect_delais = serializers.FloatField()
