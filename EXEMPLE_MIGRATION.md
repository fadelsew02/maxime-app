# 📝 Exemple Concret de Migration

## Module : EssaisRouteModule

### ❌ AVANT (avec localStorage)

```typescript
// Sauvegarder les résultats d'un essai
const handleSaveResults = async () => {
  const essaiKey = `essai_${essai.id}`;
  
  // Sauvegarder dans localStorage
  localStorage.setItem(essaiKey, JSON.stringify({
    resultats: formData,
    envoye: false,
    date: new Date().toISOString()
  }));
  
  toast.success('Résultats sauvegardés');
};

// Envoyer les résultats
const handleSubmit = async () => {
  const essaiKey = `essai_${essai.id}`;
  
  try {
    // Appel API
    await api.post(`/essais/${essai.id}/resultats/`, formData);
    
    // Marquer comme envoyé dans localStorage
    localStorage.setItem(essaiKey, JSON.stringify({
      resultats: formData,
      envoye: true,
      date: new Date().toISOString()
    }));
    
    toast.success('Résultats envoyés');
  } catch (error) {
    toast.error('Erreur');
  }
};

// Charger les résultats sauvegardés
useEffect(() => {
  const essaiKey = `essai_${essai.id}`;
  const saved = localStorage.getItem(essaiKey);
  
  if (saved) {
    const data = JSON.parse(saved);
    setFormData(data.resultats);
  }
}, [essai.id]);
```

### ✅ APRÈS (avec backend)

```typescript
import storageService from '@/services/storageService';

// Sauvegarder les résultats d'un essai
const handleSaveResults = async () => {
  const essaiKey = `essai_${essai.id}`;
  
  try {
    // Sauvegarder dans le backend
    await storageService.setItem(essaiKey, {
      resultats: formData,
      envoye: false,
      date: new Date().toISOString()
    });
    
    toast.success('Résultats sauvegardés');
  } catch (error) {
    console.error('Erreur sauvegarde:', error);
    toast.error('Erreur de sauvegarde');
  }
};

// Envoyer les résultats
const handleSubmit = async () => {
  const essaiKey = `essai_${essai.id}`;
  
  try {
    // Appel API
    await api.post(`/essais/${essai.id}/resultats/`, formData);
    
    // Marquer comme envoyé dans le backend
    await storageService.setItem(essaiKey, {
      resultats: formData,
      envoye: true,
      date: new Date().toISOString()
    });
    
    toast.success('Résultats envoyés');
  } catch (error) {
    console.error('Erreur:', error);
    toast.error('Erreur');
  }
};

// Charger les résultats sauvegardés
useEffect(() => {
  const loadSavedData = async () => {
    const essaiKey = `essai_${essai.id}`;
    
    try {
      const data = await storageService.getItem(essaiKey);
      
      if (data && data.resultats) {
        setFormData(data.resultats);
      }
    } catch (error) {
      console.error('Erreur chargement:', error);
    }
  };
  
  loadSavedData();
}, [essai.id]);
```

## 🔑 Changements clés

1. **Import du service**
   ```typescript
   import storageService from '@/services/storageService';
   ```

2. **Appels asynchrones**
   - Tous les appels deviennent `async/await`
   - Ajout de `try/catch` pour gérer les erreurs

3. **Pas de JSON.parse/stringify**
   - Le service gère automatiquement la sérialisation

4. **useEffect asynchrone**
   - Créer une fonction async interne
   - L'appeler immédiatement

## 🎯 Checklist de migration

- [ ] Importer `storageService`
- [ ] Remplacer `localStorage.setItem` par `storageService.setItem`
- [ ] Remplacer `localStorage.getItem` par `storageService.getItem`
- [ ] Remplacer `localStorage.removeItem` par `storageService.removeItem`
- [ ] Ajouter `async/await`
- [ ] Ajouter `try/catch`
- [ ] Supprimer `JSON.parse` et `JSON.stringify`
- [ ] Tester le module

## 🧪 Test

1. Sauvegarder des données
2. Rafraîchir la page
3. Vérifier que les données sont toujours là
4. Se déconnecter et se reconnecter
5. Vérifier que les données sont toujours là
6. Vider le cache du navigateur
7. Se reconnecter
8. Vérifier que les données sont toujours là ✅

---

**Date** : 29 novembre 2025
