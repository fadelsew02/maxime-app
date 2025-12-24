# 🚀 Instructions de Migration - localStorage → Backend

## ✅ Étape 1 : Vérifier que le backend fonctionne

```bash
cd backend
python manage.py runserver
```

Le serveur doit démarrer sur `http://127.0.0.1:8000`

## ✅ Étape 2 : Tester l'API de stockage

```bash
cd backend
python test_storage_api.py
```

Vous devriez voir :
```
✅ Tous les tests sont passés avec succès !
```

## ✅ Étape 3 : Utiliser le service dans votre code

### Import
```typescript
import storageService from '@/services/storageService';
```

### Sauvegarder
```typescript
await storageService.setItem('ma_cle', { data: 'valeur' });
```

### Récupérer
```typescript
const data = await storageService.getItem('ma_cle');
```

### Supprimer
```typescript
await storageService.removeItem('ma_cle');
```

## 📝 Exemple complet de migration

### Fichier : `src/components/modules/ReceptionModule.tsx`

#### AVANT
```typescript
// Sauvegarder le client
const existingClients = localStorage.getItem('clients');
const savedClients = existingClients ? JSON.parse(existingClients) : [];
savedClients.push(newClient);
localStorage.setItem('clients', JSON.stringify(savedClients));
```

#### APRÈS
```typescript
import storageService from '@/services/storageService';

// Sauvegarder le client
const savedClients = await storageService.getItem('clients') || [];
savedClients.push(newClient);
await storageService.setItem('clients', savedClients);
```

## 🔄 Migration des données existantes

### Option 1 : Script automatique (recommandé)

Ouvrez la console du navigateur (F12) et exécutez :

```javascript
async function migrateToBackend() {
  const token = localStorage.getItem('access_token');
  let migrated = 0;
  let errors = 0;
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    
    // Ignorer les tokens
    if (key === 'access_token' || key === 'refresh_token') continue;
    
    const value = localStorage.getItem(key);
    
    try {
      const response = await fetch('http://127.0.0.1:8000/api/storage/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ key, value }),
      });
      
      if (response.ok) {
        console.log(`✅ ${key}`);
        migrated++;
      } else {
        console.error(`❌ ${key}: ${response.status}`);
        errors++;
      }
    } catch (error) {
      console.error(`❌ ${key}:`, error);
      errors++;
    }
  }
  
  console.log(`\n📊 Résultat:`);
  console.log(`✅ Migrées: ${migrated}`);
  console.log(`❌ Erreurs: ${errors}`);
}

migrateToBackend();
```

### Option 2 : Migration manuelle

1. Notez les clés importantes dans localStorage
2. Copiez les valeurs
3. Utilisez l'API pour les recréer

## 📋 Checklist de migration par module

### ReceptionModule
- [ ] Import storageService
- [ ] Remplacer sauvegarde clients
- [ ] Tester création client
- [ ] Vérifier persistance

### EssaisRouteModule
- [ ] Import storageService
- [ ] Remplacer sauvegarde résultats
- [ ] Remplacer chargement résultats
- [ ] Tester sauvegarde/chargement

### EssaisMecaniqueModule
- [ ] Import storageService
- [ ] Remplacer sauvegarde résultats
- [ ] Remplacer chargement résultats
- [ ] Tester sauvegarde/chargement

### DecodificationModule
- [ ] Import storageService
- [ ] Remplacer recherche essais
- [ ] Remplacer sauvegarde traitement
- [ ] Tester décodification

### TraitementModule
- [ ] Import storageService
- [ ] Remplacer chargement rapports
- [ ] Remplacer envoi chef projet
- [ ] Tester workflow

## 🧪 Tests à effectuer

Pour chaque module migré :

1. ✅ **Sauvegarder des données**
   - Remplir un formulaire
   - Cliquer sur "Sauvegarder"
   - Vérifier le message de succès

2. ✅ **Rafraîchir la page**
   - Appuyer sur F5
   - Vérifier que les données sont toujours là

3. ✅ **Se déconnecter/reconnecter**
   - Se déconnecter
   - Se reconnecter
   - Vérifier que les données sont toujours là

4. ✅ **Vider le cache**
   - Ouvrir les outils développeur (F12)
   - Application → Storage → Clear site data
   - Se reconnecter
   - Vérifier que les données sont toujours là

5. ✅ **Tester sur un autre appareil**
   - Se connecter depuis un autre ordinateur/navigateur
   - Vérifier que les données sont synchronisées

## ⚠️ Points d'attention

### 1. Gestion des erreurs
Toujours entourer les appels de try/catch :

```typescript
try {
  await storageService.setItem('key', data);
  toast.success('Sauvegardé');
} catch (error) {
  console.error('Erreur:', error);
  toast.error('Erreur de sauvegarde');
}
```

### 2. Chargement asynchrone
Dans useEffect, créer une fonction async :

```typescript
useEffect(() => {
  const loadData = async () => {
    const data = await storageService.getItem('key');
    setData(data);
  };
  loadData();
}, []);
```

### 3. Performance
Mettre en cache les données fréquemment utilisées :

```typescript
const [cache, setCache] = useState({});

const getData = async (key) => {
  if (cache[key]) return cache[key];
  
  const data = await storageService.getItem(key);
  setCache(prev => ({ ...prev, [key]: data }));
  return data;
};
```

## 🎯 Ordre de migration recommandé

1. **ReceptionModule** (le plus simple)
2. **EssaisRouteModule** (important)
3. **EssaisMecaniqueModule** (similaire à Route)
4. **DecodificationModule** (complexe)
5. **TraitementModule** (workflow)
6. **ChefProjetModule** (validation)
7. **ChefServiceModule** (validation)
8. **ValidationModule** (validation finale)
9. **DashboardHome** (affichage)
10. **MarketingDashboard** (rapports)

## 📞 Support

En cas de problème :

1. Vérifier que le backend est démarré
2. Vérifier que vous êtes connecté (token valide)
3. Vérifier la console du navigateur pour les erreurs
4. Vérifier les logs du backend

## 🎉 Résultat attendu

Après la migration complète :

- ✅ Aucun appel à `localStorage` (sauf tokens)
- ✅ Toutes les données persistantes
- ✅ Synchronisation multi-appareils
- ✅ Backup automatique
- ✅ Meilleure sécurité

---

**Bon courage pour la migration ! 🚀**

**Date** : 29 novembre 2025
**Système** : Gestion d'Échantillons - Laboratoire SNERTP
