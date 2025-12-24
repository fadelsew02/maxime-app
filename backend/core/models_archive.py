"""
Modèle pour l'archivage des rapports transmis au chef service
"""

from django.db import models
from django.contrib.auth import get_user_model
import uuid

User = get_user_model()


class RapportArchive(models.Model):
    """Archive des rapports transmis au chef service"""
    
    ETAPE_CHOICES = [
        ('chef_service', 'Chef Service'),
        ('directeur_technique', 'Directeur Technique'),
        ('directeur_snertp', 'Directeur SNERTP'),
        ('marketing', 'Service Marketing'),
        ('client', 'Client'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    code_echantillon = models.CharField(max_length=20)
    client_name = models.CharField(max_length=200)
    file_name = models.CharField(max_length=255)
    file_data = models.TextField(help_text="Fichier en base64")
    
    # Qui a envoyé
    envoye_par = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='rapports_archives_envoyes')
    
    # À quelle étape
    etape_envoi = models.CharField(max_length=30, choices=ETAPE_CHOICES)
    date_envoi = models.DateTimeField(auto_now_add=True)
    
    # Commentaires
    commentaires = models.TextField(blank=True)
    
    # Métadonnées
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'rapports_archives'
        ordering = ['-date_envoi']
        indexes = [
            models.Index(fields=['code_echantillon']),
            models.Index(fields=['envoye_par', 'etape_envoi']),
        ]
    
    def __str__(self):
        return f"Archive {self.code_echantillon} - {self.etape_envoi}"
