# 👥 Comptes Utilisateurs - Laboratoire SNERTP

## 📋 Liste complète des comptes de test

Tous les comptes utilisent le mot de passe : **`demo123`** (sauf admin)

---

### 🔴 ADMINISTRATION

#### 1. Administrateur Système
- **Username** : `admin`
- **Password** : `admin123` ⚠️ (différent des autres)
- **Rôle** : Directeur Général
- **Nom complet** : Admin SNERTP
- **Email** : admin@snertp.com
- **Accès** : Tous les modules

#### 2. Directeur Général
- **Username** : `directeur`
- **Password** : `demo123`
- **Rôle** : Directeur Général
- **Nom complet** : Fatou SANOGO
- **Email** : direction@snertp.com
- **Accès** : Validation finale, vue d'ensemble

---

### 🟠 DIRECTION TECHNIQUE

#### 3. Directeur Technique
- **Username** : `dir_technique`
- **Password** : `demo123`
- **Rôle** : Directeur Technique
- **Nom complet** : Yves DIALLO
- **Email** : technique@snertp.com
- **Accès** : Validation technique, supervision

#### 4. Chef Service Génie Civil
- **Username** : `chef_service`
- **Password** : `demo123`
- **Rôle** : Chef Service Génie Civil
- **Nom complet** : Amani KOUAME
- **Email** : service@snertp.com
- **Accès** : Validation service, gestion équipe

#### 5. Chef de Projet
- **Username** : `chef_projet`
- **Password** : `demo123`
- **Rôle** : Chef de Projet
- **Nom complet** : Konan BROU
- **Email** : projet@snertp.com
- **Accès** : Suivi projets, validation rapports

---

### 🟢 OPÉRATIONS LABORATOIRE

#### 6. Réceptionniste
- **Username** : `receptionniste`
- **Password** : `demo123`
- **Rôle** : Réceptionniste
- **Nom complet** : Marie KOUASSI
- **Email** : reception@snertp.com
- **Accès** : Réception échantillons, enregistrement clients

#### 7. Responsable Matériaux
- **Username** : `resp_materiaux`
- **Password** : `demo123`
- **Rôle** : Responsable Matériaux
- **Nom complet** : Jean KOFFI
- **Email** : materiaux@snertp.com
- **Accès** : Gestion stockage, planification essais

#### 8. Opérateur Route
- **Username** : `operateur_route`
- **Password** : `demo123`
- **Rôle** : Opérateur Labo - Section Route
- **Nom complet** : Kouadio YAO
- **Email** : route@snertp.com
- **Accès** : Essais AG, Proctor, CBR

#### 9. Opérateur Mécanique
- **Username** : `operateur_meca`
- **Password** : `demo123`
- **Rôle** : Opérateur Labo - Mécanique des sols
- **Nom complet** : Aya TRAORE
- **Email** : mecanique@snertp.com
- **Accès** : Essais Œdomètre, Cisaillement

#### 10. Responsable Traitement
- **Username** : `resp_traitement`
- **Password** : `demo123`
- **Rôle** : Responsable Traitement
- **Nom complet** : Adjoua N'GUESSAN
- **Email** : traitement@snertp.com
- **Accès** : Décodification, traitement données

---

### 📤 MARKETING & COMMUNICATION

#### 11. Service Marketing
- **Username** : `marketing`
- **Password** : `demo123`
- **Rôle** : Service Marketing
- **Nom complet** : Service Marketing
- **Email** : marketing@snertp.com
- **Accès** : Réception rapports signés, envoi clients

---

## 🔐 Résumé des mots de passe

| Username | Mot de passe |
|----------|--------------|
| admin | **admin123** |
| Tous les autres | **demo123** |

---

## 🎯 Workflow par rôle

### 1️⃣ Réceptionniste
- Enregistre les clients
- Réceptionne les échantillons
- Génère les QR codes
- Assigne les priorités

### 2️⃣ Responsable Matériaux
- Gère le stockage des échantillons
- Planifie les essais
- Assigne les essais aux opérateurs

### 3️⃣ Opérateurs (Route / Mécanique)
- Réalisent les essais
- Saisissent les résultats
- Marquent les essais comme terminés

### 4️⃣ Responsable Traitement
- Décodifie les résultats
- Traite les données
- Prépare les rapports

### 5️⃣ Chef de Projet
- Valide les rapports
- Suit l'avancement des projets

### 6️⃣ Chef Service / Directeur Technique
- Validation hiérarchique
- Supervision technique

### 7️⃣ Directeur Général
- Validation finale
- Vue d'ensemble du laboratoire

### 8️⃣ Service Marketing
- Reçoit les rapports signés par le Directeur SNERTP
- Envoie les rapports aux clients
- Gestion de la communication client

---

## 🌐 Accès à l'application

**URL Frontend** : http://localhost:3000
**URL Backend API** : http://127.0.0.1:8000/api/

---

## 📝 Notes importantes

1. **Tous les comptes sont actifs** et prêts à être utilisés
2. **Les mots de passe peuvent être changés** via l'interface admin Django
3. **Chaque rôle a des permissions spécifiques** définies dans le backend
4. **Le workflow suit la hiérarchie** : Réception → Stockage → Essais → Traitement → Validation

---

## 🔧 Pour ajouter un nouvel utilisateur

Utilisez l'interface admin Django :
1. Allez sur http://127.0.0.1:8000/admin/
2. Connectez-vous avec `admin` / `admin123`
3. Cliquez sur "Users" → "Add User"
4. Remplissez les informations et assignez un rôle

---

**Date de création** : 29 novembre 2025
**Système** : Gestion d'Échantillons - Laboratoire SNERTP
