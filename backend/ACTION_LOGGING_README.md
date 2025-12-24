# Système d'Enregistrement des Actions - Installation Complète

## ✅ Installation Réussie

Le système d'enregistrement automatique de toutes les actions a été installé avec succès dans le backend du laboratoire SNERTP.

---

## 📁 Fichiers Créés

### 1. Modèle de données
- **`core/models_action_log.py`** : Modèle ActionLog pour stocker les logs
  - 30+ types d'actions prédéfinis
  - Capture automatique des informations utilisateur, requête, et réponse
  - Méthode helper `log_action()` pour logging manuel

### 2. Middleware
- **`core/middleware_action_log.py`** : Middleware pour capture automatique
  - Enregistre TOUTES les requêtes API automatiquement
  - Calcule la durée de chaque action
  - Masque les mots de passe automatiquement
  - Ignore certains endpoints pour éviter la récursion

### 3. Serializers
- **`core/serializers_action_log.py`** : Serializers pour l'API
  - ActionLogSerializer : Sérialisation des logs
  - ActionLogStatsSerializer : Sérialisation des statistiques

### 4. Views
- **`core/views_action_log.py`** : ViewSet pour l'API REST
  - Endpoints de consultation des logs
  - Filtrage avancé (utilisateur, type, période, etc.)
  - Statistiques globales
  - Actions récentes, par utilisateur, par échantillon
  - Liste des erreurs

### 5. Documentation
- **`LOGGING_SYSTEM.md`** : Documentation complète du système
  - Guide d'utilisation
  - Exemples d'API calls
  - Cas d'usage
  - Configuration

### 6. Tests
- **`test_action_logging_simple.py`** : Script de test
  - Vérifie la création de logs
  - Affiche les statistiques
  - Liste les actions récentes

---

## 🔧 Modifications Apportées

### 1. Settings (`config/settings.py`)
```python
MIDDLEWARE = [
    # ... autres middlewares
    'core.middleware_action_log.ActionLogMiddleware',  # ✅ AJOUTÉ
]
```

### 2. URLs (`core/urls.py`)
```python
from .views_action_log import ActionLogViewSet

router.register(r'action-logs', ActionLogViewSet, basename='action-log')  # ✅ AJOUTÉ
```

### 3. Admin (`core/admin.py`)
```python
from .models_action_log import ActionLog

@admin.register(ActionLog)
class ActionLogAdmin(admin.ModelAdmin):
    # Configuration admin pour les logs
```

### 4. Base de données
- ✅ Migration créée : `0014_remove_workflowvalidation_commentaire_chef_projet_and_more.py`
- ✅ Migration appliquée : Table `action_logs` créée
- ✅ Index créés pour performance optimale

---

## 🚀 Utilisation

### 1. Consultation via API

#### Tous les logs
```bash
GET http://127.0.0.1:8000/api/action-logs/
```

#### Filtrer par utilisateur
```bash
GET http://127.0.0.1:8000/api/action-logs/?username=operateur_meca
```

#### Filtrer par type d'action
```bash
GET http://127.0.0.1:8000/api/action-logs/?action_type=essai_create
```

#### Filtrer par période
```bash
GET http://127.0.0.1:8000/api/action-logs/?period=today
GET http://127.0.0.1:8000/api/action-logs/?period=week
```

#### Statistiques
```bash
GET http://127.0.0.1:8000/api/action-logs/stats/
```

#### Actions récentes (24h)
```bash
GET http://127.0.0.1:8000/api/action-logs/recent/
```

#### Actions en erreur
```bash
GET http://127.0.0.1:8000/api/action-logs/errors/
```

### 2. Consultation via Admin Django

1. Accéder à : http://127.0.0.1:8000/admin/
2. Se connecter avec le compte admin
3. Cliquer sur "Action logs" dans la section "Core"
4. Utiliser les filtres pour rechercher

### 3. Test du système

```bash
cd backend
python test_action_logging_simple.py
```

---

## 📊 Types d'Actions Enregistrées

### Authentification
- `login` : Connexion
- `logout` : Déconnexion

### Clients
- `client_create`, `client_update`, `client_delete`, `client_view`

### Échantillons
- `echantillon_create`, `echantillon_update`, `echantillon_delete`, `echantillon_view`
- `echantillon_send_essai`, `echantillon_send_traitement`

### Essais
- `essai_create`, `essai_update`, `essai_delete`, `essai_view`
- `essai_start`, `essai_complete`, `essai_send`

### Rapports
- `rapport_create`, `rapport_update`, `rapport_view`
- `rapport_validate`, `rapport_reject`, `rapport_send`

### Workflow
- `workflow_create`, `workflow_validate`, `workflow_reject`, `workflow_advance`

### Notifications
- `notification_create`, `notification_read`

### Autres
- `api_call`, `export`, `import`, `other`

---

## 🔍 Informations Capturées

Pour chaque action :

### Utilisateur
- ID et nom d'utilisateur
- Rôle
- Adresse IP
- User Agent

### Action
- Type d'action
- Description détaillée
- Méthode HTTP
- Endpoint

### Données
- Données de la requête (POST/PUT/PATCH)
- Code de statut HTTP
- Succès/Échec
- Message d'erreur
- Durée en millisecondes

### Références
- ID et code de l'échantillon
- ID et type de l'essai
- ID et code du client
- ID du rapport
- ID du workflow

---

## ✅ Tests Effectués

```
[TEST 1] Creation manuelle d'un log d'action...
[OK] Log cree avec succes

[TEST 2] Statistiques des logs...
[OK] Total de logs: 17
[OK] Logs des dernieres 24h: 17
[OK] Taux de succes: 100.00%

[TEST 3] Actions recentes...
[OK] 5 actions les plus recentes affichees
```

---

## 🔒 Sécurité

- ✅ Mots de passe automatiquement masqués
- ✅ Logs en lecture seule (pas de modification)
- ✅ Permissions basées sur l'authentification
- ✅ Pas de récursion infinie (endpoint /api/action-logs/ ignoré)

---

## 📈 Performance

- ✅ Enregistrement asynchrone (ne ralentit pas les requêtes)
- ✅ Index sur les champs fréquemment utilisés
- ✅ Pagination automatique (50 résultats par page)
- ✅ Filtrage optimisé

---

## 🎯 Fonctionnement Automatique

Le système fonctionne **AUTOMATIQUEMENT** :

1. ✅ Chaque requête API est interceptée par le middleware
2. ✅ Les informations sont extraites et enregistrées
3. ✅ Le type d'action est déterminé automatiquement
4. ✅ Les références aux objets sont extraites
5. ✅ Le log est créé en base de données
6. ✅ La requête continue normalement

**Aucune modification de code n'est nécessaire dans les vues existantes !**

---

## 📝 Exemple de Log Créé

```json
{
  "id": "d831811c-c5aa-4f62-83a6-21c9b45528b6",
  "username": "operateur_meca",
  "user_role": "operateur_mecanique",
  "action_type": "essai_create",
  "action_type_display": "Création Essai",
  "action_description": "Création/Action sur /api/essais/",
  "http_method": "POST",
  "endpoint": "/api/essais/",
  "ip_address": "127.0.0.1",
  "success": true,
  "response_status": 201,
  "duration_ms": 150,
  "created_at": "2025-12-18 06:51:35"
}
```

---

## 🔧 Maintenance

### Nettoyer les vieux logs (optionnel)

```python
# Supprimer les logs de plus de 90 jours
from datetime import timedelta
from django.utils import timezone
from core.models_action_log import ActionLog

cutoff_date = timezone.now() - timedelta(days=90)
ActionLog.objects.filter(created_at__lt=cutoff_date).delete()
```

### Exporter les logs

```bash
# Via Django
python manage.py dumpdata core.ActionLog --output=logs_backup.json

# Via l'API
GET /api/action-logs/?format=json
```

---

## 📚 Documentation Complète

Voir **`LOGGING_SYSTEM.md`** pour :
- Guide d'utilisation détaillé
- Tous les endpoints disponibles
- Exemples de filtrage avancé
- Cas d'usage pratiques
- Configuration personnalisée

---

## ✨ Résumé

Le système d'enregistrement des actions est maintenant **OPÉRATIONNEL** et enregistre automatiquement :

- ✅ Toutes les connexions/déconnexions
- ✅ Toutes les créations de clients, échantillons, essais
- ✅ Toutes les modifications de données
- ✅ Tous les envois et validations
- ✅ Toutes les consultations importantes
- ✅ Toutes les erreurs

**Le système fonctionne en arrière-plan sans intervention manuelle !**

---

**Date d'installation** : 18 décembre 2025  
**Version** : 1.0  
**Statut** : ✅ Opérationnel
