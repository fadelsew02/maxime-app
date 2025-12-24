// Script de diagnostic pour vérifier le contenu du localStorage
// À exécuter dans la console du navigateur (F12)

console.log('🔍 DIAGNOSTIC DU LOCALSTORAGE - MODULE DÉCODIFICATION\n');
console.log('='.repeat(60));

const validTypes = ['AG', 'Proctor', 'CBR', 'Oedometre', 'Cisaillement'];
let essaisEnvoyes = [];
let essaisNonEnvoyes = [];

for (let i = 0; i < localStorage.length; i++) {
  const key = localStorage.key(i);
  
  if (key && key.includes('_') && 
      !key.includes('echantillons_') && 
      !key.includes('treatment_') &&
      !key.includes('token') &&
      !key.includes('user')) {
    try {
      const data = JSON.parse(localStorage.getItem(key));
      
      if (!data || typeof data !== 'object') continue;
      
      let code, type;
      
      if (key.startsWith('decodification_')) {
        const keyWithoutPrefix = key.replace('decodification_', '');
        const parts = keyWithoutPrefix.split('_');
        type = parts[parts.length - 1];
        code = parts.slice(0, -1).join('_');
      } else {
        const parts = key.split('_');
        type = parts[parts.length - 1];
        code = parts.slice(0, -1).join('_');
      }
      
      if (!validTypes.includes(type)) continue;
      
      const isEnvoye = data.envoye === true || 
                      data.statut === 'termine' || 
                      data.statut === 'en_attente_validation' ||
                      (data.dateEnvoi && data.dateEnvoi !== '');
      
      const essaiInfo = {
        cle: key,
        code: code,
        type: type,
        envoye: data.envoye,
        statut: data.statut,
        dateEnvoi: data.dateEnvoi,
        operateur: data.operateur,
        fichier: data.fichier,
        isEnvoye: isEnvoye
      };
      
      if (isEnvoye) {
        essaisEnvoyes.push(essaiInfo);
      } else {
        essaisNonEnvoyes.push(essaiInfo);
      }
    } catch (e) {
      // Ignorer les erreurs de parsing
    }
  }
}

console.log('\n✅ ESSAIS ENVOYÉS (devraient apparaître dans décodification):');
console.log('-'.repeat(60));
if (essaisEnvoyes.length === 0) {
  console.log('❌ AUCUN ESSAI ENVOYÉ TROUVÉ !');
  console.log('   → Vérifiez que les opérateurs ont bien cliqué sur "Envoyer à la décodification"');
} else {
  essaisEnvoyes.forEach(e => {
    console.log(`\n📦 ${e.code} - ${e.type}`);
    console.log(`   Clé: ${e.cle}`);
    console.log(`   Statut: ${e.statut}`);
    console.log(`   Envoyé: ${e.envoye}`);
    console.log(`   Date envoi: ${e.dateEnvoi || 'Non définie'}`);
    console.log(`   Opérateur: ${e.operateur || 'Non défini'}`);
    console.log(`   Fichier: ${e.fichier || 'Aucun'}`);
  });
}

console.log('\n\n⏳ ESSAIS NON ENVOYÉS (ne devraient PAS apparaître):');
console.log('-'.repeat(60));
if (essaisNonEnvoyes.length === 0) {
  console.log('✅ Aucun essai en attente');
} else {
  essaisNonEnvoyes.forEach(e => {
    console.log(`\n📋 ${e.code} - ${e.type}`);
    console.log(`   Clé: ${e.cle}`);
    console.log(`   Statut: ${e.statut || 'Non défini'}`);
    console.log(`   Envoyé: ${e.envoye || false}`);
    console.log(`   Opérateur: ${e.operateur || 'Non défini'}`);
  });
}

console.log('\n' + '='.repeat(60));
console.log(`\n📊 RÉSUMÉ:`);
console.log(`   ✅ Essais envoyés: ${essaisEnvoyes.length}`);
console.log(`   ⏳ Essais non envoyés: ${essaisNonEnvoyes.length}`);
console.log(`   📦 Total: ${essaisEnvoyes.length + essaisNonEnvoyes.length}`);

console.log('\n💡 ACTIONS:');
if (essaisEnvoyes.length === 0) {
  console.log('   1. Connectez-vous en tant qu\'opérateur (operateur_route ou operateur_meca)');
  console.log('   2. Ouvrez un essai et remplissez les résultats');
  console.log('   3. Cliquez sur "Envoyer à la décodification"');
  console.log('   4. Revenez au compte réceptionniste et actualisez');
} else {
  console.log('   ✅ Des essais sont prêts ! Actualisez le module de décodification');
}

console.log('\n');
