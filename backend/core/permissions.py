"""
Permissions personnalisées basées sur les rôles
"""

from rest_framework import permissions


class IsReceptionniste(permissions.BasePermission):
    """Permission pour les réceptionnistes"""
    
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'receptionniste'


class IsResponsableMateriaux(permissions.BasePermission):
    """Permission pour les responsables matériaux"""
    
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'responsable_materiaux'


class IsOperateur(permissions.BasePermission):
    """Permission pour les opérateurs (route ou mécanique)"""
    
    def has_permission(self, request, view):
        return (request.user.is_authenticated and 
                request.user.role in ['operateur_route', 'operateur_mecanique'])


class IsResponsableTraitement(permissions.BasePermission):
    """Permission pour le responsable traitement"""
    
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'responsable_traitement'


class IsValidateur(permissions.BasePermission):
    """Permission pour les validateurs (hiérarchie)"""
    
    def has_permission(self, request, view):
        return (request.user.is_authenticated and 
                request.user.role in ['chef_projet', 'chef_service', 
                                      'directeur_technique', 'directeur_general'])


class IsAdmin(permissions.BasePermission):
    """Permission pour les administrateurs"""
    
    def has_permission(self, request, view):
        return (request.user.is_authenticated and 
                request.user.role in ['chef_service', 'directeur_technique'])


class CanManageClients(permissions.BasePermission):
    """Permission pour gérer les clients"""
    
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        
        # Lecture autorisée pour tous
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Création/modification uniquement pour les réceptionnistes
        return request.user.role == 'receptionniste'


class CanManageEchantillons(permissions.BasePermission):
    """Permission pour gérer les échantillons"""
    
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        
        # Lecture autorisée pour tous
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Création uniquement pour les réceptionnistes
        if request.method == 'POST':
            return request.user.role == 'receptionniste'
        
        # Modification selon le statut et le rôle
        return True  # Géré au niveau de l'objet
    
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Les réceptionnistes peuvent modifier en phase de stockage et envoyer au traitement
        if request.user.role == 'receptionniste' and obj.statut in ['attente', 'stockage', 'decodification', 'traitement']:
            return True
        
        # Les responsables matériaux peuvent modifier en stockage
        if request.user.role == 'responsable_materiaux' and obj.statut == 'stockage':
            return True
        
        # Les opérateurs peuvent changer le statut à decodification (y compris pour les essais rejetés)
        if request.user.role in ['operateur_route', 'operateur_mecanique'] and obj.statut in ['stockage', 'essais', 'attente', 'decodification']:
            return True
        
        # Le responsable traitement peut modifier les échantillons en décodification
        if request.user.role == 'responsable_traitement' and obj.statut in ['decodification', 'traitement']:
            return True
        
        return False


class CanManageEssais(permissions.BasePermission):
    """Permission pour gérer les essais"""
    
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        
        # Lecture autorisée pour tous
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Les opérateurs, responsables et réceptionnistes peuvent créer et modifier les essais
        return request.user.role in ['operateur_route', 'operateur_mecanique', 
                                     'responsable_materiaux', 'receptionniste']
    
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Les opérateurs peuvent modifier leurs essais
        if request.user.role == 'operateur_route' and obj.section == 'route':
            return True
        
        if request.user.role == 'operateur_mecanique' and obj.section == 'mecanique':
            return True
        
        # Les responsables matériaux et réceptionnistes peuvent modifier pour la planification
        if request.user.role in ['responsable_materiaux', 'receptionniste']:
            return True
        
        return False
