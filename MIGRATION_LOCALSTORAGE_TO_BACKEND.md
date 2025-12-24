# 🔄 Migration localStorage vers Backend

## 📋 Vue d'ensemble

Ce document explique comment toutes les données précédemment stockées dans `localStorage` sont maintenant gérées par le backend Django.

---

## 🗄️ Nouveaux Modèles Backend

### 1. **RapportValidation**
Remplace: `localStorage` clés `sent_to_chef_*`, `sent_to_directeur_*`, `sent_to_marketing_*`

**Champs principaux:**
- `code_echantillon`: Code de l'échantillon
- `client_name`: Nom du client
- `etape_actuelle`: Étape de validation (chef_projet, chef_service, directeur_technique, directeur_snertp, marketing, client)
- `status`: pending, accepted, rejected
- `file_name`, `file_data`: Fichier rapport
- Flags de validation par étape: `validated_by_chef_projet`, `rejected_by_chef_service`, etc.
- Commentaires et dates de validation

**Endpoints API:**
```
GET    /api/rapport-validations/                    # Liste tous les rapports
GET    /api/rapport-validations/{id}/               # Détail d'un rapport
POST   /api/rapport-validations/                    # Créer un rapport
PUT    /api/rapport-validations/{id}/               # Modifier un rapport
DELETE /api/rapport-validations/{id}/               # Supprimer un rapport

# Actions spécifiques
GET    /api/rapport-validations/by_etape/?etape=chef_projet&status=pending
GET    /api/rapport-validations/by_code/?code=ECH001
POST   /api/rapport-validations/{id}/valider_chef_projet/
POST   /api/rapport-validations/{id}/rejeter_chef_projet/
POST   /api/rapport-validations/{id}/valider_chef_service/
POST   /api/rapport-validations/{id}/rejeter_chef_service/
POST   /api/rapport-validations/{id}/valider_directeur_technique/
POST   /api/rapport-validations/{id}/rejeter_directeur_technique/
POST   /api/rapport-validations/{id}/aviser_directeur_snertp/
POST   /api/rapport-validations/{id}/envoyer_client/
GET    /api/rapport-validations/rejetes/
GET    /api/rapport-validations/valides/
```

---

### 2. **EssaiData**
Remplace: `localStorage` clés `{code}_{essai_type}` (ex: `ECH001_AG`)

**Champs principaux:**
- `essai_id`: ID unique de l'essai
- `echantillon_code`: Code de l'échantillon
- `essai_type`: Type d'essai (AG, Proctor, CBR, etc.)
- `data`: Données JSON de l'essai
- `statut`: attente, en_cours, termine
- `validation_status`: pending, accepted, rejected
- `resultats`: Résultats JSON
- `commentaires`, `operateur`

**Endpoints API:**
```
GET    /api/essai-data/                             # Liste tous les essais
GET    /api/essai-data/{id}/                        # Détail d'un essai
POST   /api/essai-data/                             # Créer un essai
PUT    /api/essai-data/{id}/                        # Modifier un essai
DELETE /api/essai-data/{id}/                        # Supprimer un essai

# Actions spécifiques
GET    /api/essai-data/by_echantillon/?code=ECH001
GET    /api/essai-data/by_essai_id/?essai_id=ECH001_AG
POST   /api/essai-data/{id}/update_data/
```

---

### 3. **PlanificationData**
Remplace: `localStorage` clés `plan_{code}_{essai_type}`

**Champs principaux:**
- `echantillon_code`: Code de l'échantillon
- `essai_type`: Type d'essai
- `date_planifiee`: Date planifiée
- `operateur_assigne`: Opérateur assigné
- `priorite`: normale, urgente
- `statut`: planifie, en_cours, complete
- `completed`: Boolean

**Endpoints API:**
```
GET    /api/planification-data/                     # Liste toutes les planifications
GET    /api/planification-data/{id}/                # Détail d'une planification
POST   /api/planification-data/                     # Créer une planification
PUT    /api/planification-data/{id}/                # Modifier une planification
DELETE /api/planification-data/{id}/                # Supprimer une planification

# Actions spécifiques
GET    /api/planification-data/by_echantillon/?code=ECH001
GET    /api/planification-data/by_date/?date=2024-01-15
POST   /api/planification-data/{id}/marquer_complete/
```

---

## 🔧 Migration des Modules Frontend

### **Modules à migrer:**

1. ✅ **EssaisRejetesModule.tsx** - Déjà migré vers API
2. ✅ **EssaisRejetesMecaniqueModule.tsx** - Déjà migré vers API
3. ❌ **ChefProjetRejeteModule.tsx** - À migrer vers `RapportValidation`
4. ❌ **ServiceMarketingModule.tsx** - À migrer vers `RapportValidation`
5. ❌ **ChefServiceModule.tsx** - À migrer vers `RapportValidation`
6. ❌ **ValidationResultsModule.tsx** - À migrer vers `RapportValidation`
7. ❌ **AdminModule.tsx** - À migrer vers API complète

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
    essai_type: 'AG',
    etape_actuelle: 'chef_projet',
    file_name: 'rapport.pdf',
    file_data: 'data:application/pdf;base64,...',
  })
});
```

### **Récupérer les rapports en attente pour Chef de Projet**
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
const response = await fetch(
  `http://127.0.0.1:8000/api/rapport-validations/${rapportId}/valider_chef_projet/`,
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      comment: 'Rapport validé, bon travail'
    })
  }
);
```

### **Rejeter un rapport**
```typescript
const response = await fetch(
  `http://127.0.0.1:8000/api/rapport-validations/${rapportId}/rejeter_chef_projet/`,
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      comment: 'Erreurs dans les calculs, à corriger'
    })
  }
);
```

### **Sauvegarder des données d'essai**
```typescript
const response = await fetch('http://127.0.0.1:8000/api/essai-data/', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    essai_id: 'ECH001_AG',
    echantillon_code: 'ECH001',
    essai_type: 'AG',
    statut: 'en_cours',
    data: {
      dateDebut: '2024-01-15',
      operateur: 'Jean Dupont'
    },
    resultats: {
      pourcent_inf_2mm: 85.5,
      pourcent_inf_80um: 45.2
    }
  })
});
```

---

## 🎯 Avantages de la migration

### **Avant (localStorage):**
- ❌ Données perdues si cache navigateur vidé
- ❌ Pas de synchronisation entre utilisateurs
- ❌ Pas d'historique centralisé
- ❌ Difficile à déboguer
- ❌ Limité à 5-10 MB

### **Après (Backend):**
- ✅ Données persistantes et sécurisées
- ✅ Synchronisation temps réel
- ✅ Historique complet avec ActionLog
- ✅ Facile à déboguer via Django Admin
- ✅ Pas de limite de stockage
- ✅ Backup automatique
- ✅ Accès multi-utilisateurs

---

## 🔐 Sécurité

Toutes les requêtes nécessitent un token JWT:
```typescript
headers: {
  'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
  'Content-Type': 'application/json',
}
```

---

## 📊 Monitoring

Toutes les actions sont automatiquement enregistrées dans `ActionLog`:
- Qui a fait quoi
- Quand
- Sur quel échantillon/essai/rapport
- Succès ou échec
- Durée de l'opération

Accessible via:
- Django Admin: http://127.0.0.1:8000/admin/core/actionlog/
- API: http://127.0.0.1:8000/api/action-logs/

---

## 🚀 Prochaines étapes

1. Migrer `ChefProjetRejeteModule.tsx`
2. Migrer `ServiceMarketingModule.tsx`
3. Migrer `ChefServiceModule.tsx`
4. Migrer `ValidationResultsModule.tsx`
5. Migrer `AdminModule.tsx`
6. Supprimer toutes les références localStorage (sauf auth)
7. Tester l'application complète
8. Déployer en production

---

**Date de création**: 29 novembre 2025  
**Système**: Gestion d'Échantillons - Laboratoire SNERTP
