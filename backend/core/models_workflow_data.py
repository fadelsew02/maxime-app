from django.db import models
from django.conf import settings


class RapportValidation(models.Model):
    """Stocke les rapports en cours de validation (remplace localStorage sent_to_chef_*)"""
    ETAPE_CHOICES = [
        ('chef_projet', 'Chef de Projet'),
        ('chef_service', 'Chef de Service'),
        ('directeur_technique', 'Directeur Technique'),
        ('directeur_snertp', 'Directeur SNERTP'),
        ('marketing', 'Service Marketing'),
        ('client', 'Client'),
    ]
    
    STATUS_CHOICES = [
        ('pending', 'En attente'),
        ('accepted', 'Accepté'),
        ('rejected', 'Rejeté'),
    ]
    
    code_echantillon = models.CharField(max_length=100, db_index=True)
    client_name = models.CharField(max_length=255)
    essai_type = models.CharField(max_length=50, blank=True)
    
    # Étape actuelle
    etape_actuelle = models.CharField(max_length=50, choices=ETAPE_CHOICES, db_index=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending', db_index=True)
    
    # Fichier rapport
    file_name = models.CharField(max_length=255)
    file_data = models.TextField()  # Base64 ou URL
    original_file_name = models.CharField(max_length=255, blank=True)
    original_file_data = models.TextField(blank=True)
    
    # Dates
    date_envoi = models.DateTimeField(auto_now_add=True)
    date_validation = models.DateTimeField(null=True, blank=True)
    date_rejet = models.DateTimeField(null=True, blank=True)
    
    # Validations par étape
    validated_by_chef_projet = models.BooleanField(default=False)
    rejected_by_chef_projet = models.BooleanField(default=False)
    comment_chef_projet = models.TextField(blank=True)
    date_validation_chef_projet = models.DateTimeField(null=True, blank=True)
    
    validated_by_chef_service = models.BooleanField(default=False)
    rejected_by_chef_service = models.BooleanField(default=False)
    comment_chef_service = models.TextField(blank=True)
    date_validation_chef_service = models.DateTimeField(null=True, blank=True)
    
    validated_by_directeur_technique = models.BooleanField(default=False)
    rejected_by_directeur_technique = models.BooleanField(default=False)
    comment_directeur_technique = models.TextField(blank=True)
    date_validation_directeur_technique = models.DateTimeField(null=True, blank=True)
    
    validated_by_directeur_snertp = models.BooleanField(default=False)
    rejected_by_directeur_snertp = models.BooleanField(default=False)
    avis_directeur_snertp = models.TextField(blank=True)
    signature_directeur_snertp = models.TextField(blank=True)
    date_validation_directeur_snertp = models.DateTimeField(null=True, blank=True)
    
    # Marketing
    processed_by_marketing = models.BooleanField(default=False)
    date_envoi_client = models.DateTimeField(null=True, blank=True)
    email_client = models.EmailField(blank=True)
    
    # Métadonnées
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'rapport_validations'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['code_echantillon', 'etape_actuelle']),
            models.Index(fields=['status', 'etape_actuelle']),
        ]
    
    def __str__(self):
        return f"{self.code_echantillon} - {self.etape_actuelle} ({self.status})"


class EssaiData(models.Model):
    """Stocke les données d'essais temporaires (remplace localStorage pour essais)"""
    essai_id = models.CharField(max_length=100, unique=True, db_index=True)
    echantillon_code = models.CharField(max_length=100, db_index=True)
    essai_type = models.CharField(max_length=50)
    
    # Données de l'essai (JSON)
    data = models.JSONField(default=dict)
    
    # Statuts
    statut = models.CharField(max_length=50, default='attente')
    validation_status = models.CharField(max_length=50, blank=True)
    envoye = models.BooleanField(default=False)
    
    # Dates
    date_reception = models.DateField(null=True, blank=True)
    date_debut = models.DateField(null=True, blank=True)
    date_fin = models.DateField(null=True, blank=True)
    
    # Résultats
    resultats = models.JSONField(default=dict, blank=True)
    commentaires = models.TextField(blank=True)
    operateur = models.CharField(max_length=255, blank=True)
    
    # Métadonnées
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'essai_data'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['echantillon_code', 'essai_type']),
            models.Index(fields=['statut']),
        ]
    
    def __str__(self):
        return f"{self.essai_id} - {self.essai_type}"


class PlanificationData(models.Model):
    """Stocke les planifications d'essais (remplace localStorage plan_*)"""
    echantillon_code = models.CharField(max_length=100, db_index=True)
    essai_type = models.CharField(max_length=50)
    
    # Planification
    date_planifiee = models.DateField()
    operateur_assigne = models.CharField(max_length=255, blank=True)
    priorite = models.CharField(max_length=50, default='normale')
    
    # Statut
    statut = models.CharField(max_length=50, default='planifie')
    completed = models.BooleanField(default=False)
    
    # Métadonnées
    planifie_par = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'planification_data'
        ordering = ['date_planifiee']
        indexes = [
            models.Index(fields=['echantillon_code', 'statut']),
            models.Index(fields=['date_planifiee']),
        ]
    
    def __str__(self):
        return f"{self.echantillon_code} - {self.essai_type} ({self.date_planifiee})"
