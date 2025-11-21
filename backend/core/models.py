"""
Models pour le système de gestion du laboratoire SNERTP
"""

from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone
import uuid


class User(AbstractUser):
    """Utilisateur du système avec rôle"""
    
    ROLE_CHOICES = [
        ('receptionniste', 'Réceptionniste'),
        ('responsable_materiaux', 'Responsable Matériaux'),
        ('operateur_route', 'Opérateur Route'),
        ('operateur_mecanique', 'Opérateur Mécanique'),
        ('responsable_traitement', 'Responsable Traitement'),
        ('chef_projet', 'Chef de Projet'),
        ('chef_service', 'Chef Service Génie Civil'),
        ('directeur_technique', 'Directeur Technique'),
        ('directeur_general', 'Directeur Général'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    role = models.CharField(max_length=30, choices=ROLE_CHOICES)
    phone = models.CharField(max_length=20, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'users'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.get_full_name()} ({self.get_role_display()})"


class Client(models.Model):
    """Client du laboratoire"""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    code = models.CharField(max_length=20, unique=True, editable=False)
    nom = models.CharField(max_length=200)
    contact = models.CharField(max_length=200)
    projet = models.CharField(max_length=300)
    email = models.EmailField(blank=True)
    telephone = models.CharField(max_length=20, blank=True)
    photo = models.ImageField(upload_to='clients/', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='clients_created')
    
    class Meta:
        db_table = 'clients'
        ordering = ['-created_at']
    
    def save(self, *args, **kwargs):
        if not self.code:
            # Générer le code client (CLI-XXX)
            last_client = Client.objects.order_by('-created_at').first()
            if last_client and last_client.code:
                last_num = int(last_client.code.split('-')[1])
                self.code = f"CLI-{str(last_num + 1).zfill(3)}"
            else:
                self.code = "CLI-001"
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.code} - {self.nom}"


class Echantillon(models.Model):
    """Échantillon reçu au laboratoire"""
    
    NATURE_CHOICES = [
        ('Sol argileux', 'Sol argileux'),
        ('Sol sableux', 'Sol sableux'),
        ('Sol limoneux', 'Sol limoneux'),
        ('Gravier', 'Gravier'),
        ('Roche', 'Roche'),
        ('Latérite', 'Latérite'),
        ('Tout-venant', 'Tout-venant'),
    ]
    
    SONDAGE_CHOICES = [
        ('carotte', 'Carotté'),
        ('vrac', 'Vrac'),
    ]
    
    STATUT_CHOICES = [
        ('attente', 'En attente'),
        ('stockage', 'En stockage'),
        ('essais', 'En essais'),
        ('decodification', 'Décodification'),
        ('traitement', 'Traitement'),
        ('validation', 'Validation'),
        ('valide', 'Validé'),
        ('rejete', 'Rejeté'),
    ]
    
    PRIORITE_CHOICES = [
        ('normale', 'Normale'),
        ('urgente', 'Urgente'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    code = models.CharField(max_length=20, unique=True, editable=False)
    client = models.ForeignKey(Client, on_delete=models.CASCADE, related_name='echantillons')
    nature = models.CharField(max_length=100, choices=NATURE_CHOICES)
    profondeur_debut = models.DecimalField(max_digits=6, decimal_places=2, validators=[MinValueValidator(0)])
    profondeur_fin = models.DecimalField(max_digits=6, decimal_places=2, validators=[MinValueValidator(0)])
    sondage = models.CharField(max_length=10, choices=SONDAGE_CHOICES)
    nappe = models.CharField(max_length=100, blank=True, help_text="Niveau de la nappe phréatique")
    qr_code = models.CharField(max_length=50, unique=True, editable=False)
    photo = models.ImageField(upload_to='echantillons/', blank=True, null=True)
    
    # Dates
    date_reception = models.DateField(default=timezone.now)
    date_fin_estimee = models.DateField(blank=True, null=True)
    
    # Gestion
    statut = models.CharField(max_length=20, choices=STATUT_CHOICES, default='stockage')
    priorite = models.CharField(max_length=10, choices=PRIORITE_CHOICES, default='normale')
    chef_projet = models.CharField(max_length=200, blank=True)
    
    # Métadonnées
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='echantillons_created')
    
    class Meta:
        db_table = 'echantillons'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['statut', 'priorite']),
            models.Index(fields=['date_reception']),
        ]
    
    def save(self, *args, **kwargs):
        if not self.code:
            # Générer le code échantillon (S-XXXX/YY)
            year = timezone.now().year % 100
            last_echantillon = Echantillon.objects.filter(
                code__endswith=f'/{year}'
            ).order_by('-created_at').first()
            
            if last_echantillon and last_echantillon.code:
                last_num = int(last_echantillon.code.split('-')[1].split('/')[0])
                self.code = f"S-{str(last_num + 1).zfill(4)}/{year}"
            else:
                self.code = f"S-0001/{year}"
            
            # Générer le QR code
            self.qr_code = f"QR-{self.code.replace('/', '-')}"
        
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.code} - {self.nature}"


class Essai(models.Model):
    """Essai de laboratoire"""
    
    TYPE_CHOICES = [
        ('AG', 'Analyse Granulométrique (AG)'),
        ('Proctor', 'Proctor'),
        ('CBR', 'CBR'),
        ('Oedometre', 'Œdomètre'),
        ('Cisaillement', 'Cisaillement'),
    ]
    
    SECTION_CHOICES = [
        ('route', 'Section Route'),
        ('mecanique', 'Section Mécanique des Sols'),
    ]
    
    STATUT_CHOICES = [
        ('attente', 'En attente'),
        ('en_cours', 'En cours'),
        ('termine', 'Terminé'),
    ]
    
    STATUT_VALIDATION_CHOICES = [
        ('pending', 'En attente'),
        ('accepted', 'Accepté'),
        ('rejected', 'Rejeté'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    echantillon = models.ForeignKey(Echantillon, on_delete=models.CASCADE, related_name='essais')
    type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    section = models.CharField(max_length=15, choices=SECTION_CHOICES)
    
    # Dates
    date_reception = models.DateField(blank=True, null=True)
    date_debut = models.DateField(blank=True, null=True)
    date_fin = models.DateField(blank=True, null=True)
    date_rejet = models.DateField(blank=True, null=True)
    duree_estimee = models.PositiveIntegerField(help_text="Durée en jours")
    
    # Personnel
    operateur = models.CharField(max_length=200, blank=True)
    
    # Statut
    statut = models.CharField(max_length=15, choices=STATUT_CHOICES, default='attente')
    statut_validation = models.CharField(max_length=15, choices=STATUT_VALIDATION_CHOICES, default='pending')
    
    # Résultats (stockés en JSON)
    resultats = models.JSONField(blank=True, null=True)
    
    # Commentaires
    commentaires = models.TextField(blank=True)
    commentaires_validation = models.TextField(blank=True)
    
    # Fichiers
    fichier = models.FileField(upload_to='essais/', blank=True, null=True)
    
    # Flags
    was_resumed = models.BooleanField(default=False, help_text="Essai repris après rejet")
    
    # Métadonnées
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'essais'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['statut', 'section']),
            models.Index(fields=['date_debut']),
        ]
    
    def __str__(self):
        return f"{self.get_type_display()} - {self.echantillon.code}"


class Notification(models.Model):
    """Notifications pour les utilisateurs"""
    
    TYPE_CHOICES = [
        ('info', 'Information'),
        ('success', 'Succès'),
        ('warning', 'Avertissement'),
        ('error', 'Erreur'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    type = models.CharField(max_length=10, choices=TYPE_CHOICES)
    title = models.CharField(max_length=200)
    message = models.TextField()
    module = models.CharField(max_length=100, blank=True)
    action_required = models.BooleanField(default=False)
    read = models.BooleanField(default=False)
    
    # Références optionnelles
    echantillon = models.ForeignKey(Echantillon, on_delete=models.CASCADE, blank=True, null=True)
    essai = models.ForeignKey(Essai, on_delete=models.CASCADE, blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    read_at = models.DateTimeField(blank=True, null=True)
    
    class Meta:
        db_table = 'notifications'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'read']),
        ]
    
    def __str__(self):
        return f"{self.title} - {self.user.username}"
    
    def mark_as_read(self):
        """Marquer la notification comme lue"""
        if not self.read:
            self.read = True
            self.read_at = timezone.now()
            self.save()


class ValidationHistory(models.Model):
    """Historique des validations hiérarchiques"""
    
    ACTION_CHOICES = [
        ('valide', 'Validé'),
        ('rejete', 'Rejeté'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    echantillon = models.ForeignKey(Echantillon, on_delete=models.CASCADE, related_name='validations')
    validateur = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    action = models.CharField(max_length=10, choices=ACTION_CHOICES)
    observations = models.TextField(blank=True)
    niveau = models.CharField(max_length=30)  # Niveau hiérarchique
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'validation_history'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.echantillon.code} - {self.get_action_display()} par {self.validateur}"
