# Connexion Frontend-Backend

## ✅ Configuration actuelle

### Backend (Django)
- **URL**: http://127.0.0.1:8000
- **Base de données**: SQLite (db.sqlite3)
- **API**: http://127.0.0.1:8000/api/

### Frontend (React + Vite)
- **URL**: http://localhost:3000

## 🔐 Identifiants de connexion

- **Username**: `admin`
- **Password**: `admin123`
- **Rôle**: Directeur Général (tous les droits)

## 📡 Endpoints API disponibles

### Authentification
- `POST /api/auth/login/` - Connexion (retourne access + refresh tokens)
- `POST /api/auth/refresh/` - Rafraîchir le token

### Utilisateurs
- `GET /api/users/` - Liste des utilisateurs
- `GET /api/users/me/` - Profil de l'utilisateur connecté
- `POST /api/users/` - Créer un utilisateur

### Clients
- `GET /api/clients/` - Liste des clients
- `POST /api/clients/` - Créer un client
- `GET /api/clients/{id}/` - Détails d'un client
- `GET /api/clients/{id}/echantillons/` - Échantillons d'un client

### Échantillons
- `GET /api/echantillons/` - Liste des échantillons
- `POST /api/echantillons/` - Créer un échantillon
- `GET /api/echantillons/{id}/` - Détails d'un échantillon
- `POST /api/echantillons/{id}/change_statut/` - Changer le statut
- `GET /api/echantillons/{id}/essais/` - Essais d'un échantillon

### Essais
- `GET /api/essais/` - Liste des essais
- `POST /api/essais/` - Créer un essai
- `POST /api/essais/{id}/demarrer/` - Démarrer un essai
- `POST /api/essais/{id}/terminer/` - Terminer un essai
- `POST /api/essais/{id}/rejeter/` - Rejeter un essai

### Dashboard
- `GET /api/dashboard/stats/` - Statistiques globales
- `GET /api/dashboard/my_tasks/` - Tâches de l'utilisateur

### Notifications
- `GET /api/notifications/` - Liste des notifications
- `POST /api/notifications/{id}/mark_as_read/` - Marquer comme lue
- `GET /api/notifications/unread_count/` - Nombre de non lues

## 🔧 Fichiers créés pour la connexion

1. **`src/lib/api.ts`** - Gestion des requêtes HTTP avec JWT
2. **`src/lib/auth.ts`** - Service d'authentification
3. **`src/components/LoginPage.tsx`** - Page de connexion mise à jour

## 📝 Prochaines étapes

Pour dynamiser complètement l'application, il faut créer des services pour :

1. **Clients** - CRUD complet
2. **Échantillons** - CRUD + gestion des statuts
3. **Essais** - CRUD + workflow
4. **Dashboard** - Récupération des statistiques réelles
5. **Notifications** - Système temps réel

## 🧪 Test de connexion

1. Ouvrez http://localhost:3000
2. Entrez:
   - Username: `admin`
   - Password: `admin123`
3. Cliquez sur "Se connecter"

Si tout fonctionne, vous serez connecté et verrez le dashboard !

## ⚠️ Note importante

Le frontend utilise maintenant l'API Django pour l'authentification. Les données statiques seront progressivement remplacées par des appels API.
