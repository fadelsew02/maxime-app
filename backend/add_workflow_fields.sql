-- Script SQL pour ajouter les champs de rejet au modèle WorkflowValidation

-- Champs Chef Projet
ALTER TABLE workflow_validations ADD COLUMN IF NOT EXISTS validation_chef_projet BOOLEAN DEFAULT FALSE;
ALTER TABLE workflow_validations ADD COLUMN IF NOT EXISTS rejet_chef_projet BOOLEAN DEFAULT FALSE;
ALTER TABLE workflow_validations ADD COLUMN IF NOT EXISTS raison_rejet_chef_projet TEXT DEFAULT '';
ALTER TABLE workflow_validations ADD COLUMN IF NOT EXISTS commentaire_chef_projet TEXT DEFAULT '';

-- Champs Chef Service
ALTER TABLE workflow_validations ADD COLUMN IF NOT EXISTS validation_chef_service BOOLEAN DEFAULT FALSE;
ALTER TABLE workflow_validations ADD COLUMN IF NOT EXISTS rejet_chef_service BOOLEAN DEFAULT FALSE;
ALTER TABLE workflow_validations ADD COLUMN IF NOT EXISTS raison_rejet_chef_service TEXT DEFAULT '';
ALTER TABLE workflow_validations ADD COLUMN IF NOT EXISTS commentaire_chef_service TEXT DEFAULT '';

-- Champs Directeur Technique
ALTER TABLE workflow_validations ADD COLUMN IF NOT EXISTS validation_directeur_technique BOOLEAN DEFAULT FALSE;
ALTER TABLE workflow_validations ADD COLUMN IF NOT EXISTS rejet_directeur_technique BOOLEAN DEFAULT FALSE;
ALTER TABLE workflow_validations ADD COLUMN IF NOT EXISTS raison_rejet_directeur_technique TEXT DEFAULT '';
ALTER TABLE workflow_validations ADD COLUMN IF NOT EXISTS commentaire_directeur_technique TEXT DEFAULT '';

-- Champs Directeur SNERTP
ALTER TABLE workflow_validations ADD COLUMN IF NOT EXISTS rejet_directeur_snertp BOOLEAN DEFAULT FALSE;
ALTER TABLE workflow_validations ADD COLUMN IF NOT EXISTS raison_rejet_directeur_snertp TEXT DEFAULT '';
