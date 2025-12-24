"""
Modèle pour les tâches programmées (envoi automatique)
"""

from django.db import models
from django.utils import timezone
import uuid


class TacheProgrammee(models.Model):
    """Tâche programmée pour envoi automatique"""
    
    TYPE_CHOICES = [
        ('envoi_essai', 'Envoi Essai'),
        ('envoi_traitement', 'Envoi Traitement'),
        ('envoi_validation', 'Envoi Validation'),
    ]
    
    STATUT_CHOICES = [
        ('en_attente', 'En attente'),
        ('executee', 'Exécutée'),
        ('annulee', 'Annulée'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    type_tache = models.CharField(max_length=20, choices=TYPE_CHOICES)
    date_execution = models.DateTimeField(help_text="Date et heure d'exécution automatique")
    statut = models.CharField(max_length=15, choices=STATUT_CHOICES, default='en_attente')
    
    # Références
    echantillon_id = models.UUIDField(blank=True, null=True)
    essai_id = models.UUIDField(blank=True, null=True)
    
    # Métadonnées
    created_at = models.DateTimeField(auto_now_add=True)
    executed_at = models.DateTimeField(blank=True, null=True)
    created_by_id = models.UUIDField(blank=True, null=True)
    
    class Meta:
        db_table = 'taches_programmees'
        ordering = ['date_execution']
        indexes = [
            models.Index(fields=['statut', 'date_execution']),
        ]
    
    def __str__(self):
        return f"{self.get_type_tache_display()} - {self.date_execution}"
