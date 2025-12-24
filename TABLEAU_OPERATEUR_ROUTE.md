# Tableau Spécifique pour Opérateur Route

## Vue d'ensemble
Le tableau de l'accueil pour les opérateurs route affiche maintenant des colonnes spécifiques pour chaque type d'essai de la section route.

## Structure du Tableau

### Pour Opérateur Route (route@snertp.com)
Le tableau affiche **6 colonnes** :

1. **Code échantillon** - Code unique de l'échantillon avec badge URGENT si prioritaire
2. **Date réception** - Date de réception au laboratoire
3. **Analyse granulométrique** - Date d'envoi planifiée pour l'essai AG
4. **Proctor** - Date d'envoi planifiée pour l'essai Proctor
5. **CBR** - Date d'envoi planifiée pour l'essai CBR
6. **Date retour client** - Date prévue de retour des résultats au client

### Pour Autres Rôles (Directeur, Chef de Service)
Le tableau affiche **5 colonnes** :

1. **Code échantillon**
2. **Date réception**
3. **Date envoi essais**
4. **Date fin essais**
5. **Date retour client**

## Fonctionnement

### Création d'un échantillon
1. Le réceptionniste crée un échantillon dans le module Réception
2. Il sélectionne les essais à effectuer (AG, Proctor, CBR, etc.)
3. Les essais sont automatiquement créés et associés à l'échantillon

### Planification des essais
1. Le responsable matériaux va dans le module Stockage
2. Il planifie l'envoi de l'échantillon aux sections
3. Pour chaque essai, une `date_reception` est définie (date d'envoi planifiée)
4. Cette date apparaît automatiquement dans le tableau de l'opérateur route

### Affichage pour l'opérateur route
- L'opérateur voit tous les échantillons avec leurs essais planifiés
- Chaque colonne d'essai affiche la date d'envoi planifiée
- Si un essai n'est pas planifié, la colonne affiche "-"
- Les échantillons urgents sont clairement identifiés

## Données Affichées

### Colonnes d'essais
- **Analyse granulométrique** : `essai.date_reception` pour l'essai de type "AG"
- **Proctor** : `essai.date_reception` pour l'essai de type "Proctor"
- **CBR** : `essai.date_reception` pour l'essai de type "CBR"

### Format des dates
Toutes les dates sont formatées en français : `30/11/2025`

## Modifications Techniques

### Backend
- Modèle `Essai` : Utilise le champ `date_reception` pour la date d'envoi planifiée
- Serializer `EssaiSerializer` : Inclut tous les champs nécessaires
- Serializer `EchantillonSerializer` : Inclut les essais complets avec leurs dates

### Frontend
- `DashboardHome.tsx` : Tableau conditionnel selon le rôle de l'utilisateur
- Chargement des essais complets depuis l'API
- Affichage dynamique des dates de planification
- Format français pour toutes les dates

## Exemple de Flux Complet

1. **Réception** (réceptionniste)
   - Crée échantillon S-0014/25
   - Sélectionne essais : AG, Proctor, CBR
   - Essais créés avec statut "attente"

2. **Stockage** (responsable matériaux)
   - Planifie l'envoi pour le 01/12/2025
   - Définit `date_reception = 01/12/2025` pour chaque essai

3. **Accueil Opérateur Route**
   - Voit l'échantillon S-0014/25
   - Colonnes affichent :
     - AG : 01/12/2025
     - Proctor : 01/12/2025
     - CBR : 01/12/2025

4. **Traitement**
   - L'opérateur route effectue les essais
   - Met à jour les statuts et résultats
   - Les dates restent visibles pour le suivi

## Avantages

✅ Vue claire des essais à effectuer
✅ Dates de planification visibles immédiatement
✅ Suivi individuel de chaque type d'essai
✅ Interface adaptée au rôle de l'utilisateur
✅ Confidentialité préservée (pas de nom client, pas de statut)
