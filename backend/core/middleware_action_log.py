"""
Middleware pour enregistrer automatiquement toutes les actions API
"""

import time
import json
from django.utils.deprecation import MiddlewareMixin
from django.urls import resolve
from .models_action_log import ActionLog


class ActionLogMiddleware(MiddlewareMixin):
    """Middleware pour logger automatiquement toutes les requêtes API"""
    
    # Endpoints à ignorer pour éviter trop de logs
    IGNORED_ENDPOINTS = [
        '/api/notifications/',
        '/api/action-logs/',  # Éviter la récursion
        '/admin/jsi18n/',
        '/static/',
        '/media/',
    ]
    
    # Mapping des endpoints vers les types d'actions
    ENDPOINT_ACTION_MAP = {
        'login': 'login',
        'logout': 'logout',
        'clients': 'client',
        'echantillons': 'echantillon',
        'essais': 'essai',
        'rapports': 'rapport',
        'workflow': 'workflow',
        'notifications': 'notification',
    }
    
    def process_request(self, request):
        """Enregistrer le début de la requête"""
        request._action_log_start_time = time.time()
        return None
    
    def process_response(self, request, response):
        """Enregistrer la fin de la requête et créer le log"""
        
        # Ignorer certains endpoints
        if any(ignored in request.path for ignored in self.IGNORED_ENDPOINTS):
            return response
        
        # Calculer la durée
        duration_ms = None
        if hasattr(request, '_action_log_start_time'):
            duration_ms = int((time.time() - request._action_log_start_time) * 1000)
        
        # Déterminer le type d'action
        action_type = self._determine_action_type(request, response)
        
        if action_type:
            # Extraire les données de la requête
            request_data = self._extract_request_data(request)
            
            # Créer le log
            try:
                log_data = {
                    'action_type': action_type,
                    'http_method': request.method,
                    'endpoint': request.path,
                    'ip_address': self._get_client_ip(request),
                    'user_agent': request.META.get('HTTP_USER_AGENT', '')[:500],
                    'request_data': request_data,
                    'response_status': response.status_code,
                    'success': 200 <= response.status_code < 400,
                    'duration_ms': duration_ms,
                }
                
                # Ajouter l'utilisateur si authentifié
                if hasattr(request, 'user') and request.user.is_authenticated:
                    log_data['user'] = request.user
                    log_data['username'] = request.user.username
                    log_data['user_role'] = getattr(request.user, 'role', '')
                
                # Extraire les IDs des objets depuis l'URL ou les données
                self._extract_object_ids(request, request_data, log_data)
                
                # Générer une description
                log_data['action_description'] = self._generate_description(request, log_data)
                
                ActionLog.objects.create(**log_data)
            except Exception as e:
                # Ne pas bloquer la requête si le logging échoue
                print(f"Erreur lors de la création du log d'action: {e}")
        
        return response
    
    def _determine_action_type(self, request, response):
        """Déterminer le type d'action basé sur l'endpoint et la méthode HTTP"""
        path = request.path.lower()
        method = request.method
        
        # Authentification
        if 'login' in path:
            return 'login'
        if 'logout' in path:
            return 'logout'
        
        # Trouver le type de ressource
        resource_type = None
        for key in self.ENDPOINT_ACTION_MAP:
            if key in path:
                resource_type = self.ENDPOINT_ACTION_MAP[key]
                break
        
        if not resource_type:
            return 'api_call'
        
        # Déterminer l'action selon la méthode HTTP
        if method == 'GET':
            return f'{resource_type}_view'
        elif method == 'POST':
            # Vérifier si c'est un envoi spécial
            if 'send' in path or 'envoyer' in path:
                return f'{resource_type}_send'
            elif 'validate' in path or 'valider' in path:
                return f'{resource_type}_validate'
            elif 'reject' in path or 'rejeter' in path:
                return f'{resource_type}_reject'
            return f'{resource_type}_create'
        elif method in ['PUT', 'PATCH']:
            return f'{resource_type}_update'
        elif method == 'DELETE':
            return f'{resource_type}_delete'
        
        return 'api_call'
    
    def _extract_request_data(self, request):
        """Extraire les données de la requête de manière sécurisée"""
        if request.method in ['POST', 'PUT', 'PATCH']:
            try:
                if request.content_type == 'application/json':
                    data = json.loads(request.body.decode('utf-8'))
                else:
                    data = dict(request.POST)
                
                # Masquer les mots de passe
                if isinstance(data, dict):
                    if 'password' in data:
                        data['password'] = '***MASKED***'
                    if 'password1' in data:
                        data['password1'] = '***MASKED***'
                    if 'password2' in data:
                        data['password2'] = '***MASKED***'
                
                return data
            except:
                return None
        return None
    
    def _get_client_ip(self, request):
        """Obtenir l'adresse IP du client"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip
    
    def _extract_object_ids(self, request, request_data, log_data):
        """Extraire les IDs des objets depuis l'URL ou les données"""
        path_parts = request.path.split('/')
        
        # Essayer d'extraire depuis l'URL
        try:
            if 'echantillons' in request.path and len(path_parts) > 3:
                echantillon_id = path_parts[3]
                if echantillon_id and echantillon_id != '':
                    log_data['echantillon_id'] = echantillon_id
            
            if 'essais' in request.path and len(path_parts) > 3:
                essai_id = path_parts[3]
                if essai_id and essai_id != '':
                    log_data['essai_id'] = essai_id
            
            if 'clients' in request.path and len(path_parts) > 3:
                client_id = path_parts[3]
                if client_id and client_id != '':
                    log_data['client_id'] = client_id
        except:
            pass
        
        # Essayer d'extraire depuis les données de la requête
        if request_data and isinstance(request_data, dict):
            if 'echantillon' in request_data:
                log_data['echantillon_id'] = request_data['echantillon']
            if 'echantillon_code' in request_data:
                log_data['echantillon_code'] = request_data['echantillon_code']
            if 'essai' in request_data:
                log_data['essai_id'] = request_data['essai']
            if 'type' in request_data and 'essai' in request.path:
                log_data['essai_type'] = request_data['type']
            if 'client' in request_data:
                log_data['client_id'] = request_data['client']
    
    def _generate_description(self, request, log_data):
        """Générer une description lisible de l'action"""
        method = request.method
        path = request.path
        user = log_data.get('username', 'Anonyme')
        
        descriptions = {
            'GET': f"Consultation de {path}",
            'POST': f"Création/Action sur {path}",
            'PUT': f"Modification complète de {path}",
            'PATCH': f"Modification partielle de {path}",
            'DELETE': f"Suppression de {path}",
        }
        
        return descriptions.get(method, f"Action {method} sur {path}")
