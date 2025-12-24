# 🧪 Guide de Test - QR Codes avec Photos

## ✅ Étape 1 : Vérifier que les serveurs sont démarrés

### Backend (Django)
Ouvrez : http://127.0.0.1:8000/api/echantillons/
- Vous devriez voir la liste des échantillons en JSON
- Vérifiez que le champ `qr_code` contient une URL complète

### Frontend (React)
Ouvrez : http://localhost:3002/
- Vous devriez voir la page de connexion
- Connectez-vous avec un compte réceptionniste

## ✅ Étape 2 : Tester l'accès direct à une page de détails

Ouvrez dans votre navigateur :
```
http://localhost:3002/echantillon/S-0008-25
```

**Ce que vous devriez voir :**
- ✅ Le code de l'échantillon (S-0008/25)
- ✅ Le statut avec badge coloré
- ✅ Les informations du client (COLAS SE)
- ✅ La nature de l'échantillon (Sol argileux)
- ✅ Les profondeurs
- ✅ La date de réception
- ✅ Le QR code sur le côté
- ✅ Un bouton "Imprimer"
- ✅ Un bouton "Retour"

**Note :** La photo ne s'affichera pas car cet échantillon n'en a pas encore.

## ✅ Étape 3 : Créer un échantillon avec photo

### 3.1 Connectez-vous
- URL : http://localhost:3002/
- Utilisateur : `receptionniste` (ou autre compte réceptionniste)
- Mot de passe : celui que vous avez configuré

### 3.2 Créez un client (si nécessaire)
1. Allez dans le module **Réception**
2. Cliquez sur **"Nouveau Client"**
3. Remplissez les informations
4. Sauvegardez

### 3.3 Créez un échantillon avec photo
1. Dans le module **Réception**
2. Cliquez sur **"Nouvel Échantillon"**
3. Sélectionnez le client
4. Remplissez les informations (nature, profondeur, etc.)
5. **IMPORTANT :** Cliquez sur "Choisir un fichier" et sélectionnez une photo
6. Sélectionnez les essais demandés
7. Cliquez sur **"Créer l'échantillon"**

### 3.4 Notez le code de l'échantillon
Après création, notez le code généré (ex: S-0009/25)

## ✅ Étape 4 : Voir la page de détails avec photo

Ouvrez dans votre navigateur :
```
http://localhost:3002/echantillon/S-0009-25
```
(Remplacez S-0009-25 par le code de votre échantillon)

**Ce que vous devriez voir maintenant :**
- ✅ Toutes les informations de l'échantillon
- ✅ **LA PHOTO** en grand format en haut de la page
- ✅ Les informations du client
- ✅ Le QR code

## ✅ Étape 5 : Imprimer le QR code

### 5.1 Depuis la liste des échantillons
1. Dans le dashboard, cherchez votre échantillon
2. Cliquez sur le bouton **"Imprimer"** à côté du QR code
3. Une fenêtre s'ouvre avec :
   - Le QR code en grand
   - Les informations de l'échantillon
   - La photo (si disponible)
4. Imprimez ou sauvegardez en PDF

### 5.2 Depuis la page de détails
1. Ouvrez la page de détails de l'échantillon
2. Cliquez sur le bouton **"Imprimer cette page"**
3. La page complète s'imprime avec la photo

## ✅ Étape 6 : Scanner le QR code avec un smartphone

### 6.1 Imprimez le QR code
- Imprimez la page avec le QR code
- Ou affichez-le sur un autre écran

### 6.2 Scannez avec votre smartphone

**iPhone :**
1. Ouvrez l'app **Appareil Photo**
2. Pointez vers le QR code
3. Une notification apparaît en haut
4. Tapez dessus pour ouvrir l'URL

**Android :**
1. Ouvrez l'app **Appareil Photo** ou **Google Lens**
2. Pointez vers le QR code
3. Tapez sur le lien qui apparaît

### 6.3 Vérifiez le résultat
- Votre navigateur mobile s'ouvre
- Vous voyez la page de détails
- La photo s'affiche (si disponible)
- Toutes les informations sont visibles

## 🎯 Checklist de test

- [ ] Backend accessible (http://127.0.0.1:8000/)
- [ ] Frontend accessible (http://localhost:3002/)
- [ ] Page de détails accessible directement
- [ ] Client créé
- [ ] Échantillon créé avec photo
- [ ] Photo visible sur la page de détails
- [ ] QR code imprimé
- [ ] QR code scanné avec smartphone
- [ ] Page de détails ouverte sur smartphone
- [ ] Photo visible sur smartphone

## 🐛 Dépannage

### Le serveur frontend ne répond pas
```bash
cd maxime-app
npm run dev
```

### Le serveur backend ne répond pas
```bash
cd maxime-app/backend
.\venv\Scripts\python.exe manage.py runserver
```

### La page de détails affiche "Échantillon non trouvé"
- Vérifiez que le code est correct
- Vérifiez que l'échantillon existe dans la base de données
- Essayez avec un autre code (S-0008-25, S-0007-25, etc.)

### La photo ne s'affiche pas
- Vérifiez que vous avez bien téléchargé une photo lors de la création
- Vérifiez que le fichier existe dans `backend/media/echantillons/`
- Vérifiez que Django sert les fichiers media (devrait être automatique en dev)

### Le QR code ne scanne pas
- Assurez-vous que le QR code est bien imprimé (pas flou)
- Essayez avec une autre app de scan
- Vérifiez que votre smartphone est connecté au même réseau (pour localhost)

### Le smartphone ne peut pas accéder à localhost
**Solution 1 : Utiliser l'IP locale**
1. Trouvez votre IP locale (ex: 192.168.1.100)
2. Modifiez `base_url` dans `models.py` :
   ```python
   base_url = "http://192.168.1.100:3002"
   ```
3. Relancez `update_qr_codes.py`

**Solution 2 : Utiliser ngrok (pour test)**
1. Installez ngrok : https://ngrok.com/
2. Lancez : `ngrok http 3002`
3. Utilisez l'URL fournie comme `base_url`

## 📸 Exemple de résultat attendu

Quand vous scannez le QR code, vous devriez voir une page comme celle-ci :

```
┌─────────────────────────────────────────┐
│  ← Retour                               │
│                                         │
│  Détails de l'échantillon               │
│  Informations complètes de l'échantillon│
│                                         │
│  ┌───────────────────────────────────┐ │
│  │                                   │ │
│  │     [PHOTO DE L'ÉCHANTILLON]     │ │
│  │                                   │ │
│  └───────────────────────────────────┘ │
│                                         │
│  S-0009/25              [Stockage]      │
│                                         │
│  👤 Client                              │
│  Code: CLI-001                          │
│  Nom: COLAS SE                          │
│  Contact: Mr Géraud                     │
│  Projet: COLAS SA                       │
│                                         │
│  📊 Caractéristiques                    │
│  Nature: Sol argileux                   │
│  Profondeur: 0.10m - 0.40m             │
│  Date: 2025-11-30                       │
│  Sondage: Carotte                       │
│                                         │
│  🧪 Essais demandés                     │
│  [AG] [Proctor] [CBR]                  │
│                                         │
│  [Imprimer cette page]                  │
└─────────────────────────────────────────┘
```

## ✨ Félicitations !

Si tous les tests passent, votre système de QR codes avec photos est **100% fonctionnel** ! 🎉

Vous pouvez maintenant :
- Créer des échantillons avec photos
- Imprimer les QR codes
- Scanner les codes pour voir les détails
- Partager les liens directement
