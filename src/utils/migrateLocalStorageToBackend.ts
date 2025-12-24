/**
 * Script de migration des données localStorage vers le backend
 * À exécuter une seule fois pour transférer toutes les données existantes
 */

const API_BASE_URL = 'http://127.0.0.1:8000/api';

interface MigrationResult {
  success: number;
  errors: number;
  details: string[];
}

/**
 * Migrer les rapports en validation (sent_to_chef_*, sent_to_directeur_*, sent_to_marketing_*)
 */
export async function migrateRapportsValidation(): Promise<MigrationResult> {
  const result: MigrationResult = { success: 0, errors: 0, details: [] };
  const token = localStorage.getItem('access_token');

  if (!token) {
    result.details.push('❌ Token d\'authentification manquant');
    return result;
  }

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key) continue;

    // Identifier les clés de rapports
    if (
      key.startsWith('sent_to_chef_') ||
      key.startsWith('sent_to_directeur_') ||
      key.startsWith('sent_to_marketing_')
    ) {
      try {
        const data = localStorage.getItem(key);
        if (!data) continue;

        const rapportData = JSON.parse(data);

        // Déterminer l'étape actuelle
        let etape_actuelle = 'chef_projet';
        if (key.startsWith('sent_to_chef_service_')) etape_actuelle = 'chef_service';
        else if (key.startsWith('sent_to_directeur_technique_')) etape_actuelle = 'directeur_technique';
        else if (key.startsWith('sent_to_directeur_snertp_')) etape_actuelle = 'directeur_snertp';
        else if (key.startsWith('sent_to_marketing_')) etape_actuelle = 'marketing';

        // Déterminer le statut
        let status = 'pending';
        if (rapportData.rejected || rapportData.rejectedByChefService || rapportData.rejectedByDirecteurTechnique) {
          status = 'rejected';
        } else if (rapportData.acceptedByChefService || rapportData.validatedByDirecteurTechnique) {
          status = 'accepted';
        }

        // Créer l'objet rapport
        const rapport = {
          code_echantillon: rapportData.code || '',
          client_name: rapportData.clientName || '',
          essai_type: rapportData.essaiType || '',
          etape_actuelle,
          status,
          file_name: rapportData.file || '',
          file_data: rapportData.fileData || '',
          original_file_name: rapportData.originalFile || '',
          original_file_data: rapportData.originalFileData || '',
          date_envoi: rapportData.date || rapportData.dateEnvoi || new Date().toISOString(),
          
          // Chef Projet
          validated_by_chef_projet: rapportData.acceptedByChefProjet || false,
          rejected_by_chef_projet: rapportData.rejected || false,
          comment_chef_projet: rapportData.commentChefProjet || '',
          date_validation_chef_projet: rapportData.dateValidationChefProjet || null,
          
          // Chef Service
          validated_by_chef_service: rapportData.acceptedByChefService || false,
          rejected_by_chef_service: rapportData.rejectedByChefService || false,
          comment_chef_service: rapportData.commentChefService || '',
          date_validation_chef_service: rapportData.dateValidationChefService || null,
          
          // Directeur Technique
          validated_by_directeur_technique: rapportData.validatedByDirecteurTechnique || false,
          rejected_by_directeur_technique: rapportData.rejectedByDirecteurTechnique || false,
          comment_directeur_technique: rapportData.commentDirecteurTechnique || '',
          date_validation_directeur_technique: rapportData.validationDateDirecteurTechnique || null,
          
          // Directeur SNERTP
          validated_by_directeur_snertp: rapportData.validatedByDirecteurSNERTP || false,
          avis_directeur_snertp: rapportData.avisDirecteurSNERTP || '',
          signature_directeur_snertp: rapportData.signatureDirecteurSNERTP || '',
          date_validation_directeur_snertp: rapportData.dateValidationDirecteurSNERTP || null,
          
          // Marketing
          processed_by_marketing: rapportData.processedByMarketing || false,
          date_envoi_client: rapportData.dateEnvoiClient || null,
          email_client: rapportData.emailClient || '',
        };

        // Envoyer au backend
        const response = await fetch(`${API_BASE_URL}/rapport-validations/`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(rapport),
        });

        if (response.ok) {
          result.success++;
          result.details.push(`✅ Migré: ${key}`);
        } else {
          result.errors++;
          const error = await response.text();
          result.details.push(`❌ Erreur ${key}: ${error}`);
        }
      } catch (error) {
        result.errors++;
        result.details.push(`❌ Exception ${key}: ${error}`);
      }
    }
  }

  return result;
}

/**
 * Migrer les données d'essais
 */
export async function migrateEssaisData(): Promise<MigrationResult> {
  const result: MigrationResult = { success: 0, errors: 0, details: [] };
  const token = localStorage.getItem('access_token');

  if (!token) {
    result.details.push('❌ Token d\'authentification manquant');
    return result;
  }

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key) continue;

    // Identifier les clés d'essais (format: CODE_TYPE)
    if (
      key.includes('_AG') ||
      key.includes('_Proctor') ||
      key.includes('_CBR') ||
      key.includes('_Oedometre') ||
      key.includes('_Cisaillement')
    ) {
      // Exclure les clés de workflow
      if (
        key.startsWith('sent_to_') ||
        key.startsWith('plan_') ||
        key.startsWith('treatment_')
      ) {
        continue;
      }

      try {
        const data = localStorage.getItem(key);
        if (!data) continue;

        const essaiData = JSON.parse(data);

        // Extraire code et type
        const parts = key.split('_');
        const essai_type = parts[parts.length - 1];
        const echantillon_code = parts.slice(0, -1).join('_');

        // Créer l'objet essai
        const essai = {
          essai_id: key,
          echantillon_code,
          essai_type,
          data: essaiData,
          statut: essaiData.statut || 'attente',
          validation_status: essaiData.validationStatus || '',
          envoye: essaiData.envoye || false,
          date_reception: essaiData.dateReception || null,
          date_debut: essaiData.dateDebut || null,
          date_fin: essaiData.dateFin || null,
          resultats: essaiData.resultats || {},
          commentaires: essaiData.commentaires || '',
          operateur: essaiData.operateur || '',
        };

        // Envoyer au backend
        const response = await fetch(`${API_BASE_URL}/essai-data/`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(essai),
        });

        if (response.ok) {
          result.success++;
          result.details.push(`✅ Migré: ${key}`);
        } else {
          result.errors++;
          const error = await response.text();
          result.details.push(`❌ Erreur ${key}: ${error}`);
        }
      } catch (error) {
        result.errors++;
        result.details.push(`❌ Exception ${key}: ${error}`);
      }
    }
  }

  return result;
}

/**
 * Migrer les planifications
 */
export async function migratePlanifications(): Promise<MigrationResult> {
  const result: MigrationResult = { success: 0, errors: 0, details: [] };
  const token = localStorage.getItem('access_token');

  if (!token) {
    result.details.push('❌ Token d\'authentification manquant');
    return result;
  }

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key || !key.startsWith('plan_')) continue;

    try {
      const data = localStorage.getItem(key);
      if (!data) continue;

      const planData = JSON.parse(data);

      // Extraire code et type
      const parts = key.replace('plan_', '').split('_');
      const essai_type = parts[parts.length - 1];
      const echantillon_code = parts.slice(0, -1).join('_');

      // Créer l'objet planification
      const planification = {
        echantillon_code,
        essai_type,
        date_planifiee: planData.datePlanifiee || new Date().toISOString().split('T')[0],
        operateur_assigne: planData.operateurAssigne || '',
        priorite: planData.priorite || 'normale',
        statut: planData.statut || 'planifie',
        completed: planData.completed || false,
      };

      // Envoyer au backend
      const response = await fetch(`${API_BASE_URL}/planification-data/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(planification),
      });

      if (response.ok) {
        result.success++;
        result.details.push(`✅ Migré: ${key}`);
      } else {
        result.errors++;
        const error = await response.text();
        result.details.push(`❌ Erreur ${key}: ${error}`);
      }
    } catch (error) {
      result.errors++;
      result.details.push(`❌ Exception ${key}: ${error}`);
    }
  }

  return result;
}

/**
 * Exécuter la migration complète
 */
export async function migrateAllLocalStorageData(): Promise<{
  rapports: MigrationResult;
  essais: MigrationResult;
  planifications: MigrationResult;
}> {
  console.log('🚀 Début de la migration localStorage → Backend...');

  const rapports = await migrateRapportsValidation();
  console.log(`📊 Rapports: ${rapports.success} succès, ${rapports.errors} erreurs`);

  const essais = await migrateEssaisData();
  console.log(`📊 Essais: ${essais.success} succès, ${essais.errors} erreurs`);

  const planifications = await migratePlanifications();
  console.log(`📊 Planifications: ${planifications.success} succès, ${planifications.errors} erreurs`);

  console.log('✅ Migration terminée !');

  return { rapports, essais, planifications };
}

/**
 * Afficher un rapport de migration dans la console
 */
export function displayMigrationReport(results: {
  rapports: MigrationResult;
  essais: MigrationResult;
  planifications: MigrationResult;
}) {
  console.log('\n📋 RAPPORT DE MIGRATION\n');
  console.log('═══════════════════════════════════════');
  
  console.log('\n📄 RAPPORTS DE VALIDATION:');
  console.log(`  ✅ Succès: ${results.rapports.success}`);
  console.log(`  ❌ Erreurs: ${results.rapports.errors}`);
  if (results.rapports.details.length > 0) {
    console.log('  Détails:');
    results.rapports.details.forEach(d => console.log(`    ${d}`));
  }
  
  console.log('\n🧪 DONNÉES D\'ESSAIS:');
  console.log(`  ✅ Succès: ${results.essais.success}`);
  console.log(`  ❌ Erreurs: ${results.essais.errors}`);
  if (results.essais.details.length > 0) {
    console.log('  Détails:');
    results.essais.details.forEach(d => console.log(`    ${d}`));
  }
  
  console.log('\n📅 PLANIFICATIONS:');
  console.log(`  ✅ Succès: ${results.planifications.success}`);
  console.log(`  ❌ Erreurs: ${results.planifications.errors}`);
  if (results.planifications.details.length > 0) {
    console.log('  Détails:');
    results.planifications.details.forEach(d => console.log(`    ${d}`));
  }
  
  console.log('\n═══════════════════════════════════════');
  const totalSuccess = results.rapports.success + results.essais.success + results.planifications.success;
  const totalErrors = results.rapports.errors + results.essais.errors + results.planifications.errors;
  console.log(`\n📊 TOTAL: ${totalSuccess} succès, ${totalErrors} erreurs`);
  console.log('\n═══════════════════════════════════════\n');
}
