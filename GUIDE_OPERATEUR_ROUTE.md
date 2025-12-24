# 👨‍🔬 Guide de l'Opérateur Route

## 🔐 Connexion

**Compte :** `operateur_route`  
**Mot de passe :** `demo123`  
**URL :** http://localhost:3000

## 📋 Votre Rôle

En tant qu'opérateur route, vous êtes responsable de :
- Réaliser les essais de la section Route (AG, Proctor, CBR)
- Saisir les résultats des essais
- Marquer les essais comme terminés

## 🎯 Workflow de Travail

### 1️⃣ Voir les Échantillons Assignés

Quand vous vous connectez, vous voyez :
- La liste des échantillons avec des essais route
- Le code de chaque échantillon (ex: S-0001/25)
- Les types d'essais à réaliser (AG, Proctor, CBR)
- Le statut de chaque essai

### 2️⃣ Démarrer un Essai

1. **Cliquez** sur le bouton de l'essai à réaliser (AG, Proctor ou CBR)
2. **Remplissez** les informations :
   - Votre nom (opérateur)
   - Date de début (par défaut : aujourd'hui)
   - La date de fin est calculée automatiquement
3. **Cliquez** sur "Démarrer l'essai"

**✨ Nouveau :** Quand vous démarrez un essai, le statut de l'échantillon change automatiquement de "Stockage" à "En essais" !

### 3️⃣ Réaliser l'Essai

Pendant que vous réalisez l'essai :
- Le statut de l'essai est "En cours"
- Vous pouvez saisir les résultats au fur et à mesure
- Vous pouvez ajouter des commentaires

### 4️⃣ Saisir les Résultats

#### Pour l'Analyse Granulométrique (AG) :
- % passant à 2mm *
- % passant à 80µm
- Coefficient d'uniformité (Cu)

#### Pour le Proctor :
- Type Proctor (Normal ou Modifié)
- Densité sèche optimale (g/cm³) *
- Teneur en eau optimale (%) *

#### Pour le CBR :
- CBR à 95% OPM (%) *
- CBR à 98% OPM (%)
- CBR à 100% OPM (%)
- Gonflement (%)

**Note :** Les champs marqués d'un * sont obligatoires

### 5️⃣ Télécharger le Fichier Excel

1. **Cliquez** sur "Sélectionner un fichier"
2. **Choisissez** votre fichier Excel (.xlsx ou .xls)
3. Le nom du fichier s'affiche en vert quand il est sélectionné

### 6️⃣ Terminer l'Essai

1. **Vérifiez** que tous les résultats sont saisis
2. **Vérifiez** que le fichier Excel est téléchargé
3. **Cliquez** sur "Terminer l'essai"

L'essai est maintenant terminé et envoyé automatiquement à la décodification !

## 🎨 Codes Couleurs

### Statuts des Essais :
- 🟡 **Jaune** : En attente (vous devez le démarrer)
- 🔵 **Bleu** : En cours (vous êtes en train de le réaliser)
- 🟢 **Vert** : Terminé (essai fini et envoyé)

### Statuts des Échantillons :
- 🟡 **Jaune** : Stockage (essais planifiés)
- 🔵 **Bleu** : En essais (au moins un essai en cours) ✅
- 🟢 **Vert** : Terminé (tous les essais finis)

## 🔍 Filtres Disponibles

Vous pouvez filtrer les échantillons par :
- **Code échantillon** : Recherchez un code spécifique
- **Type d'essai** : Affichez uniquement les échantillons avec AG, Proctor ou CBR

## ⚠️ Points Importants

1. **Date de début** : Par défaut, c'est la date du jour
2. **Date de fin** : Calculée automatiquement (début + durée estimée)
3. **Fichier Excel** : Obligatoire pour terminer l'essai
4. **Résultats** : Les champs marqués * sont obligatoires
5. **Commentaires** : Ajoutez des observations si nécessaire

## 🆘 Problèmes Courants

### Je ne vois pas d'échantillons
- Vérifiez que vous êtes bien connecté avec le compte `operateur_route`
- Vérifiez que le Responsable Matériaux a planifié des essais
- Actualisez la page (F5)

### Je ne peux pas démarrer un essai
- Vérifiez que l'essai est en statut "En attente"
- Vérifiez que vous avez saisi votre nom (opérateur)
- Vérifiez que la date de début est renseignée

### Je ne peux pas terminer un essai
- Vérifiez que tous les champs obligatoires (*) sont remplis
- Vérifiez que vous avez téléchargé un fichier Excel
- Vérifiez que l'essai est en statut "En cours"

### Le statut de l'échantillon ne change pas
- ✅ **Résolu !** Le statut change maintenant automatiquement quand vous démarrez un essai
- Si le problème persiste, contactez l'administrateur

## 📊 Exemple de Workflow Complet

### Exemple : Échantillon S-0001/25 avec AG, Proctor et CBR

1. **Connexion** : Vous vous connectez avec `operateur_route`
2. **Visualisation** : Vous voyez l'échantillon S-0001/25 avec 3 essais en attente
3. **Démarrage AG** :
   - Cliquez sur "AG"
   - Saisissez votre nom : "Kouadio YAO"
   - Date début : 16/12/2025 (aujourd'hui)
   - Date fin calculée : 21/12/2025 (5 jours)
   - Cliquez "Démarrer l'essai"
   - ✅ Le statut de l'échantillon passe à "En essais"
4. **Réalisation AG** :
   - Vous réalisez l'essai au laboratoire
   - Vous saisissez les résultats :
     - % passant à 2mm : 85.5
     - % passant à 80µm : 45.2
     - Coefficient Cu : 6.5
   - Vous téléchargez le fichier Excel
   - Vous ajoutez un commentaire : "Essai réalisé selon la norme NF P94-056"
5. **Fin AG** :
   - Cliquez "Terminer l'essai"
   - L'essai AG est maintenant terminé
6. **Démarrage Proctor** :
   - Vous répétez le processus pour le Proctor
7. **Démarrage CBR** :
   - Vous répétez le processus pour le CBR
8. **Fin** :
   - Quand tous les essais sont terminés, l'échantillon passe automatiquement à "Décodification"

## 📞 Contact

En cas de problème technique :
- Contactez l'administrateur système
- Consultez le fichier `SOLUTION_STATUT_ESSAIS.md`
- Vérifiez que le backend est bien démarré

---

**Laboratoire SNERTP**  
**Section Route**  
**Version :** 2.0 (avec changement automatique de statut)
