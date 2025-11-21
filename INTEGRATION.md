# 🔗 Guide d'Intégration Frontend ↔ Backend

Guide complet pour intégrer le frontend React avec le backend Django.

## Vue d'ensemble

```
┌─────────────────────────────────────────────────────────┐
│  Frontend (React + Vite)                                │
│  Port: 5173                                             │
│  ├── Composants UI (shadcn/ui)                         │
│  ├── Gestion d'état (React Context)                    │
│  └── Communication HTTP (fetch/axios)                  │
└────────────────┬────────────────────────────────────────┘
                 │
                 │ HTTP REST API + JWT
                 │
┌────────────────▼────────────────────────────────────────┐
│  Backend (Django REST Framework)                        │
│  Port: 8000                                             │
│  ├── API REST endpoints                                │
│  ├── Authentification JWT                              │
│  ├── Optimisation par contraintes (OR-Tools)           │
│  └── Base de données PostgreSQL                        │
└─────────────────────────────────────────────────────────┘
```

## Configuration CORS

### Backend (Django)

Dans `backend/config/settings.py`:

```python
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

CORS_ALLOW_CREDENTIALS = True
```

### Frontend (Vite)

Créer `src/lib/api.ts`:

```typescript
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export const api = {
  baseURL: API_BASE_URL,
  
  getHeaders: () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
  }),
};
```

## Authentification JWT

### 1. Login

**Frontend:**
```typescript
// src/services/auth.ts
export async function login(username: string, password: string) {
  const response = await fetch(`${API_BASE_URL}/auth/login/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  
  const data = await response.json();
  
  // Stocker les tokens
  localStorage.setItem('access_token', data.access);
  localStorage.setItem('refresh_token', data.refresh);
  
  return data;
}
```

**Backend endpoint:** `POST /api/auth/login/`

**Réponse:**
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbG..."
}
```

### 2. Refresh Token

**Frontend:**
```typescript
export async function refreshToken() {
  const refresh = localStorage.getItem('refresh_token');
  
  const response = await fetch(`${API_BASE_URL}/auth/refresh/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh }),
  });
  
  const data = await response.json();
  localStorage.setItem('access_token', data.access);
  
  return data;
}
```

### 3. Auto-refresh sur 401

```typescript
async function fetchWithAuth(url: string, options: RequestInit = {}) {
  let response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
    },
  });
  
  // Si 401, rafraîchir le token et réessayer
  if (response.status === 401) {
    await refreshToken();
    response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
      },
    });
  }
  
  return response;
}
```

## Migration des données Mock vers l'API

### Avant (Mock Data)

```typescript
// src/lib/mockData.ts
export function getEchantillons(): Echantillon[] {
  return echantillons;
}
```

### Après (API)

```typescript
// src/lib/api.ts
export async function getEchantillons(): Promise<Echantillon[]> {
  const response = await fetchWithAuth(`${API_BASE_URL}/echantillons/`);
  const data = await response.json();
  return data.results || data;
}

export async function createEchantillon(data: CreateEchantillonDTO) {
  const response = await fetchWithAuth(`${API_BASE_URL}/echantillons/`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return response.json();
}

export async function updateEchantillon(id: string, data: Partial<Echantillon>) {
  const response = await fetchWithAuth(`${API_BASE_URL}/echantillons/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
  return response.json();
}
```

## Correspondance API ↔ Frontend

### Clients

| Frontend | Backend | Méthode | Endpoint |
|----------|---------|---------|----------|
| `getClients()` | GET | `/api/clients/` | Liste |
| `addClient(data)` | POST | `/api/clients/` | Créer |
| `getClient(code)` | GET | `/api/clients/{id}/` | Détails |

### Échantillons

| Frontend | Backend | Méthode | Endpoint |
|----------|---------|---------|----------|
| `getEchantillons()` | GET | `/api/echantillons/` | Liste |
| `addEchantillon(data)` | POST | `/api/echantillons/` | Créer |
| `updateEchantillon(code, data)` | PATCH | `/api/echantillons/{id}/` | Modifier |
| `getEchantillons().filter(statut)` | GET | `/api/echantillons/?statut=stockage` | Filtrer |

### Essais

| Frontend | Backend | Méthode | Endpoint |
|----------|---------|---------|----------|
| `getEssaisBySection(section)` | GET | `/api/essais/?section=route` | Par section |
| `updateEssai(id, data)` | PATCH | `/api/essais/{id}/` | Modifier |
| `demarrer()` | POST | `/api/essais/{id}/demarrer/` | Démarrer |
| `terminer()` | POST | `/api/essais/{id}/terminer/` | Terminer |

## Intégration du Scheduler

### 1. Récupérer le planning actif

**Frontend:**
```typescript
export async function getActivePlanning() {
  const response = await fetchWithAuth(`${API_BASE_URL}/scheduler/plannings/actif/`);
  return response.json();
}
```

### 2. Créer un planning optimisé

**Frontend (StorageModule.tsx):**
```typescript
// Remplacer la logique de planification manuelle
async function optimiserPlanning() {
  const response = await fetchWithAuth(
    `${API_BASE_URL}/scheduler/plannings/optimiser/`,
    {
      method: 'POST',
      body: JSON.stringify({
        nom: `Planning ${new Date().toLocaleDateString()}`,
        date_debut: new Date().toISOString().split('T')[0],
        date_fin: addDays(new Date(), 14).toISOString().split('T')[0],
        section: 'all'
      })
    }
  );
  
  const planning = await response.json();
  console.log(`Planning créé avec ${planning.nombre_essais_planifies} essais`);
  
  return planning;
}
```

### 3. Afficher le planning

**Frontend:**
```typescript
interface Affectation {
  id: string;
  essai: Essai;
  date_debut_planifiee: string;
  date_fin_planifiee: string;
  priorite_calculee: number;
}

function PlanningView({ planningId }: { planningId: string }) {
  const [affectations, setAffectations] = useState<Affectation[]>([]);
  
  useEffect(() => {
    fetchWithAuth(`${API_BASE_URL}/scheduler/plannings/${planningId}/affectations/`)
      .then(r => r.json())
      .then(setAffectations);
  }, [planningId]);
  
  return (
    <div>
      <h2>Planning Optimisé</h2>
      {affectations.map(aff => (
        <div key={aff.id}>
          <p>{aff.essai.type} - {aff.essai.echantillon.code}</p>
          <p>Début: {aff.date_debut_planifiee}</p>
          <p>Fin: {aff.date_fin_planifiee}</p>
          <p>Priorité: {aff.priorite_calculee}</p>
        </div>
      ))}
    </div>
  );
}
```

## Notifications en Temps Réel

### Option 1: Polling (Simple)

```typescript
function useNotifications(userId: string) {
  const [notifications, setNotifications] = useState([]);
  
  useEffect(() => {
    const interval = setInterval(async () => {
      const response = await fetchWithAuth(`${API_BASE_URL}/notifications/`);
      const data = await response.json();
      setNotifications(data.results || data);
    }, 30000); // Toutes les 30 secondes
    
    return () => clearInterval(interval);
  }, [userId]);
  
  return notifications;
}
```

### Option 2: Server-Sent Events (Avancé)

**Backend (à ajouter):**
```python
# core/views.py
from django.http import StreamingHttpResponse

def notification_stream(request):
    def event_stream():
        while True:
            notifications = Notification.objects.filter(
                user=request.user,
                read=False
            )
            yield f"data: {json.dumps(list(notifications.values()))}\n\n"
            time.sleep(10)
    
    return StreamingHttpResponse(event_stream(), content_type='text/event-stream')
```

**Frontend:**
```typescript
function useNotificationStream() {
  const [notifications, setNotifications] = useState([]);
  
  useEffect(() => {
    const eventSource = new EventSource(
      `${API_BASE_URL}/notifications/stream/`,
      { withCredentials: true }
    );
    
    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setNotifications(data);
    };
    
    return () => eventSource.close();
  }, []);
  
  return notifications;
}
```

## Variables d'environnement

### Frontend (.env)

```env
VITE_API_URL=http://localhost:8000/api
VITE_WS_URL=ws://localhost:8000/ws
```

### Backend (.env)

```env
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

## Gestion des erreurs

### Frontend

```typescript
async function handleApiCall<T>(
  apiCall: () => Promise<Response>
): Promise<T | null> {
  try {
    const response = await apiCall();
    
    if (!response.ok) {
      const error = await response.json();
      toast.error(error.message || 'Une erreur est survenue');
      return null;
    }
    
    return await response.json();
  } catch (error) {
    console.error('Erreur API:', error);
    toast.error('Erreur de connexion au serveur');
    return null;
  }
}

// Utilisation
const echantillon = await handleApiCall<Echantillon>(
  () => fetchWithAuth(`${API_BASE_URL}/echantillons/${id}/`)
);
```

## Typage TypeScript

### Générer les types depuis Django

**Option 1: Manuellement**

```typescript
// src/types/api.ts
export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  first_name: string;
  last_name: string;
}

export interface Echantillon {
  id: string;
  code: string;
  client: string;
  nature: string;
  profondeur_debut: number;
  profondeur_fin: number;
  sondage: 'carotte' | 'vrac';
  statut: EchantillonStatut;
  // ...
}
```

**Option 2: Automatique (drf-spectacular)**

```bash
# Backend
pip install drf-spectacular

# Générer le schéma OpenAPI
python manage.py spectacular --file schema.yml

# Frontend: Générer les types
npx openapi-typescript schema.yml --output src/types/api.ts
```

## Tests d'intégration

### Frontend

```typescript
// tests/integration/api.test.ts
import { describe, it, expect } from 'vitest';
import { login, getEchantillons } from '@/lib/api';

describe('API Integration', () => {
  it('should login and fetch echantillons', async () => {
    // Login
    const auth = await login('receptionniste', 'password123');
    expect(auth.access).toBeDefined();
    
    // Fetch data
    const echantillons = await getEchantillons();
    expect(Array.isArray(echantillons)).toBe(true);
  });
});
```

## Checklist de migration

- [ ] Configurer CORS dans Django
- [ ] Créer service d'authentification JWT
- [ ] Migrer `getClients()` → API
- [ ] Migrer `getEchantillons()` → API
- [ ] Migrer `getEssais()` → API
- [ ] Intégrer le scheduler pour la planification
- [ ] Remplacer les notifications mockées
- [ ] Implémenter le rafraîchissement auto du token
- [ ] Gérer les erreurs API
- [ ] Typer les réponses API
- [ ] Tests d'intégration
- [ ] Documentation des endpoints

## Démarrage

### 1. Backend

```bash
cd backend
source venv/bin/activate
python manage.py runserver
# API disponible sur http://localhost:8000/api/
```

### 2. Frontend

```bash
cd ../
npm run dev
# App disponible sur http://localhost:5173
```

### 3. Tester l'intégration

```bash
# Ouvrir http://localhost:5173
# Se connecter avec: receptionniste / password123
# Vérifier que les données viennent du backend
```

## Support

Pour toute question sur l'intégration:
- Consulter la documentation Swagger: http://localhost:8000/swagger/
- Voir les exemples dans `backend/README.md`
- Contact: contact@snertp.ci
