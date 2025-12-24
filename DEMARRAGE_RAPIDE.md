# 🚀 Guide de Démarrage Rapide

## ✅ Prérequis installés

- ✓ Python 3.13 + environnement virtuel
- ✓ Node.js + npm
- ✓ Base de données SQLite (db.sqlite3)
- ✓ Tous les packages installés

---

## 🎯 Démarrage en 3 étapes

### 1️⃣ Démarrer le Backend (Django)

```cmd
cd maxime-app\backend
venv\Scripts\activate
python manage.py runserver
```

**Le backend sera accessible sur** : http://127.0.0.1:8000

### 2️⃣ Démarrer le Frontend (React + Vite)

Dans un **nouveau terminal** :

```cmd
cd maxime-app
npm run dev
```

**Le frontend sera accessible sur** : http://localhost:3000

### 3️⃣ Se connecter

Ouvrez votre navigateur sur **http://localhost:3000** et connectez-vous avec :

**Compte Admin** :
- Username : `admin`
- Password : `admin123`

**Autres comptes** (voir COMPTES_UTILISATEURS.md) :
- Username : `receptionniste`, `operateur_route`, etc.
- Password : `demo123`

---

## 📁 Structure du projet

```
maxime-app/
├── backend/                    # Backend Django
│   ├── config/                # Configuration Django
│   ├── core/                  # Application principale
│   │   ├── models.py         # Modèles de données
│   │   ├── views.py          # API endpoints
│   │   ├── serializers.py    # Sérialisation JSON
│   │   └── urls.py           # Routes API
│   ├── db.sqlite3            # Base de données SQLite
│   ├── manage.py             # Commandes Django
│   └── venv/                 # Environnement virtuel Python
│
├── src/                       # Frontend React
│   ├── components/           # Composants React
│   ├── lib/                  # Services et utilitaires
│   │   ├── api.ts           # Client API HTTP
│   │   └── auth.ts          # Service d'authentification
│   ├── contexts/            # Contextes React
│   └── App.tsx              # Composant principal
│
├── COMPTES_UTILISATEURS.md   # Liste des comptes
├── CONNEXION_API.md          # Documentation API
└── DEMARRAGE_RAPIDE.md       # Ce fichier
```

---

## 🔧 Commandes utiles

### Backend Django

```cmd
# Créer des migrations
python manage.py makemigrations

# Appliquer les migrations
python manage.py migrate

# Créer un superutilisateur
python manage.py createsuperuser

# Accéder à l'admin Django
# http://127.0.0.1:8000/admin/

# Lancer le shell Django
python manage.py shell
```

### Frontend React

```cmd
# Installer les dépendances
npm install

# Démarrer en mode développement
npm run dev

# Build pour production
npm run build

# Prévisualiser le build
npm run preview
```

---

## 📡 Endpoints API principaux

### Authentification
- `POST /api/auth/login/` - Connexion
- `POST /api/auth/refresh/` - Rafraîchir le token

### Données
- `GET /api/users/me/` - Profil utilisateur
- `GET /api/clients/` - Liste des clients
- `GET /api/echantillons/` - Liste des échantillons
- `GET /api/essais/` - Liste des essais
- `GET /api/dashboard/stats/` - Statistiques
- `GET /api/notifications/` - Notifications

**Documentation complète** : Voir CONNEXION_API.md

---

## 🐛 Résolution de problèmes

### Le backend ne démarre pas
```cmd
# Vérifier que le port 8000 est libre
netstat -ano | findstr :8000

# Réactiver l'environnement virtuel
cd maxime-app\backend
venv\Scripts\activate
```

### Le frontend ne démarre pas
```cmd
# Réinstaller les dépendances
cd maxime-app
npm install

# Vérifier que le port 3000 est libre
netstat -ano | findstr :3000
```

### Erreur de connexion à l'API
1. Vérifier que le backend tourne sur http://127.0.0.1:8000
2. Vérifier la console du navigateur (F12)
3. Vérifier que les tokens JWT sont sauvegardés (localStorage)

### Réinitialiser la base de données
```cmd
cd maxime-app\backend
del db.sqlite3
python manage.py migrate
python create_test_users.py
```

---

## 📚 Documentation

- **COMPTES_UTILISATEURS.md** - Liste complète des comptes de test
- **CONNEXION_API.md** - Documentation de l'API et endpoints
- **PROJECT_SUMMARY.md** - Vue d'ensemble du projet
- **ARCHITECTURE.md** - Architecture technique (backend)

---

## 🎓 Prochaines étapes

1. ✅ Backend et frontend démarrés
2. ✅ Connexion dynamique fonctionnelle
3. ⏳ Dynamiser le dashboard
4. ⏳ Dynamiser la gestion des échantillons
5. ⏳ Dynamiser la gestion des essais
6. ⏳ Système de notifications temps réel

---

## 💡 Conseils

- **Gardez les deux terminaux ouverts** (backend + frontend)
- **Utilisez différents comptes** pour tester les différents rôles
- **Consultez la console du navigateur** (F12) pour déboguer
- **Vérifiez les logs du backend** dans le terminal Django

---

**Bon développement ! 🚀**
