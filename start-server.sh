#!/bin/bash

echo "🚀 Démarrage du serveur avec frontend intégré..."

# Build du frontend si pas encore fait
if [ ! -f "backend/templates/index.html" ]; then
    echo "📦 Premier build du frontend..."
    ./build-frontend.sh
fi

# Démarrer Django
cd backend
echo "🌐 Démarrage du serveur Django sur http://localhost:8000"
python manage.py runserver