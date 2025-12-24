# ⚡ Guide Rapide de Migration

## 🎯 En 3 étapes

### 1️⃣ Importer le service
```typescript
import storageService from '@/services/storageService';
```

### 2️⃣ Remplacer les appels
```typescript
// ❌ AVANT
localStorage.setItem('key', JSON.stringify(data));
const data = JSON.parse(localStorage.getItem('key') || '{}');
localStorage.removeItem('key');

// ✅ APRÈS
await storageService.setItem('key', data);
const data = await storageService.getItem('key');
await storageService.removeItem('key');
```

### 3️⃣ Ajouter async/await + try/catch
```typescript
const handleSave = async () => {
  try {
    await storageService.setItem('key', data);
    toast.success('Sauvegardé !');
  } catch (error) {
    toast.error('Erreur');
  }
};
```

## 🔄 Patterns de remplacement

### Pattern 1 : Sauvegarde simple
```typescript
// ❌ AVANT
localStorage.setItem('planning_S-0001', JSON.stringify(planningData));

// ✅ APRÈS
await storageService.setItem('planning_S-0001', planningData);
```

### Pattern 2 : Récupération simple
```typescript
// ❌ AVANT
const saved = localStorage.getItem('planning_S-0001');
const data = saved ? JSON.parse(saved) : null;

// ✅ APRÈS
const data = await storageService.getItem('planning_S-0001');
```

### Pattern 3 : Récupération avec valeur par défaut
```typescript
// ❌ AVANT
const saved = localStorage.getItem('clients');
const clients = saved ? JSON.parse(saved) : [];

// ✅ APRÈS
const clients = await storageService.getItem('clients') || [];
```

### Pattern 4 : Mise à jour d'un tableau
```typescript
// ❌ AVANT
const saved = localStorage.getItem('clients');
const clients = saved ? JSON.parse(saved) : [];
clients.push(newClient);
localStorage.setItem('clients', JSON.stringify(clients));

// ✅ APRÈS
const clients = await storageService.getItem('clients') || [];
clients.push(newClient);
await storageService.setItem('clients', clients);
```

### Pattern 5 : Mise à jour d'un objet
```typescript
// ❌ AVANT
const saved = localStorage.getItem('essai_123');
const essai = saved ? JSON.parse(saved) : {};
essai.resultats = newResults;
localStorage.setItem('essai_123', JSON.stringify(essai));

// ✅ APRÈS
const essai = await storageService.getItem('essai_123') || {};
essai.resultats = newResults;
await storageService.setItem('essai_123', essai);
```

### Pattern 6 : Boucle sur localStorage
```typescript
// ❌ AVANT
for (let i = 0; i < localStorage.length; i++) {
  const key = localStorage.key(i);
  if (key?.startsWith('essai_')) {
    const data = localStorage.getItem(key);
    // traiter data
  }
}

// ✅ APRÈS
const keys = await storageService.getAllKeys();
for (const key of keys) {
  if (key.startsWith('essai_')) {
    const data = await storageService.getItem(key);
    // traiter data
  }
}
```

### Pattern 7 : useEffect avec chargement
```typescript
// ❌ AVANT
useEffect(() => {
  const saved = localStorage.getItem('data');
  if (saved) {
    setData(JSON.parse(saved));
  }
}, []);

// ✅ APRÈS
useEffect(() => {
  const loadData = async () => {
    const data = await storageService.getItem('data');
    if (data) setData(data);
  };
  loadData();
}, []);
```

### Pattern 8 : Suppression
```typescript
// ❌ AVANT
localStorage.removeItem('essai_123');

// ✅ APRÈS
await storageService.removeItem('essai_123');
```

## 🎯 Checklist rapide

Pour chaque fichier :

- [ ] Importer `storageService`
- [ ] Chercher tous les `localStorage.setItem`
- [ ] Chercher tous les `localStorage.getItem`
- [ ] Chercher tous les `localStorage.removeItem`
- [ ] Chercher tous les `localStorage.key`
- [ ] Remplacer par les appels `storageService`
- [ ] Ajouter `async/await`
- [ ] Ajouter `try/catch`
- [ ] Supprimer `JSON.parse` et `JSON.stringify`
- [ ] Tester le module

## 🧪 Test rapide

```typescript
// 1. Sauvegarder
await storageService.setItem('test', { hello: 'world' });

// 2. Récupérer
const data = await storageService.getItem('test');
console.log(data); // { hello: 'world' }

// 3. Supprimer
await storageService.removeItem('test');

// 4. Vérifier
const deleted = await storageService.getItem('test');
console.log(deleted); // null
```

## ⚡ Commandes utiles

### Rechercher les fichiers à migrer
```bash
# Windows
findstr /s /i "localStorage" src\*.tsx src\*.ts

# Unix/Linux/Mac
grep -r "localStorage" src/
```

### Compter les occurrences
```bash
# Windows
findstr /s /i /c:"localStorage.setItem" src\*.tsx src\*.ts | find /c /v ""

# Unix/Linux/Mac
grep -r "localStorage.setItem" src/ | wc -l
```

## 🎓 Exemple complet avant/après

### AVANT
```typescript
import { useState, useEffect } from 'react';

function EssaisModule() {
  const [essais, setEssais] = useState([]);

  useEffect(() => {
    // Charger les essais
    const saved = localStorage.getItem('essais');
    if (saved) {
      setEssais(JSON.parse(saved));
    }
  }, []);

  const handleSave = (essai) => {
    const key = `essai_${essai.id}`;
    localStorage.setItem(key, JSON.stringify(essai));
    alert('Sauvegardé !');
  };

  const handleDelete = (essaiId) => {
    const key = `essai_${essaiId}`;
    localStorage.removeItem(key);
    alert('Supprimé !');
  };

  return <div>{/* UI */}</div>;
}
```

### APRÈS
```typescript
import { useState, useEffect } from 'react';
import storageService from '@/services/storageService';
import { toast } from 'sonner';

function EssaisModule() {
  const [essais, setEssais] = useState([]);

  useEffect(() => {
    const loadEssais = async () => {
      try {
        const saved = await storageService.getItem('essais');
        if (saved) setEssais(saved);
      } catch (error) {
        console.error('Erreur chargement:', error);
      }
    };
    loadEssais();
  }, []);

  const handleSave = async (essai) => {
    try {
      const key = `essai_${essai.id}`;
      await storageService.setItem(key, essai);
      toast.success('Sauvegardé !');
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
      toast.error('Erreur de sauvegarde');
    }
  };

  const handleDelete = async (essaiId) => {
    try {
      const key = `essai_${essaiId}`;
      await storageService.removeItem(key);
      toast.success('Supprimé !');
    } catch (error) {
      console.error('Erreur suppression:', error);
      toast.error('Erreur de suppression');
    }
  };

  return <div>{/* UI */}</div>;
}
```

## 📝 Notes importantes

1. **Pas de JSON.parse/stringify** - Le service le fait automatiquement
2. **Toujours async/await** - Les appels sont asynchrones
3. **Toujours try/catch** - Gérer les erreurs réseau
4. **useEffect async** - Créer une fonction async interne
5. **Tokens d'auth** - Garder dans localStorage (access_token, refresh_token)

## 🚀 Ordre de migration

1. ReceptionModule (simple)
2. EssaisRouteModule (important)
3. EssaisMecaniqueModule (similaire)
4. DecodificationModule (complexe)
5. TraitementModule (workflow)
6. Autres modules

---

**Temps estimé par module** : 15-30 minutes
**Difficulté** : ⭐⭐ (Facile à Moyen)

**Bon courage ! 💪**
