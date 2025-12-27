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

## Bordereau de transmission avec signature

### Nouvelle fonctionnalité

Le système génère maintenant un **bordereau de transmission** qui doit être placé en première page avant le rapport PDF d'essai.

#### Caractéristiques :
- Génération automatique avec les données de l'échantillon
- Signature numérique du Directeur Général intégrée
- Personnalisation de tous les champs avant génération
- Export en HTML pour impression/conversion en PDF

#### Utilisation :
1. Dans le module "Rapports à aviser", signez le rapport
2. Cliquez sur "Bordereau de transmission"
3. Vérifiez/modifiez les informations
4. Générez le bordereau (s'ouvre dans une nouvelle fenêtre)
5. Imprimez ou enregistrez en PDF (Ctrl+P / Cmd+P)
6. Ouvrez le rapport original
7. Combinez les deux documents (bordereau en première page)

#### Documentation complète :
Voir [BORDEREAU_TRANSMISSION.md](./BORDEREAU_TRANSMISSION.md) pour plus de détails.

#### Fichiers ajoutés :
- `src/lib/bordereauGenerator.ts` - Générateur de bordereau
- `src/components/modules/BordereauDialog.tsx` - Interface de personnalisation
- `BORDEREAU_TRANSMISSION.md` - Documentation complète
- `test-bordereau.ts` - Tests unitaires