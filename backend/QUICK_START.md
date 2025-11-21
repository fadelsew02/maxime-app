# 🚀 Guide de Démarrage Rapide

Guide pour démarrer rapidement le backend du système SNERTP.

## Installation Rapide (Linux/Mac)

```bash
# 1. Cloner et naviguer vers le backend
cd backend

# 2. Exécuter le script de configuration
chmod +x scripts/setup.sh
./scripts/setup.sh

# 3. Lancer le serveur
python manage.py runserver
```

## Installation Manuelle

### Étape 1: PostgreSQL

```bash
# Installer PostgreSQL
sudo apt-get install postgresql postgresql-contrib  # Ubuntu/Debian
# brew install postgresql  # Mac

# Créer la base de données
sudo -u postgres psql -f database/create_db.sql
```

### Étape 2: Redis

```bash
# Installer Redis
sudo apt-get install redis-server  # Ubuntu/Debian
# brew install redis  # Mac

# Démarrer Redis
sudo service redis-server start  # Linux
# redis-server  # Mac
```

### Étape 3: Python et dépendances

```bash
# Créer un environnement virtuel
python3 -m venv venv
source venv/bin/activate

# Installer les dépendances
pip install -r requirements.txt
```

### Étape 4: Configuration

```bash
# Copier et configurer .env
cp .env.example .env
nano .env  # Modifier avec vos paramètres
```

### Étape 5: Base de données Django

```bash
# Créer et appliquer les migrations
python manage.py makemigrations
python manage.py migrate

# Créer les données d'exemple
python scripts/create_sample_data.py
```

### Étape 6: Lancer les services

```bash
# Terminal 1: Django
python manage.py runserver

# Terminal 2: Celery Worker
celery -A config worker -l info

# Terminal 3: Celery Beat
celery -A config beat -l info
```

## Accès

- **API**: http://localhost:8000/api/
- **Admin**: http://localhost:8000/admin/
- **Swagger**: http://localhost:8000/swagger/
- **ReDoc**: http://localhost:8000/redoc/

## Comptes de Test

Tous les mots de passe: `password123`

| Username           | Rôle                      |
|--------------------|---------------------------|
| admin              | Superuser (chef_service)  |
| receptionniste     | Réceptionniste            |
| responsable_mat    | Responsable Matériaux     |
| operateur_route    | Opérateur Route           |
| operateur_meca     | Opérateur Mécanique       |
| resp_traitement    | Responsable Traitement    |
| chef_projet        | Chef de Projet            |
| chef_service       | Chef Service              |
| dir_technique      | Directeur Technique       |
| dir_general        | Directeur Général         |

## Premiers Tests

### 1. Connexion (JWT)

```bash
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "receptionniste",
    "password": "password123"
  }'
```

Réponse:
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbG..."
}
```

### 2. Utiliser le token

```bash
# Remplacer YOUR_TOKEN par le token reçu
curl http://localhost:8000/api/echantillons/ \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 3. Créer un client

```bash
curl -X POST http://localhost:8000/api/clients/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "nom": "Entreprise Test",
    "contact": "M. Test",
    "projet": "Projet Test",
    "email": "test@example.com",
    "telephone": "+225 07 00 00 00"
  }'
```

### 4. Créer un planning optimisé

```bash
curl -X POST http://localhost:8000/api/scheduler/plannings/optimiser/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "nom": "Planning Test",
    "date_debut": "2025-11-15",
    "date_fin": "2025-11-29",
    "section": "all"
  }'
```

## Commandes Utiles

```bash
# Créer un superuser
python manage.py createsuperuser

# Shell Django
python manage.py shell

# Tester l'optimisation
python manage.py shell
>>> from scheduler.optimizer import optimiser_planning_hebdomadaire
>>> planning = optimiser_planning_hebdomadaire()
>>> print(f"Essais planifiés: {planning.nombre_essais_planifies}")

# Vérifier la configuration
python manage.py check

# Collecter les fichiers statiques
python manage.py collectstatic

# Créer une migration vide
python manage.py makemigrations --empty core

# Appliquer une migration spécifique
python manage.py migrate core 0001

# Revert une migration
python manage.py migrate core zero
```

## Dépannage

### Erreur de connexion PostgreSQL

```bash
# Vérifier que PostgreSQL est lancé
sudo service postgresql status

# Vérifier les paramètres de connexion
psql -U snertp_user -d snertp_lab_db -h localhost
```

### Erreur Redis

```bash
# Vérifier que Redis est lancé
redis-cli ping
# Devrait retourner: PONG
```

### Erreur de migration

```bash
# Supprimer toutes les migrations et recommencer
find . -path "*/migrations/*.py" -not -name "__init__.py" -delete
find . -path "*/migrations/*.pyc" -delete
python manage.py makemigrations
python manage.py migrate
```

### Erreur de dépendances

```bash
# Réinstaller toutes les dépendances
pip install --upgrade pip
pip install -r requirements.txt --force-reinstall
```

## Tests

```bash
# Lancer tous les tests
python manage.py test

# Tests d'un module spécifique
python manage.py test core.tests
python manage.py test scheduler.tests

# Tests avec verbosité
python manage.py test --verbosity=2

# Tests avec couverture
coverage run --source='.' manage.py test
coverage report
coverage html  # Génère un rapport HTML
```

## Production

Pour le déploiement en production, consultez le fichier `README.md` complet.

Points importants:
- ✅ Changer `DEBUG=False`
- ✅ Générer une nouvelle `SECRET_KEY`
- ✅ Configurer `ALLOWED_HOSTS`
- ✅ Utiliser Gunicorn
- ✅ Configurer Nginx
- ✅ Utiliser HTTPS
- ✅ Configurer les logs
- ✅ Backup réguliers de la BDD

## Support

Pour toute question: contact@snertp.ci
