"""
Configuration de l'interface d'administration Django
"""

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, Client, Echantillon, Essai, Notification, ValidationHistory


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """Administration des utilisateurs"""
    
    list_display = ['username', 'email', 'first_name', 'last_name', 'role', 'is_active']
    list_filter = ['role', 'is_active', 'is_staff']
    search_fields = ['username', 'email', 'first_name', 'last_name']
    
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Informations SNERTP', {'fields': ('role', 'phone')}),
    )
    
    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        ('Informations SNERTP', {'fields': ('role', 'phone')}),
    )


@admin.register(Client)
class ClientAdmin(admin.ModelAdmin):
    """Administration des clients"""
    
    list_display = ['code', 'nom', 'contact', 'projet', 'email', 'telephone', 'created_at']
    list_filter = ['created_at']
    search_fields = ['code', 'nom', 'contact', 'projet', 'email']
    readonly_fields = ['code', 'created_at', 'updated_at']
    date_hierarchy = 'created_at'


@admin.register(Echantillon)
class EchantillonAdmin(admin.ModelAdmin):
    """Administration des échantillons"""
    
    list_display = ['code', 'client', 'nature', 'statut', 'priorite', 'chef_projet', 'date_reception']
    list_filter = ['statut', 'priorite', 'nature', 'sondage', 'created_at']
    search_fields = ['code', 'qr_code', 'client__nom', 'chef_projet']
    readonly_fields = ['code', 'qr_code', 'created_at', 'updated_at']
    date_hierarchy = 'date_reception'
    
    fieldsets = (
        ('Identification', {
            'fields': ('code', 'qr_code', 'client', 'photo')
        }),
        ('Caractéristiques', {
            'fields': ('nature', 'profondeur_debut', 'profondeur_fin', 'sondage', 'nappe')
        }),
        ('Gestion', {
            'fields': ('statut', 'priorite', 'chef_projet', 'date_reception', 'date_fin_estimee')
        }),
        ('Métadonnées', {
            'fields': ('created_at', 'updated_at', 'created_by'),
            'classes': ('collapse',)
        }),
    )


@admin.register(Essai)
class EssaiAdmin(admin.ModelAdmin):
    """Administration des essais"""
    
    list_display = ['echantillon', 'type', 'section', 'statut', 'operateur', 'date_debut', 'date_fin']
    list_filter = ['type', 'section', 'statut', 'statut_validation', 'created_at']
    search_fields = ['echantillon__code', 'operateur', 'type']
    readonly_fields = ['created_at', 'updated_at']
    date_hierarchy = 'date_debut'
    
    fieldsets = (
        ('Identification', {
            'fields': ('echantillon', 'type', 'section')
        }),
        ('Planning', {
            'fields': ('date_reception', 'date_debut', 'date_fin', 'duree_estimee')
        }),
        ('Exécution', {
            'fields': ('operateur', 'statut', 'statut_validation')
        }),
        ('Résultats', {
            'fields': ('resultats', 'commentaires', 'commentaires_validation', 'fichier')
        }),
        ('Flags', {
            'fields': ('was_resumed', 'date_rejet'),
            'classes': ('collapse',)
        }),
        ('Métadonnées', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    """Administration des notifications"""
    
    list_display = ['user', 'title', 'type', 'module', 'action_required', 'read', 'created_at']
    list_filter = ['type', 'read', 'action_required', 'created_at']
    search_fields = ['user__username', 'title', 'message']
    readonly_fields = ['created_at', 'read_at']
    date_hierarchy = 'created_at'


@admin.register(ValidationHistory)
class ValidationHistoryAdmin(admin.ModelAdmin):
    """Administration de l'historique des validations"""
    
    list_display = ['echantillon', 'validateur', 'action', 'niveau', 'created_at']
    list_filter = ['action', 'niveau', 'created_at']
    search_fields = ['echantillon__code', 'validateur__username']
    readonly_fields = ['created_at']
    date_hierarchy = 'created_at'
