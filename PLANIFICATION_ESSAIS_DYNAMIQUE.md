# Planification Dynamique des Essais

## Résumé
Le module Stockage utilise maintenant l'API pour mettre à jour les dates de planification des essais. Ces dates apparaissent automatiquement dans le tableau de l'accueil des opérateurs.

## Modifications Apportées

### Module Stockage (StorageModule.tsx)
- ✅ Import des services API : `updateEssai`, `getEssaisByEchantillon`, `changeEchantillonStatut`
- ✅ Fonction `handleEnvoiEssai` convertie en async et utilise l'API
- ✅ Mise à jour de `essai.date_reception` via `updateEssai()`
- ✅ Changement de statut via `changeEchantillonStatut()`
- ✅ Rafraîchissement automatique après planification

## Workflow Complet

### 1. Création d'un échantillon
```
Réceptionniste → Module Réception
↓
Crée échantillon S-0014/25 avec essais AG, Proctor, CBR
↓
Backend crée automatiquement :
- Échantillon (statut: stockage)
- 3 essais avec date_reception = date réception échantillon
```

### 2. Planification dans Stockage
```
Responsable Matériaux → Module Stockage
↓
Sélectionne échantillon S-0014/25
↓
Pour chaque essai (AG, Proctor, CBR) :
  - Sélectionne une date d'envoi (ex: 05/12/2025)
  - Clique sur "Envoyer"
  ↓
  API: updateEssai(essaiId, { date_reception: '2025-12-05' })
  ↓
  Toast: "Essai AG planifié - Date d'envoi: 05/12/2025"
↓
Quand tous les essais sont planifiés :
  API: changeEchantillonStatut(echantillonId, 'essais')
  ↓
  Échantillon passe en statut "essais"
  ↓
  Notifications envoyées aux opérateurs
```

### 3. Affichage pour opérateur route
```
Opérateur Route → Accueil
↓
Tableau affiche :
| Code      | Date réception | AG         | Proctor    | CBR        | Date retour |
|-----------|----------------|------------|------------|------------|-------------|
| S-0014/25 | 30/11/2025     | 05/12/2025 | 05/12/2025 | 05/12/2025 | -           |
```

## Code Implémenté

### Fonction handleEnvoiEssai (StorageModule.tsx)
```typescript
const handleEnvoiEssai = async (essaiType: string) => {
  const dateEnvoi = dateEnvoiParEssai[essaiType];
  
  if (!selectedEchantillon || !dateEnvoi) {
    toast.error('Veuillez sélectionner une date d\'envoi');
    return;
  }

  const ech = echantillons.find(e => e.code === selectedEchantillon);
  if (!ech) return;

  const dateEnvoiStr = format(dateEnvoi, 'yyyy-MM-dd');

  try {
    // Récupérer les essais de l'échantillon depuis l'API
    const essais = await getEssaisByEchantillon(ech.id);
    
    // Trouver l'essai correspondant au type
    const essai = essais.find(e => e.type === essaiType);
    
    if (essai) {
      // Mettre à jour la date_reception de l'essai via l'API
      await updateEssai(essai.id, {
        date_reception: dateEnvoiStr
      });
      
      toast.success(`Essai ${essaiType} planifié`, {
        description: `Date d'envoi: ${formatDateFr(dateEnvoiStr)}`,
      });
    }

    // Vérifier si tous les essais sont planifiés
    const tousEssaisEnvoyes = ech.essais.every(essai => dateEnvoiParEssai[essai]);

    if (tousEssaisEnvoyes) {
      // Changer le statut de l'échantillon
      await changeEchantillonStatut(ech.id, 'essais');
      
      // Rafraîchir les données
      await refreshEchantillons();
      
      // Reset
      setSelectedEchantillon(null);
      setDateEnvoiParEssai({});
    }
  } catch (error) {
    console.error('Erreur lors de la planification:', error);
    toast.error('Erreur lors de la planification de l\'essai');
  }
};
```

### Affichage dans DashboardHome.tsx
```typescript
// Récupérer les essais de l'échantillon
const essaisDetails = (ech as any).essaisDetails || [];
const essaiAG = essaisDetails.find((e: any) => e.type === 'AG');
const essaiProctor = essaisDetails.find((e: any) => e.type === 'Proctor');
const essaiCBR = essaisDetails.find((e: any) => e.type === 'CBR');

// Afficher les dates
<td>{essaiAG?.date_reception ? formatDateFr(essaiAG.date_reception) : '-'}</td>
<td>{essaiProctor?.date_reception ? formatDateFr(essaiProctor.date_reception) : '-'}</td>
<td>{essaiCBR?.date_reception ? formatDateFr(essaiCBR.date_reception) : '-'}</td>
```

## Services API Utilisés

### essaiService.ts
```typescript
// Récupérer les essais d'un échantillon
export const getEssaisByEchantillon = async (echantillonId: string): Promise<Essai[]>

// Mettre à jour un essai
export const updateEssai = async (id: string, data: Partial<EssaiCreate>): Promise<Essai>
```

### echantillonService.ts
```typescript
// Changer le statut d'un échantillon
export const changeEchantillonStatut = async (id: string, statut: string): Promise<Echantillon>
```

## Flux de Données

```
Module Stockage
    ↓
  updateEssai(essaiId, { date_reception: '2025-12-05' })
    ↓
Backend API: PATCH /api/essais/{id}/
    ↓
Base de données: UPDATE essais SET date_reception = '2025-12-05'
    ↓
Module Accueil (DashboardHome)
    ↓
  getEchantillons() → inclut essais avec date_reception
    ↓
Tableau affiche: AG: 05/12/2025
```

## Avantages

✅ **Temps réel** : Les dates apparaissent immédiatement après planification
✅ **Persistance** : Les dates sont sauvegardées en base de données
✅ **Synchronisation** : Tous les utilisateurs voient les mêmes dates
✅ **Traçabilité** : Historique des modifications via updated_at
✅ **Flexibilité** : Chaque essai peut avoir une date différente
✅ **Notifications** : Les opérateurs sont alertés automatiquement

## Test du Workflow

### Étape 1 : Créer un échantillon
```
1. Se connecter avec reception@snertp.com
2. Aller dans Module Réception
3. Créer un échantillon avec essais AG, Proctor, CBR
4. Vérifier que l'échantillon apparaît dans Stockage
```

### Étape 2 : Planifier les essais
```
1. Se connecter avec materiel@snertp.com
2. Aller dans Module Stockage
3. Sélectionner l'échantillon
4. Pour chaque essai :
   - Sélectionner une date d'envoi
   - Cliquer sur "Envoyer"
   - Vérifier le toast de confirmation
5. Vérifier que le statut passe à "essais"
```

### Étape 3 : Vérifier l'affichage
```
1. Se connecter avec route@snertp.com
2. Aller à l'Accueil
3. Vérifier que le tableau affiche :
   - Code échantillon
   - Date réception
   - AG : date planifiée
   - Proctor : date planifiée
   - CBR : date planifiée
   - Date retour client : -
```

## Scripts de Maintenance

### Vérifier les dates des essais
```bash
cd maxime-app/backend
venv\Scripts\python.exe test_essais_dates.py
```

### Mettre à jour les essais existants
```bash
cd maxime-app/backend
venv\Scripts\python.exe set_essais_date_reception.py
```

## Conclusion

Le système est maintenant complètement dynamique :
- ✅ Module Stockage utilise l'API pour planifier
- ✅ Dates sauvegardées en base de données
- ✅ Tableau Accueil affiche les dates en temps réel
- ✅ Format français pour toutes les dates
- ✅ Notifications automatiques
- ✅ Changement de statut automatique

Les opérateurs route voient maintenant les dates de planification exactes définies par le responsable matériaux dans le module Stockage.
