"""
Modèle pour le stockage des données (remplace localStorage)
"""

from django.db import models
from django.contrib.auth import get_user_model
import uuid

User = get_user_model()


class DataStorage(models.Model):
    """Stockage clé-valeur pour remplacer localStorage"""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='stored_data')
    key = models.CharField(max_length=255)
    value = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'data_storage'
        unique_together = ['user', 'key']
        indexes = [
            models.Index(fields=['user', 'key']),
        ]
    
    def __str__(self):
        return f"{self.user.username} - {self.key}"
