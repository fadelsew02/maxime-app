# 🔍 Guide de Dépannage - Module Décodification

## ❌ Problème : Aucun résultat ne s'affiche dans le module décodification

### 🎯 Solution Rapide

#### Étape 1 : Vérifier que les essais sont bien envoyés

1. **Connectez-vous en tant qu'opérateur** :
   - Username: `operateur_route` ou `operateur_meca`
   - Password: `demo123`

2. **Vérifiez le statut des essais** :
   - Les essais doivent avoir le statut **"Terminé"** (badge vert)
   - Un bouton **"Envoyer à la décodification"** doit être visible

3. **Envoyez les essais** :
   - Ouvrez chaque essai terminé
   - Cliquez sur **"Envoyer à la décodification"**
   - Vous devriez voir un message de confirmation

#### Étape 2 : Vérifier dans le localStorage

1. **Ouvrez la console du navigateur** (F12)

2. **Copiez et collez ce script** :
```javascript
// Copier tout le contenu du fichier debug-localStorage.js
```

3. **Analysez les résultats** :
   - Si "AUCUN ESSAI ENVOYÉ TROUVÉ" → Les opérateurs n'ont pas envoyé les essais
   - Si des essais sont listés → Le problème vient du module de décodification

#### Étape 3 : Actualiser le module décodification

1. **Connectez-vous en tant que réceptionniste** :
   - Username: `receptionniste`
   - Password: `demo123`

2. **Allez dans le module Décodification**

3. **Cliquez sur "Actualiser"**

4. **Les essais devraient maintenant apparaître** ✅

---

## 🔧 Corrections Appliquées

### Modification du module DecodificationModule.tsx

Le module a été corrigé pour détecter les essais envoyés avec plusieurs critères :

```typescript
const isEnvoye = essaiData.envoye === true || 
               essaiData.statut === 'termine' || 
               essaiData.statut === 'en_attente_validation' ||
               (essaiData.dateEnvoi && essaiData.dateEnvoi !== '');
```

### Logs de débogage ajoutés

Des messages de console ont été ajoutés pour faciliter le diagnostic :
- 🔍 Recherche des essais dans localStorage
- 📋 Détails de chaque essai trouvé
- ✅ Nombre d'échantillons avec essais envoyés

---

## 📝 Workflow Complet

### 1️⃣ Opérateur Route/Méca

1. Se connecter avec `operateur_route` ou `operateur_meca`
2. Ouvrir un essai (AG, Proctor, CBR, Oedometre, Cisaillement)
3. Cliquer sur **"Démarrer l'essai"**
4. Remplir les résultats
5. Télécharger un fichier Excel
6. Cliquer sur **"Envoyer à la décodification"**

### 2️⃣ Réceptionniste (Décodification)

1. Se connecter avec `receptionniste`
2. Aller dans **"Décodification"**
3. Les essais envoyés apparaissent automatiquement
4. Cliquer sur **"Voir détails"** pour chaque échantillon
5. Valider ou rejeter chaque essai
6. Envoyer au traitement quand tous les essais sont acceptés

---

## 🐛 Problèmes Courants

### Problème 1 : "Aucun échantillon en attente de décodification"

**Causes possibles** :
- Les opérateurs n'ont pas envoyé les essais
- Les essais ne sont pas terminés
- Le localStorage est vide

**Solution** :
1. Vérifier avec le script de diagnostic
2. Demander aux opérateurs d'envoyer les essais
3. Actualiser la page

### Problème 2 : Les essais apparaissent mais sans résultats

**Causes possibles** :
- Les résultats n'ont pas été saisis
- Le fichier n'a pas été téléchargé

**Solution** :
1. Retourner au compte opérateur
2. Ouvrir l'essai
3. Vérifier que tous les champs sont remplis
4. Renvoyer l'essai

### Problème 3 : Les essais disparaissent après actualisation

**Causes possibles** :
- Le localStorage a été vidé
- Les données ont été supprimées

**Solution** :
1. Ne pas vider le localStorage
2. Recréer les essais si nécessaire

---

## 🔑 Comptes de Test

| Rôle | Username | Password |
|------|----------|----------|
| Opérateur Route | `operateur_route` | `demo123` |
| Opérateur Méca | `operateur_meca` | `demo123` |
| Réceptionniste | `receptionniste` | `demo123` |

---

## 📞 Support

Si le problème persiste après avoir suivi ce guide :

1. Ouvrez la console du navigateur (F12)
2. Exécutez le script de diagnostic
3. Copiez les résultats
4. Partagez-les pour analyse

---

**Date de création** : 29 novembre 2025  
**Dernière mise à jour** : 29 novembre 2025
