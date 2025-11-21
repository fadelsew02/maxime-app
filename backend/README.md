# Backend - Système de Gestion du Laboratoire SNERTP

API REST Django pour le système de gestion d'échantillons du laboratoire SNERTP.

## Fonctionnalités

### Modules Principaux

1. **Core** - Gestion de base
   - Authentification JWT
   - Gestion des utilisateurs (9 rôles)
   - Gestion des clients
   - Gestion des échantillons
   - Gestion des essais
   - Système de notifications
   - Historique des validations

2. **Scheduler** - Planification par contraintes
   - Optimisation automatique du planning avec OR-Tools
   - Gestion des ressources (équipements, personnel)
   - Contraintes temporelles (jours fermés, maintenance)
   - Affectation optimale des essais
   - Tâches automatisées (Celery)

### Technologies

- **Django 5.0.1** - Framework web
- **Django REST Framework** - API REST
- **PostgreSQL** - Base de données
- **JWT** - Authentification
- **OR-Tools** - Optimisation par contraintes
- **Celery** - Tâches asynchrones
- **Redis** - Cache et broker Celery

## Installation

### 1. Prérequis

```bash
# Python 3.10+
python --version

# PostgreSQL 14+
psql --version

# Redis (pour Celery)
redis-cli --version
```

### 2. Configuration de la base de données

```bash
# Créer la base de données PostgreSQL
sudo -u postgres psql
```

```sql
CREATE DATABASE snertp_lab_db;
CREATE USER snertp_user WITH PASSWORD 'your_password';
ALTER ROLE snertp_user SET client_encoding TO 'utf8';
ALTER ROLE snertp_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE snertp_user SET timezone TO 'Africa/Abidjan';
GRANT ALL PRIVILEGES ON DATABASE snertp_lab_db TO snertp_user;
\q
```

### 3. Installation des dépendances

```bash
# Créer un environnement virtuel
python -m venv venv
source venv/bin/activate  # Sur Linux/Mac
# venv\Scripts\activate  # Sur Windows

# Installer les dépendances
pip install -r requirements.txt
```

### 4. Configuration de l'environnement

```bash
# Copier le fichier d'exemple
cp .env.example .env

# Éditer le fichier .env avec vos paramètres
nano .env
```

Configurer les variables suivantes dans `.env`:

```env
SECRET_KEY=votre-cle-secrete-longue-et-complexe
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

DB_NAME=snertp_lab_db
DB_USER=snertp_user
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=5432

CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173

REDIS_URL=redis://localhost:6379/0
```

### 5. Migrations et données initiales

```bash
# Créer les migrations
python manage.py makemigrations

# Appliquer les migrations
python manage.py migrate

# Créer un super utilisateur
python manage.py createsuperuser

# (Optionnel) Charger des données de test
python manage.py loaddata fixtures/initial_data.json
```

### 6. Lancer le serveur

```bash
# Serveur de développement
python manage.py runserver

# L'API sera disponible sur http://localhost:8000/api/
```

### 7. Lancer Celery (pour les tâches automatisées)

```bash
# Dans un terminal séparé

# Lancer le worker Celery
celery -A config worker -l info

# Lancer le scheduler Celery Beat
celery -A config beat -l info
```

## Structure du Projet

```
backend/
├── config/              # Configuration Django
│   ├── settings.py      # Paramètres
│   ├── urls.py          # URLs principales
│   ├── celery.py        # Configuration Celery
│   └── wsgi.py / asgi.py
├── core/                # Module principal
│   ├── models.py        # Models (User, Client, Echantillon, Essai...)
│   ├── serializers.py   # Serializers DRF
│   ├── views.py         # ViewSets
│   ├── permissions.py   # Permissions personnalisées
│   ├── urls.py          # URLs de l'API
│   └── admin.py         # Interface admin
├── scheduler/           # Module de planification
│   ├── models.py        # Models (Ressource, Planning...)
│   ├── optimizer.py     # Moteur d'optimisation OR-Tools
│   ├── serializers.py   # Serializers
│   ├── views.py         # ViewSets
│   ├── tasks.py         # Tâches Celery
│   └── urls.py          # URLs
├── manage.py
└── requirements.txt
```

## API Endpoints

### Authentification

```
POST   /api/auth/login/          # Connexion (retourne JWT)
POST   /api/auth/refresh/        # Rafraîchir le token
```

### Core

```
# Utilisateurs
GET    /api/users/               # Liste des utilisateurs
POST   /api/users/               # Créer un utilisateur
GET    /api/users/me/            # Utilisateur connecté
GET    /api/users/{id}/          # Détails d'un utilisateur

# Clients
GET    /api/clients/             # Liste des clients
POST   /api/clients/             # Créer un client
GET    /api/clients/{id}/        # Détails d'un client
GET    /api/clients/{id}/echantillons/  # Échantillons du client

# Échantillons
GET    /api/echantillons/        # Liste des échantillons
POST   /api/echantillons/        # Créer un échantillon
GET    /api/echantillons/{id}/   # Détails d'un échantillon
POST   /api/echantillons/{id}/change_statut/  # Changer le statut
GET    /api/echantillons/{id}/essais/  # Essais de l'échantillon
GET    /api/echantillons/by_statut/?statut=stockage  # Filtrer par statut

# Essais
GET    /api/essais/              # Liste des essais
POST   /api/essais/              # Créer un essai
GET    /api/essais/{id}/         # Détails d'un essai
POST   /api/essais/{id}/demarrer/  # Démarrer un essai
POST   /api/essais/{id}/terminer/  # Terminer un essai
POST   /api/essais/{id}/rejeter/   # Rejeter un essai
GET    /api/essais/by_section/?section=route  # Filtrer par section

# Notifications
GET    /api/notifications/       # Mes notifications
POST   /api/notifications/{id}/mark_as_read/  # Marquer comme lue
POST   /api/notifications/mark_all_as_read/   # Tout marquer comme lu
GET    /api/notifications/unread_count/       # Nombre non lues

# Dashboard
GET    /api/dashboard/stats/     # Statistiques globales
GET    /api/dashboard/my_tasks/  # Mes tâches
```

### Scheduler

```
# Ressources
GET    /api/scheduler/ressources/              # Liste des ressources
POST   /api/scheduler/ressources/              # Créer une ressource
GET    /api/scheduler/ressources/disponibles/  # Ressources disponibles

# Contraintes
GET    /api/scheduler/contraintes/             # Liste des contraintes
POST   /api/scheduler/contraintes/             # Créer une contrainte
GET    /api/scheduler/contraintes/actives/     # Contraintes actives

# Plannings
GET    /api/scheduler/plannings/               # Liste des plannings
POST   /api/scheduler/plannings/optimiser/     # Créer un planning optimisé
POST   /api/scheduler/plannings/optimiser_hebdomadaire/  # Planning auto 2 semaines
GET    /api/scheduler/plannings/actif/         # Planning actif
POST   /api/scheduler/plannings/{id}/activer/  # Activer un planning
GET    /api/scheduler/plannings/{id}/affectations/  # Affectations du planning
```

## Programmation par Contraintes

Le module scheduler utilise **OR-Tools** de Google pour optimiser l'ordonnancement des essais.

### Contraintes implémentées

1. **Capacité des ressources** - Limite le nombre d'essais simultanés
2. **Jours fermés** - Weekends, jours fériés, maintenance
3. **Précédence** - Ordre des essais pour un même échantillon
4. **Priorité** - Échantillons urgents traités en priorité
5. **Durée estimée** - Respect des durées par type d'essai

### Fonction objectif

L'optimiseur minimise:
- Le makespan (durée totale du planning)
- La somme pondérée des dates de fin (essais prioritaires terminés plus tôt)

### Exemple d'utilisation

```python
from scheduler.optimizer import SchedulerOptimizer
from datetime import date

# Créer un optimiseur pour les 2 prochaines semaines
optimizer = SchedulerOptimizer(
    date_debut=date(2025, 11, 10),
    date_fin=date(2025, 11, 24),
    section='route'  # ou 'mecanique' ou None
)

# Créer le planning optimisé
planning = optimizer.creer_planning("Planning Novembre")

# Résultats
print(f"Essais planifiés: {planning.nombre_essais_planifies}")
print(f"Score: {planning.score_optimisation}")
print(f"Temps de calcul: {planning.temps_calcul}s")
```

## Tâches Automatisées (Celery)

Les tâches suivantes s'exécutent automatiquement:

- **check_delayed_samples** - Toutes les heures, vérifie les retards
- **optimize_daily_schedule** - Chaque jour à 6h, optimise le planning
- **send_daily_planning_report** - Chaque matin, envoie les essais du jour
- **cleanup_old_notifications** - Nettoie les vieilles notifications

## Documentation API

La documentation interactive Swagger est disponible sur:

```
http://localhost:8000/swagger/
http://localhost:8000/redoc/
```

## Tests

```bash
# Lancer tous les tests
python manage.py test

# Tests avec couverture
coverage run --source='.' manage.py test
coverage report
```

## Déploiement

### Production avec Gunicorn

```bash
# Installer Gunicorn
pip install gunicorn

# Collecter les fichiers statiques
python manage.py collectstatic --noinput

# Lancer avec Gunicorn
gunicorn config.wsgi:application --bind 0.0.0.0:8000 --workers 4
```

### Variables d'environnement en production

```env
DEBUG=False
ALLOWED_HOSTS=votredomaine.com,www.votredomaine.com
SECRET_KEY=cle-secrete-tres-longue-et-aleatoire
```

## Sécurité

- Authentification JWT avec refresh tokens
- Permissions basées sur les rôles
- CORS configuré
- Protection CSRF
- Validation des données
- Hachage des mots de passe (Django bcrypt)

## Contribution

1. Fork le projet
2. Créer une branche (`git checkout -b feature/nouvelle-fonctionnalite`)
3. Commit (`git commit -am 'Ajout nouvelle fonctionnalité'`)
4. Push (`git push origin feature/nouvelle-fonctionnalite`)
5. Créer une Pull Request

## Licence

Propriétaire - SNERTP Côte d'Ivoire

## Support

Pour toute question: contact@snertp.ci
