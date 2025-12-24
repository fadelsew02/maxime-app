// Script de test pour créer un essai de test dans localStorage
// À exécuter dans la console du navigateur (F12)

console.log('🧪 CRÉATION D\'UN ESSAI DE TEST\n');
console.log('='.repeat(60));

// Créer un essai de test
const essaiTest = {
  echantillonCode: 'TEST-001',
  nature: 'Gravier',
  dateReception: '2025-11-29',
  dateDebut: '2025-11-29',
  dateFin: '2025-12-04',
  operateur: 'Test Opérateur',
  resultats: {
    pourcent_inf_2mm: '85.5',
    pourcent_inf_80um: '45.2',
    coefficient_uniformite: '6.5'
  },
  commentaires: 'Essai de test pour vérifier le module décodification',
  fichier: 'test-resultats.xlsx',
  dateEnvoi: new Date().toISOString(),
  envoye: true,
  statut: 'termine'
};

// Sauvegarder dans localStorage
const essaiKey = 'TEST-001_AG';
localStorage.setItem(essaiKey, JSON.stringify(essaiTest));

console.log('✅ Essai de test créé avec succès !');
console.log('\n📦 Données sauvegardées :');
console.log(JSON.stringify(essaiTest, null, 2));

console.log('\n💡 INSTRUCTIONS :');
console.log('1. Allez dans le module Décodification');
console.log('2. Cliquez sur "Actualiser"');
console.log('3. Vous devriez voir l\'échantillon TEST-001 avec l\'essai AG');
console.log('4. Cliquez sur "Voir détails" pour vérifier les résultats');

console.log('\n🗑️  Pour supprimer l\'essai de test :');
console.log('localStorage.removeItem("TEST-001_AG");');

console.log('\n' + '='.repeat(60));
