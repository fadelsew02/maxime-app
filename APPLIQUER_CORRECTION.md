# 🚀 Comment Appliquer la Correction

## ✅ Étapes à Suivre

### 1️⃣ Arrêter les Serveurs

Si les serveurs sont en cours d'exécution, arrêtez-les :
- Appuyez sur `Ctrl + C` dans les fenêtres de terminal
- Ou fermez les fenêtres de terminal

### 2️⃣ Redémarrer le Backend Django

Ouvrez un terminal et exécutez :

```bash
cd c:\Users\HP\Desktop\MOI\maxime-app\backend
python manage.py runserver
```

Le serveur devrait démarrer sur : http://127.0.0.1:8000

### 3️⃣ Redémarrer le Frontend React

Ouvrez un autre terminal et exécutez :

```bash
cd c:\Users\HP\Desktop\MOI\maxime-app
npm run dev
```

Le frontend devrait démarrer sur : http://localhost:3000

### 4️⃣ Tester la Correction

#### Option A : Test Automatique
```bash
cd c:\Users\HP\Desktop\MOI\maxime-app\backend
python test_statut_essai.py
```

Vous devriez voir :
```
[SUCCESS] TEST REUSSI: L'echantillon est maintenant en statut 'essais'
```

#### Option B : Test Manuel
1. Ouvrez votre navigateur : http://localhost:3000
2. Connectez-vous avec :
   - Username : `operateur_route`
   - Password : `demo123`
3. Trouvez un échantillon avec des essais en attente
4. Cliquez sur un essai (AG, Proctor ou CBR)
5. Remplissez les informations et cliquez "Démarrer l'essai"
6. Vérifiez que le badge de statut de l'échantillon change de "Stockage" à "En essais"

## 🔍 Vérification

### Vérifier que le Backend est Démarré
Ouvrez votre navigateur et allez sur : http://127.0.0.1:8000/api/

Vous devriez voir la page de l'API Django REST Framework.

### Vérifier que le Frontend est Démarré
Ouvrez votre navigateur et allez sur : http://localhost:3000

Vous devriez voir la page de connexion de l'application.

## 🆘 Problèmes Courants

### Le Backend ne Démarre Pas

**Erreur : "Port already in use"**
```bash
# Trouver le processus qui utilise le port 8000
netstat -ano | findstr :8000

# Tuer le processus (remplacez PID par le numéro trouvé)
taskkill /PID <PID> /F

# Redémarrer le backend
python manage.py runserver
```

**Erreur : "Module not found"**
```bash
# Installer les dépendances
pip install -r requirements.txt

# Redémarrer le backend
python manage.py runserver
```

### Le Frontend ne Démarre Pas

**Erreur : "Port already in use"**
```bash
# Tuer le processus sur le port 3000
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Redémarrer le frontend
npm run dev
```

**Erreur : "Module not found"**
```bash
# Installer les dépendances
npm install

# Redémarrer le frontend
npm run dev
```

### La Correction ne Fonctionne Pas

1. **Vérifiez que vous avez bien redémarré le backend**
2. **Videz le cache du navigateur** (Ctrl + Shift + Delete)
3. **Actualisez la page** (F5 ou Ctrl + F5)
4. **Vérifiez les logs du backend** dans le terminal
5. **Exécutez le script de test** : `python test_statut_essai.py`

## 📊 Commandes Utiles

### Créer des Données de Test
```bash
cd c:\Users\HP\Desktop\MOI\maxime-app\backend
python create_test_essai.py
```

### Vérifier les Échantillons en Base
```bash
cd c:\Users\HP\Desktop\MOI\maxime-app\backend
python manage.py shell

# Dans le shell Python :
from core.models import Echantillon, Essai
print(f"Échantillons en stockage: {Echantillon.objects.filter(statut='stockage').count()}")
print(f"Échantillons en essais: {Echantillon.objects.filter(statut='essais').count()}")
print(f"Essais en attente: {Essai.objects.filter(statut='attente').count()}")
print(f"Essais en cours: {Essai.objects.filter(statut='en_cours').count()}")
```

### Réinitialiser un Échantillon pour Tester
```bash
cd c:\Users\HP\Desktop\MOI\maxime-app\backend
python manage.py shell

# Dans le shell Python :
from core.models import Echantillon, Essai

# Trouver un échantillon
ech = Echantillon.objects.filter(code='S-0002/25').first()

# Remettre en stockage
ech.statut = 'stockage'
ech.save()

# Remettre les essais en attente
for essai in ech.essais.all():
    essai.statut = 'attente'
    essai.date_debut = None
    essai.operateur = ''
    essai.save()

print(f"Échantillon {ech.code} réinitialisé")
```

## ✅ Checklist de Vérification

- [ ] Backend Django démarré (http://127.0.0.1:8000)
- [ ] Frontend React démarré (http://localhost:3000)
- [ ] Test automatique réussi (`python test_statut_essai.py`)
- [ ] Connexion avec `operateur_route` fonctionne
- [ ] Les échantillons s'affichent correctement
- [ ] Le démarrage d'un essai change le statut de l'échantillon
- [ ] Le badge de statut s'affiche correctement

## 📞 Support

Si vous rencontrez des problèmes :
1. Consultez les logs du backend dans le terminal
2. Consultez la console du navigateur (F12)
3. Exécutez le script de test : `python test_statut_essai.py`
4. Consultez les fichiers de documentation :
   - `CORRECTION_STATUT_ESSAIS.md`
   - `SOLUTION_STATUT_ESSAIS.md`
   - `GUIDE_OPERATEUR_ROUTE.md`

---

**Bonne chance ! 🚀**

La correction est maintenant appliquée et testée. Vous devriez voir le changement de statut automatique quand l'opérateur route démarre un essai.
