# 📊 Système d'Enregistrement des Actions (Action Logging)

## 📋 Vue d'ensemble

Le système d'enregistrement des actions capture automatiquement **TOUTES** les actions effectuées dans le backend du laboratoire SNERTP. Chaque requête API, modification de données, et action utilisateur est enregistrée avec des détails complets.

---

## 🎯 Fonctionnalités

### ✅ Enregistrement Automatique
- **Middleware automatique** : Capture toutes les requêtes HTTP sans code supplémentaire
- **Aucune modification nécessaire** : Les vues existantes continuent de fonctionner normalement
- **Performance optimisée** : Enregistrement asynchrone pour ne pas ralentir les requêtes

### 📝 Informations Capturées

Pour chaque action, le système enregistre :

#### 👤 Utilisateur
- ID et nom d'utilisateur
- Rôle (réceptionniste, opérateur, chef de projet, etc.)
- Adresse IP
- User Agent (navigateur/appareil)

#### 🔧 Action
- Type d'action (création, modification, suppression, consultation)
- Description détaillée
- Méthode HTTP (GET, POST, PUT, PATCH, DELETE)
- Endpoint appelé

#### 📦 Données
- Données de la requête (POST/PUT/PATCH)
- Code de statut de la réponse
- Succès ou échec
- Message d'erreur si échec
- Durée de l'action en millisecondes

#### 🔗 Références
- ID et code de l'échantillon (si applicable)
- ID et type de l'essai (si applicable)
- ID et code du client (si applicable)
- ID du rapport (si applicable)
- ID du workflow (si applicable)

---

## 🚀 Utilisation

### 1️⃣ Consultation via API

#### Obtenir tous les logs
```bash
GET /api/action-logs/
```

#### Filtrer par utilisateur
```bash
GET /api/action-logs/?user_id=<uuid>
GET /api/action-logs/?username=operateur_meca
```

#### Filtrer par type d'action
```bash
GET /api/action-logs/?action_type=echantillon_create
GET /api/action-logs/?action_type=essai_update
```

#### Filtrer par période
```bash
GET /api/action-logs/?period=today
GET /api/action-logs/?period=week
GET /api/action-logs/?period=month
GET /api/action-logs/?date_from=2025-01-01&date_to=2025-01-31
```

#### Filtrer par échantillon
```bash
GET /api/action-logs/?echantillon_id=<uuid>
GET /api/action-logs/?echantillon_code=S-0001/25
```

#### Filtrer par succès/échec
```bash
GET /api/action-logs/?success=true
GET /api/action-logs/?success=false
```

### 2️⃣ Endpoints Spéciaux

#### Statistiques globales
```bash
GET /api/action-logs/stats/
```

Retourne :
- Total d'actions
- Actions par type
- Actions par utilisateur (top 10)
- Actions par jour (7 derniers jours)
- Taux de succès
- Durée moyenne des actions

#### Actions récentes (24h)
```bash
GET /api/action-logs/recent/
```

#### Actions d'un utilisateur
```bash
GET /api/action-logs/by_user/?user_id=<uuid>
```

#### Actions liées à un échantillon
```bash
GET /api/action-logs/by_echantillon/?echantillon_id=<uuid>
```

#### Actions en erreur
```bash
GET /api/action-logs/errors/
```

### 3️⃣ Consultation via Admin Django

1. Accéder à l'interface admin : http://127.0.0.1:8000/admin/
2. Se connecter avec le compte admin
3. Cliquer sur "Action logs" dans la section "Core"
4. Utiliser les filtres pour rechercher des actions spécifiques

---

## 📊 Types d'Actions Enregistrées

### 🔐 Authentification
- `login` : Connexion
- `logout` : Déconnexion

### 👥 Clients
- `client_create` : Création d'un client
- `client_update` : Modification d'un client
- `client_delete` : Suppression d'un client
- `client_view` : Consultation d'un client

### 🧪 Échantillons
- `echantillon_create` : Création d'un échantillon
- `echantillon_update` : Modification d'un échantillon
- `echantillon_delete` : Suppression d'un échantillon
- `echantillon_view` : Consultation d'un échantillon
- `echantillon_send_essai` : Envoi aux essais
- `echantillon_send_traitement` : Envoi au traitement

### 🔬 Essais
- `essai_create` : Création d'un essai
- `essai_update` : Modification d'un essai
- `essai_delete` : Suppression d'un essai
- `essai_view` : Consultation d'un essai
- `essai_start` : Démarrage d'un essai
- `essai_complete` : Finalisation d'un essai
- `essai_send` : Envoi d'un essai

### 📄 Rapports
- `rapport_create` : Création d'un rapport
- `rapport_update` : Modification d'un rapport
- `rapport_view` : Consultation d'un rapport
- `rapport_validate` : Validation d'un rapport
- `rapport_reject` : Rejet d'un rapport
- `rapport_send` : Envoi d'un rapport

### 🔄 Workflow
- `workflow_create` : Création d'un workflow
- `workflow_validate` : Validation dans le workflow
- `workflow_reject` : Rejet dans le workflow
- `workflow_advance` : Avancement du workflow

### 🔔 Notifications
- `notification_create` : Création d'une notification
- `notification_read` : Lecture d'une notification

### 📦 Autres
- `api_call` : Appel API générique
- `export` : Export de données
- `import` : Import de données
- `other` : Autre action

---

## 🛠️ Utilisation Programmatique

### Créer un log manuellement (si nécessaire)

```python
from core.models_action_log import ActionLog

# Dans une vue ou une fonction
ActionLog.log_action(
    user=request.user,
    action_type='echantillon_send_essai',
    description='Envoi de l\'échantillon S-0001/25 aux essais mécaniques',
    echantillon_id=echantillon.id,
    echantillon_code=echantillon.code,
    success=True
)
```

### Exemple dans une vue personnalisée

```python
from rest_framework.decorators import api_view
from rest_framework.response import Response
from core.models_action_log import ActionLog

@api_view(['POST'])
def custom_action(request):
    try:
        # Votre logique métier
        result = do_something()
        
        # Log de succès
        ActionLog.log_action(
            user=request.user,
            action_type='other',
            description='Action personnalisée réussie',
            success=True
        )
        
        return Response({'status': 'success'})
    except Exception as e:
        # Log d'erreur
        ActionLog.log_action(
            user=request.user,
            action_type='other',
            description='Action personnalisée échouée',
            success=False,
            error_message=str(e)
        )
        
        return Response({'error': str(e)}, status=500)
```

---

## 📈 Cas d'Usage

### 1. Audit de Sécurité
Tracer toutes les actions d'un utilisateur spécifique :
```bash
GET /api/action-logs/?username=operateur_meca&date_from=2025-01-01
```

### 2. Suivi d'un Échantillon
Voir toutes les actions effectuées sur un échantillon :
```bash
GET /api/action-logs/by_echantillon/?echantillon_id=<uuid>
```

### 3. Analyse de Performance
Identifier les actions lentes :
```bash
GET /api/action-logs/?duration_ms__gte=1000
```

### 4. Détection d'Erreurs
Voir toutes les actions qui ont échoué :
```bash
GET /api/action-logs/errors/
```

### 5. Statistiques d'Utilisation
Obtenir des statistiques globales :
```bash
GET /api/action-logs/stats/
```

---

## ⚙️ Configuration

### Désactiver le logging pour certains endpoints

Modifier `IGNORED_ENDPOINTS` dans `core/middleware_action_log.py` :

```python
IGNORED_ENDPOINTS = [
    '/api/notifications/',
    '/api/action-logs/',
    '/admin/jsi18n/',
    '/static/',
    '/media/',
    '/api/mon-endpoint-a-ignorer/',  # Ajouter ici
]
```

### Personnaliser le mapping des actions

Modifier `ENDPOINT_ACTION_MAP` dans `core/middleware_action_log.py` :

```python
ENDPOINT_ACTION_MAP = {
    'login': 'login',
    'logout': 'logout',
    'clients': 'client',
    'echantillons': 'echantillon',
    'mon-endpoint': 'mon_action',  # Ajouter ici
}
```

---

## 🔒 Sécurité

### Masquage des Données Sensibles

Les mots de passe sont automatiquement masqués dans les logs :
- `password` → `***MASKED***`
- `password1` → `***MASKED***`
- `password2` → `***MASKED***`

### Permissions

- **Lecture** : Tous les utilisateurs authentifiés peuvent consulter les logs
- **Écriture** : Les logs sont créés automatiquement, pas d'ajout manuel
- **Modification** : Les logs ne peuvent pas être modifiés (lecture seule)
- **Suppression** : Seuls les administrateurs peuvent supprimer des logs via l'admin Django

---

## 📊 Structure de la Base de Données

### Table : `action_logs`

| Champ | Type | Description |
|-------|------|-------------|
| id | UUID | Identifiant unique |
| user | FK | Référence à l'utilisateur |
| username | String | Nom d'utilisateur |
| user_role | String | Rôle de l'utilisateur |
| action_type | String | Type d'action |
| action_description | Text | Description détaillée |
| http_method | String | Méthode HTTP |
| endpoint | String | URL de l'endpoint |
| ip_address | IP | Adresse IP du client |
| user_agent | Text | User Agent |
| request_data | JSON | Données de la requête |
| response_status | Integer | Code HTTP de réponse |
| echantillon_id | UUID | ID de l'échantillon |
| echantillon_code | String | Code de l'échantillon |
| essai_id | UUID | ID de l'essai |
| essai_type | String | Type d'essai |
| client_id | UUID | ID du client |
| client_code | String | Code du client |
| rapport_id | UUID | ID du rapport |
| workflow_id | UUID | ID du workflow |
| success | Boolean | Succès de l'action |
| error_message | Text | Message d'erreur |
| duration_ms | Integer | Durée en ms |
| created_at | DateTime | Date de création |

### Index

- `user` + `created_at`
- `action_type` + `created_at`
- `echantillon_id`
- `essai_id`
- `success` + `created_at`

---

## 🧪 Tests

### Tester le système de logging

```bash
# 1. Créer un client
curl -X POST http://127.0.0.1:8000/api/clients/ \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"nom": "Test Client", "contact": "Contact", "projet": "Projet Test"}'

# 2. Vérifier que l'action a été loggée
curl http://127.0.0.1:8000/api/action-logs/?action_type=client_create \
  -H "Authorization: Bearer <token>"
```

---

## 📝 Notes Importantes

1. **Performance** : Le middleware est optimisé pour ne pas ralentir les requêtes
2. **Stockage** : Les logs s'accumulent dans la base de données. Prévoir un nettoyage périodique des vieux logs
3. **Confidentialité** : Les mots de passe sont automatiquement masqués
4. **Récursion** : L'endpoint `/api/action-logs/` est ignoré pour éviter la récursion infinie
5. **Erreurs** : Si le logging échoue, la requête principale continue normalement

---

## 🔧 Maintenance

### Nettoyer les vieux logs

```python
# Script Python pour supprimer les logs de plus de 90 jours
from datetime import timedelta
from django.utils import timezone
from core.models_action_log import ActionLog

cutoff_date = timezone.now() - timedelta(days=90)
ActionLog.objects.filter(created_at__lt=cutoff_date).delete()
```

### Exporter les logs

```bash
# Via l'API
GET /api/action-logs/?format=json

# Via Django admin
python manage.py dumpdata core.ActionLog --output=action_logs_backup.json
```

---

## 📞 Support

Pour toute question ou problème avec le système de logging, contacter l'équipe technique.

**Date de création** : 29 novembre 2025  
**Version** : 1.0  
**Système** : Gestion d'Échantillons - Laboratoire SNERTP
