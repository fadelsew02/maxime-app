# Système de Gestion du Laboratoire SNERTP

## Démarrage rapide

### Prérequis
- Python 3.8+
- Node.js 16+
- npm

### 1. Démarrer le Backend (Django)

```bash
# Aller dans le dossier backend
cd backend

# Installer les dépendances Python
pip install Django djangorestframework django-cors-headers python-decouple djangorestframework-simplejwt django-filter drf-yasg celery redis django-celery-beat ortools Pillow

# Démarrer le serveur Django
python manage.py runserver
```

Le backend sera accessible sur : http://127.0.0.1:8000/

### 2. Démarrer le Frontend (React)

```bash
# Dans un nouveau terminal, aller à la racine du projet
cd maxime-app

# Installer les dépendances npm
npm install

# Démarrer le serveur de développement
npm run dev
```

Le frontend sera accessible sur : http://localhost:3000/ (ou le port affiché)

### 3. Démarrage avec un seul script

Créez un fichier `start.bat` :

```batch
@echo off
echo Démarrage du backend...
start cmd /k "cd backend && python manage.py runserver"

echo Attente de 3 secondes...
timeout /t 3 /nobreak > nul

echo Démarrage du frontend...
start cmd /k "npm run dev"

echo Les deux serveurs sont en cours de démarrage...
pause
```

Puis exécutez : `start.bat`

## URLs importantes

- **Frontend** : http://localhost:3000/
- **Backend API** : http://127.0.0.1:8000/
- **Admin Django** : http://127.0.0.1:8000/admin/
- **Documentation API** : http://127.0.0.1:8000/swagger/

## Résolution du problème de date CLI-015

Le problème de date de retour pour CLI-015 a été corrigé :
- La date la plus défavorable (28 décembre 2025) + 2 jours de marge = **30 décembre 2025**
- La fonction `calculateClientReturnDate` utilise maintenant la même logique que `simulerIADateEnvoi`