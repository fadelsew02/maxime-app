#!/bin/bash

# Script de configuration initiale du backend

echo "========================================"
echo "Configuration du Backend SNERTP Lab"
echo "========================================"
echo ""

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Vérifier Python
echo -e "${YELLOW}1. Vérification de Python...${NC}"
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}Python 3 n'est pas installé!${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Python $(python3 --version)${NC}"
echo ""

# Vérifier PostgreSQL
echo -e "${YELLOW}2. Vérification de PostgreSQL...${NC}"
if ! command -v psql &> /dev/null; then
    echo -e "${RED}PostgreSQL n'est pas installé!${NC}"
    exit 1
fi
echo -e "${GREEN}✓ PostgreSQL installé${NC}"
echo ""

# Créer l'environnement virtuel
echo -e "${YELLOW}3. Création de l'environnement virtuel...${NC}"
if [ ! -d "venv" ]; then
    python3 -m venv venv
    echo -e "${GREEN}✓ Environnement virtuel créé${NC}"
else
    echo -e "${GREEN}✓ Environnement virtuel existe déjà${NC}"
fi
echo ""

# Activer l'environnement virtuel
echo -e "${YELLOW}4. Activation de l'environnement virtuel...${NC}"
source venv/bin/activate
echo -e "${GREEN}✓ Environnement activé${NC}"
echo ""

# Installer les dépendances
echo -e "${YELLOW}5. Installation des dépendances...${NC}"
pip install --upgrade pip
pip install -r requirements.txt
echo -e "${GREEN}✓ Dépendances installées${NC}"
echo ""

# Créer le fichier .env
echo -e "${YELLOW}6. Configuration de l'environnement...${NC}"
if [ ! -f ".env" ]; then
    cp .env.example .env
    echo -e "${YELLOW}⚠ Fichier .env créé. Veuillez le configurer avec vos paramètres.${NC}"
else
    echo -e "${GREEN}✓ Fichier .env existe${NC}"
fi
echo ""

# Créer la base de données
echo -e "${YELLOW}7. Configuration de la base de données...${NC}"
echo "Veuillez créer la base de données PostgreSQL manuellement:"
echo ""
echo "  sudo -u postgres psql"
echo "  CREATE DATABASE snertp_lab_db;"
echo "  CREATE USER snertp_user WITH PASSWORD 'your_password';"
echo "  GRANT ALL PRIVILEGES ON DATABASE snertp_lab_db TO snertp_user;"
echo "  \\q"
echo ""
read -p "Appuyez sur Entrée une fois la base de données créée..."
echo ""

# Créer les migrations
echo -e "${YELLOW}8. Création des migrations...${NC}"
python manage.py makemigrations
python manage.py migrate
echo -e "${GREEN}✓ Migrations appliquées${NC}"
echo ""

# Créer les données d'exemple
echo -e "${YELLOW}9. Création des données d'exemple...${NC}"
read -p "Voulez-vous créer des données d'exemple? (o/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Oo]$ ]]; then
    python scripts/create_sample_data.py
    echo -e "${GREEN}✓ Données d'exemple créées${NC}"
fi
echo ""

# Résumé
echo ""
echo "========================================"
echo -e "${GREEN}Configuration terminée avec succès!${NC}"
echo "========================================"
echo ""
echo "Pour lancer le serveur de développement:"
echo "  source venv/bin/activate"
echo "  python manage.py runserver"
echo ""
echo "Pour lancer Celery (dans des terminaux séparés):"
echo "  celery -A config worker -l info"
echo "  celery -A config beat -l info"
echo ""
echo "API disponible sur: http://localhost:8000/api/"
echo "Admin: http://localhost:8000/admin/"
echo "Swagger: http://localhost:8000/swagger/"
echo ""
