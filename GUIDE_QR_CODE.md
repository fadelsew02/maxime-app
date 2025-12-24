# Guide d'utilisation des QR Codes avec Photos

## 🎯 Fonctionnalité implémentée

Les QR codes générés pour chaque échantillon contiennent maintenant une **URL complète** qui pointe vers une page web affichant :
- ✅ Le code de l'échantillon
- ✅ La photo de l'échantillon (si disponible)
- ✅ Toutes les informations détaillées (client, nature, profondeur, etc.)
- ✅ Les essais demandés
- ✅ Le statut actuel

## 📱 Comment ça marche ?

### 1. Scanner le QR Code
Utilisez n'importe quelle application de scan de QR code sur votre smartphone :
- **iPhone** : Ouvrez l'appareil photo natif
- **Android** : Utilisez Google Lens ou l'appareil photo natif
- **Ordinateur** : Utilisez une extension de navigateur ou une webcam

### 2. Accéder à la page de détails
Le QR code contient une URL du type :
```
http://localhost:3002/echantillon/S-0001-25
```

Lorsque vous scannez le code, votre navigateur s'ouvre automatiquement sur cette page.

### 3. Voir les informations complètes
La page affiche :
- **Photo de l'échantillon** en grand format
- **Informations du client** (nom, contact, projet, etc.)
- **Caractéristiques de l'échantillon** (nature, profondeur, sondage, etc.)
- **Essais demandés** avec badges
- **QR Code** pour réimprimer si nécessaire
- **Bouton d'impression** pour imprimer la fiche complète

## 🔧 Configuration

### URL de base
L'URL de base est configurée dans le modèle Django :
```python
# maxime-app/backend/core/models.py
base_url = "http://localhost:3002"
```

**⚠️ Important pour la production :**
Avant de déployer en production, modifiez cette URL pour pointer vers votre domaine réel :
```python
base_url = "https://votre-domaine.com"
```

### Mise à jour des QR codes existants
Si vous changez l'URL de base, exécutez le script de mise à jour :
```bash
cd maxime-app/backend
.\venv\Scripts\python.exe update_qr_codes.py
```

## 📋 Test de la fonctionnalité

### Étape 1 : Créer un échantillon avec photo
1. Connectez-vous en tant que **réceptionniste**
2. Allez dans le module **Réception**
3. Créez un nouveau client (si nécessaire)
4. Créez un échantillon et **téléchargez une photo**
5. Le QR code est généré automatiquement

### Étape 2 : Imprimer le QR code
1. Dans la liste des échantillons, cliquez sur **"Imprimer"**
2. Une fenêtre s'ouvre avec le QR code et les informations
3. Imprimez ou sauvegardez en PDF

### Étape 3 : Scanner le QR code
1. Utilisez votre smartphone pour scanner le QR code imprimé
2. Votre navigateur s'ouvre sur la page de détails
3. Vous voyez la photo et toutes les informations de l'échantillon

### Étape 4 : Accès direct (sans scan)
Vous pouvez aussi accéder directement à la page en tapant l'URL :
```
http://localhost:3002/echantillon/S-0001-25
```
(Remplacez `S-0001-25` par le code de votre échantillon)

## 🎨 Personnalisation

### Modifier l'apparence de la page de détails
Le fichier à modifier : `maxime-app/src/components/EchantillonDetails.tsx`

### Ajouter des informations supplémentaires
Vous pouvez ajouter d'autres champs dans la page de détails en modifiant le composant `EchantillonDetails`.

## 🔒 Sécurité

**Note importante :** La page de détails est actuellement **publique** (accessible sans connexion). Cela permet de scanner les QR codes sans avoir à se connecter.

Si vous souhaitez protéger cette page :
1. Modifiez `App.tsx` pour ajouter une vérification d'authentification
2. Ou créez un système de tokens temporaires pour l'accès

## 📊 Avantages de cette solution

✅ **Traçabilité** : Chaque échantillon a une page web unique
✅ **Mobilité** : Accessible depuis n'importe quel appareil avec un navigateur
✅ **Visuel** : La photo aide à identifier rapidement l'échantillon
✅ **Complet** : Toutes les informations en un seul endroit
✅ **Imprimable** : Possibilité d'imprimer la fiche complète
✅ **Pas d'app mobile** : Fonctionne avec n'importe quel scanner de QR code

## 🐛 Dépannage

### Le QR code ne s'affiche pas
- Vérifiez que le serveur backend est démarré
- Vérifiez que l'échantillon a bien un `qr_code` dans la base de données

### La page de détails affiche "Échantillon non trouvé"
- Vérifiez que le code dans l'URL est correct
- Vérifiez que l'échantillon existe dans la base de données
- Vérifiez que le serveur backend est accessible

### La photo ne s'affiche pas
- Vérifiez que le fichier photo existe dans `backend/media/echantillons/`
- Vérifiez que Django sert correctement les fichiers media
- Vérifiez la configuration `MEDIA_URL` et `MEDIA_ROOT` dans `settings.py`

### L'URL du QR code pointe vers localhost
- C'est normal en développement
- En production, modifiez `base_url` dans `models.py` et relancez `update_qr_codes.py`

## 📝 Prochaines étapes possibles

- [ ] Ajouter un historique des scans (qui a scanné, quand)
- [ ] Permettre l'ajout de commentaires via la page publique
- [ ] Générer des QR codes en couleur avec logo
- [ ] Créer des étiquettes imprimables avec QR code et photo miniature
- [ ] Ajouter une galerie de photos (plusieurs photos par échantillon)
