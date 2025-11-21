"""
Serializers pour le module scheduler
"""

from rest_framework import serializers
from .models import Ressource, ContrainteTemporelle, Planning, AffectationEssai
from core.serializers import EssaiSerializer


class RessourceSerializer(serializers.ModelSerializer):
    """Serializer pour les ressources"""
    
    type_display = serializers.CharField(source='get_type_display', read_only=True)
    section_display = serializers.CharField(source='get_section_display', read_only=True)
    
    class Meta:
        model = Ressource
        fields = [
            'id', 'nom', 'type', 'type_display', 'section', 'section_display',
            'capacite', 'disponible', 'date_maintenance_debut',
            'date_maintenance_fin', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class ContrainteTemporelleSerializer(serializers.ModelSerializer):
    """Serializer pour les contraintes temporelles"""
    
    type_display = serializers.CharField(source='get_type_display', read_only=True)
    
    class Meta:
        model = ContrainteTemporelle
        fields = [
            'id', 'type', 'type_display', 'date_debut', 'date_fin',
            'section', 'description', 'active', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class AffectationEssaiSerializer(serializers.ModelSerializer):
    """Serializer pour les affectations d'essais"""
    
    essai = EssaiSerializer(read_only=True)
    ressources = RessourceSerializer(many=True, read_only=True)
    
    class Meta:
        model = AffectationEssai
        fields = [
            'id', 'planning', 'essai', 'date_debut_planifiee',
            'date_fin_planifiee', 'ressources', 'priorite_calculee', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class PlanningSerializer(serializers.ModelSerializer):
    """Serializer pour les plannings"""
    
    affectations = AffectationEssaiSerializer(many=True, read_only=True)
    statut_display = serializers.CharField(source='get_statut_display', read_only=True)
    
    class Meta:
        model = Planning
        fields = [
            'id', 'nom', 'date_debut', 'date_fin', 'statut', 'statut_display',
            'score_optimisation', 'temps_calcul', 'nombre_essais_planifies',
            'affectations', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class PlanningListSerializer(serializers.ModelSerializer):
    """Serializer simplifié pour les listes de plannings"""
    
    statut_display = serializers.CharField(source='get_statut_display', read_only=True)
    
    class Meta:
        model = Planning
        fields = [
            'id', 'nom', 'date_debut', 'date_fin', 'statut', 'statut_display',
            'nombre_essais_planifies', 'score_optimisation', 'created_at'
        ]


class OptimizationRequestSerializer(serializers.Serializer):
    """Serializer pour les requêtes d'optimisation"""
    
    nom = serializers.CharField(max_length=200)
    date_debut = serializers.DateField()
    date_fin = serializers.DateField()
    section = serializers.ChoiceField(
        choices=['route', 'mecanique', 'all'],
        required=False,
        default='all'
    )
    
    def validate(self, data):
        """Validation personnalisée"""
        if data['date_fin'] <= data['date_debut']:
            raise serializers.ValidationError(
                "La date de fin doit être postérieure à la date de début"
            )
        
        # Vérifier que la période n'est pas trop longue (max 60 jours)
        delta = (data['date_fin'] - data['date_debut']).days
        if delta > 60:
            raise serializers.ValidationError(
                "La période ne peut pas dépasser 60 jours"
            )
        
        return data
