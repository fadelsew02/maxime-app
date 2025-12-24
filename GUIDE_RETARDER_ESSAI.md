# 📅 Guide : Retarder un Essai avec Envoi Automatique

## 🎯 Fonctionnalité

Cette fonctionnalité permet de **retarder un essai** et de **fixer une date** pour qu'il soit **envoyé automatiquement** sans intervention manuelle.

## 🔧 Comment ça marche ?

### 1️⃣ Bouton "Retarder"
- L'utilisateur clique sur "Retarder" pour un essai
- Une fenêtre s'ouvre pour choisir une nouvelle date

### 2️⃣ Bouton "Fixer cette date"
- L'utilisateur sélectionne la date souhaitée
- Il clique sur "Fixer cette date"
- Le système crée une **tâche programmée**

### 3️⃣ Envoi Automatique
- Quand la date arrive, le système exécute automatiquement la tâche
- L'essai est démarré automatiquement
- Le statut de l'échantillon passe à "essais"
- **Aucune intervention manuelle nécessaire !**

## 📊 Architecture Technique

### Backend (Django)

#### 1. Nouveau Modèle : `TacheProgrammee`
```python
class TacheProgrammee(models.Model):
    type_tache = 'envoi_essai' | 'envoi_traitement' | 'envoi_validation'
    date_execution = DateTimeField  # Date d'exécution automatique
    statut = 'en_attente' | 'executee' | 'annulee'
    essai = ForeignKey(Essai)
    echantillon = ForeignKey(Echantillon)
```

#### 2. Nouvel Endpoint : `/api/essais/{id}/retarder/`
```python
POST /api/essais/{id}/retarder/
Body: {
    "date_execution": "2025-12-20T10:00:00Z"
}

Response: {
    "message": "Essai retardé avec succès",
    "tache_id": "uuid",
    "date_execution": "2025-12-20T10:00:00Z"
}
```

#### 3. Commande Django : `executer_taches_programmees`
```bash
python manage.py executer_taches_programmees
```

Cette commande :
- Cherche les tâches dont la date est arrivée
- Exécute automatiquement les actions
- Marque les tâches comme exécutées

## 🚀 Installation

### 1. Créer les migrations
```bash
cd backend
python manage.py makemigrations
python manage.py migrate
```

### 2. Tester manuellement
```bash
python manage.py executer_taches_programmees
```

### 3. Automatiser avec un scheduler

#### Option A : Windows Task Scheduler
1. Ouvrir "Planificateur de tâches"
2. Créer une nouvelle tâche
3. Déclencheur : Toutes les 5 minutes
4. Action : `python manage.py executer_taches_programmees`

#### Option B : Cron (Linux/Mac)
```bash
# Éditer crontab
crontab -e

# Ajouter cette ligne (exécute toutes les 5 minutes)
*/5 * * * * cd /path/to/backend && python manage.py executer_taches_programmees
```

#### Option C : Celery (Recommandé pour production)
```python
# Dans settings.py
CELERY_BEAT_SCHEDULE = {
    'executer-taches-programmees': {
        'task': 'core.tasks.executer_taches_programmees',
        'schedule': 300.0,  # Toutes les 5 minutes
    },
}
```

## 📝 Exemple d'Utilisation

### Scénario : Retarder un essai AG

1. **Opérateur Route** se connecte
2. Il voit l'essai AG pour l'échantillon S-0001/25
3. Il clique sur "Retarder"
4. Il choisit la date : 20/12/2025 à 10h00
5. Il clique sur "Fixer cette date"
6. Le système confirme : "Essai retardé. Envoi automatique le 20/12/2025 à 10h00"

### Le 20/12/2025 à 10h00 :
- Le scheduler exécute la commande
- L'essai AG est démarré automatiquement
- Le statut de l'échantillon passe à "essais"
- Une notification est envoyée à l'opérateur

## 🔍 Vérification

### Voir les tâches programmées
```bash
python manage.py shell

from core.models import TacheProgrammee
taches = TacheProgrammee.objects.filter(statut='en_attente')
for tache in taches:
    print(f"{tache.type_tache} - {tache.date_execution}")
```

### Voir les tâches exécutées
```bash
from core.models import TacheProgrammee
taches = TacheProgrammee.objects.filter(statut='executee')
for tache in taches:
    print(f"{tache.type_tache} - Exécutée le {tache.executed_at}")
```

## 📊 Base de Données

### Table : `taches_programmees`
| Champ | Type | Description |
|-------|------|-------------|
| id | UUID | Identifiant unique |
| type_tache | VARCHAR | Type de tâche |
| date_execution | DATETIME | Date d'exécution |
| statut | VARCHAR | Statut de la tâche |
| essai_id | UUID | Référence à l'essai |
| echantillon_id | UUID | Référence à l'échantillon |
| created_at | DATETIME | Date de création |
| executed_at | DATETIME | Date d'exécution |

## 🎨 Interface Utilisateur (À implémenter)

### Bouton "Retarder"
```tsx
<Button onClick={() => setShowRetarderDialog(true)}>
  Retarder
</Button>
```

### Dialog "Fixer la date"
```tsx
<Dialog open={showRetarderDialog}>
  <DialogTitle>Retarder l'essai</DialogTitle>
  <DialogContent>
    <DateTimePicker
      value={dateExecution}
      onChange={setDateExecution}
    />
    <Button onClick={handleFixerDate}>
      Fixer cette date
    </Button>
  </DialogContent>
</Dialog>
```

### Fonction `handleFixerDate`
```tsx
const handleFixerDate = async () => {
  const response = await fetch(`/api/essais/${essaiId}/retarder/`, {
    method: 'POST',
    body: JSON.stringify({
      date_execution: dateExecution.toISOString()
    })
  });
  
  if (response.ok) {
    toast.success('Essai retardé avec succès');
  }
};
```

## ⚠️ Points Importants

1. **Fuseau horaire** : Utilisez toujours UTC pour les dates
2. **Scheduler** : Assurez-vous que le scheduler tourne en continu
3. **Notifications** : Informez l'utilisateur quand la tâche est exécutée
4. **Annulation** : Permettez d'annuler une tâche programmée

## 🔄 Workflow Complet

```
1. Utilisateur clique "Retarder"
   ↓
2. Sélectionne une date
   ↓
3. Clique "Fixer cette date"
   ↓
4. Backend crée TacheProgrammee
   ↓
5. Scheduler vérifie toutes les 5 minutes
   ↓
6. Quand date_execution <= maintenant
   ↓
7. Exécute automatiquement l'action
   ↓
8. Marque la tâche comme "executee"
   ↓
9. Envoie une notification
```

## 📞 Support

Pour toute question :
- Consultez les logs : `python manage.py executer_taches_programmees`
- Vérifiez la base de données : Table `taches_programmees`
- Testez manuellement la commande

---

**Date de création :** 16 décembre 2025  
**Système :** Gestion d'Échantillons - Laboratoire SNERTP
