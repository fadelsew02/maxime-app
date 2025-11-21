-- Script SQL pour créer la base de données PostgreSQL
-- Système de Gestion du Laboratoire SNERTP

-- 1. Créer la base de données
CREATE DATABASE snertp_lab_db
    WITH 
    OWNER = postgres
    ENCODING = 'UTF8'
    LC_COLLATE = 'fr_FR.UTF-8'
    LC_CTYPE = 'fr_FR.UTF-8'
    TABLESPACE = pg_default
    CONNECTION LIMIT = -1;

-- 2. Se connecter à la base de données
\c snertp_lab_db;

-- 3. Créer l'utilisateur
CREATE USER snertp_user WITH PASSWORD 'ChangeThisPassword123!';

-- 4. Configurer l'utilisateur
ALTER ROLE snertp_user SET client_encoding TO 'utf8';
ALTER ROLE snertp_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE snertp_user SET timezone TO 'Africa/Abidjan';

-- 5. Donner tous les privilèges sur la base de données
GRANT ALL PRIVILEGES ON DATABASE snertp_lab_db TO snertp_user;

-- 6. Donner les privilèges sur le schéma public
GRANT ALL ON SCHEMA public TO snertp_user;

-- 7. Donner les privilèges sur toutes les tables futures
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO snertp_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO snertp_user;

-- 8. Créer des extensions utiles
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";  -- Pour générer des UUIDs
CREATE EXTENSION IF NOT EXISTS "pg_trgm";     -- Pour la recherche full-text

-- 9. Afficher les informations
\du snertp_user
\l snertp_lab_db

-- Instructions de connexion
\echo '================================================'
\echo 'Base de données créée avec succès!'
\echo '================================================'
\echo 'Nom de la base: snertp_lab_db'
\echo 'Utilisateur: snertp_user'
\echo 'Mot de passe: ChangeThisPassword123! (à changer!)'
\echo ''
\echo 'Configuration dans .env:'
\echo 'DB_NAME=snertp_lab_db'
\echo 'DB_USER=snertp_user'
\echo 'DB_PASSWORD=ChangeThisPassword123!'
\echo 'DB_HOST=localhost'
\echo 'DB_PORT=5432'
\echo '================================================'
