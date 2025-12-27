from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone
from datetime import date
import uuid


def get_today():
    """Retourne la date d'aujourd'hui"""
    return timezone.now().date()


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
        ('directeur_snertp', 'Directeur SNERTP'),
        ('service_marketing', 'Service Marketing'),
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
    nom = models.CharField(max_length=200, help_text="Nom de l'entreprise")
    projet = models.CharField(max_length=300, help_text="Nom du projet")
    contact = models.CharField(max_length=200, help_text="Personne ayant apporté les échantillons")
    telephone = models.CharField(max_length=20, help_text="Téléphone")
    email = models.EmailField(help_text="Adresse e-mail de l'entreprise ou de la personne")
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
        ('Sol', 'Sol'),
        ('Gravier', 'Gravier'),
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
    qr_code = models.CharField(max_length=200, unique=True, editable=False)
    photo = models.ImageField(upload_to='echantillons/', blank=True, null=True)
    date_reception = models.DateField(default=get_today)
    date_envoi_essais = models.DateField(blank=True, null=True, help_text="Date d'envoi aux sections pour essais")
    date_fin_estimee = models.DateField(blank=True, null=True)
    statut = models.CharField(max_length=20, choices=STATUT_CHOICES, default='stockage')
    priorite = models.CharField(max_length=10, choices=PRIORITE_CHOICES, default='normale')
    chef_projet = models.CharField(max_length=200, blank=True)
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
    numero_sondage = models.CharField(max_length=50, blank=True, help_text="Numéro de sondage (obligatoire si caroté)")
    date_envoi_ag = models.DateField(blank=True, null=True)
    date_envoi_proctor = models.DateField(blank=True, null=True)
    date_envoi_cbr = models.DateField(blank=True, null=True)
    date_envoi_oedometre = models.DateField(blank=True, null=True)
    date_envoi_cisaillement = models.DateField(blank=True, null=True)
    essais_types = models.JSONField(default=list, blank=True)
    date_retour_predite = models.DateField(blank=True, null=True)
    date_envoi_traitement = models.DateField(blank=True, null=True, help_text="Date d'envoi au traitement")
    date_envoi_chef_projet = models.DateField(blank=True, null=True, help_text="Date d'envoi au chef de projet")
    date_envoi_chef_service = models.DateField(blank=True, null=True, help_text="Date d'envoi au chef de service")
    date_envoi_directeur_technique = models.DateField(blank=True, null=True, help_text="Date d'envoi au directeur technique")
    
    # Informations client dénormalisées pour performance
    client_nom = models.CharField(max_length=200, blank=True)
    client_code = models.CharField(max_length=20, blank=True)
    
    def save(self, *args, **kwargs):
        if not self.code:
            prefix = self.nature[0].upper() if self.nature else 'S'
            year = timezone.now().year % 100
        
            last_echantillon = Echantillon.objects.filter(
                code__startswith=f'{prefix}-',
                code__endswith=f'/{year}'
            ).order_by('-created_at').first()
            
            if last_echantillon and last_echantillon.code:
                last_num = int(last_echantillon.code.split('-')[1].split('/')[0])
                self.code = f"{prefix}-{str(last_num + 1).zfill(4)}/{year}"
            else:
                self.code = f"{prefix}-0001/{year}"
            
            # Générer le QR code avec URL complète
            # L'URL pointe vers la page de détails de l'échantillon
            code_for_url = self.code.replace('/', '-')
            # En production, remplacer par votre domaine réel
            base_url = "http://localhost:3002" 
            self.qr_code = f"{base_url}/echantillon/{code_for_url}"
            if not self.date_envoi_essais:
                self.date_envoi_essais = self.date_reception
        
        # Synchroniser les informations client
        if self.client:
            self.client_nom = self.client.nom
            self.client_code = self.client.code
        
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
    priorite = models.CharField(max_length=10, choices=[('normale', 'Normale'), ('urgente', 'Urgente')], default='normale')
    
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


class Rapport(models.Model):
    """Rapport de laboratoire"""
    
    STATUT_CHOICES = [
        ('en_cours', 'En cours'),
        ('chef_service', 'Chez Chef Service'),
        ('directeur_technique', 'Chez Directeur Technique'),
        ('directeur_snertp', 'Chez Directeur SNERTP'),
        ('envoye_client', 'Envoyé au client'),
        ('rejete', 'Rejeté'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    echantillon = models.OneToOneField(Echantillon, on_delete=models.CASCADE, related_name='rapport')
    contenu = models.TextField()
    signature_directeur = models.TextField(blank=True, help_text="Signature numérique base64")
    observations_chef_service = models.TextField(blank=True)
    observations_directeur_technique = models.TextField(blank=True)
    observations_directeur_snertp = models.TextField(blank=True)
    fichier_traitement = models.FileField(upload_to='rapports/traitement/', blank=True, null=True)
    statut = models.CharField(max_length=20, choices=STATUT_CHOICES, default='en_cours')
    date_envoi_chef_service = models.DateTimeField(blank=True, null=True)
    date_validation_chef_service = models.DateTimeField(blank=True, null=True)
    date_envoi_directeur_technique = models.DateTimeField(blank=True, null=True)
    date_validation_directeur_technique = models.DateTimeField(blank=True, null=True)
    date_envoi_directeur_snertp = models.DateTimeField(blank=True, null=True)
    date_envoi_client = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    
    class Meta:
        db_table = 'rapports'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Rapport {self.echantillon.code}"


class PlanificationEssai(models.Model):
    """Planification des essais avec contraintes de capacité"""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    essai = models.OneToOneField(Essai, on_delete=models.CASCADE, related_name='planification')
    date_planifiee = models.DateField()
    date_fin_planifiee = models.DateField()
    capacite_utilisee = models.PositiveIntegerField(default=1)
    contraintes_respectees = models.BooleanField(default=True)
    notes_planification = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'planifications_essais'
        ordering = ['date_planifiee']
    
    def __str__(self):
        return f"Planification {self.essai.type} - {self.essai.echantillon.code}"


class CapaciteLaboratoire(models.Model):
    """Capacités quotidiennes du laboratoire par type d'essai"""
    
    TYPE_ESSAI_CHOICES = [
        ('AG', 'Analyse Granulométrique'),
        ('Proctor', 'Proctor'),
        ('CBR', 'CBR'),
        ('Oedometre', 'Œdomètre'),
        ('Cisaillement', 'Cisaillement'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    type_essai = models.CharField(max_length=20, choices=TYPE_ESSAI_CHOICES, unique=True)
    capacite_quotidienne = models.PositiveIntegerField()
    capacite_simultanee = models.PositiveIntegerField(blank=True, null=True)
    duree_standard_jours = models.PositiveIntegerField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'capacites_laboratoire'
    
    def __str__(self):
        return f"{self.get_type_essai_display()} - {self.capacite_quotidienne}/jour"


class RapportMarketing(models.Model):
    """Rapports envoyés au service marketing"""
    
    STATUT_CHOICES = [
        ('en_attente', 'En attente'),
        ('envoye', 'Envoyé au client'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    echantillon = models.ForeignKey(Echantillon, on_delete=models.CASCADE, related_name='rapports_marketing')
    code_echantillon = models.CharField(max_length=20)
    client_name = models.CharField(max_length=200)
    file_name = models.CharField(max_length=255)
    file_data = models.TextField(help_text="Fichier PDF en base64")
    signed_report_data = models.TextField(blank=True, help_text="Rapport HTML signé en base64")
    avis_directeur_snertp = models.TextField(blank=True)
    signature_directeur_snertp = models.TextField(blank=True, help_text="Signature en base64")
    statut = models.CharField(max_length=20, choices=STATUT_CHOICES, default='en_attente')
    email_client = models.EmailField(blank=True)
    date_envoi_marketing = models.DateTimeField(auto_now_add=True)
    date_envoi_client = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'rapports_marketing'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Rapport Marketing {self.code_echantillon} - {self.client_name}"


class WorkflowValidation(models.Model):
    """Workflow de validation des rapports"""
    
    ETAPE_CHOICES = [
        ('chef_projet', 'Chef de Projet'),
        ('chef_service', 'Chef de Service'),
        ('directeur_technique', 'Directeur Technique'),
        ('directeur_snertp', 'Directeur SNERTP'),
        ('marketing', 'Service Marketing'),
        ('client', 'Client'),
    ]
    
    STATUT_CHOICES = [
        ('en_attente', 'En attente'),
        ('accepte', 'Accepté'),
        ('rejete', 'Rejeté'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    echantillon = models.ForeignKey(Echantillon, on_delete=models.CASCADE, related_name='workflow_validations')
    code_echantillon = models.CharField(max_length=20)
    client_name = models.CharField(max_length=200)
    
    # Fichiers
    file_name = models.CharField(max_length=255)
    file_data = models.TextField(help_text="Fichier en base64")
    
    # Étape actuelle
    etape_actuelle = models.CharField(max_length=30, choices=ETAPE_CHOICES)
    statut = models.CharField(max_length=20, choices=STATUT_CHOICES, default='en_attente')
    
    # Responsable Traitement
    observations_traitement = models.TextField(blank=True)
    
    # Chef Projet
    date_envoi_chef_projet = models.DateTimeField(blank=True, null=True)
    date_validation_chef_projet = models.DateTimeField(blank=True, null=True)
    comment_chef_projet = models.TextField(blank=True)
    validated_by_chef_projet = models.BooleanField(default=False)
    
    # Chef Service
    date_envoi_chef_service = models.DateTimeField(blank=True, null=True)
    date_validation_chef_service = models.DateTimeField(blank=True, null=True)
    comment_chef_service = models.TextField(blank=True)
    validated_by_chef_service = models.BooleanField(default=False)
    
    # Directeur Technique
    date_envoi_directeur_technique = models.DateTimeField(blank=True, null=True)
    date_validation_directeur_technique = models.DateTimeField(blank=True, null=True)
    comment_directeur_technique = models.TextField(blank=True)
    validated_by_directeur_technique = models.BooleanField(default=False)
    
    # Directeur SNERTP
    date_envoi_directeur_snertp = models.DateTimeField(blank=True, null=True)
    date_validation_directeur_snertp = models.DateTimeField(blank=True, null=True)
    observations_directeur_snertp = models.TextField(blank=True)
    signature_directeur_snertp = models.TextField(blank=True)
    avise_by_directeur_snertp = models.BooleanField(default=False)
    
    # Marketing
    date_envoi_marketing = models.DateTimeField(blank=True, null=True)
    processed_by_marketing = models.BooleanField(default=False)
    date_envoi_client = models.DateTimeField(blank=True, null=True)
    email_client = models.EmailField(blank=True)
    
    # Rejet
    date_rejet = models.DateTimeField(blank=True, null=True)
    raison_rejet = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='workflows_created')
    
    class Meta:
        db_table = 'workflow_validations'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['etape_actuelle', 'statut']),
            models.Index(fields=['code_echantillon']),
        ]
    
    def __str__(self):
        return f"Workflow {self.code_echantillon} - {self.get_etape_actuelle_display()}"


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
