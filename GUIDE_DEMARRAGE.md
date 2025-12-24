# 🚀 Guide de Démarrage - Maxime App

## ✅ Étapes Complétées

1. ✅ Dépendances frontend installées (npm install)
2. ✅ Environnement virtuel Python créé
3. ✅ Dépendances backend installées

## 📋 Prochaines Étapes

### 1. Configuration de PostgreSQL

Tu dois avoir PostgreSQL installé et créer la base de données :

```bash
# Ouvrir PostgreSQL
psql -U postgres

# Dans psql, exécuter :
CREATE DATABASE snertp_lab_db;
```

Ou utiliser le script fourni :
```bash
cd backend
psql -U postgres -f database/create_db.sql
```

### 2. Appliquer les migrations Django

```bash
cd backend
venv\Scripts\python.exe manage.py migrate
```

### 3. Créer un super utilisateur (optionnel)

```bash
venv\Scripts\python.exe manage.py createsuperuser
```

### 4. Démarrer le Backend

```bash
cd backend
venv\Scripts\python.exe manage.py runserver
```

Le backend sera disponible sur : http://localhost:8000

### 5. Démarrer le Frontend (dans un nouveau terminal)

**Important** : Si tu utilises PowerShell, utilise cette commande :
```bash
cd maxime-app
cmd /c npm run dev
```

Ou ouvre un terminal CMD et exécute :
```bash
cd maxime-app
npm run dev
```

Le frontend sera disponible sur : http://localhost:3000

## 🔧 Services Optionnels

### Redis (pour Celery - tâches asynchrones)

Si tu veux utiliser les fonctionnalités de planification automatique :

1. Installer Redis pour Windows
2. Démarrer Redis
3. Lancer Celery :

```bash
cd backend
venv\Scripts\celery.exe -A config worker -l info
```

## 📝 Comptes de Test

Après avoir créé les données d'exemple, tu peux te connecter avec :

- Username: `admin`
- Password: `password123`

## ⚠️ Problèmes Courants

### PostgreSQL n'est pas installé
Télécharge et installe PostgreSQL depuis : https://www.postgresql.org/download/windows/

### Le port 8000 ou 5173 est déjà utilisé
Arrête les autres applications utilisant ces ports ou change le port dans la configuration.

## 📚 Documentation Complète

Consulte les fichiers suivants pour plus d'informations :
- `backend/README.md` - Documentation complète du backend
- `backend/QUICK_START.md` - Guide de démarrage rapide
- `README.md` - Documentation du projet
