// Script pour vérifier les rapports dans localStorage
// Ouvrir la console du navigateur (F12) et coller ce code

console.log('=== VÉRIFICATION DES RAPPORTS ===');

let rapportsCount = 0;
for (let i = 0; i < localStorage.length; i++) {
  const key = localStorage.key(i);
  if (key && key.startsWith('sent_to_directeur_technique_')) {
    rapportsCount++;
    const data = localStorage.getItem(key);
    if (data) {
      try {
        const rapport = JSON.parse(data);
        console.log('\n--- Rapport:', key, '---');
        console.log('Code:', rapport.code);
        console.log('Client:', rapport.clientName);
        console.log('Fichier:', rapport.file);
        console.log('Envoyé par Chef Service:', rapport.sentByChefService);
        console.log('Validé par Dir. Technique:', rapport.validatedByDirecteurTechnique);
        console.log('Validé par Dir. SNERTP:', rapport.validatedByDirecteurSNERTP);
        console.log('FileData présent:', !!rapport.fileData);
        if (rapport.fileData) {
          console.log('FileData type:', rapport.fileData.substring(0, 50) + '...');
        }
      } catch (e) {
        console.error('Erreur parsing:', e);
      }
    }
  }
}

console.log('\n=== TOTAL:', rapportsCount, 'rapport(s) trouvé(s) ===');
