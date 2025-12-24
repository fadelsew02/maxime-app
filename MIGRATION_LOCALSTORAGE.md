# Migration localStorage vers Backend

## Étapes de migration

### 1. Exporter les données localStorage

**Frontend:**
- Un bouton "📥 Exporter localStorage" apparaît en bas à droite (mode dev uniquement)
- Cliquer pour télécharger `localstorage_YYYY-MM-DD.json`

**Alternative console:**
```javascript
// Dans la console du navigateur (F12)
copy(JSON.stringify(localStorage))
// Coller dans un fichier localstorage.json
```

### 2. Migrer vers le backend

**Backend:**
```bash
cd backend
python migrate_localstorage.py chemin/vers/localstorage.json
```

Le script migre automatiquement:
- ✅ Essais (AG, Proctor, CBR, Oedometre, Cisaillement)
- ✅ Workflows de validation (chef_projet → chef_service → directeur_technique → directeur_snertp)
- ✅ Statuts et commentaires de validation
- ✅ Dates et métadonnées

### 3. Vérifier la migration

**Django Admin:**
```
http://127.0.0.1:8000/admin/
```
- Vérifier les Essais
- Vérifier les WorkflowValidation

**API:**
```bash
# Essais
curl http://127.0.0.1:8000/api/essais/

# Workflows
curl http://127.0.0.1:8000/api/workflows/
```

### 4. Nettoyer localStorage (optionnel)

**Après vérification:**
```javascript
// Garder uniquement les tokens
const tokens = {
  access_token: localStorage.getItem('access_token'),
  refresh_token: localStorage.getItem('refresh_token'),
  user: localStorage.getItem('user')
};

localStorage.clear();

Object.entries(tokens).forEach(([key, value]) => {
  if (value) localStorage.setItem(key, value);
});
```

## Structure des données migrées

### Essais
```python
Essai {
  echantillon: FK,
  type_essai: 'AG' | 'Proctor' | 'CBR' | 'Oedometre' | 'Cisaillement',
  resultats: JSON,
  statut: 'en_cours' | 'termine',
  date_debut, date_fin,
  operateur, commentaires
}
```

### Workflows
```python
WorkflowValidation {
  echantillon: FK,
  code_echantillon: str,
  etape_actuelle: 'chef_projet' | 'chef_service' | 'directeur_technique' | 'directeur_snertp' | 'marketing' | 'client',
  statut: 'en_attente' | 'valide' | 'rejete',
  file_data, file_name,
  
  # Validations
  validation_chef_projet, date_validation_chef_projet, commentaire_chef_projet,
  validation_chef_service, date_validation_chef_service, commentaire_chef_service,
  validation_directeur_technique, date_validation_directeur_technique, commentaire_directeur_technique,
  
  # Avis directeur SNERTP
  avis_directeur_snertp, signature_directeur_snertp, date_avis_directeur_snertp,
  
  # Marketing
  date_envoi_client, email_client
}
```

## Avantages de la migration

1. **Persistance** - Données sauvegardées en base de données
2. **Synchronisation** - Plusieurs utilisateurs simultanés
3. **Traçabilité** - Historique complet des actions
4. **Performance** - Requêtes optimisées
5. **Sécurité** - Données centralisées et sécurisées
6. **Backup** - Sauvegarde automatique de la base de données

## Rollback (si nécessaire)

Si problème après migration:
1. Garder le fichier JSON exporté
2. Les données localStorage restent intactes jusqu'au nettoyage manuel
3. Le frontend a un fallback localStorage automatique
