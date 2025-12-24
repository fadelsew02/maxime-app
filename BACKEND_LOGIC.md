# Migration de la logique vers le Backend

## Vue d'ensemble

Toute la logique métier a été déplacée du frontend (DashboardHome.tsx) vers le backend Django pour une meilleure architecture et performance.

## Nouveaux fichiers créés

### 1. `backend/core/utils.py`

Contient toutes les fonctions utilitaires pour :
- Calcul des jours ouvrables (excluant week-ends et jours fériés)
- Comptage des échantillons en attente par type d'essai
- Calcul des dates d'envoi et de retour prédites
- Génération des dates d'envoi par type d'essai

**Fonctions principales :**
- `ajouter_jours_ouvrables(date_debut, nombre_jours)` : Ajoute des jours ouvrables
- `compter_echantillons_en_attente()` : Compte les échantillons en attente par type
- `calculer_date_envoi_et_retour(echantillon)` : Calcule les prédictions de dates
- `generer_dates_envoi_par_type(echantillons, type_essai, date_base, capacite)` : Génère les dates d'envoi

## Nouveaux endpoints API

### Endpoints généraux

#### `GET /api/echantillons/{id}/prediction_dates/`
Retourne la prédiction des dates d'envoi et de retour pour un échantillon spécifique.

**Réponse :**
```json
{
  "date_envoi": "lundi 08 décembre 2025",
  "date_envoi_iso": "2025-12-08",
  "confidence": 90,
  "raison": "Basé sur les contraintes réelles du laboratoire",
  "delai_jours": 0,
  "date_retour": "mercredi 17 décembre 2025",
  "date_retour_iso": "2025-12-17",
  "confidence_retour": 85,
  "raison_retour": "Délai total: 5 jours d'essais + 2 jours de traitement",
  "delai_retour_jours": 7,
  "charge_par_essai": {
    "AG": 0,
    "Proctor": 0,
    "CBR": 0,
    "Oedometre": 0,
    "Cisaillement": 0
  },
  "details_par_essai": {
    "AG": {
      "delai_attente": 0,
      "duree_essai": 5,
      "date_envoi": "lundi 08 décembre 2025",
      "date_retour": "mercredi 17 décembre 2025",
      "charge_actuelle": 0
    }
  }
}
```

#### `GET /api/dashboard/charge_laboratoire/`
Retourne la charge actuelle du laboratoire par type d'essai.

**Réponse :**
```json
{
  "AG": 5,
  "Proctor": 3,
  "CBR": 2,
  "Oedometre": 8,
  "Cisaillement": 1
}
```

### Endpoints des dashboards

#### `GET /api/echantillons/dashboard_meca/`
Dashboard pour les essais mécaniques (Oedométrique et Cisaillement).

**Réponse :** Liste des échantillons avec dates d'envoi calculées pour chaque essai mécanique.

#### `GET /api/echantillons/dashboard_route/`
Dashboard pour les essais route (AG, Proctor, CBR).

**Réponse :** Liste des échantillons avec dates d'envoi calculées pour chaque essai route.

#### `GET /api/echantillons/dashboard_traitement/`
Dashboard pour le traitement groupé par client.

**Réponse :**
```json
[
  {
    "clientName": "Nom du client",
    "nombreEchantillons": 5,
    "dateReception": "01/12/2025",
    "dateTraitement": "En traitement",
    "dateRetourClient": "15/12/2025"
  }
]
```

#### `GET /api/echantillons/dashboard_chef_projet/`
Dashboard pour chef de projet groupé par client.

**Réponse :**
```json
[
  {
    "clientName": "Nom du client",
    "nombreEchantillons": 5,
    "dateReception": "01/12/2025",
    "dateTraitement": "-",
    "dateRetourClient": "mercredi 17 décembre 2025"
  }
]
```

#### `GET /api/echantillons/dashboard_directeur_technique/`
Dashboard pour directeur technique avec toutes les dates.

**Réponse :**
```json
[
  {
    "clientName": "Nom du client",
    "nombreEchantillons": 5,
    "dateReception": "01/12/2025",
    "dateTraitement": "-",
    "dateChefProjet": "-",
    "dateChefService": "-",
    "dateRetourClient": "mercredi 17 décembre 2025"
  }
]
```

## Logique de calcul des dates

### Contraintes du laboratoire

**Durées des essais (en jours) :**
- AG : 5 jours
- Proctor : 5 jours
- CBR : 9 jours
- Oedométrique : 18 jours
- Cisaillement : 4 jours

**Capacités quotidiennes :**
- AG : 5 essais/jour
- Proctor : 4 essais/jour
- CBR : 4 essais/jour
- Oedométrique : 10 essais simultanés sur 18 jours
- Cisaillement : 4 essais/jour

### Algorithme de calcul

1. **Comptage de la charge actuelle** : Compte tous les échantillons en statut "stockage" ou "essais" par type d'essai

2. **Calcul du délai d'attente** :
   - Pour les essais normaux : `délai = charge_actuelle / capacité_quotidienne`
   - Pour l'oedométrique : Si charge ≥ 10, `délai = (charge - 9) * 18 / 10`

3. **Date d'envoi** : `aujourd'hui + délai_max_attente` (en jours ouvrables)

4. **Date de retour** : `aujourd'hui + délai_attente + durée_essai_plus_long + 2 jours de traitement` (en jours ouvrables)

5. **Confiance** :
   - Base : 90%
   - Si délai > 5 jours : -15%
   - Si délai > 2 jours : -5%
   - Min : 75%, Max : 95%

### Jours ouvrables

Le calcul exclut automatiquement :
- Les week-ends (samedi et dimanche)
- Les jours fériés 2025 (Jour de l'an, Pâques, 1er mai, etc.)

## Migration du frontend

### Avant (Frontend)
```typescript
// Logique dans DashboardHome.tsx
function simulerIADateEnvoi(echantillon) {
  // Calculs complexes côté client
  // ...
}
```

### Après (Backend)
```typescript
// Appel API simple
const response = await fetch(
  `http://127.0.0.1:8000/api/echantillons/${id}/prediction_dates/`,
  {
    headers: {
      'Authorization': `Bearer ${token}`,
    }
  }
);
const prediction = await response.json();
```

## Avantages de cette architecture

1. **Performance** : Les calculs sont effectués côté serveur
2. **Cohérence** : Une seule source de vérité pour les calculs
3. **Maintenance** : Plus facile de modifier la logique métier
4. **Sécurité** : La logique métier n'est pas exposée au client
5. **Scalabilité** : Le backend peut être optimisé et mis en cache
6. **Testabilité** : Plus facile de tester la logique métier

## Prochaines étapes

Pour utiliser ces nouveaux endpoints dans le frontend :

1. Remplacer les appels à `simulerIADateEnvoi()` par des appels API
2. Utiliser les endpoints spécifiques pour chaque dashboard
3. Supprimer le code de calcul du frontend
4. Mettre en cache les résultats si nécessaire

## Exemple d'utilisation

```typescript
// Dans MecaDashboard
const loadEchantillons = async () => {
  const response = await fetch(
    'http://127.0.0.1:8000/api/echantillons/dashboard_meca/',
    {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
      }
    }
  );
  const data = await response.json();
  setEchantillons(data);
};

// Dans ReceptionnisteHome pour un échantillon
const loadPrediction = async (echantillonId) => {
  const response = await fetch(
    `http://127.0.0.1:8000/api/echantillons/${echantillonId}/prediction_dates/`,
    {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
      }
    }
  );
  const prediction = await response.json();
  return prediction;
};
```
