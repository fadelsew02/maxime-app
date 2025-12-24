"""
Configuration de l'interface d'administration Django
"""

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, Client, Echantillon, Essai, Notification, ValidationHistory
from .models_action_log import ActionLog
from .models_workflow_data import RapportValidation, EssaiData, PlanificationData


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


@admin.register(ActionLog)
class ActionLogAdmin(admin.ModelAdmin):
    """Administration des logs d'actions"""
    
    list_display = ['username', 'action_type', 'http_method', 'endpoint', 'success', 'response_status', 'created_at']
    list_filter = ['action_type', 'http_method', 'success', 'user_role', 'created_at']
    search_fields = ['username', 'action_description', 'endpoint', 'echantillon_code', 'client_code']
    readonly_fields = [
        'id', 'user', 'username', 'user_role', 'action_type', 'action_description',
        'http_method', 'endpoint', 'ip_address', 'user_agent', 'request_data',
        'response_status', 'echantillon_id', 'echantillon_code', 'essai_id',
        'essai_type', 'client_id', 'client_code', 'rapport_id', 'workflow_id',
        'success', 'error_message', 'duration_ms', 'created_at'
    ]
    date_hierarchy = 'created_at'
    
    def has_add_permission(self, request):
        # Les logs sont créés automatiquement, pas d'ajout manuel
        return False
    
    def has_change_permission(self, request, obj=None):
        # Les logs ne peuvent pas être modifiés
        return False


@admin.register(RapportValidation)
class RapportValidationAdmin(admin.ModelAdmin):
    """Administration des rapports en validation"""
    
    list_display = ['code_echantillon', 'client_name', 'etape_actuelle', 'status', 'date_envoi']
    list_filter = ['etape_actuelle', 'status', 'created_at']
    search_fields = ['code_echantillon', 'client_name', 'essai_type']
    readonly_fields = ['created_at', 'updated_at']
    date_hierarchy = 'created_at'


@admin.register(EssaiData)
class EssaiDataAdmin(admin.ModelAdmin):
    """Administration des données d'essais"""
    
    list_display = ['essai_id', 'echantillon_code', 'essai_type', 'statut', 'envoye']
    list_filter = ['essai_type', 'statut', 'envoye', 'created_at']
    search_fields = ['essai_id', 'echantillon_code', 'operateur']
    readonly_fields = ['created_at', 'updated_at']
    date_hierarchy = 'created_at'


@admin.register(PlanificationData)
class PlanificationDataAdmin(admin.ModelAdmin):
    """Administration des planifications d'essais"""
    
    list_display = ['echantillon_code', 'essai_type', 'date_planifiee', 'operateur_assigne', 'statut', 'completed']
    list_filter = ['essai_type', 'statut', 'completed', 'date_planifiee']
    search_fields = ['echantillon_code', 'operateur_assigne']
    readonly_fields = ['created_at', 'updated_at']
    date_hierarchy = 'date_planifiee'
