#!/bin/bash

echo "🚀 Build et déploiement du frontend..."

# Aller dans le dossier UI
cd ui

# Installer les dépendances si nécessaire
if [ ! -d "node_modules" ]; then
    echo "📦 Installation des dépendances..."
    npm install
fi

# Build du frontend
echo "🔨 Build du frontend..."
npm run build

# Vérifier si le build a réussi
if [ $? -eq 0 ]; then
    echo "✅ Build réussi ! Les fichiers sont dans backend/templates/"
    echo "🌐 Le frontend sera servi depuis Django sur http://localhost:8000"
else
    echo "❌ Erreur lors du build"
    exit 1
fi

# Retourner au dossier racine
cd ..

echo "🎉 Déploiement terminé !"