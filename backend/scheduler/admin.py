"""
Configuration de l'interface d'administration pour le module scheduler
"""

from django.contrib import admin
from .models import Ressource, ContrainteTemporelle, Planning, AffectationEssai


@admin.register(Ressource)
class RessourceAdmin(admin.ModelAdmin):
    """Administration des ressources"""
    
    list_display = ['nom', 'type', 'section', 'capacite', 'disponible']
    list_filter = ['type', 'section', 'disponible']
    search_fields = ['nom']
    
    fieldsets = (
        ('Informations', {
            'fields': ('nom', 'type', 'section', 'capacite')
        }),
        ('Disponibilité', {
            'fields': ('disponible', 'date_maintenance_debut', 'date_maintenance_fin')
        }),
    )


@admin.register(ContrainteTemporelle)
class ContrainteTemporelleAdmin(admin.ModelAdmin):
    """Administration des contraintes temporelles"""
    
    list_display = ['type', 'date_debut', 'date_fin', 'section', 'active']
    list_filter = ['type', 'active', 'date_debut']
    search_fields = ['description']
    date_hierarchy = 'date_debut'


@admin.register(Planning)
class PlanningAdmin(admin.ModelAdmin):
    """Administration des plannings"""
    
    list_display = ['nom', 'date_debut', 'date_fin', 'statut', 'nombre_essais_planifies', 'score_optimisation']
    list_filter = ['statut', 'date_debut']
    search_fields = ['nom']
    readonly_fields = ['score_optimisation', 'temps_calcul', 'nombre_essais_planifies', 'created_at', 'updated_at']
    date_hierarchy = 'date_debut'


@admin.register(AffectationEssai)
class AffectationEssaiAdmin(admin.ModelAdmin):
    """Administration des affectations d'essais"""
    
    list_display = ['essai', 'planning', 'date_debut_planifiee', 'date_fin_planifiee', 'priorite_calculee']
    list_filter = ['planning', 'date_debut_planifiee']
    search_fields = ['essai__echantillon__code']
    date_hierarchy = 'date_debut_planifiee'
    
    readonly_fields = ['created_at']
