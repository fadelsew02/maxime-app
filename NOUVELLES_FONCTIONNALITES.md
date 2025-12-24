# Nouvelles Fonctionnalités Implémentées

## 1. Blocage d'ajout d'échantillons après 24h ✅

**Backend**: Validation automatique dans `EchantillonViewSet.perform_create()`

- Vérifie le délai depuis le dernier échantillon du client
- Bloque l'ajout si > 24h avec message d'erreur
- Force la création d'un nouveau client

**Utilisation**:
```python
# Automatique lors de la création d'un échantillon
POST /api/echantillons/
```

## 2. Marquage automatique prioritaire des essais rejetés ✅

**Backend**: `EssaiViewSet.rejeter()`

- Marque automatiquement l'essai comme `priorite='urgente'`
- Marque aussi l'échantillon parent comme prioritaire
- Les essais prioritaires apparaissent en premier dans les dashboards

**Utilisation**:
```python
POST /api/essais/{id}/rejeter/
{
  "commentaires": "Raison du rejet"
}
```

## 3. Affichage visuel des essais rejetés ✅

**Frontend**: `src/styles/essais-rejetes.css`

Classes CSS disponibles:
- `.essai-rejete` - Fond rouge clair avec bordure rouge
- `.essai-rejete-badge` - Badge rouge avec animation pulse
- `.essai-prioritaire` - Fond jaune clair pour les prioritaires

**Utilisation**:
```tsx
<div className={essai.date_rejet ? 'essai-rejete' : ''}>
  {essai.date_rejet && (
    <Badge className="essai-rejete-badge">REJETÉ</Badge>
  )}
</div>
```

## 4. Vérification de capacité avec blocage ✅

**Helper**: `src/lib/capaciteHelper.ts`

Fonctions disponibles:
- `verifierCapacite(typeEssai, dateEnvoi)` - Vérifie la capacité
- `afficherMessageCapacite(disponible, message)` - Affiche le message de blocage

**Utilisation**:
```typescript
import { verifierCapacite, afficherMessageCapacite } from '@/lib/capaciteHelper';

const result = await verifierCapacite('AG', '2025-01-15');
if (!afficherMessageCapacite(result.disponible, result.message)) {
  // Blocage: "Capacité atteinte, veuillez patienter."
  return;
}
// Continuer l'envoi
```

## 5. Reprogrammation automatique des retards ✅

**Backend**: `core/reprogrammation_helper.py` + endpoint API

Fonctionnalités:
- Calcule automatiquement la nouvelle date d'envoi
- Déclasse l'ordre d'envoi
- Recalcule la date de retour prédite
- Crée une tâche programmée pour l'envoi automatique

**Utilisation**:
```python
POST /api/echantillons/{id}/retarder/
{
  "jours_retard": 4
}

# Réponse:
{
  "success": true,
  "nouvelle_date_envoi": "2025-01-20",
  "nouvelle_date_retour": "2025-02-05",
  "message": "Échantillon reprogrammé avec succès pour le 2025-01-20"
}
```

## 6. Personnalisation des sidebars par rôle ✅

**Config**: `src/config/sidebarConfig.ts`

Configuration par rôle:
- **chef_projet**: Suppression de "Rapport rejeté" et "Validation"
- **directeur_technique**: Suppression de "Rapport"
- Chaque rôle a sa propre liste de menus

**Utilisation**:
```typescript
import { getMenuItemsForRole, shouldShowMenuItem } from '@/config/sidebarConfig';

// Obtenir les menus pour un rôle
const menus = getMenuItemsForRole(user.role);

// Vérifier si un menu doit être affiché
if (shouldShowMenuItem(user.role, 'Rapport')) {
  // Afficher le menu
}
```

## 7. Archivage des rapports ✅

**Backend**: 
- Modèle: `core/models_archive.py` - `RapportArchive`
- ViewSet: `core/views_archive.py` - `RapportArchiveViewSet`
- Route: `/api/rapports-archives/`

Fonctionnalités:
- Archive automatique lors de l'envoi au chef service
- Filtrage par rôle (chef projet voit ses propres archives)
- Recherche par code échantillon et client

**Utilisation**:
```python
# Archiver un rapport
POST /api/rapports-archives/archiver_rapport/
{
  "code_echantillon": "S-0001/25",
  "client_name": "Client ABC",
  "file_name": "rapport.pdf",
  "file_data": "base64...",
  "etape_envoi": "chef_service",
  "commentaires": "Rapport validé"
}

# Récupérer mes archives (chef projet)
GET /api/rapports-archives/mes_archives/

# Lister toutes les archives (autres rôles)
GET /api/rapports-archives/
```

## Ordre d'envoi strict pour opérateurs ✅

**Backend**: Déjà implémenté dans les endpoints existants

- `dashboard_meca` - Tri par date_envoi_essais puis priorité
- `dashboard_route` - Tri par date_envoi_essais puis priorité
- Les essais rejetés (prioritaires) passent automatiquement en premier

**Utilisation**:
```python
GET /api/echantillons/dashboard_meca/
GET /api/echantillons/dashboard_route/
```

## Migration et déploiement

```bash
# Appliquer les migrations
cd backend
source venv/bin/activate
python manage.py makemigrations
python manage.py migrate

# Redémarrer le serveur
python manage.py runserver
```

## Tests

Toutes les fonctionnalités ont été testées et sont opérationnelles. Les anciennes fonctionnalités restent intactes.
