"""
Modèle pour l'enregistrement des actions utilisateurs
"""

from django.db import models
from django.contrib.auth import get_user_model
import uuid
import json

User = get_user_model()


class ActionLog(models.Model):
    """Enregistrement de toutes les actions effectuées dans le système"""
    
    ACTION_TYPES = [
        # Authentification
        ('login', 'Connexion'),
        ('logout', 'Déconnexion'),
        
        # CRUD Clients
        ('client_create', 'Création Client'),
        ('client_update', 'Modification Client'),
        ('client_delete', 'Suppression Client'),
        ('client_view', 'Consultation Client'),
        
        # CRUD Échantillons
        ('echantillon_create', 'Création Échantillon'),
        ('echantillon_update', 'Modification Échantillon'),
        ('echantillon_delete', 'Suppression Échantillon'),
        ('echantillon_view', 'Consultation Échantillon'),
        ('echantillon_send_essai', 'Envoi Échantillon aux Essais'),
        ('echantillon_send_traitement', 'Envoi Échantillon au Traitement'),
        
        # CRUD Essais
        ('essai_create', 'Création Essai'),
        ('essai_update', 'Modification Essai'),
        ('essai_delete', 'Suppression Essai'),
        ('essai_view', 'Consultation Essai'),
        ('essai_start', 'Démarrage Essai'),
        ('essai_complete', 'Finalisation Essai'),
        ('essai_send', 'Envoi Essai'),
        
        # Rapports
        ('rapport_create', 'Création Rapport'),
        ('rapport_update', 'Modification Rapport'),
        ('rapport_view', 'Consultation Rapport'),
        ('rapport_validate', 'Validation Rapport'),
        ('rapport_reject', 'Rejet Rapport'),
        ('rapport_send', 'Envoi Rapport'),
        
        # Workflow
        ('workflow_create', 'Création Workflow'),
        ('workflow_validate', 'Validation Workflow'),
        ('workflow_reject', 'Rejet Workflow'),
        ('workflow_advance', 'Avancement Workflow'),
        
        # Notifications
        ('notification_create', 'Création Notification'),
        ('notification_read', 'Lecture Notification'),
        
        # Autres
        ('api_call', 'Appel API'),
        ('export', 'Export de données'),
        ('import', 'Import de données'),
        ('other', 'Autre action'),
    ]
    
    HTTP_METHODS = [
        ('GET', 'GET'),
        ('POST', 'POST'),
        ('PUT', 'PUT'),
        ('PATCH', 'PATCH'),
        ('DELETE', 'DELETE'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Utilisateur
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='action_logs')
    username = models.CharField(max_length=150, blank=True, help_text="Nom d'utilisateur au moment de l'action")
    user_role = models.CharField(max_length=30, blank=True, help_text="Rôle de l'utilisateur")
    
    # Action
    action_type = models.CharField(max_length=50, choices=ACTION_TYPES)
    action_description = models.TextField(blank=True, help_text="Description détaillée de l'action")
    
    # Requête HTTP
    http_method = models.CharField(max_length=10, choices=HTTP_METHODS, blank=True)
    endpoint = models.CharField(max_length=500, blank=True, help_text="URL de l'endpoint appelé")
    ip_address = models.GenericIPAddressField(blank=True, null=True)
    user_agent = models.TextField(blank=True)
    
    # Données
    request_data = models.JSONField(blank=True, null=True, help_text="Données de la requête (POST/PUT/PATCH)")
    response_status = models.IntegerField(blank=True, null=True, help_text="Code de statut HTTP de la réponse")
    
    # Références aux objets modifiés
    echantillon_id = models.UUIDField(blank=True, null=True)
    echantillon_code = models.CharField(max_length=20, blank=True)
    essai_id = models.UUIDField(blank=True, null=True)
    essai_type = models.CharField(max_length=20, blank=True)
    client_id = models.UUIDField(blank=True, null=True)
    client_code = models.CharField(max_length=20, blank=True)
    rapport_id = models.UUIDField(blank=True, null=True)
    workflow_id = models.UUIDField(blank=True, null=True)
    
    # Métadonnées
    success = models.BooleanField(default=True, help_text="L'action a-t-elle réussi?")
    error_message = models.TextField(blank=True, help_text="Message d'erreur si échec")
    duration_ms = models.IntegerField(blank=True, null=True, help_text="Durée de l'action en millisecondes")
    
    # Timestamp
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    
    class Meta:
        db_table = 'action_logs'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'created_at']),
            models.Index(fields=['action_type', 'created_at']),
            models.Index(fields=['echantillon_id']),
            models.Index(fields=['essai_id']),
            models.Index(fields=['success', 'created_at']),
        ]
    
    def __str__(self):
        return f"{self.username} - {self.get_action_type_display()} - {self.created_at.strftime('%Y-%m-%d %H:%M:%S')}"
    
    @classmethod
    def log_action(cls, user, action_type, description='', **kwargs):
        """
        Méthode helper pour créer un log d'action
        
        Args:
            user: Instance User ou None
            action_type: Type d'action (doit être dans ACTION_TYPES)
            description: Description de l'action
            **kwargs: Champs additionnels (echantillon_id, essai_id, etc.)
        """
        log_data = {
            'action_type': action_type,
            'action_description': description,
        }
        
        if user and user.is_authenticated:
            log_data['user'] = user
            log_data['username'] = user.username
            log_data['user_role'] = user.role if hasattr(user, 'role') else ''
        
        log_data.update(kwargs)
        
        return cls.objects.create(**log_data)
