# 🏗️ Architecture du Backend

Documentation de l'architecture du système de gestion du laboratoire SNERTP.

## Vue d'ensemble

Le backend est une API REST construite avec Django qui gère l'ensemble du workflow de traitement des échantillons de laboratoire, de la réception à la validation finale, avec un module avancé de planification par contraintes.

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend React                        │
│                     (Vite + TypeScript)                      │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTP/REST + JWT
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    Django REST Framework                     │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Authentication (JWT)                    │   │
│  │         Permissions basées sur les rôles            │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────┐    │
│  │     Core     │  │   Scheduler  │  │    Celery     │    │
│  │   (Models)   │  │ (Optimizer)  │  │    (Tasks)    │    │
│  └──────┬───────┘  └──────┬───────┘  └───────┬───────┘    │
└─────────┼──────────────────┼──────────────────┼────────────┘
          │                  │                  │
          ▼                  ▼                  ▼
┌─────────────────┐  ┌──────────────┐  ┌──────────────┐
│   PostgreSQL    │  │   OR-Tools   │  │    Redis     │
│  (Base données) │  │ (CP Solver)  │  │   (Broker)   │
└─────────────────┘  └──────────────┘  └──────────────┘
```

## Stack Technologique

### Backend
- **Django 5.0.1** - Framework web Python
- **Django REST Framework** - Construction d'API REST
- **PostgreSQL** - Base de données relationnelle
- **JWT** - Authentification stateless
- **OR-Tools** - Optimisation par contraintes
- **Celery** - Tâches asynchrones et planifiées
- **Redis** - Cache et broker de messages

### Outils de développement
- **Swagger/ReDoc** - Documentation API
- **Django Admin** - Interface d'administration

## Modules

### 1. Core (Gestion de base)

**Responsabilité**: Gestion des entités métier principales

#### Models

```python
User              # Utilisateurs avec rôles
├── 9 rôles différents (receptionniste, operateur_route, etc.)
└── Authentification Django standard

Client            # Clients du laboratoire
├── Code auto-généré (CLI-XXX)
└── Informations de contact

Echantillon       # Échantillons reçus
├── Code auto-généré (S-XXXX/YY)
├── QR Code unique
├── 8 statuts (attente → valide)
└── Workflow complet

Essai             # Essais de laboratoire
├── 5 types (AG, Proctor, CBR, Oedometre, Cisaillement)
├── 2 sections (route, mecanique)
└── Résultats en JSON

Notification      # Système de notifications
└── Notifications ciblées par rôle

ValidationHistory # Traçabilité des validations
└── Historique hiérarchique
```

#### API Endpoints

```
/api/auth/                # Authentification JWT
/api/users/               # Gestion utilisateurs
/api/clients/             # Gestion clients
/api/echantillons/        # Gestion échantillons
/api/essais/              # Gestion essais
/api/notifications/       # Notifications
/api/dashboard/           # Statistiques
```

### 2. Scheduler (Planification par contraintes)

**Responsabilité**: Optimisation de l'ordonnancement des essais

#### Models

```python
Ressource             # Ressources du laboratoire
├── Équipements
├── Personnel
└── Salles

ContrainteTemporelle  # Contraintes de planning
├── Jours fermés
├── Maintenances
└── Priorités

Planning              # Plans optimisés
└── Généré par OR-Tools

AffectationEssai      # Affectations individuelles
└── Date + Ressources
```

#### Algorithme d'optimisation

Le module utilise **Google OR-Tools** avec un modèle de **programmation par contraintes (CP-SAT)**.

##### Variables de décision

Pour chaque essai `i`:
- `start[i]` : date de début (entier, jour dans l'horizon)
- `end[i]` : date de fin
- `interval[i]` : intervalle [start, duration, end]

##### Contraintes implémentées

1. **Capacité des ressources** (Cumulative)
```python
# Section Route: max 5 essais simultanés
AddCumulative(intervals_route, demands, capacity=5)

# Section Mécanique: max 3 essais simultanés
AddCumulative(intervals_meca, demands, capacity=3)
```

2. **Jours fermés**
```python
# Ne pas planifier sur weekends et jours fériés
for day in closed_days:
    model.Add(start[i] != day)
```

3. **Précédence** (pour un même échantillon)
```python
# AG doit finir avant Proctor
model.Add(start[proctor] >= end[ag] + 1)
```

4. **Priorité**
```python
priority = base_priority + urgency_bonus + age_bonus
# Les essais urgents ont un poids plus élevé
```

##### Fonction objectif

Minimiser:
```
makespan + Σ(weight[i] × end[i])
```

Où:
- `makespan` = durée totale du planning
- `weight[i]` = inverse de la priorité (essais prioritaires terminés plus tôt)

##### Résolution

```python
solver.parameters.max_time_in_seconds = 30.0
status = solver.Solve(model)

if status == OPTIMAL or FEASIBLE:
    # Extraire la solution
    for essai in essais:
        start_day = solver.Value(task_starts[essai.id])
        end_day = solver.Value(task_ends[essai.id])
```

#### API Endpoints

```
/api/scheduler/ressources/        # CRUD ressources
/api/scheduler/contraintes/       # CRUD contraintes
/api/scheduler/plannings/         # Gestion plannings
/api/scheduler/plannings/optimiser/  # Créer planning optimisé
/api/scheduler/affectations/      # Affectations individuelles
```

### 3. Celery (Tâches automatisées)

**Tâches périodiques**:

```python
# Toutes les heures
check_delayed_samples()
├── Détecte les échantillons en retard
└── Crée des notifications d'alerte

# Chaque jour à 6h
optimize_daily_schedule()
└── Optimise le planning des 2 prochaines semaines

# Chaque matin
send_daily_planning_report()
└── Notifie les opérateurs des essais du jour

# Hebdomadaire
cleanup_old_notifications()
└── Nettoie les anciennes notifications
```

## Workflow Métier

### Cycle de vie d'un échantillon

```
1. RÉCEPTION (Réceptionniste)
   ├── Création client
   ├── Création échantillon
   ├── Génération QR code
   └── Sélection des essais
          ↓
2. STOCKAGE (Responsable Matériaux)
   ├── Planification manuelle
   └── OU optimisation automatique
          ↓
3. ESSAIS (Opérateurs)
   ├── Section Route (AG, Proctor, CBR)
   ├── Section Mécanique (Oedometre, Cisaillement)
   ├── Saisie des résultats
   └── Upload fichiers
          ↓
4. DÉCODIFICATION (Réceptionniste)
   ├── Validation des résultats
   ├── Acceptation/Rejet
   └── Si rejet → retour Essais
          ↓
5. TRAITEMENT (Responsable Traitement)
   ├── Génération du rapport
   └── Préparation documents
          ↓
6. VALIDATION (Hiérarchie)
   ├── Chef de Projet
   ├── Chef Service
   ├── Directeur Technique
   └── Directeur Général
          ↓
7. VALIDÉ
   └── Envoi au client
```

## Sécurité

### Authentification

- **JWT (JSON Web Tokens)**
  - Access token: 8 heures
  - Refresh token: 7 jours
  - Rotation automatique des refresh tokens

### Autorisation

Permissions basées sur les rôles (RBAC):

```python
Réceptionniste:
  - Créer clients et échantillons
  - Accès en lecture aux essais

Responsable Matériaux:
  - Modifier échantillons en stockage
  - Planifier les envois

Opérateurs:
  - Gérer leurs essais (route ou mécanique)
  - Saisir les résultats

Validateurs:
  - Valider selon leur niveau hiérarchique
  - Vision globale

Admins (Chef Service, Dir. Technique):
  - Accès complet
  - Supervision et statistiques
```

### Protection des données

- CORS configuré pour le frontend
- CSRF protection activée
- Validation des données à tous les niveaux
- Sanitization des entrées utilisateur
- Logs des actions sensibles

## Base de Données

### Schema Principal

```sql
-- Users (Django Auth)
users (id, username, email, role, ...)

-- Core
clients (id, code, nom, contact, projet, ...)
echantillons (id, code, client_id, nature, statut, qr_code, ...)
essais (id, echantillon_id, type, section, statut, resultats, ...)
notifications (id, user_id, type, title, message, ...)
validation_history (id, echantillon_id, validateur_id, action, ...)

-- Scheduler
ressources (id, nom, type, section, capacite, ...)
contraintes_temporelles (id, type, date_debut, date_fin, ...)
plannings (id, nom, date_debut, date_fin, score, ...)
affectations_essais (id, planning_id, essai_id, dates, ...)
```

### Indexes

```sql
CREATE INDEX idx_echantillon_statut ON echantillons(statut, priorite);
CREATE INDEX idx_essai_statut ON essais(statut, section);
CREATE INDEX idx_notification_user ON notifications(user_id, read);
```

### Relations

```
Client (1) ─── (*) Echantillon
Echantillon (1) ─── (*) Essai
Essai (*) ─── (*) Ressource (via AffectationEssai)
User (1) ─── (*) Notification
```

## Performance

### Optimisations

1. **Requêtes**
   - `select_related()` pour les FK
   - `prefetch_related()` pour les M2M
   - Indexes sur les champs filtrés

2. **Cache**
   - Redis pour les sessions
   - Cache des statistiques du dashboard

3. **Pagination**
   - Limite de 50 items par défaut
   - Configurable par endpoint

4. **OR-Tools**
   - Timeout de 30s pour l'optimisation
   - Solutions feasible acceptées si optimal non trouvé

## Tests

### Structure des tests

```
tests/
├── test_models.py        # Tests des models
├── test_serializers.py   # Tests des serializers
├── test_views.py         # Tests des endpoints
├── test_permissions.py   # Tests des permissions
└── test_optimizer.py     # Tests de l'optimiseur
```

### Exécution

```bash
python manage.py test                    # Tous les tests
python manage.py test core              # Module core
python manage.py test scheduler         # Module scheduler
coverage run manage.py test             # Avec couverture
```

## Monitoring & Logs

### Logs Django

```python
LOGGING = {
    'version': 1,
    'handlers': {
        'file': {
            'level': 'INFO',
            'class': 'logging.FileHandler',
            'filename': 'logs/django.log',
        },
    },
    'loggers': {
        'django': {
            'handlers': ['file'],
            'level': 'INFO',
        },
    },
}
```

### Celery Monitoring

```bash
# Flower pour monitorer Celery
celery -A config flower
# Interface web sur http://localhost:5555
```

## Déploiement

### Checklist Production

- [ ] `DEBUG = False`
- [ ] `SECRET_KEY` aléatoire et sécurisée
- [ ] `ALLOWED_HOSTS` configuré
- [ ] PostgreSQL avec backup automatique
- [ ] Redis avec persistence
- [ ] Gunicorn + Nginx
- [ ] HTTPS (Let's Encrypt)
- [ ] Supervision (systemd, supervisor)
- [ ] Logs centralisés
- [ ] Monitoring (Sentry, DataDog, etc.)

### Docker (optionnel)

```yaml
version: '3.8'
services:
  db:
    image: postgres:14
  redis:
    image: redis:7
  web:
    build: .
    command: gunicorn config.wsgi:application
  celery:
    build: .
    command: celery -A config worker
```

## Évolutions Futures

### Prévues
- [ ] API GraphQL en complément de REST
- [ ] Websockets pour les notifications temps réel
- [ ] Machine Learning pour prédire les durées d'essais
- [ ] Module de reporting avancé (PDF/Excel)
- [ ] Intégration avec des équipements IoT

### Considérées
- [ ] Multi-laboratoires / Multi-tenancy
- [ ] API publique pour les clients
- [ ] Application mobile native
- [ ] Blockchain pour la traçabilité

---

**Auteur**: Équipe de développement SNERTP  
**Date**: Novembre 2025  
**Version**: 1.0.0
