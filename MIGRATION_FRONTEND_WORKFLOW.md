# Migration Frontend - Workflow API

## Fichiers modifiés

### 1. workflowApi.ts (CRÉÉ)
Service API centralisé pour gérer les workflows de validation.

**Fonctions principales:**
- `getByEtape(etape)` - Récupérer workflows par étape
- `create(data)` - Créer un nouveau workflow
- `validerChefProjet(id, commentaire)` - Valider par chef projet
- `rejeterChefProjet(id, raison)` - Rejeter par chef projet
- `validerChefService(id, commentaire)` - Valider par chef service
- `rejeterChefService(id, raison)` - Rejeter par chef service
- `validerDirecteurTechnique(id, commentaire)` - Valider par directeur technique
- `rejeterDirecteurTechnique(id, raison)` - Rejeter par directeur technique
- `aviserDirecteurSNERTP(id, avis, signature)` - Aviser par directeur SNERTP
- `rejeterDirecteurSNERTP(id, raison)` - Rejeter par directeur SNERTP
- `envoyerClient(id, email)` - Envoyer au client
- `getByCode(code)` - Récupérer workflow par code échantillon

### 2. TraitementModule.tsx (MODIFIÉ)
- Import de `workflowApi`
- `handleSendToChefProjet()` utilise `workflowApi.create()` pour créer le workflow
- Fallback localStorage si API échoue

### 3. ChefProjetModule.tsx (MODIFIÉ)
- Import de `workflowApi`
- `loadEchantillons()` utilise `workflowApi.getByEtape('chef_projet')`
- `handleAccept()` utilise `workflowApi.validerChefProjet()`
- `handleReject()` utilise `workflowApi.rejeterChefProjet()`

## Prochaines étapes

### ChefServiceModule.tsx
- Charger via `workflowApi.getByEtape('chef_service')`
- Valider via `workflowApi.validerChefService()`
- Rejeter via `workflowApi.rejeterChefService()`

### ValidationModule.tsx (Directeur Technique)
- Charger via `workflowApi.getByEtape('directeur_technique')`
- Valider via `workflowApi.validerDirecteurTechnique()`
- Rejeter via `workflowApi.rejeterDirecteurTechnique()`

### RapportAAviserModule.tsx (Directeur SNERTP)
- Charger via `workflowApi.getByEtape('directeur_snertp')`
- Aviser via `workflowApi.aviserDirecteurSNERTP()`
- Rejeter via `workflowApi.rejeterDirecteurSNERTP()`

### ServiceMarketingModule.tsx
- Charger via `workflowApi.getByEtape('marketing')`
- Envoyer via `workflowApi.envoyerClient()`

## Avantages de la migration

1. **Centralisation**: Toute la logique workflow dans l'API backend
2. **Persistance**: Données sauvegardées en base de données
3. **Traçabilité**: Historique complet des validations
4. **Synchronisation**: Plusieurs utilisateurs peuvent travailler simultanément
5. **Maintenance**: Code frontend simplifié
