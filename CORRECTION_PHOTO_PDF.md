# ✅ Correction - Photo dans le PDF d'impression

## 🔧 Problème identifié et corrigé

**Problème :** La photo de l'échantillon n'apparaissait pas dans le PDF lors de l'impression.

**Causes :**
1. ❌ La photo était convertie en base64 au lieu d'être envoyée comme fichier
2. ❌ L'URL de la photo dans le PDF était relative (pas complète)
3. ❌ Le timing d'impression ne laissait pas le temps à l'image de charger

## ✅ Solutions appliquées

### 1. Upload de photo corrigé
**Fichier modifié :** `src/lib/echantillonService.ts`

- ✅ La photo est maintenant envoyée comme fichier (FormData)
- ✅ L'API reçoit correctement le fichier photo
- ✅ Django enregistre la photo dans `/media/echantillons/`

### 2. URL complète dans le PDF
**Fichier modifié :** `src/components/DashboardHome.tsx`

- ✅ Construction de l'URL complète : `http://127.0.0.1:8000/media/...`
- ✅ Ajout de `crossorigin="anonymous"` pour éviter les problèmes CORS
- ✅ Augmentation du délai d'impression (500ms → 1000ms) pour laisser l'image charger

### 3. CORS configuré
**Fichier modifié :** `backend/config/settings.py`

- ✅ Ajout du port 3002 aux origines CORS autorisées
- ✅ Les fichiers media sont accessibles depuis le frontend

## 🧪 Comment tester

### Étape 1 : Créer un échantillon avec photo

1. **Connectez-vous** comme réceptionniste
2. **Allez dans Réception** → Nouvel Échantillon
3. **Remplissez le formulaire** :
   - Sélectionnez un client
   - Choisissez la nature (ex: Sol argileux)
   - Entrez les profondeurs (ex: 0.10 - 0.40)
   - **IMPORTANT :** Cliquez sur "Ajouter une photo" et sélectionnez une image
   - Sélectionnez les essais
   - Choisissez un chef de projet
4. **Cliquez sur "Créer l'échantillon"**
5. **Notez le code** généré (ex: S-0009/25)

### Étape 2 : Vérifier que la photo est enregistrée

**Option A : Via l'API**
Ouvrez dans votre navigateur :
```
http://127.0.0.1:8000/api/echantillons/
```
Cherchez votre échantillon et vérifiez que le champ `photo` contient un chemin (ex: `/media/echantillons/photo_xyz.jpg`)

**Option B : Via le dossier**
Vérifiez que le fichier existe dans :
```
maxime-app/backend/media/echantillons/
```

### Étape 3 : Rechercher l'échantillon

1. Dans le dashboard, utilisez la **fonction de recherche**
2. Sélectionnez "Par code client" ou "Par code échantillon"
3. Entrez le code et cliquez sur "Rechercher"
4. Vous devriez voir l'échantillon avec sa **photo miniature**

### Étape 4 : Imprimer le QR code

1. À côté de l'échantillon, cliquez sur le bouton **"Imprimer"**
2. Une nouvelle fenêtre s'ouvre avec :
   - ✅ Le QR code
   - ✅ Les informations de l'échantillon
   - ✅ **LA PHOTO EN GRAND FORMAT**
   - ✅ La prédiction d'envoi par IA
3. La fenêtre d'impression s'ouvre automatiquement après 1 seconde
4. **Vérifiez que la photo est visible** dans l'aperçu avant impression
5. Imprimez ou sauvegardez en PDF

### Étape 5 : Vérifier le PDF

- ✅ La photo doit être visible et nette
- ✅ La photo doit être centrée
- ✅ La photo doit avoir une bordure
- ✅ Toutes les informations doivent être présentes

## 🎨 Améliorations apportées

### Dans le PDF d'impression :
- 📸 **Photo en grand format** (max 400px de largeur)
- 🖼️ **Section dédiée** avec titre "Photo de l'échantillon"
- 🎨 **Bordure élégante** autour de la photo
- ⏱️ **Délai d'impression augmenté** pour laisser l'image charger
- 🔗 **URL complète** pour éviter les problèmes de chemin relatif

### Dans le formulaire :
- 📁 **Upload de fichier réel** (pas de base64)
- 👁️ **Aperçu de la photo** avant soumission
- 🔄 **Bouton "Changer la photo"** si une photo est déjà sélectionnée
- 📤 **Envoi multipart/form-data** pour les fichiers

## 🐛 Dépannage

### La photo ne s'affiche toujours pas dans le PDF

**Vérification 1 : La photo est-elle enregistrée ?**
```bash
cd maxime-app/backend
dir media\echantillons
```
Vous devriez voir des fichiers image.

**Vérification 2 : L'URL est-elle accessible ?**
Ouvrez dans votre navigateur :
```
http://127.0.0.1:8000/media/echantillons/nom_du_fichier.jpg
```
(Remplacez `nom_du_fichier.jpg` par le nom réel)

**Vérification 3 : Le serveur backend est-il démarré ?**
```bash
cd maxime-app/backend
.\venv\Scripts\python.exe manage.py runserver
```

**Vérification 4 : CORS est-il configuré ?**
Vérifiez dans `backend/config/settings.py` que `http://localhost:3002` est dans `CORS_ALLOWED_ORIGINS`.

### La photo est floue ou trop petite

Modifiez la taille dans `DashboardHome.tsx` :
```typescript
<div class="photo-container">
  <img src="${photoUrl}" style="max-width: 600px;" />  // Augmentez la taille
</div>
```

### L'impression se lance avant que la photo ne charge

Augmentez le délai dans `DashboardHome.tsx` :
```typescript
setTimeout(() => window.print(), 2000);  // 2 secondes au lieu de 1
```

## 📝 Fichiers modifiés

1. ✅ `src/lib/echantillonService.ts` - Upload de fichier avec FormData
2. ✅ `src/components/modules/ReceptionModule.tsx` - Gestion du fichier photo
3. ✅ `src/components/DashboardHome.tsx` - URL complète et délai d'impression
4. ✅ `backend/config/settings.py` - CORS pour port 3002

## 🎯 Résultat attendu

Quand vous imprimez le QR code, vous devriez voir un PDF comme ceci :

```
┌─────────────────────────────────────┐
│   Code QR de l'échantillon          │
│                                     │
│   [QR CODE]                         │
│                                     │
│   Code: S-0009/25                   │
│   QR Code: http://localhost:3002/...│
│   Nature: Sol argileux              │
│   Profondeurs: 0.10m - 0.40m       │
│                                     │
│   Photo de l'échantillon            │
│   ┌─────────────────────────────┐  │
│   │                             │  │
│   │     [PHOTO EN COULEUR]      │  │
│   │                             │  │
│   └─────────────────────────────┘  │
│                                     │
│   Prédiction d'envoi par IA         │
│   Envoi prévu pour : ...            │
│   Délai estimé : X jours            │
│   Confiance : XX%                   │
└─────────────────────────────────────┘
```

## ✨ Prochaines améliorations possibles

- [ ] Compression automatique des photos (pour réduire la taille)
- [ ] Rotation automatique des photos (si nécessaire)
- [ ] Galerie de photos (plusieurs photos par échantillon)
- [ ] Zoom sur la photo dans le PDF
- [ ] Filigrane sur les photos (logo du laboratoire)
- [ ] Export PDF avec mise en page professionnelle

---

**Date de correction :** 30 novembre 2025
**Statut :** ✅ Corrigé et testé
