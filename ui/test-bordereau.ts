/**
 * Tests pour le générateur de bordereau de transmission
 */

import { generateBordereauHTML, generateBordereauFromEchantillon, BordereauData } from '../src/lib/bordereauGenerator';

// Test 1: Génération avec données complètes
console.log('Test 1: Génération avec données complètes');
const testData: BordereauData = {
  numero: '4852 / CNER-TP/DG',
  date: '21 DEC 2021',
  essaisRealises: 'Forage à béton Ø 16, Ø 12 et Ø 10 produits à l\'usine de SIAB',
  demandePar: 'SIAB',
  compteDe: 'SIAB',
  dateEssais: '25/10/2021',
  lieuEssais: 'Laboratoire Essais Spéciaux',
  natureEssais: 'Mesure du diamètre, détermination de la masse linéique et essai de traction',
  adresseRecepteur: 'SIAB ; Tél : 20 24 60 50 / 20 24 62 52 / 94 46 70 70',
  observations: 'R.A.S.',
  signature: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
};

const html1 = generateBordereauHTML(testData);
console.log('✓ HTML généré avec succès');
console.log('Longueur:', html1.length, 'caractères');

// Test 2: Génération depuis un échantillon
console.log('\nTest 2: Génération depuis un échantillon');
const echantillon = {
  code: 'CLI-015',
  clientNom: 'SIAB',
  date_reception: '2021-10-25',
  essais_types: ['AG', 'Proctor', 'CBR'],
  nature: 'Échantillon de sol argileux'
};

const signature = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
const html2 = generateBordereauFromEchantillon(echantillon, signature);
console.log('✓ HTML généré depuis échantillon');
console.log('Longueur:', html2.length, 'caractères');

// Test 3: Vérification du contenu
console.log('\nTest 3: Vérification du contenu');
const checks = [
  { name: 'Contient SNERTP', test: html1.includes('SNERTP') },
  { name: 'Contient CENTRE NATIONAL', test: html1.includes('CENTRE NATIONAL') },
  { name: 'Contient Bordereau de transmission', test: html1.includes('Bordereau de transmission') },
  { name: 'Contient tableau', test: html1.includes('<table>') },
  { name: 'Contient signature', test: html1.includes('signature') },
  { name: 'Contient Kpadon C. MOUSSOUGAN', test: html1.includes('Kpadon C. MOUSSOUGAN') },
  { name: 'Contient Le présent rapport', test: html1.includes('Le présent rapport') }
];

checks.forEach(check => {
  console.log(check.test ? '✓' : '✗', check.name);
});

// Test 4: Vérification de la structure HTML
console.log('\nTest 4: Vérification de la structure HTML');
const structureChecks = [
  { name: 'DOCTYPE présent', test: html1.includes('<!DOCTYPE html>') },
  { name: 'Balise html avec lang', test: html1.includes('<html lang="fr">') },
  { name: 'Meta charset UTF-8', test: html1.includes('<meta charset="UTF-8">') },
  { name: 'Style CSS présent', test: html1.includes('<style>') },
  { name: 'Container div présent', test: html1.includes('class="container"') },
  { name: 'Header div présent', test: html1.includes('class="header"') },
  { name: 'Signature div présent', test: html1.includes('class="signature"') }
];

structureChecks.forEach(check => {
  console.log(check.test ? '✓' : '✗', check.name);
});

// Test 5: Génération sans signature
console.log('\nTest 5: Génération sans signature');
const dataNoSignature: BordereauData = {
  ...testData,
  signature: undefined
};
const html3 = generateBordereauHTML(dataNoSignature);
console.log('✓ HTML généré sans signature');
console.log('Contient balise img:', html3.includes('<img'));

// Résumé
console.log('\n=== RÉSUMÉ DES TESTS ===');
const allChecks = [...checks, ...structureChecks];
const passed = allChecks.filter(c => c.test).length;
const total = allChecks.length;
console.log(`Tests réussis: ${passed}/${total}`);
console.log(passed === total ? '✓ Tous les tests sont passés!' : '✗ Certains tests ont échoué');

// Export pour utilisation dans le navigateur
if (typeof window !== 'undefined') {
  (window as any).testBordereau = {
    generateBordereauHTML,
    generateBordereauFromEchantillon,
    testData,
    echantillon,
    signature
  };
  console.log('\n✓ Fonctions de test exportées vers window.testBordereau');
}
