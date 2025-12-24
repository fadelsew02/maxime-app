# 🎯 Système de Stockage Backend - Laboratoire SNERTP

## 📌 Vue d'ensemble

Toutes les données de l'application sont maintenant stockées dans le backend Django au lieu de `localStorage`. Cela garantit:
- ✅ **Persistance**: Les données ne sont jamais perdues
- ✅ **Synchronisation**: Temps réel entre tous les utilisateurs
- ✅ **Traçabilité**: Historique complet de toutes les actions
- ✅ **Sécurité**: Authentification JWT, permissions, audit
- ✅ **Scalabilité**: Pas de limite de stockage

---

## 🗄️ Architecture

### **Modèles de données**

```
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND DJANGO                            │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  📊 RapportValidation                                        │
│  ├─ Workflow complet de validation                          │
│  ├─ Chef Projet → Chef Service → DT → DS → Marketing        │
│  └─ Commentaires, dates, statuts par étape                  │
│                                                               │
│  🧪 EssaiData                                                │
│  ├─ Données temporaires d'essais                            │
│  ├─ Résultats, statuts, commentaires                        │
│  └─ Lien avec échantillons                                  │
│                                                               │
│  📅 PlanificationData                                        │
│  ├─ Planifications d'essais                                 │
│  ├─ Dates, opérateurs, priorités                            │
│  └─ Statuts de complétion                                   │
│                                                               │
│  📝 ActionLog (existant)                                     │
│  └─ Traçabilité complète de toutes les actions              │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Démarrage rapide

### **1. Backend déjà configuré**
Les modèles, vues, serializers et routes sont déjà créés et migrés.

### **2. Lancer le serveur**
```bash
cd backend
python manage.py runserver
```

### **3. Accéder aux données**
- **API**: http://127.0.0.1:8000/api/
- **Admin**: http://127.0.0.1:8000/admin/ (admin/admin123)

---

## 📡 Endpoints API

### **RapportValidation**
```
GET    /api/rapport-validations/
POST   /api/rapport-validations/
GET    /api/rapport-validations/{id}/
PUT    /api/rapport-validations/{id}/
DELETE /api/rapport-validations/{id}/

# Filtres
GET    /api/rapport-validations/by_etape/?etape=chef_projet&status=pending
GET    /api/rapport-validations/by_code/?code=ECH001
GET    /api/rapport-validations/rejetes/
GET    /api/rapport-validations/valides/

# Actions
POST   /api/rapport-validations/{id}/valider_chef_projet/
POST   /api/rapport-validations/{id}/rejeter_chef_projet/
POST   /api/rapport-validations/{id}/valider_chef_service/
POST   /api/rapport-validations/{id}/rejeter_chef_service/
POST   /api/rapport-validations/{id}/valider_directeur_technique/
POST   /api/rapport-validations/{id}/rejeter_directeur_technique/
POST   /api/rapport-validations/{id}/aviser_directeur_snertp/
POST   /api/rapport-validations/{id}/envoyer_client/
```

### **EssaiData**
```
GET    /api/essai-data/
POST   /api/essai-data/
GET    /api/essai-data/{id}/
PUT    /api/essai-data/{id}/
DELETE /api/essai-data/{id}/

# Filtres
GET    /api/essai-data/by_echantillon/?code=ECH001
GET    /api/essai-data/by_essai_id/?essai_id=ECH001_AG

# Actions
POST   /api/essai-data/{id}/update_data/
```

### **PlanificationData**
```
GET    /api/planification-data/
POST   /api/planification-data/
GET    /api/planification-data/{id}/
PUT    /api/planification-data/{id}/
DELETE /api/planification-data/{id}/

# Filtres
GET    /api/planification-data/by_echantillon/?code=ECH001
GET    /api/planification-data/by_date/?date=2024-01-15

# Actions
POST   /api/planification-data/{id}/marquer_complete/
```

---

## 🔄 Migration des données existantes

### **Option 1: Bouton de migration (Recommandé)**

1. Ajouter le bouton dans votre interface:
```tsx
import { MigrationButton } from './components/MigrationButton';

// Dans votre composant
<MigrationButton />
```

2. Cliquer sur "Migrer localStorage → Backend"
3. Attendre la fin de la migration
4. Vérifier les résultats dans la console

### **Option 2: Script manuel**

```typescript
import { migrateAllLocalStorageData, displayMigrationReport } from './utils/migrateLocalStorageToBackend';

// Dans la console du navigateur
const results = await migrateAllLocalStorageData();
displayMigrationReport(results);
```

---

## 📝 Exemples d'utilisation

### **Créer un rapport en validation**
```typescript
const response = await fetch('http://127.0.0.1:8000/api/rapport-validations/', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    code_echantillon: 'ECH001',
    client_name: 'Client Test',
    etape_actuelle: 'chef_projet',
    file_name: 'rapport.pdf',
    file_data: 'data:application/pdf;base64,...',
  })
});
```

### **Récupérer les rapports en attente**
```typescript
const response = await fetch(
  'http://127.0.0.1:8000/api/rapport-validations/by_etape/?etape=chef_projet&status=pending',
  {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
    }
  }
);
const rapports = await response.json();
```

### **Valider un rapport**
```typescript
await fetch(
  `http://127.0.0.1:8000/api/rapport-validations/${id}/valider_chef_projet/`,
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ comment: 'Validé' })
  }
);
```

---

## 🔍 Monitoring et Debug

### **Django Admin**
Accédez à http://127.0.0.1:8000/admin/ pour:
- Voir toutes les données
- Filtrer, rechercher, trier
- Modifier manuellement si nécessaire
- Voir les logs d'actions

### **Logs d'actions**
Toutes les opérations sont enregistrées dans `ActionLog`:
```
http://127.0.0.1:8000/admin/core/actionlog/
http://127.0.0.1:8000/api/action-logs/
```

### **Console navigateur**
Les scripts de migration affichent des rapports détaillés dans la console.

---

## 📊 État de la migration

### **✅ Modules déjà migrés**
- EssaisRejetesModule.tsx
- EssaisRejetesMecaniqueModule.tsx
- DecodificationModule.tsx
- EssaisMecaniqueModule.tsx
- EssaisRouteModule.tsx

### **❌ Modules à migrer**
- ChefProjetRejeteModule.tsx
- ServiceMarketingModule.tsx
- ChefServiceModule.tsx
- ValidationResultsModule.tsx
- AdminModule.tsx
- MarketingDashboard.tsx
- DashboardHome.tsx

---

## 🛠️ Commandes utiles

### **Voir les données**
```bash
# Django shell
python manage.py shell

# Compter les rapports
from core.models_workflow_data import RapportValidation
RapportValidation.objects.count()

# Voir les rapports en attente
RapportValidation.objects.filter(status='pending')
```

### **Backup**
```bash
python manage.py dumpdata core.RapportValidation > backup_rapports.json
python manage.py dumpdata core.EssaiData > backup_essais.json
python manage.py dumpdata core.PlanificationData > backup_planifications.json
```

### **Restore**
```bash
python manage.py loaddata backup_rapports.json
python manage.py loaddata backup_essais.json
python manage.py loaddata backup_planifications.json
```

---

## 🔐 Sécurité

### **Authentification**
Toutes les requêtes nécessitent un token JWT:
```typescript
headers: {
  'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
}
```

### **Permissions**
Les permissions sont gérées par rôle utilisateur dans Django.

### **Audit**
Toutes les actions sont enregistrées avec:
- Utilisateur
- Date/heure
- Action effectuée
- Données modifiées
- Résultat (succès/échec)

---

## 📚 Documentation complète

- **MIGRATION_LOCALSTORAGE_TO_BACKEND.md**: Guide détaillé de migration
- **BACKEND_STORAGE_SUMMARY.md**: Résumé complet du système
- **README_BACKEND_STORAGE.md**: Ce fichier

---

## 🎯 Prochaines étapes

1. ✅ Backend configuré et fonctionnel
2. ✅ Script de migration créé
3. ✅ Bouton de migration ajouté
4. ⏳ Migrer les modules restants
5. ⏳ Supprimer les références localStorage
6. ⏳ Tests complets
7. ⏳ Déploiement production

---

## 💡 Conseils

- **Toujours** utiliser les endpoints API au lieu de localStorage
- **Toujours** inclure le token JWT dans les headers
- **Toujours** gérer les erreurs (try/catch)
- **Toujours** vérifier les logs en cas de problème
- **Ne jamais** stocker de données sensibles dans localStorage (sauf tokens auth)

---

## 🆘 Support

En cas de problème:
1. Vérifier les logs Django: `python manage.py runserver`
2. Vérifier les logs d'actions: http://127.0.0.1:8000/admin/core/actionlog/
3. Vérifier la console navigateur
4. Consulter la documentation

---

**Système**: Laboratoire SNERTP  
**Version**: 2.0 (Backend Storage)  
**Date**: 29 novembre 2025  
**Statut**: ✅ Prêt pour migration frontend
