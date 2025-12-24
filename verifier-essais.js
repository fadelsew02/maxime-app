// Script simple pour vérifier les essais dans localStorage
// À exécuter dans la console du navigateur (F12)

console.clear();
console.log('🔍 VÉRIFICATION DES ESSAIS ENVOYÉS\n');

const validTypes = ['AG', 'Proctor', 'CBR', 'Oedometre', 'Cisaillement'];
let count = 0;

for (let i = 0; i < localStorage.length; i++) {
  const key = localStorage.key(i);
  
  // Ignorer les tokens et autres clés
  if (key && key.includes('_') && 
      !key.includes('token') && 
      !key.includes('user') &&
      !key.includes('echantillons_') && 
      !key.includes('treatment_')) {
    
    try {
      const data = JSON.parse(localStorage.getItem(key));
      
      // Vérifier si c'est un essai valide
      const parts = key.split('_');
      const type = parts[parts.length - 1];
      
      if (validTypes.includes(type)) {
        const isEnvoye = data.envoye === true || 
                        data.statut === 'termine' || 
                        (data.dateEnvoi && data.dateEnvoi !== '');
        
        if (isEnvoye) {
          count++;
          console.log(`✅ ${key}`);
          console.log(`   Statut: ${data.statut}`);
          console.log(`   Envoyé: ${data.envoye}`);
          console.log(`   Opérateur: ${data.operateur || 'Non défini'}`);
          console.log('');
        }
      }
    } catch (e) {
      // Ignorer les erreurs
    }
  }
}

console.log('─'.repeat(60));
if (count === 0) {
  console.log('❌ AUCUN ESSAI ENVOYÉ TROUVÉ');
  console.log('\n💡 SOLUTION:');
  console.log('1. Connectez-vous en tant qu\'opérateur (operateur_route ou operateur_meca)');
  console.log('2. Ouvrez un essai et remplissez les résultats');
  console.log('3. Cliquez sur "Envoyer à la décodification"');
} else {
  console.log(`✅ ${count} essai(s) envoyé(s) trouvé(s)`);
  console.log('\n💡 Actualisez le module Décodification pour les voir');
}
