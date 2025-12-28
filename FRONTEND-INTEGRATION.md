# Frontend intégré avec Django

Le frontend React est maintenant servi directement depuis Django.

## Scripts disponibles

### `./build-frontend.sh`
Build le frontend React et place les fichiers dans `backend/templates/`

### `./start-server.sh`  
Démarre le serveur Django avec le frontend intégré sur http://localhost:8000

## Workflow de développement

1. **Développement frontend** : Utilise `cd ui && npm run dev` pour le développement avec hot-reload
2. **Build et test** : Utilise `./build-frontend.sh` pour builder et tester l'intégration
3. **Production** : Utilise `./start-server.sh` pour servir l'app complète

## Structure

```
backend/
├── templates/
│   ├── index.html          # Page principale React
│   └── static/
│       ├── css/            # Styles buildés
│       └── js/             # JavaScript buildé
└── ...

ui/
├── src/                    # Code source React
└── vite.config.ts         # Config modifiée pour build dans backend/templates
```

## URLs

- `/` : Frontend React
- `/api/` : API Django REST
- `/admin/` : Interface admin Django
- `/swagger/` : Documentation API