"""
Models pour le module de planification
"""

from django.db import models
from core.models import Echantillon, Essai
import uuid


class Ressource(models.Model):
    """Ressources disponibles pour les essais"""
    
    TYPE_CHOICES = [
        ('equipement', 'Équipement'),
        ('personnel', 'Personnel'),
        ('salle', 'Salle'),
    ]
    
    SECTION_CHOICES = [
        ('route', 'Section Route'),
        ('mecanique', 'Section Mécanique'),
        ('general', 'Général'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    nom = models.CharField(max_length=200)
    type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    section = models.CharField(max_length=15, choices=SECTION_CHOICES)
    capacite = models.PositiveIntegerField(default=1, help_text="Nombre d'essais simultanés")
    disponible = models.BooleanField(default=True)
    
    # Maintenance
    date_maintenance_debut = models.DateField(blank=True, null=True)
    date_maintenance_fin = models.DateField(blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'ressources'
        ordering = ['section', 'nom']
    
    def __str__(self):
        return f"{self.nom} ({self.get_section_display()})"


class ContrainteTemporelle(models.Model):
    """Contraintes temporelles pour l'ordonnancement"""
    
    TYPE_CHOICES = [
        ('jour_ferme', 'Jour Fermé'),
        ('plage_indisponible', 'Plage Indisponible'),
        ('priorite_haute', 'Priorité Haute'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    type = models.CharField(max_length=30, choices=TYPE_CHOICES)
    date_debut = models.DateField()
    date_fin = models.DateField()
    section = models.CharField(max_length=15, blank=True, help_text="Section concernée")
    description = models.TextField(blank=True)
    active = models.BooleanField(default=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'contraintes_temporelles'
        ordering = ['-date_debut']
    
    def __str__(self):
        return f"{self.get_type_display()} - {self.date_debut} à {self.date_fin}"


class Planning(models.Model):
    """Planning généré par l'algorithme d'optimisation"""
    
    STATUT_CHOICES = [
        ('draft', 'Brouillon'),
        ('active', 'Actif'),
        ('archived', 'Archivé'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    nom = models.CharField(max_length=200)
    date_debut = models.DateField()
    date_fin = models.DateField()
    statut = models.CharField(max_length=15, choices=STATUT_CHOICES, default='draft')
    
    # Métadonnées sur l'optimisation
    score_optimisation = models.FloatField(blank=True, null=True, help_text="Score de qualité du planning")
    temps_calcul = models.FloatField(blank=True, null=True, help_text="Temps de calcul en secondes")
    nombre_essais_planifies = models.PositiveIntegerField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'plannings'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.nom} ({self.date_debut} - {self.date_fin})"


class AffectationEssai(models.Model):
    """Affectation d'un essai dans un planning"""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    planning = models.ForeignKey(Planning, on_delete=models.CASCADE, related_name='affectations')
    essai = models.ForeignKey(Essai, on_delete=models.CASCADE, related_name='affectations')
    
    # Dates planifiées
    date_debut_planifiee = models.DateField()
    date_fin_planifiee = models.DateField()
    
    # Ressources affectées
    ressources = models.ManyToManyField(Ressource, related_name='affectations')
    
    # Priorité calculée
    priorite_calculee = models.PositiveIntegerField(default=0, help_text="Priorité après optimisation")
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'affectations_essais'
        ordering = ['date_debut_planifiee']
        unique_together = [['planning', 'essai']]
    
    def __str__(self):
        return f"{self.essai} - {self.date_debut_planifiee}"
