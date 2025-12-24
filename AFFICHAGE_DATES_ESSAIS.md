# Affichage des Dates d'Essais dans le Tableau Opérateur

## Résumé
Les dates de planification des essais (AG, Proctor, CBR) apparaissent maintenant dans le tableau de l'accueil des opérateurs route.

## Configuration Actuelle

### Backend
- **Modèle Essai** : Champ `date_reception` pour stocker la date d'envoi planifiée
- **Serializer** : `EssaiSerializer` inclut tous les champs nécessaires
- **API** : Endpoint `/api/essais/` disponible pour CRUD complet
- **Échantillons** : Les essais sont inclus dans la réponse de `/api/echantillons/`

### Frontend
- **Service** : `essaiService.ts` créé pour gérer les essais via l'API
- **DashboardHome** : Tableau conditionnel selon le rôle
  - Opérateur route : Colonnes AG, Proctor, CBR avec dates
  - Autres rôles : Colonnes générales

## Structure du Tableau pour Opérateur Route

| Code échantillon | Date réception | Analyse granulométrique | Proctor | CBR | Date retour client |
|------------------|----------------|-------------------------|---------|-----|-------------------|
| S-0013/25        | 30/11/2025     | 30/11/2025             | 30/11/2025 | 30/11/2025 | - |
| S-0012/25        | 30/11/2025     | 30/11/2025             | -       | 30/11/2025 | - |

## Fonctionnement

### 1. Création d'un échantillon
```
Réceptionniste → Module Réception
- Crée échantillon avec essais sélectionnés
- Essais créés automatiquement avec date_reception = date de réception échantillon
```

### 2. Planification (Future amélioration)
```
Responsable Matériaux → Module Stockage
- Sélectionne échantillon
- Définit date d'envoi pour chaque essai
- Met à jour essai.date_reception via API
```

### 3. Affichage pour opérateur route
```
Opérateur Route → Accueil
- Voit tous les échantillons
- Colonnes AG, Proctor, CBR affichent essai.date_reception
- Format français : 30/11/2025
```

## Données Affichées

### Code Frontend (DashboardHome.tsx)
```typescript
// Récupérer les dates des essais
const essaisDetails = (ech as any).essaisDetails || [];
const essaiAG = essaisDetails.find((e: any) => e.type === 'AG');
const essaiProctor = essaisDetails.find((e: any) => e.type === 'Proctor');
const essaiCBR = essaisDetails.find((e: any) => e.type === 'CBR');

// Afficher les dates
<td>{essaiAG?.date_reception ? formatDateFr(essaiAG.date_reception) : '-'}</td>
<td>{essaiProctor?.date_reception ? formatDateFr(essaiProctor.date_reception) : '-'}</td>
<td>{essaiCBR?.date_reception ? formatDateFr(essaiCBR.date_reception) : '-'}</td>
```

## Scripts de Maintenance

### set_essais_date_reception.py
Met à jour tous les essais existants avec `date_reception = date de réception de l'échantillon`

```bash
cd maxime-app/backend
venv\Scripts\python.exe set_essais_date_reception.py
```

**Résultat** : 42 essais mis à jour avec succès

## État Actuel

✅ Backend configuré avec modèle Essai et API complète
✅ Frontend avec service essaiService.ts
✅ Tableau conditionnel selon le rôle utilisateur
✅ Affichage des dates d'essais pour opérateur route
✅ Format français pour toutes les dates
✅ 42 essais existants mis à jour avec dates

## Prochaines Étapes

### Module Stockage
Le module Storage doit être mis à jour pour utiliser l'API au lieu des fonctions mockées :

1. **Importer le service essai**
```typescript
import { updateEssai } from '../../lib/essaiService';
```

2. **Mettre à jour la date lors de la planification**
```typescript
// Au lieu de addEssai (mocké)
await updateEssai(essaiId, {
  date_reception: dateEnvoiStr
});
```

3. **Récupérer les essais de l'échantillon**
```typescript
import { getEssaisByEchantillon } from '../../lib/essaiService';

const essais = await getEssaisByEchantillon(echantillonId);
```

### Workflow Complet

1. **Réception** : Crée échantillon + essais (date_reception = date réception)
2. **Stockage** : Planifie et met à jour date_reception de chaque essai
3. **Accueil Opérateur** : Affiche les dates planifiées dans le tableau
4. **Essais Route** : Opérateur effectue les essais selon planning
5. **Suivi** : Dates visibles pour coordination et suivi

## Avantages

✅ Visibilité immédiate du planning des essais
✅ Coordination facilitée entre sections
✅ Suivi précis de chaque type d'essai
✅ Interface adaptée au rôle (confidentialité)
✅ Données en temps réel depuis l'API
